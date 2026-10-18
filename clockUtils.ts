import type { ClockInfo } from './types.ts';
import { getNumberInfo } from './spanishData.ts';

const SPANISH_HOURS_MAP: Record<number, string> = {
  1: 'una',
  2: 'dos',
  3: 'tres',
  4: 'cuatro',
  5: 'cinco',
  6: 'seis',
  7: 'siete',
  8: 'ocho',
  9: 'nueve',
  10: 'diez',
  11: 'once',
  12: 'doce',
};

const RUSSIAN_HOURS_NOMINATIVE: Record<number, string> = {
  1: 'час',
  2: 'два часа',
  3: 'три часа',
  4: 'четыре часа',
  5: 'пять часов',
  6: 'шесть часов',
  7: 'семь часов',
  8: 'восемь часов',
  9: 'девять часов',
  10: 'десять часов',
  11: 'одиннадцать часов',
  12: 'двенадцать часов',
};

const RUSSIAN_HOURS_GENITIVE: Record<number, string> = {
  1: 'первого',
  2: 'второго',
  3: 'третьего',
  4: 'четвёртого',
  5: 'пятого',
  6: 'шестого',
  7: 'седьмого',
  8: 'восьмого',
  9: 'девятого',
  10: 'десятого',
  11: 'одиннадцатого',
  12: 'двенадцатого',
};

const RUSSIAN_MINUS_GENITIVE: Record<number, string> = {
  1: 'одного',
  2: 'двух',
  3: 'трёх',
  4: 'четырёх',
  5: 'пяти',
  6: 'шести',
  7: 'семи',
  8: 'восьми',
  9: 'девяти',
  10: 'десяти',
  11: 'одиннадцати',
  12: 'двенадцати',
};

export function getSpanishTime(hours: number, minutes: number): ClockInfo {
  // Normalize 1..12
  let h = hours % 12;
  if (h === 0) h = 12;
  const m = Math.max(0, Math.min(59, Math.round(minutes)));

  let nextH = h + 1;
  if (nextH > 12) nextH = 1;

  let spanish = '';
  let russian = '';
  let formalSpanish = '';
  let explanationRu = '';

  const hName = SPANISH_HOURS_MAP[h];
  const nextHName = SPANISH_HOURS_MAP[nextH];
  const isOne = h === 1;
  const isNextOne = nextH === 1;

  if (m === 0) {
    if (isOne) {
      spanish = 'Es la una en punto';
      russian = 'Сейчас ровно час';
    } else {
      spanish = `Son las ${hName} en punto`;
      russian = `Сейчас ровно ${RUSSIAN_HOURS_NOMINATIVE[h]}`;
    }
    explanationRu = 'С 1 часом используется «Es la una», со всеми остальными — «Son las...».';
  } else if (m === 15) {
    if (isOne) {
      spanish = 'Es la una y cuarto';
      russian = 'Сейчас четверть второго (1:15)';
    } else {
      spanish = `Son las ${hName} y cuarto`;
      russian = `Сейчас четверть ${RUSSIAN_HOURS_GENITIVE[nextH]} (${h}:15)`;
    }
    explanationRu = '15 минут в испанском называют «y cuarto» (четверть).';
  } else if (m === 30) {
    if (isOne) {
      spanish = 'Es la una y media';
      russian = 'Сейчас половина второго (1:30)';
    } else {
      spanish = `Son las ${hName} y media`;
      russian = `Сейчас половина ${RUSSIAN_HOURS_GENITIVE[nextH]} (${h}:30)`;
    }
    explanationRu = '30 минут обозначаются словом «y media» (половина).';
  } else if (m < 35) {
    // Minutes from 1 to 34 (excluding 15 and 30)
    const mInfo = getNumberInfo(m);
    if (isOne) {
      spanish = `Es la una y ${mInfo.spanish}`;
      russian = `Сейчас час и ${mInfo.russian} ${getMinuteRuSuffix(m)}`;
    } else {
      spanish = `Son las ${hName} y ${mInfo.spanish}`;
      russian = `Сейчас ${RUSSIAN_HOURS_NOMINATIVE[h]} и ${mInfo.russian} ${getMinuteRuSuffix(m)}`;
    }
    explanationRu = 'В первой половине часа минуты прибавляются через союз «y».';
  } else if (m === 45) {
    // 45 -> menos cuarto
    if (isNextOne) {
      spanish = 'Es la una menos cuarto';
      russian = 'Сейчас без четверти час (12:45)';
    } else {
      spanish = `Son las ${nextHName} menos cuarto`;
      russian = `Сейчас без четверти ${RUSSIAN_MINUS_GENITIVE[nextH]} (${h}:45)`;
    }
    explanationRu = 'Во второй половине часа говорят «menos cuarto» (без четверти следующего часа).';
  } else {
    // 35 to 59
    const remaining = 60 - m;
    const remInfo = getNumberInfo(remaining);
    if (isNextOne) {
      spanish = `Es la una menos ${remInfo.spanish}`;
      russian = `Сейчас без ${remInfo.russian} ${getMinuteRuGenitiveSuffix(remaining)} час`;
    } else {
      spanish = `Son las ${nextHName} menos ${remInfo.spanish}`;
      russian = `Сейчас без ${remInfo.russian} ${getMinuteRuGenitiveSuffix(remaining)} ${RUSSIAN_MINUS_GENITIVE[nextH]}`;
    }
    explanationRu = `После половины часа говорят «menos» (минус) и указывают следующий час: Son las ${nextHName} menos ${remInfo.spanish}.`;
  }

  // Formal digital alternative:
  const minutePadded = m < 10 ? `0${m}` : `${m}`;
  formalSpanish = `${isOne ? 'Es la una' : `Son las ${hName}`} con ${getNumberInfo(m).spanish} minutos (${h}:${minutePadded})`;

  return {
    hours: h,
    minutes: m,
    spanish,
    russian,
    formalSpanish,
    explanationRu,
  };
}

