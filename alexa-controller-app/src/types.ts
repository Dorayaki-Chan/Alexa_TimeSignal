export interface WakeUpConfig {
    enabled: boolean;
    defaultTime: string;
    weekendEnabled: boolean;
    holidayEnabled: boolean;
}

export interface ShotoConfig {
    enabled: boolean;
    time: string;
}

export interface StopPeriodConfig {
    enabled: boolean;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
}

export type SidePipeSound = 'zarei' | 'tanfu' | 'souin' | 'wakare' | 'genmon_sougei';

export interface EventSignal {
    id: string;
    enabled: boolean;
    time: string;
    sound: SidePipeSound;
    announcement: string;
    recurring: boolean;
    date?: string;
}

export interface AppConfig {
    wakeUp: WakeUpConfig;
    timeSignal: { enabled: boolean };
    shoto: ShotoConfig;
    stopPeriod: StopPeriodConfig;
    events: EventSignal[];
}

export interface LogEntry {
    timestamp: string;
    type: 'signal' | 'config_change' | 'error' | 'system';
    message: string;
    details?: Record<string, unknown>;
}
