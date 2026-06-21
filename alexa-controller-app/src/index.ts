import 'dotenv/config';
import { ConfigStore } from './config-store';
import { AlexaManager } from './alexa-manager';
import { Sun } from './sun';
import { Scheduler } from './scheduler';
import { AppLogger } from './logger';
import { ApiServer } from './api-server';

if (!(process.env.AUDIO_SYUKKOU_PATH &&
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
      process.env.AUDIO_AKEOME_PATH)) {
    console.error('ERROR: AUDIO_PATHが設定されていません。');
    process.exit(1);
}
if (!(process.env.MY_LATITUDE && process.env.MY_LONGITUDE)) {
    console.error('ERROR: 緯度経度が設定されていません。');
    process.exit(1);
}

async function main(): Promise<void> {
    console.log('プログラム起動');

    const configStore = new ConfigStore();
    configStore.load();

    const logger = new AppLogger();
    const alexa = AlexaManager.getInstance();
    const sun = Sun.getInstance();
    const scheduler = new Scheduler(configStore, alexa, sun, logger);
    const apiServer = new ApiServer(configStore, scheduler, logger, alexa);
    apiServer.listen();

    const isDev = process.env.START_MODE === 'dev';

    if (isDev) {
        console.log('devモードで起動します');
        await alexa.teijitenken();
        setTimeout(async () => {
            await alexa.shokuji();
        }, 10000);
    } else {
        console.log('通常モードで起動します');
        await alexa.uchikatahajime();
        setTimeout(() => {
            scheduler.rebuild();
        }, 10000);
    }

    logger.log('system', `プログラム起動 (${isDev ? 'dev' : 'prod'}モード)`);
}

main();
