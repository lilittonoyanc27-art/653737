import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, CheckCircle2, XCircle, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';
import { soundEngine } from './audio.ts';
import { getNumberInfo, generateNumberDistractors, capitalizeFirst } from './spanishData.ts';
import type { NumberInfo } from './types.ts';

interface ListenNumberModuleProps {
  onScoreUpdate: (points: number, isCorrect: boolean) => void;
  speechRate: number;
}

export const ListenNumberModule: React.FC<ListenNumberModuleProps> = ({
  onScoreUpdate,
  speechRate,
}) => {
  const [targetNumber, setTargetNumber] = useState<number>(78);
  const [options, setOptions] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [streak, setStreak] = useState<number>(0);
  const [round, setRound] = useState<number>(1);

  // Generate new quiz round
  const nextQuestion = useCallback(() => {
    // Pick random target from 1 to 100
    const target = Math.floor(Math.random() * 100) + 1;
    const distractors = generateNumberDistractors(target);

    setTargetNumber(target);
    setOptions(distractors);
    setSelectedOption(null);
    setHasAnswered(false);

    // Speak the target number automatically after brief delay
    setTimeout(() => {
      const info = getNumberInfo(target);
      soundEngine.speakSpanish(info.spanish, speechRate);
    }, 200);
  }, [speechRate]);

  // Initial load
  useEffect(() => {
    nextQuestion();
  }, [nextQuestion]);

  const targetInfo: NumberInfo = getNumberInfo(targetNumber);

  const handleSelectOption = (num: number) => {
    if (hasAnswered) return;
    setSelectedOption(num);
    setHasAnswered(true);

    const isCorrect = num === targetNumber;
    if (isCorrect) {
      soundEngine.playChord('success');
      setStreak((s) => s + 1);
      onScoreUpdate(10 + Math.min(streak * 2, 10), true);
    } else {
      soundEngine.playChord('error');
      setStreak(0);
      onScoreUpdate(0, false);
    }
  };

  const playPronunciation = (customRate?: number) => {
    soundEngine.speakSpanish(targetInfo.spanish, customRate ?? speechRate);
  };

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#FFD447]" />
          <span>Escucha y toca • Слушай и нажимай</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          ¿Qué número estás escuchando?
        </h2>
        <p className="text-sm text-slate-300">
          Приложение произносит число на испанском языке. Выберите верный вариант из четырёх.
        </p>
      </div>

      {/* Main Listening Card */}
      <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-blue-500/30 p-6 sm:p-8 shadow-2xl text-center space-y-6">
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
          <span>Ronda • Раунд #{round}</span>
          <div className="flex items-center gap-2">
            <span className="text-[#FFD447] font-semibold">
              🔥 Racha / Серия: {streak}
            </span>
          </div>
        </div>

        {/* Big Audio Trigger Area */}
        <div className="py-6 flex flex-col items-center justify-center gap-4">
          <button
            onClick={() => playPronunciation()}
            className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#175CD3] via-[#67D5FF] to-[#FFD447] p-1 shadow-2xl hover:scale-105 active:scale-95 transition-all group focus:outline-none"
            aria-label="Escuchar número en español"
          >
            <div className="w-full h-full bg-slate-950 rounded-full flex flex-col items-center justify-center text-white">
              <Volume2 className="w-8 h-8 text-[#67D5FF] group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-slate-300 mt-1 uppercase tracking-wider">
                Escuchar
              </span>
            </div>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => playPronunciation()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Repetir • Повторить</span>
            </button>
            <button
              onClick={() => playPronunciation(0.65)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5"
            >
              <span>🐢 Más despacio • Медленнее</span>
            </button>
          </div>
        </div>

        {/* 4 Choices Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {options.map((num, idx) => {
            const isSelected = selectedOption === num;
            const isTarget = num === targetNumber;

            let buttonStyle = 'bg-slate-800/90 border-slate-700 text-white hover:border-[#67D5FF] hover:bg-slate-750';
            if (hasAnswered) {
              if (isTarget) {
                buttonStyle = 'bg-emerald-600/30 border-emerald-500 text-emerald-200 ring-2 ring-emerald-400/50';
              } else if (isSelected) {
                buttonStyle = 'bg-rose-600/30 border-rose-500 text-rose-200 ring-2 ring-rose-400/50';
              } else {
                buttonStyle = 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-50';
              }
            }

            return (
              <button
                key={num}
                onClick={() => handleSelectOption(num)}
                disabled={hasAnswered}
                className={`p-4 sm:p-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all shadow-lg active:scale-95 ${buttonStyle}`}
              >
                <span className="text-xs font-mono font-bold text-slate-400">
                  {letters[idx]})
                </span>
                <span className="text-3xl sm:text-4xl font-black font-mono">
                  {num}
                </span>
              </button>
            );
          })}
        </div>

        {/* Result & Explanation */}
        {hasAnswered && (
          <div
            className={`p-5 rounded-2xl border text-left max-w-2xl mx-auto animate-in slide-in-from-bottom-2 duration-300 ${
              selectedOption === targetNumber
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {selectedOption === targetNumber ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-1">
                <h4 className="font-bold text-base text-white">
                  {selectedOption === targetNumber
                    ? '¡Excelente! • Отлично!'
                    : '¡Casi! • Ошибка в числе'}
                </h4>
                <p className="text-sm font-semibold text-[#FFD447]">
                  {targetNumber} = {capitalizeFirst(targetInfo.spanish)} ({targetInfo.russian})
                </p>
                {selectedOption !== targetNumber && (
                  <p className="text-xs text-slate-300 pt-1">
                    Объяснение: звучало «<strong>{targetInfo.spanish}</strong>», что означает{' '}
                    <strong>{targetNumber} ({targetInfo.russian})</strong>.
                    {selectedOption && (
                      <span>
                        {' '}Вы выбрали <strong>{selectedOption}</strong> (по-испански{' '}
                        <em>{getNumberInfo(selectedOption).spanish}</em>). Обращайте внимание на окончание десятков!
                      </span>
                    )}
                  </p>
                )}
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
                <span>Siguiente • Следующее задание</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
