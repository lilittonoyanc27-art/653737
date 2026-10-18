import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, CheckCircle2, XCircle, ArrowRight, Sparkles } from 'lucide-react';
import { soundEngine } from './audio.ts';
import { getSpanishTime, getRandomClockTime, generateClockDistractors, getHourAngle, getMinuteAngle } from './clockUtils.ts';
import type { ClockInfo } from './types.ts';

interface ListenClockModuleProps {
  onScoreUpdate: (points: number, isCorrect: boolean) => void;
  speechRate: number;
}

export const ListenClockModule: React.FC<ListenClockModuleProps> = ({
  onScoreUpdate,
  speechRate,
}) => {
  const [targetTime, setTargetTime] = useState<{ hours: number; minutes: number }>({ hours: 7, minutes: 20 });
  const [options, setOptions] = useState<{ hours: number; minutes: number }[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [round, setRound] = useState<number>(1);
  const [streak, setStreak] = useState<number>(0);

  const targetClockInfo: ClockInfo = getSpanishTime(targetTime.hours, targetTime.minutes);

  const nextQuestion = useCallback(() => {
    const time = getRandomClockTime(5); // step 5
    const opts = generateClockDistractors(time.hours, time.minutes);

    setTargetTime(time);
    setOptions(opts);
    setSelectedIdx(null);
    setHasAnswered(false);

    // Speak time phrase automatically
    setTimeout(() => {
      const info = getSpanishTime(time.hours, time.minutes);
      soundEngine.speakSpanish(info.spanish, speechRate);
    }, 250);
  }, [speechRate]);

  useEffect(() => {
    nextQuestion();
  }, [nextQuestion]);

  const handleSelect = (idx: number) => {
    if (hasAnswered) return;
    setSelectedIdx(idx);
    setHasAnswered(true);

    const chosen = options[idx];
    const isCorrect = chosen.hours === targetTime.hours && chosen.minutes === targetTime.minutes;

    if (isCorrect) {
      soundEngine.playChord('success');
      setStreak((s) => s + 1);
      onScoreUpdate(15 + Math.min(streak * 2, 10), true);
    } else {
      soundEngine.playChord('error');
      setStreak(0);
      onScoreUpdate(0, false);
    }
  };

  const playTimeAudio = (customRate?: number) => {
    soundEngine.speakSpanish(targetClockInfo.spanish, customRate ?? speechRate);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#FFD447]" />
          <span>Escucha la hora • Угадай время на слух</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          ¿Cuál de los relojes marca la hora correcta?
        </h2>
        <p className="text-sm text-slate-300">
          Прослушайте время на испанском языке и выберите подходящий циферблат часов.
        </p>
      </div>

      {/* Main Container */}
      <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-blue-500/30 p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
          <span>Pregunta #{round}</span>
          <span className="text-[#FFD447] font-semibold">
            🔥 Racha / Серия: {streak}
          </span>
        </div>

        {/* Audio Speaker Box */}
        <div className="py-4 flex flex-col items-center justify-center gap-3">
          <button
            onClick={() => playTimeAudio()}
            className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#175CD3] via-[#67D5FF] to-[#FFD447] p-1 shadow-xl hover:scale-105 active:scale-95 transition-all group focus:outline-none"
            aria-label="Escuchar la hora en español"
          >
            <div className="w-full h-full bg-slate-950 rounded-full flex flex-col items-center justify-center text-white">
              <Volume2 className="w-7 h-7 text-[#67D5FF] group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-bold text-slate-300 uppercase mt-0.5">
                Escuchar
              </span>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => playTimeAudio()}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
            >
              Repetir • Повторить
            </button>
            <button
              onClick={() => playTimeAudio(0.65)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
            >
              🐢 Más despacio • Медленнее
            </button>
          </div>
        </div>

        {/* 4 Analog Clocks Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {options.map((opt, idx) => {
            const isTarget = opt.hours === targetTime.hours && opt.minutes === targetTime.minutes;
            const isSelected = selectedIdx === idx;
            const hourDeg = getHourAngle(opt.hours, opt.minutes);
            const minDeg = getMinuteAngle(opt.minutes);

            let borderClass = 'border-slate-700 hover:border-[#67D5FF] bg-slate-800/80';
            if (hasAnswered) {
              if (isTarget) {
                borderClass = 'border-emerald-500 bg-emerald-950/40 ring-2 ring-emerald-400';
              } else if (isSelected) {
                borderClass = 'border-rose-500 bg-rose-950/40 ring-2 ring-rose-400';
              } else {
                borderClass = 'border-slate-800 bg-slate-950/40 opacity-40';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={hasAnswered}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all cursor-pointer shadow-md active:scale-95 ${borderClass}`}
              >
                <span className="text-xs font-mono font-bold text-slate-400">
                  Reloj {String.fromCharCode(65 + idx)}
                </span>

                {/* Mini SVG Clock */}
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-950 border-2 border-slate-700 p-1 relative shadow-inner">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Hour numbers 12, 3, 6, 9 */}
                    <text x="50" y="18" textAnchor="middle" fill="#94A3B8" fontSize="8" fontWeight="bold">12</text>
                    <text x="86" y="53" textAnchor="middle" fill="#94A3B8" fontSize="8" fontWeight="bold">3</text>
                    <text x="50" y="88" textAnchor="middle" fill="#94A3B8" fontSize="8" fontWeight="bold">6</text>
                    <text x="14" y="53" textAnchor="middle" fill="#94A3B8" fontSize="8" fontWeight="bold">9</text>

                    {/* Hour Hand */}
                    <line
                      x1="50"
                      y1="50"
                      x2="50"
                      y2="28"
                      stroke="#FFD447"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      transform={`rotate(${hourDeg} 50 50)`}
                    />

                    {/* Minute Hand */}
                    <line
                      x1="50"
                      y1="50"
                      x2="50"
                      y2="16"
                      stroke="#67D5FF"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      transform={`rotate(${minDeg} 50 50)`}
                    />

                    <circle cx="50" cy="50" r="3" fill="#FF9635" />
                  </svg>
                </div>

                {/* Digital time reveal after answered */}
                {hasAnswered ? (
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {opt.hours}:{opt.minutes < 10 ? `0${opt.minutes}` : opt.minutes}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">
                    Toca para elegir
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Detailed feedback */}
        {hasAnswered && (
          <div
            className={`p-5 rounded-2xl border text-left max-w-2xl mx-auto animate-in slide-in-from-bottom-2 ${
              selectedIdx !== null && options[selectedIdx].hours === targetTime.hours && options[selectedIdx].minutes === targetTime.minutes
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {selectedIdx !== null && options[selectedIdx].hours === targetTime.hours && options[selectedIdx].minutes === targetTime.minutes ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-1">
                <h4 className="font-bold text-base text-white">
                  {selectedIdx !== null && options[selectedIdx].hours === targetTime.hours && options[selectedIdx].minutes === targetTime.minutes
                    ? '¡Correcto! • Правильно!'
                    : '¡Cuidado con la hora! • Неверный выбор'}
                </h4>
                <p className="text-sm font-semibold text-[#FFD447]">
                  {targetClockInfo.spanish}
                </p>
                <p className="text-xs text-slate-200">
                  {targetClockInfo.russian} ({targetTime.hours}:{targetTime.minutes < 10 ? `0${targetTime.minutes}` : targetTime.minutes})
                </p>
                <p className="text-xs text-slate-300 pt-1">
                  💡 {targetClockInfo.explanationRu}
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setRound((r) => r + 1);
                  nextQuestion();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#175CD3] to-[#67D5FF] text-white font-bold text-sm shadow-md hover:brightness-110 active:scale-95"
              >
                <span>Siguiente hora • Следующий вопрос</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
