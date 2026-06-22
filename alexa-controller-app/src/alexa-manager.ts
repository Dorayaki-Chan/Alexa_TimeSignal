import { execFile } from 'child_process';

export class AlexaManager {
    private static instance: AlexaManager;

    private AUDIO_SYUKKOU_PATH: string;
    private AUDIO_KIOTSUKE_PATH: string;
    private AUDIO_KIMIGAYO_PATH: string;
    private AUDIO_KAKARE_PATH: string;
    private AUDIO_TEIJITENKEN_PATH: string;
    private AUDIO_UCHIKATAHAZIME_PATH: string;
    private AUDIO_SHOTO_PATH: string;
    private AUDIO_KISHO_PATH: string;
    private AUDIO_TENKO_PATH: string;
    private AUDIO_SHOKUJI_PATH: string;
    private AUDIO_KAGYOKAISHI_PATH:string;
    private AUDIO_KAGYOSHURYO_PATH:string;
    private AUDIO_AKEOME_PATH:string;

    private AUDIO_ZAREI_PATH: string;
    private AUDIO_TANFU_PATH: string;
    private AUDIO_SOUIN_PATH: string;
    private AUDIO_WAKARE_PATH: string;
    private AUDIO_GENMON_SOUGEI_PATH: string;

    private constructor() {
        this.AUDIO_SYUKKOU_PATH = process.env.AUDIO_SYUKKOU_PATH!;
        this.AUDIO_KIOTSUKE_PATH = process.env.AUDIO_KIOTSUKE_PATH!;
        this.AUDIO_KIMIGAYO_PATH = process.env.AUDIO_KIMIGAYO_PATH!;
        this.AUDIO_KAKARE_PATH = process.env.AUDIO_KAKARE_PATH!;
        this.AUDIO_TEIJITENKEN_PATH = process.env.AUDIO_TEIJITENKEN_PATH!;
        this.AUDIO_UCHIKATAHAZIME_PATH = process.env.AUDIO_UCHIKATAHAZIME_PATH!;
        this.AUDIO_SHOTO_PATH = process.env.AUDIO_SHOTO_PATH!;
        this.AUDIO_KISHO_PATH = process.env.AUDIO_KISHO_PATH!;
        this.AUDIO_TENKO_PATH = process.env.AUDIO_TENKO_PATH!;
        this.AUDIO_SHOKUJI_PATH = process.env.AUDIO_SHOKUJI_PATH!;
        this.AUDIO_KAGYOKAISHI_PATH = process.env.AUDIO_KAGYOKAISHI_PATH!;
        this.AUDIO_KAGYOSHURYO_PATH = process.env.AUDIO_KAGYOSHURYO_PATH!;
        this.AUDIO_AKEOME_PATH = process.env.AUDIO_AKEOME_PATH!;

        this.AUDIO_ZAREI_PATH = process.env.AUDIO_ZAREI_PATH || '';
        this.AUDIO_TANFU_PATH = process.env.AUDIO_TANFU_PATH || '';
        this.AUDIO_SOUIN_PATH = process.env.AUDIO_SOUIN_PATH || '';
        this.AUDIO_WAKARE_PATH = process.env.AUDIO_WAKARE_PATH || '';
        this.AUDIO_GENMON_SOUGEI_PATH = process.env.AUDIO_GENMON_SOUGEI_PATH || '';
    }

    public static getInstance(): AlexaManager {
        if (!AlexaManager.instance) {
            AlexaManager.instance = new AlexaManager();
        }
        return AlexaManager.instance;
    }

    private static readonly MAX_RETRIES = 2;
    private static readonly RETRY_DELAY_MS = 3000;
    private static readonly DEVICE_INTERVAL_MS = 3000;
    private static readonly DEVICES = ['アレクサ壱号機', 'アレクサ弐号機'];
    private static readonly SPEAK_VOL = 100;
    private static readonly NORMAL_VOL = 30;

