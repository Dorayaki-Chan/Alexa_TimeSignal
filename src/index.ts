require('dotenv').config();
const { execSync } = require('child_process');

if (!(process.env.AUDIO_SYUKKOU_PATH && process.env.AUDIO_KIOTSUKE_PATH && process.env.AUDIO_KIMIGAYO_PATH && process.env.AUDIO_KAKARE_PATH)) {
    console.error('ERROR: AUDIO_PATHが設定されていません。');
    process.exit(1);
}
const AUDIO_SYUKKOU_PATH:string | undefined = process.env.AUDIO_SYUKKOU_PATH;
const AUDIO_KIOTSUKE_PATH:string | undefined = process.env.AUDIO_KIOTSUKE_PATH;
const AUDIO_KIMIGAYO_PATH:string | undefined = process.env.AUDIO_KIMIGAYO_PATH;
const AUDIO_KAKARE_PATH:string | undefined = process.env.AUDIO_KAKARE_PATH;

// const command:string = `./src/alexa_remote_control.sh -e speak:"<audio src='${audioPath}'/>こんにちは!DockerプラスTypeScriptからAlexaに話させてみました。"`;

//const sleep = (msec:number) => new Promise(resolve => setTimeout(resolve, msec));

// Alexaに話させる関数
const speakAlexa = async(message:string) => {
    const command:string = `./src/alexa_remote_control.sh -e speak:"${message}"`;
    const stdout = execSync(command);
    console.log(`stdout: ${stdout.toString()}`);
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
    //speakAlexa(`<audio src='${AUDIO_KIOTSUKE_PATH}'/>`);
    //await sleep(5000);
    //speakAlexa(`時間!`);
    //speakAlexa(`<audio src='${AUDIO_KIMIGAYO_PATH}'/>`);
    //await sleep(2000);
    //speakAlexa(`かかれ!`);
    //speakAlexa(`<audio src='${AUDIO_KAKARE_PATH}'/>`);
    console.log('end of kimigayo');
    return 0;
};

// 出勤する関数
const syukkou = async () => {
    console.log('start of syukkou');
    speakAlexa(`<audio src='${AUDIO_SYUKKOU_PATH}'/>`);
    console.log('end of syukkou');
    return 0;
};

// メイン関数
const main = async () => {
    console.log('start of main');
    await kimigayo();
    console.log('end of main');
    return 0;
};

main();