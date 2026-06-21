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

    private execSpeak(message: string): Promise<string> {
        return new Promise((resolve, reject) => {
            execFile('/app/alexa_remote_control.sh', ['-e', `speak:"${message}"`], (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`alexa_remote_control failed: ${error.message}\n${stderr}`));
                    return;
                }
                resolve(stdout);
            });
        });
    }

    private async speak(message: string): Promise<string> {
        let lastError: Error | null = null;
        for (let attempt = 0; attempt <= AlexaManager.MAX_RETRIES; attempt++) {
            try {
                return await this.execSpeak(message);
            } catch (e: any) {
                lastError = e;
                if (attempt < AlexaManager.MAX_RETRIES) {
                    console.error(`Alexa通信失敗 (試行${attempt + 1}/${AlexaManager.MAX_RETRIES + 1}): ${e.message}`);
                    await new Promise(r => setTimeout(r, AlexaManager.RETRY_DELAY_MS));
                }
            }
        }
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
            console.error(`音源が設定されていません: ${sound}`);
            return;
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
        `);
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
        await this.speak(`<audio src='${this.AUDIO_SHOTO_PATH}'/>`);
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
}
