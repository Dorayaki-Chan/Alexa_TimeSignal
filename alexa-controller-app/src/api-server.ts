import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import { ConfigStore } from './config-store';
import { Scheduler } from './scheduler';
import { AppLogger } from './logger';
import { AlexaManager } from './alexa-manager';
import { EventSignal, SidePipeSound } from './types';

const VALID_SOUNDS: SidePipeSound[] = ['zarei', 'tanfu', 'souin', 'wakare', 'genmon_sougei'];

export class ApiServer {
    private app: express.Express;
    private configStore: ConfigStore;
    private scheduler: Scheduler;
    private logger: AppLogger;
    private alexa: AlexaManager;
    private apiKey: string;
    private port: number;

    constructor(
        configStore: ConfigStore,
        scheduler: Scheduler,
        logger: AppLogger,
        alexa: AlexaManager,
    ) {
        this.app = express();
        this.configStore = configStore;
        this.scheduler = scheduler;
        this.logger = logger;
        this.alexa = alexa;
        this.apiKey = process.env.HA_API_KEY || 'default-api-key';
        this.port = parseInt(process.env.API_PORT || '3001', 10);

        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupMiddleware(): void {
        this.app.use(cors());
        this.app.use(express.json());

        const publicDir = path.join(__dirname, '..', 'public');
        this.app.use(express.static(publicDir));
    }

    private authenticate(req: Request, res: Response, next: NextFunction): void {
        const key = req.headers['x-api-key'] as string;
        if (key && key === this.apiKey) {
            next();
            return;
        }
        res.status(401).json({ message: 'Unauthorized: invalid or missing API key' });
    }

    private setupRoutes(): void {
        const auth = (req: Request, res: Response, next: NextFunction) => this.authenticate(req, res, next);

        // APIキー必須（HA連携用）
        this.app.get('/api/config', auth, (req, res) => this.getConfig(req, res));
        this.app.put('/api/config', auth, (req, res) => this.putConfig(req, res));
        this.app.get('/api/status', auth, (req, res) => this.getStatus(req, res));
        this.app.post('/api/test-signal', auth, (req, res) => this.testSignal(req, res));

        // APIキー不要（ブラウザUI用）
        this.app.get('/api/events', (req, res) => this.getEvents(req, res));
        this.app.post('/api/events', (req, res) => this.postEvent(req, res));
        this.app.put('/api/events/:id', (req, res) => this.putEvent(req, res));
        this.app.delete('/api/events/:id', (req, res) => this.deleteEvent(req, res));
        this.app.get('/api/logs', (req, res) => this.getLogs(req, res));

        const publicDir = path.join(__dirname, '..', 'public');
        this.app.get('/{*path}', (_req, res) => {
            res.sendFile(path.join(publicDir, 'index.html'));
        });
    }

    private getConfig(_req: Request, res: Response): void {
        res.json({ data: this.configStore.get() });
    }

    private putConfig(req: Request, res: Response): void {
        try {
            const updated = this.configStore.update(req.body);
            this.logger.log('config_change', '設定が更新されました');
            res.json({ data: updated });
        } catch (e: any) {
            res.status(400).json({ message: e.message });
        }
    }

    private getEvents(_req: Request, res: Response): void {
        const config = this.configStore.get();
        res.json({ data: config.events });
    }

    private postEvent(req: Request, res: Response): void {
        const { time, sound, announcement, recurring, date, enabled } = req.body;

        if (!time || !sound || !announcement) {
            res.status(400).json({ message: 'time, sound, announcement は必須です' });
            return;
        }
        if (!VALID_SOUNDS.includes(sound)) {
            res.status(400).json({ message: `sound は ${VALID_SOUNDS.join(', ')} のいずれかです` });
            return;
        }

        const event: EventSignal = {
            id: crypto.randomUUID(),
            enabled: enabled !== false,
            time,
            sound,
            announcement,
            recurring: recurring !== false,
            date: date || undefined,
        };

        const config = this.configStore.get();
        config.events.push(event);
        this.configStore.update({ events: config.events });
        this.logger.log('config_change', `イベント追加: ${announcement}`);
        res.status(201).json({ data: event });
    }

    private putEvent(req: Request, res: Response): void {
        const { id } = req.params;
        const config = this.configStore.get();
        const idx = config.events.findIndex(e => e.id === id);
        if (idx === -1) {
            res.status(404).json({ message: 'イベントが見つかりません' });
            return;
        }

        const updated = { ...config.events[idx], ...req.body, id };
        config.events[idx] = updated;
        this.configStore.update({ events: config.events });
        this.logger.log('config_change', `イベント更新: ${updated.announcement}`);
        res.json({ data: updated });
    }

    private deleteEvent(req: Request, res: Response): void {
        const { id } = req.params;
        const config = this.configStore.get();
        const idx = config.events.findIndex(e => e.id === id);
        if (idx === -1) {
            res.status(404).json({ message: 'イベントが見つかりません' });
            return;
        }

        const removed = config.events.splice(idx, 1)[0];
        this.configStore.update({ events: config.events });
        this.logger.log('config_change', `イベント削除: ${removed.announcement}`);
        res.json({ success: true });
    }

    private getLogs(req: Request, res: Response): void {
        const limit = parseInt(req.query.limit as string, 10) || 50;
        const offset = parseInt(req.query.offset as string, 10) || 0;
        const result = this.logger.query(limit, offset);
        res.json(result);
    }

    private async testSignal(req: Request, res: Response): Promise<void> {
        const { sound, announcement } = req.body;
        if (!sound) {
            res.status(400).json({ message: 'sound は必須です' });
            return;
        }
        try {
            await this.alexa.speakWithSound(sound, announcement || 'テスト再生');
            this.logger.log('signal', `テスト再生: ${sound}`);
            res.json({ success: true });
        } catch (e: any) {
            res.status(500).json({ message: e.message });
        }
    }

    private getStatus(_req: Request, res: Response): void {
        const config = this.configStore.get();
        const nextSignals = this.scheduler.getNextSignals();
        res.json({
            active: config.timeSignal.enabled,
            stopPeriodActive: config.stopPeriod.enabled,
            nextSignals,
            nextSignalName: nextSignals.length > 0 ? nextSignals[0].name : 'なし',
            nextSignalTime: nextSignals.length > 0 ? nextSignals[0].time : '',
        });
    }

    public listen(): void {
        this.app.listen(this.port, '0.0.0.0', () => {
            console.log(`APIサーバー起動: http://0.0.0.0:${this.port}`);
        });
    }
}
