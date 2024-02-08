/**
 * このプログラムは、Alexaに時報を話させるプログラムです。
 */
require('dotenv').config();
const { execSync } = require('child_process');
const cron = require('node-cron');
const sunCalc = require('suncalc');

if (!(process.env.AUDIO_SYUKKOU_PATH && process.env.AUDIO_KIOTSUKE_PATH && process.env.AUDIO_KIMIGAYO_PATH && process.env.AUDIO_KAKARE_PATH)) {
    console.error('ERROR: AUDIO_PATHが設定されていません。');
    process.exit(1);
}
if(!(process.env.MY_LATITUDE && process.env.MY_LONGITUDE)){
    console.error('ERROR: 緯度経度が設定されていません。');
    process.exit(1);
}

// 音楽ファイルパス
const AUDIO_SYUKKOU_PATH:string | undefined = process.env.AUDIO_SYUKKOU_PATH;
const AUDIO_KIOTSUKE_PATH:string | undefined = process.env.AUDIO_KIOTSUKE_PATH;
const AUDIO_KIMIGAYO_PATH:string | undefined = process.env.AUDIO_KIMIGAYO_PATH;
const AUDIO_KAKARE_PATH:string | undefined = process.env.AUDIO_KAKARE_PATH;
// 緯度経度
const MY_LATITUDE:number = parseFloat(process.env.MY_LATITUDE);
const MY_LONGITUDE:number = parseFloat(process.env.MY_LONGITUDE);

// const command:string = `./src/alexa_remote_control.sh -e speak:"<audio src='${audioPath}'/>こんにちは!DockerプラスTypeScriptからAlexaに話させてみました。"`;

//const sleep = (msec:number) => new Promise(resolve => setTimeout(resolve, msec));

// Alexaに話させる関数
const speakAlexa = async(message:string) => {
    const command:string = `./src/alexa_remote_control.sh -e speak:"${message}"`;
    const stdout:string = execSync(command).toString();
    // console.log(`stdout: ${stdout}`);
    return 0;
}

// 国旗を掲揚する関数
const kimigayo = async () => {
    console.log('start of Kimigayo');
    speakAlexa(`
        <amazon:emotion name='excited'>
            <prosody volume='x-fast'>10秒前</prosody>
        </amazon:emotion>
        <audio src='${AUDIO_KIOTSUKE_PATH}'/>
        <break time='4s'/>
        <amazon:emotion name='excited'>
            <prosody volume='x-fast'>時間</prosody>
        </amazon:emotion>
        <break strength='strong'/>
        <audio src='${AUDIO_KIMIGAYO_PATH}'/>
        <break time='1s'/>
        <amazon:emotion name='excited'>
            <prosody volume='x-fast'>かかれ</prosody>
        </amazon:emotion>
        <audio src='${AUDIO_KAKARE_PATH}'/>`
    );
    return 0;
};

// 出勤する関数
const syukkou = async () => {
    console.log('start of syukkou');
    speakAlexa(`<audio src='${AUDIO_SYUKKOU_PATH}'/>`);
    console.log('end of syukkou');
    return 0;
};

// 日没時刻までの時間を取得する関数
const getSunsetIntervalTime = async() => {
    const data = sunCalc.getTimes(new Date(), MY_LATITUDE, MY_LONGITUDE);
    const sunsetTime:Date = data.sunset;
    const now:Date = new Date();
    const intervalTime:number = sunsetTime.getTime() - now.getTime();
    console.log(`本日の日没時刻は${sunsetTime.getHours()}:${sunsetTime.getMinutes()}です。`);
    console.log(`日没時刻までの時間は${intervalTime}msです。`);
    return intervalTime;
};

// メイン関数
const main = async () => {
    console.log('start of main');
    // プログラム起動時に日没時刻を過ぎていない場合
    const intervalTimeOnce:number = await getSunsetIntervalTime();
    if(intervalTimeOnce > 0){
        console.log('日没時刻までの時間が残っているため、日没時刻まで待機します。');
        // 日没時刻まで待機
        setTimeout(async () => {
            console.log('日没');
            await kimigayo();
        }, intervalTimeOnce-10000);
    }
    // 0800に実行する
    cron.schedule('50 59 7 * * *', async () => {
        console.log('0800');
        await kimigayo();
        // 日没時刻まで待機
        const intervalTime:number = await getSunsetIntervalTime();
        setTimeout(async () => {
            console.log('日没');
            await kimigayo();
        }, intervalTime-10000);
    });
    console.log('end of main');
    return 0;
};

main();