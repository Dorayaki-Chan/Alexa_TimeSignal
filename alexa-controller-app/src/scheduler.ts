import cron, { ScheduledTask } from 'node-cron';
import { ConfigStore } from './config-store';
import { AlexaManager } from './alexa-manager';
import { Sun } from './sun';
import { AppLogger } from './logger';
import { AppConfig } from './types';

export class Scheduler {
    private configStore: ConfigStore;
    private alexa: AlexaManager;
    private sun: Sun;
    private logger: AppLogger;
    private tasks: ScheduledTask[] = [];
    private sunsetTimeout: ReturnType<typeof setTimeout> | null = null;
    private isHoliday: (date: Date) => boolean;

    constructor(configStore: ConfigStore, alexa: AlexaManager, sun: Sun, logger: AppLogger) {
        this.configStore = configStore;
        this.alexa = alexa;
        this.sun = sun;
        this.logger = logger;

        try {
            const holidayJp = require('@holiday-jp/holiday_jp');
            this.isHoliday = (date: Date) => holidayJp.isHoliday(date);
        } catch {
            console.log('@holiday-jp/holiday_jp が見つかりません。祝日判定を無効化します。');
            this.isHoliday = () => false;
        }

        this.configStore.on('config-changed', () => {
            console.log('設定変更を検知。スケジュールを再構築します。');
            this.rebuild();
        });
    }

    public rebuild(): void {
        this.stopAll();
        this.removeExpiredEvents();

        const config = this.configStore.get();
        if (!config.timeSignal.enabled) {
            console.log('時報マスタースイッチOFF。スケジュールなし。');
            this.logger.log('system', '時報マスタースイッチOFF');
            return;
        }

        this.scheduleMorningSequence(config);
        this.scheduleKimigayo(config);
        this.scheduleShoto(config);
        this.scheduleEvents(config);
        this.scheduleSunsetOnce();

        console.log(`スケジュール再構築完了: ${this.tasks.length}件のタスク登録`);
        this.logger.log('system', `スケジュール再構築: ${this.tasks.length}件`);
    }

    private removeExpiredEvents(): void {
        const config = this.configStore.get();
        const todayStr = new Date().toISOString().split('T')[0];
        const remaining = config.events.filter(event => {
            if (!event.recurring && event.date && event.date < todayStr) {
                console.log(`期限切れイベントを削除: ${event.announcement} (${event.date})`);
                this.logger.log('system', `期限切れイベント削除: ${event.announcement} (${event.date})`);
                return false;
            }
            return true;
        });

        if (remaining.length !== config.events.length) {
            this.configStore.update({ events: remaining });
        }
    }

    private stopAll(): void {
        this.tasks.forEach(t => t.stop());
        this.tasks = [];
        if (this.sunsetTimeout) {
            clearTimeout(this.sunsetTimeout);
            this.sunsetTimeout = null;
        }
    }

    private shouldSkipToday(config: AppConfig): boolean {
        if (config.stopPeriod.enabled && config.stopPeriod.startDate && config.stopPeriod.endDate) {
            const now = new Date();
            const startStr = `${config.stopPeriod.startDate}T${config.stopPeriod.startTime || '00:00'}`;
            const endStr = `${config.stopPeriod.endDate}T${config.stopPeriod.endTime || '23:59'}`;
            const start = new Date(startStr);
            const end = new Date(endStr);
            if (now >= start && now <= end) {
                console.log('停止期間中のためスキップ');
                return true;
            }
        }

        return false;
    }

    private shouldSkipMorning(config: AppConfig): boolean {
        if (this.shouldSkipToday(config)) return true;

        const now = new Date();
        const dayOfWeek = now.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (isWeekend && !config.wakeUp.weekendEnabled) {
            console.log('週末のためスキップ');
            return true;
        }

        if (!isWeekend && this.isHoliday(now) && !config.wakeUp.holidayEnabled) {
            console.log('祝日のためスキップ');
            return true;
        }

        return false;
    }

