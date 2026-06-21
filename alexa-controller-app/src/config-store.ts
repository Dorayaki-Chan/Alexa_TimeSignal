import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { AppConfig } from './types';

const DEFAULT_CONFIG: AppConfig = {
    wakeUp: {
        enabled: true,
        defaultTime: '07:00',
        weekendEnabled: false,
        holidayEnabled: false,
    },
    timeSignal: { enabled: true },
    shoto: { enabled: true, time: '23:00' },
    stopPeriod: { enabled: false, startDate: '', endDate: '', startTime: '00:00', endTime: '23:59' },
    events: [],
};

type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

function deepMerge(target: any, source: any): any {
    const result = { ...target };
    for (const key of Object.keys(source)) {
        const srcVal = source[key];
        if (srcVal === undefined) continue;

        if (Array.isArray(srcVal)) {
            result[key] = srcVal;
        } else if (srcVal !== null && typeof srcVal === 'object' && typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])) {
            result[key] = deepMerge(target[key], srcVal);
        } else {
            result[key] = srcVal;
        }
    }
    return result;
}

export class ConfigStore extends EventEmitter {
    private config: AppConfig;
    private readonly configPath: string;

    constructor(dataDir?: string) {
        super();
        const dir = dataDir || process.env.DATA_DIR || '/app/data';
        this.configPath = path.join(dir, 'config.json');
        this.config = { ...DEFAULT_CONFIG };
    }

    public load(): void {
        const dir = path.dirname(this.configPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (fs.existsSync(this.configPath)) {
            const raw = fs.readFileSync(this.configPath, 'utf-8');
            const loaded = JSON.parse(raw) as DeepPartial<AppConfig>;
            this.config = deepMerge(DEFAULT_CONFIG, loaded);
            console.log('設定ファイルを読み込みました:', this.configPath);
        } else {
            this.config = { ...DEFAULT_CONFIG, events: [] };
            this.save();
            console.log('デフォルト設定ファイルを作成しました:', this.configPath);
        }
    }

    public save(): void {
        const tmpPath = this.configPath + '.tmp';
        fs.writeFileSync(tmpPath, JSON.stringify(this.config, null, 2), 'utf-8');
        fs.renameSync(tmpPath, this.configPath);
    }

    public get(): AppConfig {
        return JSON.parse(JSON.stringify(this.config)) as AppConfig;
    }

    public update(partial: DeepPartial<AppConfig>): AppConfig {
        this.config = deepMerge(this.config, partial);
        this.save();
        this.emit('config-changed', this.get());
        return this.get();
    }

    public getConfigPath(): string {
        return this.configPath;
    }
}