    private execCommand(device: string, command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            execFile('/app/alexa_remote_control.sh',
                ['-d', device, '-e', command],
                (error, stdout, stderr) => {
                    if (error) {
                        reject(new Error(`alexa_remote_control failed (${device}): ${error.message}\n${stderr}`));
                        return;
                    }
                    resolve(stdout);
                }
            );
        });
    }

    private async setVolumeAll(vol: number): Promise<void> {
        for (let i = 0; i < AlexaManager.DEVICES.length; i++) {
            if (i > 0) await new Promise(r => setTimeout(r, AlexaManager.DEVICE_INTERVAL_MS));
            try {
                await this.execCommand(AlexaManager.DEVICES[i], `vol:${vol}`);
            } catch (e: any) {
                console.error(`音量設定失敗 ${AlexaManager.DEVICES[i]}: ${e.message}`);
            }
        }
    }

    private execSpeak(message: string): Promise<string> {
        return new Promise((resolve, reject) => {
            execFile('/app/alexa_remote_control.sh',
                ['-d', '全部の部屋', '-e', `speak:"${message}"`],
                (error, stdout, stderr) => {
                    if (error) {
                        reject(new Error(`alexa_remote_control failed: ${error.message}\n${stderr}`));
                        return;
                    }
                    resolve(stdout);
                }
            );
        });
    }

    private async speak(message: string, durationMs: number = 30000): Promise<string> {
        await this.setVolumeAll(AlexaManager.SPEAK_VOL);
        await new Promise(r => setTimeout(r, AlexaManager.DEVICE_INTERVAL_MS));

        let result: string;
        let lastError: Error | null = null;
        for (let attempt = 0; attempt <= AlexaManager.MAX_RETRIES; attempt++) {
            try {
                result = await this.execSpeak(message);
                await new Promise(r => setTimeout(r, durationMs));
                await this.setVolumeAll(AlexaManager.NORMAL_VOL);
                return result;
            } catch (e: any) {
                lastError = e;
                if (attempt < AlexaManager.MAX_RETRIES) {
                    console.error(`Alexa通信失敗 (試行${attempt + 1}/${AlexaManager.MAX_RETRIES + 1}): ${e.message}`);
                    await new Promise(r => setTimeout(r, AlexaManager.RETRY_DELAY_MS));
                }
            }
        }
        await this.setVolumeAll(AlexaManager.NORMAL_VOL);
        throw lastError!;
    }

    public getSidePipeAudioPath(sound: string): string {
        const map: Record<string, string> = {
            zarei: this.AUDIO_ZAREI_PATH,
            tanfu: this.AUDIO_TANFU_PATH,
            souin: this.AUDIO_SOUIN_PATH,
            wakare: this.AUDIO_WAKARE_PATH,
            genmon_sougei: this.AUDIO_GENMON_SOUGEI_PATH,
        };
        return map[sound] || '';
    }

    public async speakWithSound(sound: string, announcement: string): Promise<void> {
        const audioPath = this.getSidePipeAudioPath(sound);
        if (!audioPath) {
            throw new Error(`音源が設定されていません: ${sound} (環境変数を確認してください)`);
        }
        console.log(`イベント時報: ${sound} - ${announcement}`);
        await this.speak(`
            <audio src='${audioPath}'/>
            <amazon:emotion name='excited'>
                <prosody volume='x-fast'>${announcement}</prosody>
            </amazon:emotion>
        `);
    }

    public async kimigayo(): Promise<void> {
        console.log('start of Kimigayo');
        await this.speak(`
            <amazon:emotion name='excited'>
                <prosody volume='x-fast'>10秒前</prosody>
            </amazon:emotion>
            <audio src='${this.AUDIO_KIOTSUKE_PATH}'/>
            <break time='4s'/>
            <amazon:emotion name='excited'>
                <prosody volume='x-fast'>時間</prosody>
            </amazon:emotion>
            <break strength='strong'/>
            <audio src='${this.AUDIO_KIMIGAYO_PATH}'/>
            <break time='1s'/>
            <amazon:emotion name='excited'>
                <prosody volume='x-fast'>かかれ</prosody>
            </amazon:emotion>
            <audio src='${this.AUDIO_KAKARE_PATH}'/>
        `, 90000);
    }

    public async syukkou(): Promise<void> {
        console.log('start of syukkou');
        await this.speak(`<audio src='${this.AUDIO_SYUKKOU_PATH}'/>`);
    }

    public async teijitenken(): Promise<void> {
        console.log('start of teijitenken');
        await this.speak(`<audio src='${this.AUDIO_TEIJITENKEN_PATH}'/>`);
    }

    public async uchikatahajime(): Promise<void> {
        console.log('start of uchikatahajime');
        await this.speak(`<audio src='${this.AUDIO_UCHIKATAHAZIME_PATH}'/>`);
    }

    public async shoto(): Promise<void> {
        console.log('start of shoto');
        await this.speak(`<audio src='${this.AUDIO_SHOTO_PATH}'/>`, 90000);
    }

    public async kisho(): Promise<void> {
        console.log('start of kisho');
        await this.speak(`<audio src='${this.AUDIO_KISHO_PATH}'/>`);
    }

    public async tenko(): Promise<void> {
        console.log('start of tenko');
        await this.speak(`<audio src='${this.AUDIO_TENKO_PATH}'/>`);
    }

    public async shokuji(): Promise<void> {
        console.log('start of shokuji');
        await this.speak(`<audio src='${this.AUDIO_SHOKUJI_PATH}'/>`);
    }
    public async kagyokaishi(): Promise<void> {
        console.log('start of kagyokaishi');
        await this.speak(`<audio src='${this.AUDIO_KAGYOKAISHI_PATH}'/>`);
    }
    public async kagyoshuryo(): Promise<void> {
        console.log('start of kagyoshuryo');
        await this.speak(`<audio src='${this.AUDIO_KAGYOSHURYO_PATH}'/>`);
    }
    public async akeome(): Promise<void> {
        console.log('start of akeome');
        await this.speak(`<audio src='${this.AUDIO_AKEOME_PATH}'/>`);
    }
    public async shogo():Promise<void>{
        console.log('start of shogo');
        await this.speak(`
            <audio src='${this.AUDIO_KAGYOSHURYO_PATH}'/>
            <break time='1s'/>
            <audio src='${this.AUDIO_SHOKUJI_PATH}'/>
        `);
    }
}
