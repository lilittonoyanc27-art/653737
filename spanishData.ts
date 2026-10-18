import type { NumberInfo, ConcertEvent, QuizQuestion } from './types.ts';

// Spanish numbers 1 to 100
const SPANISH_NUMBERS_MAP: Record<number, { es: string; ru: string; phonetic?: string }> = {
  1: { es: 'uno', ru: 'один' },
  2: { es: 'dos', ru: 'два' },
  3: { es: 'tres', ru: 'три' },
  4: { es: 'cuatro', ru: 'четыре' },
  5: { es: 'cinco', ru: 'пять' },
  6: { es: 'seis', ru: 'шесть' },
  7: { es: 'siete', ru: 'семь' },
  8: { es: 'ocho', ru: 'восемь' },
  9: { es: 'nueve', ru: 'девять' },
  10: { es: 'diez', ru: 'десять' },
  11: { es: 'once', ru: 'одиннадцать' },
  12: { es: 'doce', ru: 'двенадцать' },
  13: { es: 'trece', ru: 'тринадцать' },
  14: { es: 'catorce', ru: 'четырнадцать' },
  15: { es: 'quince', ru: 'пятнадцать' },
  16: { es: 'dieciséis', ru: 'шестнадцать' },
  17: { es: 'diecisiete', ru: 'семнадцать' },
  18: { es: 'dieciocho', ru: 'восемнадцать' },
  19: { es: 'diecinueve', ru: 'девятнадцать' },
  20: { es: 'veinte', ru: 'двадцать' },
  21: { es: 'veintiuno', ru: 'двадцать один' },
  22: { es: 'veintidós', ru: 'двадцать два' },
  23: { es: 'veintitrés', ru: 'двадцать три' },
  24: { es: 'veinticuatro', ru: 'двадцать четыре' },
  25: { es: 'veinticinco', ru: 'двадцать пять' },
  26: { es: 'veintiséis', ru: 'двадцать шесть' },
  27: { es: 'veintisiete', ru: 'двадцать семь' },
  28: { es: 'veintiocho', ru: 'двадцать восемь' },
  29: { es: 'veintinueve', ru: 'двадцать девять' },
  30: { es: 'treinta', ru: 'тридцать' },
  31: { es: 'treinta y uno', ru: 'тридцать один' },
  32: { es: 'treinta y dos', ru: 'тридцать два' },
  33: { es: 'treinta y tres', ru: 'тридцать три' },
  34: { es: 'treinta y cuatro', ru: 'тридцать четыре' },
  35: { es: 'treinta y cinco', ru: 'тридцать пять' },
  36: { es: 'treinta y seis', ru: 'тридцать шесть' },
  37: { es: 'treinta y siete', ru: 'тридцать семь' },
  38: { es: 'treinta y ocho', ru: 'тридцать восемь' },
  39: { es: 'treinta y nueve', ru: 'тридцать девять' },
  40: { es: 'cuarenta', ru: 'сорок' },
  41: { es: 'cuarenta y uno', ru: 'сорок один' },
  42: { es: 'cuarenta y dos', ru: 'сорок два' },
  43: { es: 'cuarenta y tres', ru: 'сорок три' },
  44: { es: 'cuarenta y cuatro', ru: 'сорок четыре' },
  45: { es: 'cuarenta y cinco', ru: 'сорок пять' },
  46: { es: 'cuarenta y seis', ru: 'сорок шесть' },
  47: { es: 'cuarenta y siete', ru: 'сорок семь' },
  48: { es: 'cuarenta y ocho', ru: 'сорок восемь' },
  49: { es: 'cuarenta y nueve', ru: 'сорок девять' },
  50: { es: 'cincuenta', ru: 'пятьдесят' },
  51: { es: 'cincuenta y uno', ru: 'пятьдесят один' },
  52: { es: 'cincuenta y dos', ru: 'пятьдесят два' },
  53: { es: 'cincuenta y tres', ru: 'пятьдесят три' },
  54: { es: 'cincuenta y cuatro', ru: 'пятьдесят четыре' },
  55: { es: 'cincuenta y cinco', ru: 'пятьдесят пять' },
  56: { es: 'cincuenta y seis', ru: 'пятьдесят шесть' },
  57: { es: 'cincuenta y siete', ru: 'пятьдесят семь' },
  58: { es: 'cincuenta y ocho', ru: 'пятьдесят восемь' },
  59: { es: 'cincuenta y nueve', ru: 'пятьдесят девять' },
  60: { es: 'sesenta', ru: 'шестьдесят' },
  61: { es: 'sesenta y uno', ru: 'шестьдесят один' },
  62: { es: 'sesenta y dos', ru: 'шестьдесят два' },
  63: { es: 'sesenta y tres', ru: 'шестьдесят три' },
  64: { es: 'sesenta y cuatro', ru: 'шестьдесят четыре' },
  65: { es: 'sesenta y cinco', ru: 'шестьдесят пять' },
  66: { es: 'sesenta y seis', ru: 'шестьдесят шесть' },
  67: { es: 'sesenta y siete', ru: 'шестьдесят семь' },
  68: { es: 'sesenta y ocho', ru: 'шестьдесят восемь' },
  69: { es: 'sesenta y nueve', ru: 'шестьдесят девять' },
  70: { es: 'setenta', ru: 'семьдесят' },
  71: { es: 'setenta y uno', ru: 'семьдесят один' },
  72: { es: 'setenta y dos', ru: 'семьдесят два' },
  73: { es: 'setenta y tres', ru: 'семьдесят три' },
  74: { es: 'setenta y cuatro', ru: 'семьдесят четыре' },
  75: { es: 'setenta y cinco', ru: 'семьдесят пять' },
  76: { es: 'setenta y seis', ru: 'семьдесят шесть' },
  77: { es: 'setenta y siete', ru: 'семьдесят семь' },
  78: { es: 'setenta y ocho', ru: 'семьдесят восемь' },
  79: { es: 'setenta y nueve', ru: 'семьдесят девять' },
  80: { es: 'ochenta', ru: 'восемьдесят' },
  81: { es: 'ochenta y uno', ru: 'восемьдесят один' },
  82: { es: 'ochenta y dos', ru: 'восемьдесят два' },
  83: { es: 'ochenta y tres', ru: 'восемьдесят три' },
  84: { es: 'ochenta y cuatro', ru: 'восемьдесят четыре' },
  85: { es: 'ochenta y cinco', ru: 'восемьдесят пять' },
  86: { es: 'ochenta y seis', ru: 'восемьдесят шесть' },
  87: { es: 'ochenta y siete', ru: 'восемьдесят семь' },
  88: { es: 'ochenta y ocho', ru: 'восемьдесят восемь' },
  89: { es: 'ochenta y nueve', ru: 'восемьдесят девять' },
  90: { es: 'noventa', ru: 'девяносто' },
  91: { es: 'noventa y uno', ru: 'девяносто один' },
  92: { es: 'noventa y dos', ru: 'девяносто два' },
  93: { es: 'noventa y tres', ru: 'девяносто три' },
  94: { es: 'noventa y cuatro', ru: 'девяносто четыре' },
  95: { es: 'noventa y cinco', ru: 'девяносто пять' },
  96: { es: 'noventa y seis', ru: 'девяносто шесть' },
  97: { es: 'noventa y siete', ru: 'девяносто семь' },
  98: { es: 'noventa y ocho', ru: 'девяносто восемь' },
  99: { es: 'noventa y nueve', ru: 'девяносто девять' },
  100: { es: 'cien', ru: 'сто' },
};

