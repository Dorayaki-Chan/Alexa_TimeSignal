import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import request from 'supertest';
import { ConfigStore } from './config-store';
import { AppLogger } from './logger';
import { ApiServer } from './api-server';

vi.mock('./alexa-manager', () => ({
    AlexaManager: {
        getInstance: vi.fn(() => mockAlexa),
    },
}));

vi.mock('./scheduler', () => ({
    Scheduler: vi.fn().mockImplementation(() => mockScheduler),
}));

const mockAlexa = {
    speakWithSound: vi.fn(),
    getSidePipeAudioPath: vi.fn(() => 'https://example.com/audio.mp3'),
};

const mockScheduler = {
    rebuild: vi.fn(),
    getNextSignals: vi.fn(() => []),
};

const API_KEY = 'test-api-key-12345';
let tmpDir: string;
let configStore: ConfigStore;
let logger: AppLogger;
let server: ApiServer;

beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'api-test-'));
    process.env.HA_API_KEY = API_KEY;

    configStore = new ConfigStore(tmpDir);
    configStore.load();
    logger = new AppLogger(tmpDir);
    server = new ApiServer(configStore, mockScheduler as any, logger, mockAlexa as any);

    vi.clearAllMocks();
});

afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('ApiServer', () => {
    describe('認証', () => {
        it('APIキーなしで401を返す', async () => {
            await request(server.getApp())
                .get('/api/config')
                .expect(401);
        });

        it('不正なAPIキーで401を返す', async () => {
            await request(server.getApp())
                .get('/api/config')
                .set('X-API-Key', 'wrong-key')
                .expect(401);
        });

        it('正しいAPIキーで200を返す', async () => {
            await request(server.getApp())
                .get('/api/config')
                .set('X-API-Key', API_KEY)
                .expect(200);
        });
    });

    describe('GET /api/config', () => {
        it('設定データを返す', async () => {
            const res = await request(server.getApp())
                .get('/api/config')
                .set('X-API-Key', API_KEY)
                .expect(200);

            expect(res.body.data).toBeDefined();
            expect(res.body.data.timeSignal).toBeDefined();
            expect(res.body.data.wakeUp).toBeDefined();
        });
    });

    describe('PUT /api/config', () => {
        it('設定を更新して返す', async () => {
            const res = await request(server.getApp())
                .put('/api/config')
                .set('X-API-Key', API_KEY)
                .send({ shoto: { time: '22:30' } })
                .expect(200);

            expect(res.body.data.shoto.time).toBe('22:30');
        });
    });

    describe('CRUD /api/events', () => {
        it('初期状態で空の配列を返す', async () => {
            const res = await request(server.getApp())
                .get('/api/events')
                .expect(200);

            expect(res.body.data).toEqual([]);
        });

        it('有効なデータでイベントを作成する', async () => {
            const res = await request(server.getApp())
                .post('/api/events')
                .send({ time: '09:00', sound: 'zarei', announcement: 'テスト号令' })
                .expect(201);

            expect(res.body.data.id).toBeDefined();
            expect(res.body.data.time).toBe('09:00');
            expect(res.body.data.sound).toBe('zarei');
            expect(res.body.data.announcement).toBe('テスト号令');
            expect(res.body.data.enabled).toBe(true);
            expect(res.body.data.recurring).toBe(true);
        });

        it('timeが無い場合400を返す', async () => {
            await request(server.getApp())
                .post('/api/events')
                .send({ sound: 'zarei', announcement: 'テスト' })
                .expect(400);
        });

        it('soundが無い場合400を返す', async () => {
            await request(server.getApp())
                .post('/api/events')
                .send({ time: '09:00', announcement: 'テスト' })
                .expect(400);
        });

        it('announcementが無い場合400を返す', async () => {
            await request(server.getApp())
                .post('/api/events')
                .send({ time: '09:00', sound: 'zarei' })
                .expect(400);
        });

        it('無効なsound値で400を返す', async () => {
            await request(server.getApp())
                .post('/api/events')
                .send({ time: '09:00', sound: 'invalid', announcement: 'テスト' })
                .expect(400);
        });

        it('イベントを更新する', async () => {
            const createRes = await request(server.getApp())
                .post('/api/events')
                .send({ time: '09:00', sound: 'zarei', announcement: '元の号令' });

            const id = createRes.body.data.id;

            const updateRes = await request(server.getApp())
                .put(`/api/events/${id}`)
                .send({ announcement: '更新後の号令' })
                .expect(200);

            expect(updateRes.body.data.announcement).toBe('更新後の号令');
            expect(updateRes.body.data.id).toBe(id);
        });

        it('存在しないイベントの更新で404を返す', async () => {
            await request(server.getApp())
                .put('/api/events/non-existent-id')
                .send({ announcement: 'テスト' })
                .expect(404);
        });

        it('イベントを削除する', async () => {
            const createRes = await request(server.getApp())
                .post('/api/events')
                .send({ time: '09:00', sound: 'zarei', announcement: '削除テスト' });

            const id = createRes.body.data.id;

            await request(server.getApp())
                .delete(`/api/events/${id}`)
                .expect(200);

            const listRes = await request(server.getApp())
                .get('/api/events')
                .expect(200);

            expect(listRes.body.data).toHaveLength(0);
        });

        it('存在しないイベントの削除で404を返す', async () => {
            await request(server.getApp())
                .delete('/api/events/non-existent-id')
                .expect(404);
        });
    });

    describe('GET /api/logs', () => {
        it('ログエントリを返す', async () => {
            logger.log('signal', 'テストログ');

            const res = await request(server.getApp())
                .get('/api/logs')
                .expect(200);

            expect(res.body.data).toHaveLength(1);
            expect(res.body.data[0].message).toBe('テストログ');
        });

        it('limitクエリパラメータを尊重する', async () => {
            for (let i = 0; i < 5; i++) {
                logger.log('signal', `ログ${i}`);
            }

            const res = await request(server.getApp())
                .get('/api/logs?limit=2')
                .expect(200);

            expect(res.body.data).toHaveLength(2);
        });
    });

    describe('GET /api/status', () => {
        it('ステータス情報を返す', async () => {
            const res = await request(server.getApp())
                .get('/api/status')
                .set('X-API-Key', API_KEY)
                .expect(200);

            expect(res.body.active).toBeDefined();
            expect(res.body.nextSignals).toBeDefined();
        });
    });

    describe('POST /api/test-signal', () => {
        it('soundが無い場合400を返す', async () => {
            await request(server.getApp())
                .post('/api/test-signal')
                .set('X-API-Key', API_KEY)
                .send({})
                .expect(400);
        });

        it('有効なsoundでspeakWithSoundを呼び出す', async () => {
            mockAlexa.speakWithSound.mockResolvedValue(undefined);

            await request(server.getApp())
                .post('/api/test-signal')
                .set('X-API-Key', API_KEY)
                .send({ sound: 'zarei', announcement: 'テスト再生' })
                .expect(200);

            expect(mockAlexa.speakWithSound).toHaveBeenCalledWith('zarei', 'テスト再生');
        });

        it('Alexaコマンド失敗時に500を返す', async () => {
            mockAlexa.speakWithSound.mockRejectedValue(new Error('通信エラー'));

            await request(server.getApp())
                .post('/api/test-signal')
                .set('X-API-Key', API_KEY)
                .send({ sound: 'zarei' })
                .expect(500);
        });
    });
});
