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

export const SOUND_LABELS: Record<SidePipeSound, string> = {
  zarei: '雑令',
  tanfu: '短符',
  souin: '総員',
  wakare: '別れ',
  genmon_sougei: '舷門送迎',
};