export function getNumberInfo(n: number): NumberInfo {
  const bounded = Math.max(1, Math.min(100, Math.round(n)));
  const item = SPANISH_NUMBERS_MAP[bounded] || { es: 'uno', ru: 'один' };
  let category: NumberInfo['category'] = '1-10';
  if (bounded > 50) category = '51-100';
  else if (bounded > 20) category = '21-50';
  else if (bounded > 10) category = '11-20';

  return {
    num: bounded,
    spanish: item.es,
    russian: item.ru,
    category,
  };
}

export function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Generate intelligent distractors for "Escucha y toca"
// e.g., if target is 78:
// options could be 68 (sesenta/setenta acoustic confusion), 87 (inverted digits), 98 (rhyming/ending confusion)
export function generateNumberDistractors(target: number): number[] {
  const options = new Set<number>();
  options.add(target);

  // Inverted digits if 2-digit number (e.g., 78 -> 87)
  if (target >= 12 && target <= 99) {
    const tens = Math.floor(target / 10);
    const units = target % 10;
    const inverted = units * 10 + tens;
    if (inverted >= 1 && inverted <= 100 && inverted !== target) {
      options.add(inverted);
    }
  }

  // Tens confusion: sesenta (60) vs setenta (70), cincuenta (50), ochenta (80)
  const targetTens = Math.floor(target / 10);
  const targetUnits = target % 10;

  if (targetTens === 6 && (7 * 10 + targetUnits) <= 100) {
    options.add(7 * 10 + targetUnits); // 68 -> 78
  } else if (targetTens === 7 && (6 * 10 + targetUnits) >= 1) {
    options.add(6 * 10 + targetUnits); // 78 -> 68
  }

  // +/- 10
  if (target + 10 <= 100) options.add(target + 10);
  if (target - 10 >= 1) options.add(target - 10);

  // Neighbor +/- 1
  if (target + 1 <= 100) options.add(target + 1);
  if (target - 1 >= 1) options.add(target - 1);

  // Fill up with plausible random numbers in same or adjacent range
  while (options.size < 4) {
    const delta = (Math.floor(Math.random() * 20) - 10) * 1;
    let candidate = target + delta;
    if (candidate < 1) candidate = Math.floor(Math.random() * 20) + 1;
    if (candidate > 100) candidate = 100 - Math.floor(Math.random() * 20);
    options.add(candidate);
  }

  // Shuffle
  const arr = Array.from(options).slice(0, 4);
  return arr.sort(() => Math.random() - 0.5);
}