    private parseTime(timeStr: string): { hours: number; minutes: number } {
        const [h, m] = timeStr.split(':').map(Number);
        return { hours: h, minutes: m };
    }

    private addMinutes(timeStr: string, addMin: number): { hours: number; minutes: number } {
        const { hours, minutes } = this.parseTime(timeStr);
        const total = hours * 60 + minutes + addMin;
        return { hours: Math.floor(total / 60) % 24, minutes: total % 60 };
    }

    private scheduleMorningSequence(config: AppConfig): void {
        if (!config.wakeUp.enabled) return;

        const kishoTime = this.parseTime(config.wakeUp.defaultTime);
        const tenkoTime = this.addMinutes(config.wakeUp.defaultTime, 10);
        const shokujiTime = this.addMinutes(config.wakeUp.defaultTime, 20);

        const kishoTask = cron.schedule(`0 ${kishoTime.minutes} ${kishoTime.hours} * * *`, async () => {
            if (this.shouldSkipMorning(this.configStore.get())) return;
            try {
                await this.alexa.kisho();
                this.logger.log('signal', `起床ラッパ (${config.wakeUp.defaultTime})`);
            } catch (e: any) {
                this.logger.log('error', `起床ラッパ失敗: ${e.message}`);
            }
        });
        this.tasks.push(kishoTask);

        const tenkoTask = cron.schedule(`0 ${tenkoTime.minutes} ${tenkoTime.hours} * * *`, async () => {
            if (this.shouldSkipMorning(this.configStore.get())) return;
            try {
                await this.alexa.tenko();
                this.logger.log('signal', '点呼ラッパ');
            } catch (e: any) {
                this.logger.log('error', `点呼ラッパ失敗: ${e.message}`);
            }
        });
        this.tasks.push(tenkoTask);

        const shokujiTask = cron.schedule(`0 ${shokujiTime.minutes} ${shokujiTime.hours} * * *`, async () => {
            if (this.shouldSkipMorning(this.configStore.get())) return;
            try {
                await this.alexa.shokuji();
                this.logger.log('signal', '食事ラッパ');
            } catch (e: any) {
                this.logger.log('error', `食事ラッパ失敗: ${e.message}`);
            }
        });
        this.tasks.push(shokujiTask);
    }

    private scheduleKimigayo(config: AppConfig): void {
        // 毎日 07:59:50 に君が代（朝の時報）
        const kimigayoTask = cron.schedule('50 59 7 * * *', async () => {
            if (this.shouldSkipToday(this.configStore.get())) return;
            try {
                await this.alexa.kimigayo();
                this.logger.log('signal', '君が代（朝）');

                // 日没時の君が代をスケジュール
                const intervalTime = await this.sun.getSunsetIntervalTime();
                if (intervalTime > 0) {
                    this.sunsetTimeout = setTimeout(async () => {
                        try {
                            await this.alexa.kimigayo();
                            this.logger.log('signal', '君が代（日没）');
                        } catch (e: any) {
                            this.logger.log('error', `君が代（日没）失敗: ${e.message}`);
                        }
                    }, intervalTime - 10000);
                }
            } catch (e: any) {
                this.logger.log('error', `君が代（朝）失敗: ${e.message}`);
            }
        });
        this.tasks.push(kimigayoTask);
    }

    private scheduleShoto(config: AppConfig): void {
        if (!config.shoto.enabled) return;

        const { hours, minutes } = this.parseTime(config.shoto.time);
        const shotoTask = cron.schedule(`0 ${minutes} ${hours} * * *`, async () => {
            if (this.shouldSkipToday(this.configStore.get())) return;
            try {
                await this.alexa.shoto();
                this.logger.log('signal', `消灯ラッパ (${config.shoto.time})`);
            } catch (e: any) {
                this.logger.log('error', `消灯ラッパ失敗: ${e.message}`);
            }
        });
        this.tasks.push(shotoTask);
    }

