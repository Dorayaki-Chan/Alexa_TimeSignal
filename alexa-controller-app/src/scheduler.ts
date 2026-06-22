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
    private isRebuilding = false;

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
        if (this.isRebuilding) return;
        this.isRebuilding = true;
        try {
            this._rebuild();
        } finally {
            this.isRebuilding = false;
        }
    }

    private _rebuild(): void {
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
        this.scheduleWorkday(config);
        this.scheduleShoto(config);
        this.scheduleEvents(config);
        this.scheduleAkeome();
        this.scheduleSunsetOnce();

        console.log(`スケジュール再構築完了: ${this.tasks.length}件のタスク登録`);
        this.logger.log('system', `スケジュール再構築: ${this.tasks.length}件`);
    }

    private removeExpiredEvents(): void {
        const config = this.configStore.get();
        const todayStr = this.getTodayStr();
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

    private isNextWakeUpToday(config: AppConfig): boolean {
        if (!config.nextWakeUp.enabled || !config.nextWakeUp.date) return false;
        const todayStr = this.getTodayStr();
        return config.nextWakeUp.date === todayStr;
    }

    private isWeekdayToday(): boolean {
        const now = new Date();
        const dayOfWeek = now.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) return false;
        if (this.isHoliday(now)) return false;
        return true;
    }

    private shouldSkipMorning(config: AppConfig): boolean {
        if (this.shouldSkipToday(config)) return true;

        if (this.isNextWakeUpToday(config)) return false;

        if (!this.isWeekdayToday()) {
            console.log('週末または祝日のためスキップ');
            return true;
        }

        return false;
    }

    private static readonly LEAD_TIME_SEC = 8;

    private getTodayStr(): string {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
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

    private toCronWithLeadTime(hours: number, minutes: number, seconds: number = 0): string {
        const lead = Scheduler.LEAD_TIME_SEC;
        let totalSec = hours * 3600 + minutes * 60 + seconds - lead;
        if (totalSec < 0) totalSec += 24 * 3600;
        const h = Math.floor(totalSec / 3600) % 24;
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        return `${s} ${m} ${h}`;
    }

    private getMorningBaseTime(config: AppConfig): string {
        if (this.isNextWakeUpToday(config) && config.nextWakeUp.time) {
            return config.nextWakeUp.time;
        }
        return '07:00';
    }

    private clearNextWakeUp(): void {
        this.configStore.update({ nextWakeUp: { enabled: false, date: '', time: '07:00' } });
        this.logger.log('system', '次回起床オーバーライドをクリアしました');
    }

    private scheduleMorningSequence(config: AppConfig): void {
        if (!config.wakeUp.enabled && !this.isNextWakeUpToday(config)) return;

        const baseTime = this.getMorningBaseTime(config);
        const kishoTime = this.parseTime(baseTime);
        const tenkoTime = this.addMinutes(baseTime, 10);
        const shokujiTime = this.addMinutes(baseTime, 20);
        const isOverride = this.isNextWakeUpToday(config);

        const kishoTask = cron.schedule(`${this.toCronWithLeadTime(kishoTime.hours, kishoTime.minutes)} * * *`, async () => {
            if (this.shouldSkipMorning(this.configStore.get())) return;
            try {
                await this.alexa.kisho();
                this.logger.log('signal', `起床ラッパ (${baseTime}${isOverride ? ' オーバーライド' : ''})`);
            } catch (e: any) {
                this.logger.log('error', `起床ラッパ失敗: ${e.message}`);
            }
        });
        this.tasks.push(kishoTask);

        const tenkoTask = cron.schedule(`${this.toCronWithLeadTime(tenkoTime.hours, tenkoTime.minutes)} * * *`, async () => {
            if (this.shouldSkipMorning(this.configStore.get())) return;
            try {
                await this.alexa.tenko();
                this.logger.log('signal', '点呼ラッパ');
            } catch (e: any) {
                this.logger.log('error', `点呼ラッパ失敗: ${e.message}`);
            }
        });
        this.tasks.push(tenkoTask);

        const shokujiTask = cron.schedule(`${this.toCronWithLeadTime(shokujiTime.hours, shokujiTime.minutes)} * * *`, async () => {
            if (this.shouldSkipMorning(this.configStore.get())) return;
            try {
                await this.alexa.shokuji();
                this.logger.log('signal', '食事ラッパ');
                if (this.isNextWakeUpToday(this.configStore.get())) {
                    this.clearNextWakeUp();
                }
            } catch (e: any) {
                this.logger.log('error', `食事ラッパ失敗: ${e.message}`);
            }
        });
        this.tasks.push(shokujiTask);
    }

    private scheduleKimigayo(config: AppConfig): void {
        // 毎日 07:59:50 に君が代（朝の時報）— 音量設定分を前倒し
        const kimigayoTask = cron.schedule(`${this.toCronWithLeadTime(7, 59, 50)} * * *`, async () => {
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
                    }, intervalTime - 10000 - Scheduler.LEAD_TIME_SEC * 1000);
                }
            } catch (e: any) {
                this.logger.log('error', `君が代（朝）失敗: ${e.message}`);
            }
        });
        this.tasks.push(kimigayoTask);
    }

    private scheduleWorkday(config: AppConfig): void {
        // 08:45 課業開始（平日のみ）
        const kagyokaishi1 = cron.schedule(`${this.toCronWithLeadTime(8, 45)} * * *`, async () => {
            if (this.shouldSkipToday(this.configStore.get())) return;
            if (!this.isWeekdayToday()) return;
            try {
                await this.alexa.kagyokaishi();
                this.logger.log('signal', '課業開始ラッパ (08:45)');
            } catch (e: any) {
                this.logger.log('error', `課業開始ラッパ失敗: ${e.message}`);
            }
        });
        this.tasks.push(kagyokaishi1);

        // 12:00 平日→正午（課業終了+食事）、休日→食事ラッパのみ
        const noonTask = cron.schedule(`${this.toCronWithLeadTime(12, 0)} * * *`, async () => {
            if (this.shouldSkipToday(this.configStore.get())) return;
            try {
                if (this.isWeekdayToday()) {
                    await this.alexa.shogo();
                    this.logger.log('signal', '正午ラッパ (12:00)');
                } else {
                    await this.alexa.shokuji();
                    this.logger.log('signal', '食事ラッパ (12:00 休日)');
                }
            } catch (e: any) {
                this.logger.log('error', `正午/食事ラッパ失敗: ${e.message}`);
            }
        });
        this.tasks.push(noonTask);

        // 13:00 課業開始（平日のみ）
        const kagyokaishi2 = cron.schedule(`${this.toCronWithLeadTime(13, 0)} * * *`, async () => {
            if (this.shouldSkipToday(this.configStore.get())) return;
            if (!this.isWeekdayToday()) return;
            try {
                await this.alexa.kagyokaishi();
                this.logger.log('signal', '課業開始ラッパ (13:00)');
            } catch (e: any) {
                this.logger.log('error', `課業開始ラッパ失敗: ${e.message}`);
            }
        });
        this.tasks.push(kagyokaishi2);

        // 17:30 課業終了（平日のみ）
        const kagyoshuryo = cron.schedule(`${this.toCronWithLeadTime(17, 30)} * * *`, async () => {
            if (this.shouldSkipToday(this.configStore.get())) return;
            if (!this.isWeekdayToday()) return;
            try {
                await this.alexa.kagyoshuryo();
                this.logger.log('signal', '課業終了ラッパ (17:30)');
            } catch (e: any) {
                this.logger.log('error', `課業終了ラッパ失敗: ${e.message}`);
            }
        });
        this.tasks.push(kagyoshuryo);
    }

    private scheduleAkeome(): void {
        const akeomeTask = cron.schedule(`${this.toCronWithLeadTime(0, 0)} 1 1 *`, async () => {
            try {
                await this.alexa.akeome();
                this.logger.log('signal', 'あけおめ (元旦)');
            } catch (e: any) {
                this.logger.log('error', `あけおめ失敗: ${e.message}`);
            }
        });
        this.tasks.push(akeomeTask);
    }

    private scheduleShoto(config: AppConfig): void {
        if (!config.shoto.enabled) return;

        const { hours, minutes } = this.parseTime(config.shoto.time);
        const shotoTask = cron.schedule(`${this.toCronWithLeadTime(hours, minutes)} * * *`, async () => {
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
        const enabledEvents = config.events.filter(e => e.enabled);
        console.log(`イベントスケジュール: ${enabledEvents.length}件のイベント (全${config.events.length}件中)`);

        enabledEvents.forEach(event => {
            const { hours, minutes } = this.parseTime(event.time);

            if (!event.recurring && event.date) {
                const todayStr = this.getTodayStr();
                if (event.date < todayStr) {
                    console.log(`  スキップ(期限切れ): ${event.announcement} (${event.date} < ${todayStr})`);
                    return;
                }
            }

            const cronExpr = `${this.toCronWithLeadTime(hours, minutes)} * * *`;
            console.log(`  登録: ${event.announcement} | ${event.time} → cron="${cronExpr}" | sound=${event.sound} | recurring=${event.recurring}`);

            const task = cron.schedule(cronExpr, async () => {
                console.log(`イベントcron発火: ${event.announcement} (${event.time})`);
                const currentConfig = this.configStore.get();
                if (this.shouldSkipToday(currentConfig)) {
                    console.log(`  → shouldSkipTodayによりスキップ`);
                    return;
                }

                if (!event.recurring && event.date) {
                    const todayStr = this.getTodayStr();
                    if (event.date !== todayStr) {
                        console.log(`  → 日付不一致によりスキップ: event.date=${event.date}, today=${todayStr}`);
                        return;
                    }
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
                }, intervalTime - 10000 - Scheduler.LEAD_TIME_SEC * 1000);
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

        if (config.wakeUp.enabled || this.isNextWakeUpToday(config)) {
            const baseTime = this.getMorningBaseTime(config);
            const overrideLabel = this.isNextWakeUpToday(config) ? '(オーバーライド)' : '';
            allSignals.push({ time: baseTime, name: `起床ラッパ${overrideLabel}` });
            const tenko = this.addMinutes(baseTime, 10);
            allSignals.push({ time: this.formatTime(tenko.hours, tenko.minutes), name: '点呼ラッパ' });
            const shokuji = this.addMinutes(baseTime, 20);
            allSignals.push({ time: this.formatTime(shokuji.hours, shokuji.minutes), name: '食事ラッパ' });
        }
        allSignals.push({ time: '07:59', name: '君が代（朝）' });

        if (this.isWeekdayToday()) {
            allSignals.push({ time: '08:45', name: '課業開始ラッパ' });
            allSignals.push({ time: '12:00', name: '正午ラッパ' });
            allSignals.push({ time: '13:00', name: '課業開始ラッパ' });
            allSignals.push({ time: '17:30', name: '課業終了ラッパ' });
        } else {
            allSignals.push({ time: '12:00', name: '食事ラッパ（休日）' });
        }

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
