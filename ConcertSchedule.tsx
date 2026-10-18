import React, { useState, useEffect } from 'react';
import { Volume2, Sparkles, CheckCircle2, XCircle, ArrowRight, Calendar, Music } from 'lucide-react';
import { soundEngine } from './audio.ts';
import { PIANIST_CONCERT_SCHEDULE } from './spanishData.ts';
import { getSpanishTime } from './clockUtils.ts';
import type { ConcertEvent } from './types.ts';

interface ConcertScheduleProps {
  onScoreUpdate: (points: number, isCorrect: boolean) => void;
  speechRate: number;
}

interface ConcertQuestion {
  id: string;
  questionEs: string;
  questionRu: string;
  contextEs: string;
  contextRu: string;
  options: {
    labelEs: string;
    labelRu: string;
    isCorrect: boolean;
  }[];
  explanationRu: string;
}

const CONCERT_QUESTIONS: ConcertQuestion[] = [
  {
    id: 'q1',
    questionEs: '¿A qué hora empieza el gran concierto de gala?',
    questionRu: 'Во сколько начинается большой гала-концерт?',
    contextEs: 'Horario: Concierto de 19:45 a 22:00',
    contextRu: 'Расписание: Концерт с 19:45 до 22:00',
    options: [
      { labelEs: 'A las ocho menos cuarto (19:45)', labelRu: 'Без четверти восемь', isCorrect: true },
      { labelEs: 'A las ocho y cuarto (20:15)', labelRu: 'В четверть девятого', isCorrect: false },
      { labelEs: 'A las siete y media (19:30)', labelRu: 'В половине восьмого', isCorrect: false },
      { labelEs: 'A las nueve en punto (21:00)', labelRu: 'В девять ровно', isCorrect: false },
    ],
    explanationRu: '19:45 — это «a las ocho menos cuarto» (без четверти восемь вечера). Для времени событий используется предлог «A».',
  },
  {
    id: 'q2',
    questionEs: '¿Cuándo tienes que ensayar en el auditorio?',
    questionRu: 'Когда вам нужно репетировать в зале?',
    contextEs: 'Horario: Ensayo matutino de 09:00 a 11:00',
    contextRu: 'Расписание: Утренняя репетиция с 09:00 до 11:00',
    options: [
      { labelEs: 'A las nueve de la mañana (09:00)', labelRu: 'В девять утра', isCorrect: true },
      { labelEs: 'A las diez y media (10:30)', labelRu: 'В половине одиннадцатого', isCorrect: false },
      { labelEs: 'A las once en punto (11:00)', labelRu: 'В одиннадцать ровно', isCorrect: false },
      { labelEs: 'A las ocho menos cuarto (07:45)', labelRu: 'Без четверти восемь', isCorrect: false },
    ],
    explanationRu: '09:00 — «a las nueve de la mañana». Репетиция начинается в 9:00.',
  },
  {
    id: 'q3',
    questionEs: '¿Cuánto tiempo dura la clase de música y armonía?',
    questionRu: 'Сколько времени длится урок музыки и гармонии?',
    contextEs: 'La clase empieza a las 11:30 y termina a las 13:00.',
    contextRu: 'Урок начинается в 11:30 и заканчивается в 13:00.',
    options: [
      { labelEs: 'Una hora y media (1h 30min)', labelRu: 'Полтора часа', isCorrect: true },
      { labelEs: 'Dos horas en punto (2h)', labelRu: 'Два часа', isCorrect: false },
      { labelEs: 'Cuarenta y cinco minutos (45min)', labelRu: '45 минут', isCorrect: false },
      { labelEs: 'Tres cuartos de hora (45min)', labelRu: 'Три четверти часа', isCorrect: false },
    ],
    explanationRu: 'С 11:30 до 13:00 проходит 1 час и 30 минут — по-испански «una hora y media».',
  },
  {
    id: 'q4',
    questionEs: '¿A qué hora es el almuerzo con el director de orquesta?',
    questionRu: 'Во сколько обед с дирижёром оркестра?',
    contextEs: 'Horario: Almuerzo de 14:15 a 15:15',
    contextRu: 'Расписание: Обед с 14:15 до 15:15',
    options: [
      { labelEs: 'A las dos y cuarto de la tarde (14:15)', labelRu: 'В четверть третьего', isCorrect: true },
      { labelEs: 'A las dos menos cuarto (13:45)', labelRu: 'Без четверти два', isCorrect: false },
      { labelEs: 'A la una y media (13:30)', labelRu: 'В половине второго', isCorrect: false },
      { labelEs: 'A las tres en punto (15:00)', labelRu: 'В три ровно', isCorrect: false },
    ],
    explanationRu: '14:15 (2:15 дня) — это «a las dos y cuarto de la tarde». 15 минут обозначаются «y cuarto».',
  },
  {
    id: 'q5',
    questionEs: '¿A qué hora afinan el piano de cola para el recital?',
    questionRu: 'Во сколько настраивают рояль для концерта?',
    contextEs: 'Horario: Afinación del piano a las 08:00',
    contextRu: 'Расписание: Настройка пианино в 08:00',
    options: [
      { labelEs: 'A las ocho de la mañana (08:00)', labelRu: 'В восемь утра', isCorrect: true },
      { labelEs: 'A las seis de la tarde (18:00)', labelRu: 'В шесть вечера', isCorrect: false },
      { labelEs: 'A las siete y cuarto (07:15)', labelRu: 'В четверть восьмого', isCorrect: false },
      { labelEs: 'A la una en punto (13:00)', labelRu: 'В час ровно', isCorrect: false },
    ],
    explanationRu: 'Настройка пианино назначена на 8:00 утра — «a las ocho de la mañana».',
  },
];