export interface MathProblem {
  num1: number;
  num2: number;
  operation: '+' | '-';
  result: number;
  questionEs: string;
  questionRu: string;
  spokenEs: string;
  answerEs: string;
  answerRu: string;
  difficulty: 'facil' | 'medio' | 'dificil';
}

export function generateMathProblem(difficulty: 'facil' | 'medio' | 'dificil' = 'medio'): MathProblem {
  let num1 = 10;
  let num2 = 5;
  let operation: '+' | '-' = Math.random() > 0.5 ? '+' : '-';

  if (difficulty === 'facil') {
    // 1 to 20
    if (operation === '+') {
      num1 = Math.floor(Math.random() * 10) + 1; // 1..10
      num2 = Math.floor(Math.random() * 10) + 1; // 1..10
    } else {
      num1 = Math.floor(Math.random() * 10) + 10; // 10..19
      num2 = Math.floor(Math.random() * 8) + 1;  // 1..8
    }
  } else if (difficulty === 'medio') {
    // 10 to 60, round tens or tens with 5
    const base1 = Math.floor(Math.random() * 5 + 2) * 10; // 20, 30, 40, 50, 60
    if (operation === '+') {
      num1 = base1;
      const addends = [5, 10, 15, 20, 25, 8, 12];
      num2 = addends[Math.floor(Math.random() * addends.length)];
      if (num1 + num2 > 100) num2 = 100 - num1;
    } else {
      num1 = base1 + 10;
      const subtracts = [10, 15, 20, 5, 25];
      num2 = subtracts[Math.floor(Math.random() * subtracts.length)];
      if (num1 - num2 < 1) num2 = 10;
    }
  } else {
    // dificil: cross tens up to 100 e.g. 32 + 8, 90 - 40, 47 + 23
    if (operation === '+') {
      num1 = Math.floor(Math.random() * 60) + 15;
      num2 = Math.floor(Math.random() * (99 - num1)) + 1;
    } else {
      num1 = Math.floor(Math.random() * 60) + 40; // 40..99
      num2 = Math.floor(Math.random() * (num1 - 5)) + 5;
    }
  }

  const result = operation === '+' ? num1 + num2 : num1 - num2;
  const opWordEs = operation === '+' ? 'más' : 'menos';
  const opWordRu = operation === '+' ? 'плюс' : 'минус';

  const n1Info = getNumberInfo(num1);
  const n2Info = getNumberInfo(num2);
  const resInfo = getNumberInfo(result);

  const questionEs = `¿Cuánto es ${n1Info.spanish} ${opWordEs} ${n2Info.spanish}?`;
  const questionRu = `Сколько будет ${n1Info.russian} ${opWordRu} ${n2Info.russian}?`;
  const spokenEs = `¿Cuánto es ${n1Info.spanish} ${opWordEs} ${n2Info.spanish}?`;

  return {
    num1,
    num2,
    operation,
    result,
    questionEs,
    questionRu,
    spokenEs,
    answerEs: resInfo.spanish,
    answerRu: resInfo.russian,
    difficulty,
  };
}

