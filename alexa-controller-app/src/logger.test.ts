import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { AppLogger } from './logger';

let tmpDir: string;

beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'logger-test-'));
});

afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('AppLogger', () => {
    describe('constructor', () => {
        it('存在しないディレクトリを作成する', () => {
            const nestedDir = path.join(tmpDir, 'nested', 'dir');
            new AppLogger(nestedDir);
            expect(fs.existsSync(nestedDir)).toBe(true);
        });
    });

    describe('log', () => {
        it('JSONL形式で1行追記する', () => {
            const logger = new AppLogger(tmpDir);
            logger.log('signal', 'テスト信号');

            const logPath = path.join(tmpDir, 'logs.jsonl');
            const lines = fs.readFileSync(logPath, 'utf-8').trim().split('\n');
            expect(lines).toHaveLength(1);

            const entry = JSON.parse(lines[0]);
            expect(entry.type).toBe('signal');
            expect(entry.message).toBe('テスト信号');
            expect(entry.timestamp).toBeDefined();
        });

        it('detailsフィールドを含める', () => {
            const logger = new AppLogger(tmpDir);
            logger.log('error', 'エラー発生', { code: 500 });

            const logPath = path.join(tmpDir, 'logs.jsonl');
            const entry = JSON.parse(fs.readFileSync(logPath, 'utf-8').trim());
            expect(entry.details).toEqual({ code: 500 });
        });

        it('複数エントリを別々の行に追記する', () => {
            const logger = new AppLogger(tmpDir);
            logger.log('signal', '信号1');
            logger.log('system', '信号2');
            logger.log('config_change', '信号3');

            const logPath = path.join(tmpDir, 'logs.jsonl');
            const lines = fs.readFileSync(logPath, 'utf-8').trim().split('\n');
            expect(lines).toHaveLength(3);
        });

        it('ISO 8601形式のタイムスタンプを持つ', () => {
            const logger = new AppLogger(tmpDir);
            logger.log('signal', 'テスト');

            const logPath = path.join(tmpDir, 'logs.jsonl');
            const entry = JSON.parse(fs.readFileSync(logPath, 'utf-8').trim());
            expect(() => new Date(entry.timestamp)).not.toThrow();
            expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        });
    });

    describe('query', () => {
        it('ログファイルが存在しない場合空の結果を返す', () => {
            const logger = new AppLogger(tmpDir);
            const result = logger.query();
            expect(result).toEqual({ data: [], total: 0 });
        });

        it('新しい順（逆順）でエントリを返す', () => {
            const logger = new AppLogger(tmpDir);
            logger.log('signal', '最初');
            logger.log('signal', '2番目');
            logger.log('signal', '最後');

            const result = logger.query();
            expect(result.data[0].message).toBe('最後');
            expect(result.data[2].message).toBe('最初');
        });

        it('limitパラメータを尊重する', () => {
            const logger = new AppLogger(tmpDir);
            for (let i = 0; i < 10; i++) {
                logger.log('signal', `信号${i}`);
            }

            const result = logger.query(3);
            expect(result.data).toHaveLength(3);
            expect(result.total).toBe(10);
        });

        it('offsetパラメータを尊重する', () => {
            const logger = new AppLogger(tmpDir);
            for (let i = 0; i < 5; i++) {
                logger.log('signal', `信号${i}`);
            }

            const result = logger.query(50, 2);
            expect(result.data).toHaveLength(3);
            expect(result.data[0].message).toBe('信号2');
        });
    });

    describe('trimIfNeeded（log経由の間接テスト）', () => {
        it('1000行超で500行にトリムする', () => {
            const logger = new AppLogger(tmpDir);
            for (let i = 0; i < 1002; i++) {
                logger.log('signal', `信号${i}`);
            }

            const logPath = path.join(tmpDir, 'logs.jsonl');
            const lines = fs.readFileSync(logPath, 'utf-8').trim().split('\n');
            expect(lines.length).toBeLessThanOrEqual(501);

            const lastEntry = JSON.parse(lines[lines.length - 1]);
            expect(lastEntry.message).toBe('信号1001');
        });
    });
});
