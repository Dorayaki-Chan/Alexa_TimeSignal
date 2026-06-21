import sunCalc from 'suncalc';

export class Sun {
    private static instance: Sun;
    private _latitude: number;
    private _longitude: number;

    private constructor() {
        this._latitude = parseFloat(process.env.MY_LATITUDE || '0');
        this._longitude = parseFloat(process.env.MY_LONGITUDE || '0');
    }

    public static getInstance(): Sun {
        if (!Sun.instance) {
            Sun.instance = new Sun();
        }
        return Sun.instance;
    }

    public async getSunsetIntervalTime(): Promise<number> {
        const times = sunCalc.getTimes(new Date(), this._latitude, this._longitude);
        const sunsetTime: number = times.sunset.getTime();
        const now: number = new Date().getTime();
        const intervalTime: number = sunsetTime - now;
        console.log(`日没時刻: ${new Date(sunsetTime)}`);
        console.log(`日没時刻まで${intervalTime / 1000 / 60}分`);
        return intervalTime;
    }

    public getSunsetTimeString(): string {
        const times = sunCalc.getTimes(new Date(), this._latitude, this._longitude);
        const sunset = times.sunset;
        return `${String(sunset.getHours()).padStart(2, '0')}:${String(sunset.getMinutes()).padStart(2, '0')}`;
    }
}
