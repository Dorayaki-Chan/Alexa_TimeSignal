/**
 * このプログラムは、Alexaに時報を話させるプログラムです。
 */
/***** モジュールのインポート *****/
require('dotenv').config();
const { execSync } = require('child_process');
const cron = require('node-cron');
const sunCalc = require('suncalc');
/*********/

/***** 環境変数の設定 *****/
// 環境変数のチェック
if (!(  process.env.AUDIO_SYUKKOU_PATH && 
        process.env.AUDIO_KIOTSUKE_PATH && 
        process.env.AUDIO_KIMIGAYO_PATH && 
        process.env.AUDIO_KAKARE_PATH &&
        process.env.AUDIO_TEIJITENKEN_PATH &&
        process.env.AUDIO_UCHIKATAHAZIME_PATH &&
        process.env.AUDIO_SHOTO_PATH &&
        process.env.AUDIO_KISHO_PATH &&
        process.env.AUDIO_TENKO_PATH &&
        process.env.AUDIO_SHOKUJI_PATH &&
        process.env.AUDIO_KAGYOKAISHI_PATH&&
        process.env.AUDIO_KAGYOSHURYO_PATH&&
        process.env.AUDIO_AKEOME_PATH
    )) {
    console.error('ERROR: AUDIO_PATHが設定されていません。');
    process.exit(1);
}
if(!(process.env.MY_LATITUDE && process.env.MY_LONGITUDE)){
    console.error('ERROR: 緯度経度が設定されていません。');
    process.exit(1);
}

// 緯度経度
const MY_LATITUDE:number = parseFloat(process.env.MY_LATITUDE);
const MY_LONGITUDE:number = parseFloat(process.env.MY_LONGITUDE);
/*********/

