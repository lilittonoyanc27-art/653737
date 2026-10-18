import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Sparkles, CheckCircle2, XCircle, ArrowRight, HelpCircle } from 'lucide-react';
import { soundEngine } from './audio.ts';
import { generateMathProblem, MathProblem, getNumberInfo } from './spanishData.ts';

interface MathModuleProps {
  onScoreUpdate: (points: number, isCorrect: boolean) => void;
  speechRate: number;
}

export const MathModule: React.FC<MathModuleProps> = ({
  onScoreUpdate,
  speechRate,
}) => {
  const [difficulty, setDifficulty] = useState<'facil' | 'medio' | 'dificil'>('medio');
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [options, setOptions] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [round, setRound] = useState<number>(1);
  const [streak, setStreak] = useState<number>(0);

  const loadNewProblem = useCallback(() => {
    const prob = generateMathProblem(difficulty);
    setProblem(prob);
    setSelectedOption(null);
    setHasAnswered(false);

    // Build 4 options: correct result + 3 plausible distractors
    const setOfOpts = new Set<number>();
    setOfOpts.add(prob.result);
    // Common math errors (+/- 10, +/- 1, inverted tens)
    if (prob.result + 10 <= 100) setOfOpts.add(prob.result + 10);
    if (prob.result - 10 >= 1) setOfOpts.add(prob.result - 10);
    if (prob.result + 2 <= 100) setOfOpts.add(prob.result + 2);
    if (prob.result - 2 >= 1) setOfOpts.add(prob.result - 2);

    while (setOfOpts.size < 4) {
      const delta = (Math.floor(Math.random() * 8) - 4) * 2;
      const cand = prob.result + delta;
      if (cand >= 1 && cand <= 100) setOfOpts.add(cand);
      else setOfOpts.add(Math.floor(Math.random() * 80) + 1);
    }

    const optsArr = Array.from(setOfOpts).slice(0, 4);
    setOptions(optsArr.sort(() => Math.random() - 0.5));

    // Speak math question
    setTimeout(() => {
      soundEngine.speakSpanish(prob.spokenEs, speechRate);
    }, 250);
  }, [difficulty, speechRate]);

  useEffect(() => {
    loadNewProblem();
  }, [loadNewProblem]);

  const handleSelect = (num: number) => {
    if (hasAnswered || !problem) return;
    setSelectedOption(num);
    setHasAnswered(true);

    const isCorrect = num === problem.result;
    if (isCorrect) {
      soundEngine.playChord('success');
      setStreak((s) => s + 1);
      const diffBonus = difficulty === 'dificil' ? 20 : difficulty === 'medio' ? 15 : 10;
      onScoreUpdate(diffBonus + Math.min(streak * 2, 10), true);
    } else {
      soundEngine.playChord('error');
      setStreak(0);
      onScoreUpdate(0, false);
    }
  };

  const playQuestionAudio = (customRate?: number) => {
    if (problem) {
      soundEngine.speakSpanish(problem.spokenEs, customRate ?? speechRate);
    }
  };

  if (!problem) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#FFD447]" />
          <span>Matemáticas musicales • Музыкальная математика</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          Cálculos musicales en español
        </h2>
        <p className="text-sm text-slate-300">
          Слушайте вопрос на испанском языке, считайте в уме и выбирайте правильный ответ.
        </p>
      </div>

      {/* Difficulty Switcher */}
      <div className="flex justify-center gap-2">
        {(
          [
            { id: 'facil', labelEs: 'Fácil (1–20)', labelRu: 'Легкий' },
            { id: 'medio', labelEs: 'Medio (Decenas)', labelRu: 'Средний' },
            { id: 'dificil', labelEs: 'Avanzado (1–100)', labelRu: 'Сложный' },
          ] as const
        ).map((d) => (
          <button
            key={d.id}
            onClick={() => {
              setDifficulty(d.id);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              difficulty === d.id
                ? 'bg-gradient-to-r from-[#175CD3] to-[#67D5FF] text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {d.labelEs} • {d.labelRu}
          </button>
        ))}
      </div>

      {/* Main Problem Card */}
      <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-blue-500/30 p-6 sm:p-8 shadow-2xl text-center space-y-6">
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
          <span>Problema #{round}</span>
          <span className="text-[#FFD447] font-semibold">
            🔥 Racha / Серия: {streak}
          </span>
        </div>

        {/* Question in Spanish & Russian */}
        <div className="space-y-3 py-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-950/40 border border-blue-500/30">
            <button
              onClick={() => playQuestionAudio()}
              className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-sm"
              title="Escuchar pregunta en español"
              aria-label="Play question audio"
            >
              <Volume2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => playQuestionAudio(0.65)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-200 hover:text-white"
              title="Más despacio"
            >
              🐢 0.7x
            </button>
          </div>

          <h3 className="text-xl sm:text-3xl font-extrabold text-[#FFD447] tracking-tight">
            {problem.questionEs}
          </h3>
          <p className="text-base sm:text-lg font-medium text-slate-300">
            {problem.questionRu}
          </p>

          <div className="text-xs font-mono text-slate-400">
            [ {problem.num1} {problem.operation} {problem.num2} = ? ]
          </div>
        </div>

        {/* 4 Choices */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-2">
          {options.map((num) => {
            const isSelected = selectedOption === num;
            const isTarget = num === problem.result;
            const optInfo = getNumberInfo(num);

            let style = 'bg-slate-800/90 border-slate-700 text-white hover:border-[#67D5FF]';
            if (hasAnswered) {
              if (isTarget) {
                style = 'bg-emerald-600/30 border-emerald-500 text-emerald-200 ring-2 ring-emerald-400/50';
              } else if (isSelected) {
                style = 'bg-rose-600/30 border-rose-500 text-rose-200 ring-2 ring-rose-400/50';
              } else {
                style = 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-50';
              }
            }

            return (
              <button
                key={num}
                onClick={() => handleSelect(num)}
                disabled={hasAnswered}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all shadow-md active:scale-95 ${style}`}
              >
                <span className="text-2xl sm:text-3xl font-black font-mono">
                  {num}
                </span>
                <span className="text-xs text-amber-300 font-semibold truncate max-w-full px-1">
                  {optInfo.spanish}
                </span>
                <span className="text-[11px] text-slate-400 truncate max-w-full px-1">
                  {optInfo.russian}
                </span>
              </button>
            );
          })}
        </div>

        {/* Solution Explanation */}
        {hasAnswered && (
          <div
            className={`p-5 rounded-2xl border text-left max-w-2xl mx-auto animate-in slide-in-from-bottom-2 ${
              selectedOption === problem.result
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {selectedOption === problem.result ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-1">
                <h4 className="font-bold text-base text-white">
                  {selectedOption === problem.result
                    ? '¡Correcto! • Правильно!'
                    : '¡Incorrecto! • Ошибка в вычислении'}
                </h4>
                <p className="text-sm font-semibold text-[#FFD447]">
                  {problem.num1} {problem.operation} {problem.num2} = {problem.result} ({problem.answerEs} / {problem.answerRu})
                </p>
                <p className="text-xs text-slate-300 pt-1">
                  Испанская фраза: «<strong>{problem.questionEs}</strong>» — ответ:{' '}
                  <strong>{problem.answerEs}</strong> ({problem.result}).
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setRound((r) => r + 1);
                  loadNewProblem();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#175CD3] to-[#67D5FF] text-white font-bold text-sm shadow-md hover:brightness-110 active:scale-95"
              >
                <span>Siguiente cálculo • Следующий пример</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
