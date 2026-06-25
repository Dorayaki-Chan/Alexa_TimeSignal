import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('suncalc', () => ({
    default: {
        getTimes: vi.fn(),
    },
}));

import sunCalc from 'suncalc';
const mockGetTimes = vi.mocked(sunCalc.getTimes);

describe('Sun', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();
        process.env.MY_LATITUDE = '35.6535';
        process.env.MY_LONGITUDE = '139.6016';
    });

    async function createFreshSun() {
        const mod = await import('./sun');
        // @ts-ignore - reset singleton for testing
        mod.Sun['instance'] = undefined;
        return mod.Sun.getInstance();
    }

    describe('getInstance', () => {
        it('Sunインスタンスを返す', async () => {
            const sun = await createFreshSun();
            expect(sun).toBeDefined();
        });

        it('同じインスタンスを返す（シングルトン）', async () => {
            const mod = await import('./sun');
            // @ts-ignore
            mod.Sun['instance'] = undefined;
            const sun1 = mod.Sun.getInstance();
            const sun2 = mod.Sun.getInstance();
            expect(sun1).toBe(sun2);
        });
    });

    describe('getSunsetIntervalTime', () => {
        it('日没が未来の場合に正のミリ秒を返す', async () => {
            const now = new Date('2024-06-15T12:00:00+09:00');
            vi.useFakeTimers();
            vi.setSystemTime(now);

            const sunset = new Date('2024-06-15T19:00:00+09:00');
            mockGetTimes.mockReturnValue({ sunset } as any);

            const sun = await createFreshSun();
            const interval = await sun.getSunsetIntervalTime();

            expect(interval).toBeGreaterThan(0);
            expect(mockGetTimes).toHaveBeenCalledWith(expect.any(Date), 35.6535, 139.6016);

            vi.useRealTimers();
        });

        it('日没が過去の場合に負のミリ秒を返す', async () => {
            const now = new Date('2024-06-15T20:00:00+09:00');
            vi.useFakeTimers();
            vi.setSystemTime(now);

            const sunset = new Date('2024-06-15T19:00:00+09:00');
            mockGetTimes.mockReturnValue({ sunset } as any);

            const sun = await createFreshSun();
            const interval = await sun.getSunsetIntervalTime();

            expect(interval).toBeLessThan(0);

            vi.useRealTimers();
        });
    });

    describe('getSunsetTimeString', () => {
        it('HH:MM形式で返す', async () => {
            const sunset = new Date('2024-06-15T19:05:00+09:00');
            mockGetTimes.mockReturnValue({ sunset } as any);

            const sun = await createFreshSun();
            const result = sun.getSunsetTimeString();

            expect(result).toMatch(/^\d{2}:\d{2}$/);
        });

        it('1桁の時・分をゼロ埋めする', async () => {
            const sunset = new Date('2024-01-15T17:03:00+09:00');
            mockGetTimes.mockReturnValue({ sunset } as any);

            const sun = await createFreshSun();
            const result = sun.getSunsetTimeString();

            const [h, m] = result.split(':');
            expect(h).toHaveLength(2);
            expect(m).toHaveLength(2);
        });
    });
});