function getMinuteRuSuffix(m: number): string {
  const last = m % 10;
  const last2 = m % 100;
  if (last2 >= 11 && last2 <= 19) return 'минут';
  if (last === 1) return 'минута';
  if (last >= 2 && last <= 4) return 'минуты';
  return 'минут';
}

function getMinuteRuGenitiveSuffix(m: number): string {
  const last = m % 10;
  const last2 = m % 100;
  if (last2 >= 11 && last2 <= 19) return 'минут';
  if (last === 1) return 'минуты';
  return 'минут';
}

// Convert angle to hours/minutes
export function getHourAngle(hours: number, minutes: number): number {
  const h = hours % 12;
  return (h * 30) + (minutes * 0.5);
}

export function getMinuteAngle(minutes: number): number {
  return minutes * 6;
}

// Generate random clock times for quizzes
export function getRandomClockTime(step: number = 5): { hours: number; minutes: number } {
  const hours = Math.floor(Math.random() * 12) + 1;
  const stepsPerHour = 60 / step;
  const minutes = Math.floor(Math.random() * stepsPerHour) * step;
  return { hours, minutes };
}

// Generate 4 plausible time options for listening quizzes
export function generateClockDistractors(correctHours: number, correctMinutes: number): { hours: number; minutes: number }[] {
  const options: { hours: number; minutes: number }[] = [{ hours: correctHours, minutes: correctMinutes }];

  // Distractor 1: same minutes, different hour (e.g., 7:20 vs 8:20)
  const diffH = correctHours === 12 ? 1 : correctHours + 1;
  options.push({ hours: diffH, minutes: correctMinutes });

  // Distractor 2: swapped or common confusion (e.g. "menos veinte" vs "y veinte": 7:20 vs 6:40 or 7:40)
  let diffM = (correctMinutes + 30) % 60;
  if (diffM === correctMinutes) diffM = (correctMinutes + 15) % 60;
  options.push({ hours: correctHours, minutes: diffM });

  // Distractor 3: another plausible one (e.g. minus 1 hour, or 15/45 confusion)
  const prevH = correctHours === 1 ? 12 : correctHours - 1;
  let diffM2 = 60 - correctMinutes;
  if (diffM2 === 60 || diffM2 === correctMinutes) diffM2 = (correctMinutes + 10) % 60;
  options.push({ hours: prevH, minutes: diffM2 });

  // Shuffle
  return options.sort(() => Math.random() - 0.5);
}