export const ConcertSchedule: React.FC<ConcertScheduleProps> = ({
  onScoreUpdate,
  speechRate,
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [viewScheduleOnly, setViewScheduleOnly] = useState<boolean>(false);

  const q = CONCERT_QUESTIONS[currentIdx];

  const handleSelect = (idx: number) => {
    if (hasAnswered) return;
    setSelectedOpt(idx);
    setHasAnswered(true);

    const isCorrect = q.options[idx].isCorrect;
    if (isCorrect) {
      soundEngine.playChord('success');
      onScoreUpdate(20, true);
    } else {
      soundEngine.playChord('error');
      onScoreUpdate(0, false);
    }
  };

  const playQuestionAudio = () => {
    soundEngine.speakSpanish(q.questionEs, speechRate);
  };

  const playScheduleItem = (event: ConcertEvent) => {
    const timeInfo = getSpanishTime(event.startHour, event.startMinute);
    const text = `A ${timeInfo.spanish.toLowerCase()}: ${event.titleEs}`;
    soundEngine.speakSpanish(text, speechRate);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#FFD447]" />
          <span>El concierto del tiempo • Музыкальный концерт</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          Día del recital de piano en Madrid
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto">
          Вы — пианист, готовящийся к вечернему концерту. Изучите распорядок дня и отвечайте на вопросы на испанском языке.
        </p>
      </div>

      {/* Schedule Banner Cards */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-blue-500/30 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Calendar className="w-4 h-4 text-[#FFD447]" />
            <span>Horario del pianista • Расписание пианиста</span>
          </div>
          <span className="text-xs text-blue-300 font-medium">
            Нажмите на строку, чтобы прослушать
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PIANIST_CONCERT_SCHEDULE.map((item) => {
            const timeInfo = getSpanishTime(item.startHour, item.startMinute);
            const endTimeInfo = getSpanishTime(item.endHour, item.endMinute);

            return (
              <div
                key={item.id}
                onClick={() => playScheduleItem(item)}
                className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 hover:border-[#67D5FF] transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-mono text-xs font-bold text-[#FFD447] bg-black/40 px-2 py-0.5 rounded">
                    {item.startHour}:{item.startMinute < 10 ? `0${item.startMinute}` : item.startMinute} – {item.endHour}:{item.endMinute < 10 ? `0${item.endMinute}` : item.endMinute}
                  </div>
                  <Volume2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#67D5FF]" />
                </div>
                <div className="mt-2">
                  <h4 className="text-xs font-bold text-white group-hover:text-[#67D5FF]">
                    {item.titleEs}
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    {item.titleRu}
                  </p>
                  <p className="text-[10px] text-blue-300 mt-1 font-serif italic">
                    {timeInfo.spanish}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quiz Area */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-blue-500/30 shadow-2xl space-y-6">
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
          <span>Pregunta {currentIdx + 1} de {CONCERT_QUESTIONS.length}</span>
          <span className="text-[#FFD447] font-semibold">
            Тема: Расписание и длительность
          </span>
        </div>

        {/* Question Text */}
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={playQuestionAudio}
              className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 shadow-sm"
              title="Escuchar pregunta"
              aria-label="Escuchar pregunta"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#FFD447]">
              {q.questionEs}
            </h3>
          </div>
          <p className="text-sm font-semibold text-slate-300">
            {q.questionRu}
          </p>
          <div className="inline-block px-3 py-1 rounded-lg bg-blue-950/50 border border-blue-500/30 text-xs text-blue-200">
            {q.contextEs} • {q.contextRu}
          </div>
        </div>

        {/* 4 Answer options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl mx-auto">
          {q.options.map((opt, idx) => {
            const isSelected = selectedOpt === idx;
            let style = 'bg-slate-800/90 border-slate-700 text-white hover:border-[#67D5FF]';
            if (hasAnswered) {
              if (opt.isCorrect) {
                style = 'bg-emerald-600/30 border-emerald-500 text-emerald-200 ring-2 ring-emerald-400';
              } else if (isSelected) {
                style = 'bg-rose-600/30 border-rose-500 text-rose-200 ring-2 ring-rose-400';
              } else {
                style = 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-40';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={hasAnswered}
                className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-center gap-1 transition-all shadow-md active:scale-95 ${style}`}
              >
                <span className="text-sm font-bold">{opt.labelEs}</span>
                <span className="text-xs text-slate-300">{opt.labelRu}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation & Next */}
        {hasAnswered && (
          <div
            className={`p-5 rounded-2xl border text-left max-w-2xl mx-auto animate-in slide-in-from-bottom-2 ${
              selectedOpt !== null && q.options[selectedOpt].isCorrect
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {selectedOpt !== null && q.options[selectedOpt].isCorrect ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-1">
                <h4 className="font-bold text-base text-white">
                  {selectedOpt !== null && q.options[selectedOpt].isCorrect
                    ? '¡Perfecto! • Точный ответ!'
                    : '¡Revisa el horario! • Внимание к расписанию'}
                </h4>
                <p className="text-xs text-slate-300">
                  {q.explanationRu}
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setCurrentIdx((i) => (i + 1) % CONCERT_QUESTIONS.length);
                  setSelectedOpt(null);
                  setHasAnswered(false);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#175CD3] to-[#67D5FF] text-white font-bold text-sm shadow-md hover:brightness-110 active:scale-95"
              >
                <span>Siguiente pregunta • Следующий вопрос</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
