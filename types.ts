export type AppMode =
  | 'piano'
  | 'listen-number'
  | 'math'
  | 'clock'
  | 'listen-clock'
  | 'concert'
  | 'challenge';

export interface NumberInfo {
  num: number;
  spanish: string;
  russian: string;
  phonetic?: string;
  category: '1-10' | '11-20' | '21-50' | '51-100';
}

export interface ClockInfo {
  hours: number;
  minutes: number;
  spanish: string;
  russian: string;
  formalSpanish?: string;
  explanationRu?: string;
}

export interface ConcertEvent {
  id: string;
  titleEs: string;
  titleRu: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  icon: string;
}

export interface QuizQuestion {
  id: string;
  promptEs: string;
  promptRu: string;
  spokenEs: string;
  options: {
    id: string;
    labelEs: string;
    labelRu: string;
    value: string | number;
    clockHours?: number;
    clockMinutes?: number;
  }[];
  correctAnswer: string | number;
  explanationRu: string;
  explanationEs: string;
  category: 'number' | 'math' | 'clock' | 'concert';
}

export interface Achievement {
  id: string;
  titleEs: string;
  titleRu: string;
  descEs: string;
  descRu: string;
  icon: string;
  unlocked: boolean;
}

export interface UserStats {
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  keysPlayed: number;
  completedLevels: number[];
  achievements: string[];
}