/***** アレクサマネージャー *****/
class AlexaManeger {
    private static instance: AlexaManeger;
    private AUDIO_SYUKKOU_PATH:string;
    private AUDIO_KIOTSUKE_PATH:string;
    private AUDIO_KIMIGAYO_PATH:string;
    private AUDIO_KAKARE_PATH:string;
    private AUDIO_TEIJITENKEN_PATH:string;
    private AUDIO_UCHIKATAHAZIME_PATH:string;
    private AUDIO_SHOTO_PATH:string;
    private AUDIO_KISHO_PATH:string;
    private AUDIO_TENKO_PATH:string;
    private AUDIO_SHOKUJI_PATH:string;
    private AUDIO_KAGYOKAISHI_PATH:string;
    private AUDIO_KAGYOSHURYO_PATH:string;
    private AUDIO_AKEOME_PATH:string;
    
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
    }

    public static getInstance(): AlexaManeger {
        if (!AlexaManeger.instance) {
            AlexaManeger.instance = new AlexaManeger();
        }
        return AlexaManeger.instance;
    }
    /* Alexaに話してもらうコマンド */
    private speak(message:string):void{
        const command = `/app/alexa_remote_control.sh -d 全部の部屋 -e speak:"${message}"`;
        const stdout:string = execSync(command).toString();
        //console.log(stdout);
    }
    /**/
    /* ラッパテンプレート */
    public async kimigayo():Promise<void>{
        console.log('start of Kimigayo');
        this.speak(`
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
        this.speak(`<audio src='${this.AUDIO_SYUKKOU_PATH}'/>`);
    }
    public async teijitenken(): Promise<void> {
        console.log('start of teijitenken');
        this.speak(`<audio src='${this.AUDIO_TEIJITENKEN_PATH}'/>`);
    }
    public async uchikatahajime(): Promise<void> {
        console.log('start of uchikatahajime');
        this.speak(`<audio src='${this.AUDIO_UCHIKATAHAZIME_PATH}'/>`);
    }
    public async shoto(): Promise<void> {
        console.log('start of shoto');
        this.speak(`<audio src='${this.AUDIO_SHOTO_PATH}'/>`);
    }
    public async kisho(): Promise<void> {
        console.log('start of kisho');
        this.speak(`<audio src='${this.AUDIO_KISHO_PATH}'/>`);
    }
    public async tenko(): Promise<void> {
        console.log('start of tenko');
        this.speak(`<audio src='${this.AUDIO_TENKO_PATH}'/>`);
    }
    public async shokuji(): Promise<void> {
        console.log('start of shokuji');
        this.speak(`<audio src='${this.AUDIO_SHOKUJI_PATH}'/>`);
    }
    public async kagyokaishi(): Promise<void> {
        console.log('start of kagyokaishi');
        this.speak(`<audio src='${this.AUDIO_KAGYOKAISHI_PATH}'/>`);
    }
    public async kagyoshuryo(): Promise<void> {
        console.log('start of kagyoshuryo');
        this.speak(`<audio src='${this.AUDIO_KAGYOSHURYO_PATH}'/>`);
    }
    public async akeome(): Promise<void> {
        console.log('start of akeome');
        this.speak(`<audio src='${this.AUDIO_AKEOME_PATH}'/>`);
    }
    public async shogo():Promise<void>{
        console.log('start of shogo');
        this.speak(`
            <audio src='${this.AUDIO_KAGYOSHURYO_PATH}'/>
            <break time='1s'/>
            <audio src='${this.AUDIO_SHOKUJI_PATH}'/>
        `);
    }
    /**/
}
/**********/

/***** お日様 *****/
class Sun {
    private static instance: Sun;
    private _latitude: number;
    private _longitude: number;
    private constructor() {
        this._latitude = MY_LATITUDE;
        this._longitude = MY_LONGITUDE;
    }
    public static getInstance(): Sun {
        if (!Sun.instance) {
            Sun.instance = new Sun();
        }
        return Sun.instance;
    }
    /* 日没時刻までの時間を取得 */
    public async getSunsetIntervalTime(): Promise<number> {
        const times = sunCalc.getTimes(new Date(), this._latitude, this._longitude);
        const sunsetTime:number = times.sunset.getTime();
        const now:number = new Date().getTime();
        const intervalTime:number = sunsetTime - now;
        console.log(`日没時刻: ${new Date(sunsetTime)}`);
        console.log(`日没時刻まで${intervalTime/1000/60}分`);
        return intervalTime;
    }
}
/**********/

/***** メイン *****/
class Main {
    private static instance: Main;
    private _alexa: AlexaManeger;
    private _sun: Sun;
    private _isDev: boolean;

    private constructor() {
        this._alexa = AlexaManeger.getInstance();
        this._sun = Sun.getInstance();
        this._isDev = this.isDevMode();
    }
    public static getInstance(): Main {
        if (!Main.instance) {
            Main.instance = new Main();
        }
        return Main.instance;
    }
    /* devモードと通常モードの切り替え */
    private isDevMode(): boolean {
        return process.env.START_MODE === 'dev';
    }
    /**/
    /* sleep関数 */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**/
    private async start(): Promise<void> {
        // プログラム起動時に日没時刻を過ぎていない場合
        const intervalTimeOnce:number = await this._sun.getSunsetIntervalTime();
        if(intervalTimeOnce > 0){
            console.log('日没時刻までの時間が残っているため、日没時刻まで待機します。');
            // 日没時刻まで待機
            setTimeout(async () => {
                console.log('日没');
                await this._alexa.kimigayo();
            }, intervalTimeOnce-10000);
        }
        // 0700に実行する(平日のみ)
        cron.schedule('00 00 07 * * 1-5', async () => {
            console.log('0700');
            await this._alexa.kisho();
        });
        // 0710に実行する(平日のみ)
        cron.schedule('00 10 07 * * 1-5', async () => {
            console.log('0710');
            await this._alexa.tenko();
        });
        // 0620に実行する(平日のみ)
        cron.schedule('00 20 07 * * 1-5', async () => {
            console.log('0720');
            await this._alexa.shokuji();
        });
        // 0800に実行する
        cron.schedule('50 59 7 * * *', async () => {
            console.log('0800');
            await this._alexa.kimigayo();
            // 日没時刻まで待機
            const intervalTime:number = await this._sun.getSunsetIntervalTime();
            setTimeout(async () => {
                console.log('日没');
                await this._alexa.kimigayo();
            }, intervalTime-10000);
        });
        // 0845に実行する
        cron.schedule('00 45 08 * * 1-5', async () => {
            console.log('0845');
            await this._alexa.kagyokaishi();
        });
        // 1200に実行する(平日)
        cron.schedule('00 00 12 * * 1-5', async () => {
            console.log('1200');
            await this._alexa.shogo();
        });
        // 1200に実行する(休日)
        cron.schedule('00 00 12 * * 0,6', async () => {
            console.log('1200');
            await this._alexa.shokuji();
        });
        // 1730に実行する
        cron.schedule('00 30 17 * * 1-5', async () => {
            console.log('1730');
            await this._alexa.kagyoshuryo();
        });
        // 2300に実行する
        cron.schedule('00 00 23 * * *', async () => {
            console.log('2300');
            await this._alexa.shoto();
        });
        // 元旦に実行する
        cron.schedule('00 00 00 1 1 *', async () => {
            console.log('元旦');
            await this._alexa.akeome();
        });
    }
    public async run(): Promise<void> {
        console.log('プログラム起動');
        if (this._isDev) {
            console.log('devモードで起動します');
            await this._alexa.teijitenken();
            this.sleep(10000).then(async () => {
                await this._alexa.akeome();
            });
        } else {
            console.log('通常モードで起動します');
            this._alexa.uchikatahajime();
            this.sleep(10000).then(async () => {
                await this.start();
            });
        }
    }
}
/**********/

const main = Main.getInstance();
main.run();