    private scheduleEvents(config: AppConfig): void {
        config.events.filter(e => e.enabled).forEach(event => {
            const { hours, minutes } = this.parseTime(event.time);

            if (!event.recurring && event.date) {
                const todayStr = new Date().toISOString().split('T')[0];
                if (event.date < todayStr) return;
            }

            const task = cron.schedule(`0 ${minutes} ${hours} * * *`, async () => {
                const currentConfig = this.configStore.get();
                if (this.shouldSkipToday(currentConfig)) return;

                if (!event.recurring && event.date) {
                    const todayStr = new Date().toISOString().split('T')[0];
                    if (event.date !== todayStr) return;
                }

                try {
                    await this.alexa.speakWithSound(event.sound, event.announcement);
                    this.logger.log('signal', `イベント時報: ${event.announcement} (${event.sound})`);

                    if (!event.recurring) {
                        const cfg = this.configStore.get();
                        const remaining = cfg.events.filter(e => e.id !== event.id);
                        this.configStore.update({ events: remaining });
                        this.logger.log('system', `単発イベント削除: ${event.announcement}`);
                    }
                } catch (e: any) {
                    this.logger.log('error', `イベント時報失敗: ${event.announcement}: ${e.message}`);
                }
            });
            this.tasks.push(task);
        });
    }

    private async scheduleSunsetOnce(): Promise<void> {
        try {
            const intervalTime = await this.sun.getSunsetIntervalTime();
            if (intervalTime > 10000) {
                this.sunsetTimeout = setTimeout(async () => {
                    const config = this.configStore.get();
                    if (this.shouldSkipToday(config)) return;
                    try {
                        await this.alexa.kimigayo();
                        this.logger.log('signal', '君が代（日没・起動時）');
                    } catch (e: any) {
                        this.logger.log('error', `君が代（日没・起動時）失敗: ${e.message}`);
                    }
                }, intervalTime - 10000);
                console.log('起動時の日没スケジュールを設定しました');
            }
        } catch (e: any) {
            console.error('日没時刻の取得に失敗:', e.message);
        }
    }

    private formatTime(hours: number, minutes: number): string {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    public getNextSignals(): { time: string; name: string }[] {
        const config = this.configStore.get();
        const allSignals: { time: string; name: string }[] = [];

        if (!config.timeSignal.enabled) return [];

        if (config.wakeUp.enabled) {
            allSignals.push({ time: config.wakeUp.defaultTime, name: '起床ラッパ' });
            const tenko = this.addMinutes(config.wakeUp.defaultTime, 10);
            allSignals.push({ time: this.formatTime(tenko.hours, tenko.minutes), name: '点呼ラッパ' });
            const shokuji = this.addMinutes(config.wakeUp.defaultTime, 20);
            allSignals.push({ time: this.formatTime(shokuji.hours, shokuji.minutes), name: '食事ラッパ' });
        }
        allSignals.push({ time: '07:59', name: '君が代（朝）' });

        try {
            const sunsetTime = this.sun.getSunsetTimeString();
            allSignals.push({ time: sunsetTime, name: '君が代（日没）' });
        } catch { /* 日没取得失敗時は無視 */ }

        if (config.shoto.enabled) {
            allSignals.push({ time: config.shoto.time, name: '消灯ラッパ' });
        }
        config.events.filter(e => e.enabled).forEach(e => {
            allSignals.push({ time: e.time, name: `イベント: ${e.announcement}` });
        });

        allSignals.sort((a, b) => a.time.localeCompare(b.time));

        const now = new Date();
        const nowStr = this.formatTime(now.getHours(), now.getMinutes());
        const upcoming = allSignals.filter(s => s.time >= nowStr);

        if (upcoming.length > 0) return upcoming;

        return allSignals.map(s => ({ time: s.time, name: `${s.name} (翌日)` }));
    }
}