// Concert schedule for pianist
export const PIANIST_CONCERT_SCHEDULE: ConcertEvent[] = [
  {
    id: 'tuning',
    titleEs: 'Afinación del piano',
    titleRu: 'Настройка пианино',
    startHour: 8,
    startMinute: 0,
    endHour: 9,
    endMinute: 0,
    icon: 'wrench',
  },
  {
    id: 'rehearsal',
    titleEs: 'Ensayo matutino en el auditorio',
    titleRu: 'Утренняя репетиция в зале',
    startHour: 9,
    startMinute: 0,
    endHour: 11,
    endMinute: 0,
    icon: 'music',
  },
  {
    id: 'lesson',
    titleEs: 'Clase de armonía y técnica',
    titleRu: 'Урок гармонии и техники',
    startHour: 11,
    startMinute: 30,
    endHour: 13,
    endMinute: 0,
    icon: 'book-open',
  },
  {
    id: 'lunch',
    titleEs: 'Almuerzo con el director de orquesta',
    titleRu: 'Обед с дирижёром оркестра',
    startHour: 14,
    startMinute: 15, // 2:15 PM
    endHour: 15,
    endMinute: 15,
    icon: 'utensils',
  },
  {
    id: 'warmup',
    titleEs: 'Calentamiento de dedos y escalas',
    titleRu: 'Разминка пальцев и гаммы',
    startHour: 18,
    startMinute: 0, // 6:00 PM
    endHour: 19,
    endMinute: 0,
    icon: 'hand',
  },
  {
    id: 'concert',
    titleEs: 'Gran concierto de gala',
    titleRu: 'Большой гала-концерт',
    startHour: 19,
    startMinute: 45, // 7:45 PM -> Son las ocho menos cuarto
    endHour: 22,
    endMinute: 0,
    icon: 'sparkles',
  },
];

export const INITIAL_ACHIEVEMENTS = [
  {
    id: 'first_note',
    titleEs: 'Primera nota',
    titleRu: 'Первая нота',
    descEs: 'Toca una tecla en el piano musical.',
    descRu: 'Нажмите клавишу на музыкальном пианино.',
    icon: '🎵',
    unlocked: false,
  },
  {
    id: 'number_100',
    titleEs: 'Cien perfecto',
    titleRu: 'Идеальная сотня',
    descEs: 'Descubre el número 100 (cien).',
    descRu: 'Откройте число 100 (cien).',
    icon: '💯',
    unlocked: false,
  },
  {
    id: 'perfect_ear',
    titleEs: 'Oído absoluto',
    titleRu: 'Абсолютный слух',
    descEs: 'Acierta 5 números seguidos de oído.',
    descRu: 'Угадайте 5 чисел подряд на слух.',
    icon: '🎧',
    unlocked: false,
  },
  {
    id: 'clock_master',
    titleEs: 'Maestro del tiempo',
    titleRu: 'Мастер времени',
    descEs: 'Aprende las horas y cuartos en el reloj musical.',
    descRu: 'Изучите часы и четверти на музыкальных часах.',
    icon: '🕒',
    unlocked: false,
  },
  {
    id: 'math_virtuoso',
    titleEs: 'Virtuoso matemático',
    titleRu: 'Виртуоз математики',
    descEs: 'Resuelve 5 cálculos musicales en español.',
    descRu: 'Решите 5 музыкальных примеров на испанском.',
    icon: '🎼',
    unlocked: false,
  },
  {
    id: 'concert_ready',
    titleEs: 'Solista del Gran Concierto',
    titleRu: 'Солист Большого Концерта',
    descEs: 'Supera el desafío del pianista con éxito.',
    descRu: 'Успешно пройдите испытание пианиста.',
    icon: '🏆',
    unlocked: false,
  },
];
