require('dotenv').config();
const { exec } = require('child_process');

if (!process.env.AUDIO_PATH) {
    console.error('ERROR: AUDIO_PATHが設定されていません。');
    process.exit(1);
}
const audioPath:string | undefined = process.env.AUDIO_PATH;
const command:string = `./src/alexa_remote_control.sh -e speak:"<audio src='${audioPath}'/>こんにちは!DockerプラスTypeScriptからAlexaに話させてみました。"`;

exec(command, (err:string, stdout:string, stderr:string) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
});

console.log('end of script');