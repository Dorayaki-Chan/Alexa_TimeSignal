import * as fs from 'fs';
import * as path from 'path';
import { LogEntry } from './types';

const MAX_LINES = 1000;
const TRIM_TO = 500;

export class AppLogger {
    private readonly logPath: string;

    constructor(dataDir?: string) {
        const dir = dataDir || process.env.DATA_DIR || '/app/data';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        this.logPath = path.join(dir, 'logs.jsonl');
    }

    public log(type: LogEntry['type'], message: string, details?: Record<string, unknown>): void {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            type,
            message,
            details,
        };
        fs.appendFileSync(this.logPath, JSON.stringify(entry) + '\n', 'utf-8');
        this.trimIfNeeded();
    }

    public query(limit: number = 50, offset: number = 0): { data: LogEntry[]; total: number } {
        if (!fs.existsSync(this.logPath)) {
            return { data: [], total: 0 };
        }

        const content = fs.readFileSync(this.logPath, 'utf-8').trim();
        if (!content) {
            return { data: [], total: 0 };
        }

        const lines = content.split('\n');
        const total = lines.length;

        const reversed = lines.reverse();
        const sliced = reversed.slice(offset, offset + limit);
        const data = sliced.map(line => JSON.parse(line) as LogEntry);

        return { data, total };
    }

    private trimIfNeeded(): void {
        if (!fs.existsSync(this.logPath)) return;

        const content = fs.readFileSync(this.logPath, 'utf-8').trim();
        if (!content) return;

        const lines = content.split('\n');
        if (lines.length > MAX_LINES) {
            const trimmed = lines.slice(lines.length - TRIM_TO);
            fs.writeFileSync(this.logPath, trimmed.join('\n') + '\n', 'utf-8');
        }
    }
}
