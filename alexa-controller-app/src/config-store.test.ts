import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ConfigStore, deepMerge } from './config-store';

let tmpDir: string;

beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-test-'));
});

afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('deepMerge', () => {
    it('フラットなオブジェクトをマージする', () => {
        expect(deepMerge({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
    });

    it('スカラー値を上書きする', () => {
        expect(deepMerge({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
    });

    it('ネストされたオブジェクトをディープマージする', () => {
        const result = deepMerge({ x: { a: 1 } }, { x: { b: 2 } });
        expect(result).toEqual({ x: { a: 1, b: 2 } });
    });

    it('配列はマージせず置換する', () => {
        expect(deepMerge({ arr: [1] }, { arr: [2, 3] })).toEqual({ arr: [2, 3] });
    });

    it('undefinedの値をスキップする', () => {
        expect(deepMerge({ a: 1, b: 2 }, { a: undefined, b: 3 })).toEqual({ a: 1, b: 3 });
    });

    it('nullで上書きする（ディープマージしない）', () => {
        expect(deepMerge({ a: { nested: 1 } }, { a: null })).toEqual({ a: null });
    });
});

describe('ConfigStore', () => {
    describe('constructor と load', () => {
        it('存在しないディレクトリを作成する', () => {
            const nestedDir = path.join(tmpDir, 'nested', 'dir');
            const store = new ConfigStore(nestedDir);
            store.load();
            expect(fs.existsSync(nestedDir)).toBe(true);
        });

        it('設定ファイルが無い場合デフォルト設定を書き出す', () => {
            const store = new ConfigStore(tmpDir);
            store.load();
            const configPath = path.join(tmpDir, 'config.json');
            expect(fs.existsSync(configPath)).toBe(true);

            const config = store.get();
            expect(config.timeSignal.enabled).toBe(true);
            expect(config.wakeUp.enabled).toBe(true);
            expect(config.events).toEqual([]);
        });

        it('既存の部分設定をデフォルトとマージして読み込む', () => {
            const configPath = path.join(tmpDir, 'config.json');
            fs.writeFileSync(configPath, JSON.stringify({ shoto: { enabled: false, time: '22:00' } }), 'utf-8');

            const store = new ConfigStore(tmpDir);
            store.load();
            const config = store.get();

            expect(config.shoto.enabled).toBe(false);
            expect(config.shoto.time).toBe('22:00');
            expect(config.timeSignal.enabled).toBe(true);
            expect(config.wakeUp.enabled).toBe(true);
        });
    });

    describe('save', () => {
        it('有効なJSONをディスクに書き込む', () => {
            const store = new ConfigStore(tmpDir);
            store.load();

            const configPath = path.join(tmpDir, 'config.json');
            const raw = fs.readFileSync(configPath, 'utf-8');
            expect(() => JSON.parse(raw)).not.toThrow();
        });
    });

    describe('get', () => {
        it('ディープコピーを返す（返却値の変更が内部状態に影響しない）', () => {
            const store = new ConfigStore(tmpDir);
            store.load();

            const config1 = store.get();
            config1.shoto.time = '99:99';

            const config2 = store.get();
            expect(config2.shoto.time).toBe('23:00');
        });
    });

    describe('update', () => {
        it('パーシャルな更新をディープマージする', () => {
            const store = new ConfigStore(tmpDir);
            store.load();

            const updated = store.update({ shoto: { time: '21:30' } });
            expect(updated.shoto.time).toBe('21:30');
            expect(updated.shoto.enabled).toBe(true);
        });

        it('更新後にディスクに永続化する', () => {
            const store = new ConfigStore(tmpDir);
            store.load();
            store.update({ shoto: { time: '20:00' } });

            const configPath = path.join(tmpDir, 'config.json');
            const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
            expect(raw.shoto.time).toBe('20:00');
        });

        it('config-changedイベントを発火する', () => {
            const store = new ConfigStore(tmpDir);
            store.load();

            let emitted = false;
            store.on('config-changed', () => { emitted = true; });
            store.update({ shoto: { time: '19:00' } });

            expect(emitted).toBe(true);
        });

        it('eventsの配列を置換する', () => {
            const store = new ConfigStore(tmpDir);
            store.load();

            const events = [
                { id: '1', enabled: true, time: '09:00', sound: 'zarei' as const, announcement: 'テスト', recurring: true },
            ];
            store.update({ events });
            expect(store.get().events).toHaveLength(1);
            expect(store.get().events[0].announcement).toBe('テスト');
        });
    });
});
