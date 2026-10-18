import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  Star,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Volume2,
  AlertCircle,
  Award,
} from 'lucide-react';
import { soundEngine } from './audio.ts';
import {
  getNumberInfo,
  generateNumberDistractors,
  generateMathProblem,
  capitalizeFirst,
} from './spanishData.ts';
import { getSpanishTime, getRandomClockTime, generateClockDistractors } from './clockUtils.ts';
import type { QuizQuestion, UserStats } from './types.ts';

interface PianistChallengeProps {
  stats: UserStats;
  onUpdateStats: (points: number, isCorrect: boolean, levelIndex?: number) => void;
  speechRate: number;
}

export const PianistChallenge: React.FC<PianistChallengeProps> = ({
  stats,
  onUpdateStats,
  speechRate,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [selectedChoice, setSelectedChoice] = useState<string | number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [levelScore, setLevelScore] = useState<number>(0);
  const [mistakesList, setMistakesList] = useState<QuizQuestion[]>([]);
  const [isLevelFinished, setIsLevelFinished] = useState<boolean>(false);
  const [isReviewingMistakes, setIsReviewingMistakes] = useState<boolean>(false);

  // Generate 10 dynamic questions for level
  const generateQuestionsForLevel = useCallback((lvl: number): QuizQuestion[] => {
    const list: QuizQuestion[] = [];

    for (let i = 0; i < 10; i++) {
      if (lvl === 1) {
        // Nivel 1: Números fáciles (1–20)
        const target = Math.floor(Math.random() * 20) + 1;
        const info = getNumberInfo(target);
        // Distractors within 1..20
        const distractors = new Set<number>([target]);
        while (distractors.size < 4) {
          const rand = Math.floor(Math.random() * 20) + 1;
          distractors.add(rand);
        }
        const opts = Array.from(distractors).sort(() => Math.random() - 0.5);

        list.push({
          id: `lvl1_${i}_${Date.now()}`,
          promptEs: `¿Qué número es «${info.spanish}»?`,
          promptRu: `Какое число означает «${info.spanish}»?`,
          spokenEs: info.spanish,
          correctAnswer: target,
          options: opts.map((val) => ({
            id: String(val),
            labelEs: String(val),
            labelRu: getNumberInfo(val).russian,
            value: val,
          })),
          explanationEs: `${target} se dice «${info.spanish}».`,
          explanationRu: `${target} по-испански — «${info.spanish}» (${info.russian}).`,
          category: 'number',
        });
      } else if (lvl === 2) {
        // Nivel 2: Números difíciles (21–100)
        const target = Math.floor(Math.random() * 80) + 21;
        const info = getNumberInfo(target);
        const distractors = generateNumberDistractors(target);

        list.push({
          id: `lvl2_${i}_${Date.now()}`,
          promptEs: `¿Qué número es «${info.spanish}»?`,
          promptRu: `Какое число означает «${info.spanish}»?`,
          spokenEs: info.spanish,
          correctAnswer: target,
          options: distractors.map((val) => ({
            id: String(val),
            labelEs: String(val),
            labelRu: getNumberInfo(val).russian,
            value: val,
          })),
          explanationEs: `${target} es «${info.spanish}».`,
          explanationRu: `${target} по-испански — «${info.spanish}» (${info.russian}).`,
          category: 'number',
        });
      } else if (lvl === 3) {
        // Nivel 3: El reloj
        const time = getRandomClockTime(5);
        const timeInfo = getSpanishTime(time.hours, time.minutes);
        const distractors = generateClockDistractors(time.hours, time.minutes);

        list.push({
          id: `lvl3_${i}_${Date.now()}`,
          promptEs: `¿Cómo se dice ${time.hours}:${time.minutes < 10 ? `0${time.minutes}` : time.minutes} en español?`,
          promptRu: `Как сказать ${time.hours}:${time.minutes < 10 ? `0${time.minutes}` : time.minutes} по-испански?`,
          spokenEs: timeInfo.spanish,
          correctAnswer: timeInfo.spanish,
          options: distractors.map((d) => {
            const dInfo = getSpanishTime(d.hours, d.minutes);
            return {
              id: `${d.hours}:${d.minutes}`,
              labelEs: dInfo.spanish,
              labelRu: `${d.hours}:${d.minutes < 10 ? `0${d.minutes}` : d.minutes} (${dInfo.russian})`,
              value: dInfo.spanish,
              clockHours: d.hours,
              clockMinutes: d.minutes,
            };
          }),
          explanationEs: `La forma correcta es «${timeInfo.spanish}».`,
          explanationRu: `Правильно: «${timeInfo.spanish}» (${timeInfo.russian}).`,
          category: 'clock',
        });
      } else if (lvl === 4) {
        // Nivel 4: Música y horarios
        const mathProb = generateMathProblem('medio');
        list.push({
          id: `lvl4_${i}_${Date.now()}`,
          promptEs: mathProb.questionEs,
          promptRu: mathProb.questionRu,
          spokenEs: mathProb.spokenEs,
          correctAnswer: mathProb.result,
          options: [
            mathProb.result,
            mathProb.result + 10 <= 100 ? mathProb.result + 10 : mathProb.result - 10,
            mathProb.result - 5 >= 1 ? mathProb.result - 5 : mathProb.result + 5,
            mathProb.result + 2 <= 100 ? mathProb.result + 2 : mathProb.result - 2,
          ]
            .sort(() => Math.random() - 0.5)
            .map((val) => ({
              id: String(val),
              labelEs: `${val} (${getNumberInfo(val).spanish})`,
              labelRu: getNumberInfo(val).russian,
              value: val,
            })),
          explanationEs: `${mathProb.num1} ${mathProb.operation} ${mathProb.num2} = ${mathProb.result} (${mathProb.answerEs}).`,
          explanationRu: `${mathProb.num1} ${mathProb.operation} ${mathProb.num2} = ${mathProb.result} (${mathProb.answerRu}).`,
          category: 'math',
        });
      } else {
        // Nivel 5: Gran concierto (Mezcla de todo)
        const coin = Math.random();
        if (coin < 0.4) {
          // Hard number
          const target = Math.floor(Math.random() * 100) + 1;
          const info = getNumberInfo(target);
          list.push({
            id: `lvl5_${i}_${Date.now()}`,
            promptEs: `Identifica el número: «${info.spanish}»`,
            promptRu: `Определите число: «${info.spanish}»`,
            spokenEs: info.spanish,
            correctAnswer: target,
            options: generateNumberDistractors(target).map((val) => ({
              id: String(val),
              labelEs: String(val),
              labelRu: getNumberInfo(val).russian,
              value: val,
            })),
            explanationEs: `${target} = ${info.spanish}.`,
            explanationRu: `${target} = ${info.spanish} (${info.russian}).`,
            category: 'number',
          });
        } else if (coin < 0.75) {
          // Clock
          const time = getRandomClockTime(5);
          const timeInfo = getSpanishTime(time.hours, time.minutes);
          list.push({
            id: `lvl5_${i}_${Date.now()}`,
            promptEs: `¿Qué hora es? «${timeInfo.spanish}»`,
            promptRu: `Сколько времени? «${timeInfo.spanish}»`,
            spokenEs: timeInfo.spanish,
            correctAnswer: `${time.hours}:${time.minutes < 10 ? `0${time.minutes}` : time.minutes}`,
            options: generateClockDistractors(time.hours, time.minutes).map((d) => {
              const str = `${d.hours}:${d.minutes < 10 ? `0${d.minutes}` : d.minutes}`;
              return {
                id: str,
                labelEs: str,
                labelRu: getSpanishTime(d.hours, d.minutes).russian,
                value: str,
              };
            }),
            explanationEs: timeInfo.spanish,
            explanationRu: `${timeInfo.spanish} — это ${time.hours}:${time.minutes < 10 ? `0${time.minutes}` : time.minutes} (${timeInfo.russian}).`,
            category: 'clock',
          });
        } else {
          // Math
          const math = generateMathProblem('dificil');
          list.push({
            id: `lvl5_${i}_${Date.now()}`,
            promptEs: math.questionEs,
            promptRu: math.questionRu,
            spokenEs: math.spokenEs,
            correctAnswer: math.result,
            options: [
              math.result,
              math.result + 10 <= 100 ? math.result + 10 : math.result - 10,
              math.result - 4 >= 1 ? math.result - 4 : math.result + 6,
              math.result + 3 <= 100 ? math.result + 3 : math.result - 3,
            ]
              .sort(() => Math.random() - 0.5)
              .map((val) => ({
                id: String(val),
                labelEs: `${val}`,
                labelRu: getNumberInfo(val).russian,
                value: val,
              })),
            explanationEs: `${math.result} (${math.answerEs}).`,
            explanationRu: `Ответ: ${math.result} (${math.answerRu}).`,
            category: 'math',
          });
        }
      }
    }

    return list;
  }, []);

  // Start or change level
  const startLevel = useCallback(
    (lvl: number) => {
      setSelectedLevel(lvl);
      const generated = generateQuestionsForLevel(lvl);
      setQuestions(generated);
      setCurrentQIndex(0);
      setSelectedChoice(null);
      setIsAnswered(false);
      setLevelScore(0);
      setMistakesList([]);
      setIsLevelFinished(false);
      setIsReviewingMistakes(false);

      // Play start prompt
      setTimeout(() => {
        if (generated[0]) {
          soundEngine.speakSpanish(generated[0].spokenEs, speechRate);
        }
      }, 300);
    },
    [generateQuestionsForLevel, speechRate]
  );

  useEffect(() => {
    startLevel(selectedLevel);
  }, [selectedLevel, startLevel]);

  const currentQ = isReviewingMistakes ? mistakesList[currentQIndex] : questions[currentQIndex];

  const handleSelectChoice = (val: string | number) => {
    if (isAnswered || !currentQ) return;
    setSelectedChoice(val);
    setIsAnswered(true);

    const isCorrect = String(val) === String(currentQ.correctAnswer);

    if (isCorrect) {
      soundEngine.playChord('success');
      setLevelScore((s) => s + 10);
      onUpdateStats(10, true, selectedLevel);
    } else {
      soundEngine.playChord('error');
      if (!isReviewingMistakes) {
        setMistakesList((prev) => [...prev, currentQ]);
      }
      onUpdateStats(0, false, selectedLevel);
    }
  };

  const handleNext = () => {
    const list = isReviewingMistakes ? mistakesList : questions;
    if (currentQIndex + 1 < list.length) {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
      setSelectedChoice(null);
      setIsAnswered(false);
      setTimeout(() => {
        const nextQ = list[nextIdx];
        if (nextQ) {
          soundEngine.speakSpanish(nextQ.spokenEs, speechRate);
        }
      }, 200);
    } else {
      // Level finished!
      setIsLevelFinished(true);
      if (levelScore >= 70) {
        soundEngine.playChord('fanfare');
      }
    }
  };

  const playQuestionVoice = () => {
    if (currentQ) {
      soundEngine.speakSpanish(currentQ.spokenEs, speechRate);
    }
  };

  const levelsMeta = [
    { num: 1, titleEs: 'Números fáciles', titleRu: 'Числа 1–20', desc: 'Основа счета' },
    { num: 2, titleEs: 'Números difíciles', titleRu: 'Числа 21–100', desc: 'Десятки и составные числа' },
    { num: 3, titleEs: 'El reloj', titleRu: 'Часы и время', desc: 'Cuarto, media, menos cuarto' },
    { num: 4, titleEs: 'Música y horarios', titleRu: 'Музыка и расписание', desc: 'Счет и события' },
    { num: 5, titleEs: 'Gran concierto', titleRu: 'Итоговый концерт', desc: 'Все темы вместе' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
          <Trophy className="w-3.5 h-3.5 text-[#FFD447]" />
          <span>El desafío del pianista • Испытание пианиста</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          5 уровней мастерства испанского языка
        </h2>
        <p className="text-sm text-slate-300">
          Пройдите 10 динамических испытаний на каждом уровне, зарабатывайте звезды и музыкальные звания.
        </p>
      </div>

      {/* Level Selectors */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {levelsMeta.map((lvl) => {
          const isActive = selectedLevel === lvl.num;
          const isPassed = stats.completedLevels.includes(lvl.num);

          return (
            <button
              key={lvl.num}
              onClick={() => startLevel(lvl.num)}
              className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                isActive
                  ? 'bg-gradient-to-br from-[#175CD3] to-[#67D5FF] text-white border-blue-300 shadow-lg scale-102 ring-2 ring-[#FFD447]'
                  : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  Nivel {lvl.num}
                </span>
                {isPassed && <span className="text-xs">⭐</span>}
              </div>
              <div className="mt-1">
                <h4 className="font-bold text-xs leading-tight">{lvl.titleEs}</h4>
                <p className="text-[10px] text-slate-300 mt-0.5">{lvl.titleRu}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quiz Play Area or Finished Screen */}
      {!isLevelFinished ? (
        currentQ && (
          <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-blue-500/30 p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Level status bar */}
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
              <span className="font-bold text-[#67D5FF]">
                {isReviewingMistakes ? 'Повторение ошибок' : `Уровень ${selectedLevel}: ${levelsMeta[selectedLevel - 1].titleEs}`}
              </span>
              <div className="flex items-center gap-3">
                <span>
                  Вопрос {currentQIndex + 1} из {isReviewingMistakes ? mistakesList.length : questions.length}
                </span>
                <span className="text-[#FFD447] font-bold font-mono">
                  {levelScore} pts
                </span>
              </div>
            </div>

            {/* Question Card */}
            <div className="space-y-3 text-center py-2">
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={playQuestionVoice}
                  className="p-2.5 rounded-2xl bg-gradient-to-r from-[#175CD3] to-[#67D5FF] text-white shadow-md hover:brightness-110 active:scale-95"
                  title="Escuchar audio"
                  aria-label="Escuchar audio"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => soundEngine.speakSpanish(currentQ.spokenEs, 0.65)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white border border-slate-700"
                  title="Más despacio"
                >
                  🐢 0.7x
                </button>
              </div>

              <h3 className="text-xl sm:text-2xl font-extrabold text-[#FFD447]">
                {currentQ.promptEs}
              </h3>
              <p className="text-sm font-semibold text-slate-300">
                {currentQ.promptRu}
              </p>
            </div>

            {/* Choices */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {currentQ.options.map((opt) => {
                const isSelected = selectedChoice === opt.value;
                const isCorrect = String(opt.value) === String(currentQ.correctAnswer);

                let btnStyle = 'bg-slate-800/90 border-slate-700 text-white hover:border-[#67D5FF]';
                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-600/30 border-emerald-500 text-emerald-200 ring-2 ring-emerald-400';
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-600/30 border-rose-500 text-rose-200 ring-2 ring-rose-400';
                  } else {
                    btnStyle = 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-40';
                  }
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectChoice(opt.value)}
                    disabled={isAnswered}
                    className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-center transition-all shadow-md active:scale-95 ${btnStyle}`}
                  >
                    <span className="text-sm sm:text-base font-bold">{opt.labelEs}</span>
                    <span className="text-xs text-slate-300">{opt.labelRu}</span>
                  </button>
                );
              })}
            </div>

            {/* Answer feedback */}
            {isAnswered && (
              <div
                className={`p-5 rounded-2xl border text-left max-w-2xl mx-auto animate-in slide-in-from-bottom-2 ${
                  String(selectedChoice) === String(currentQ.correctAnswer)
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {String(selectedChoice) === String(currentQ.correctAnswer) ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-1">
                    <h4 className="font-bold text-sm text-white">
                      {String(selectedChoice) === String(currentQ.correctAnswer)
                        ? '¡Excelente! • Правильно!'
                        : '¡Atención! • Пояснение:'}
                    </h4>
                    <p className="text-xs text-slate-200">
                      {currentQ.explanationRu}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#175CD3] to-[#67D5FF] text-white font-bold text-sm shadow-md hover:brightness-110 active:scale-95"
                  >
                    <span>
                      {currentQIndex + 1 === (isReviewingMistakes ? mistakesList.length : questions.length)
                        ? 'Ver resultados • Посмотреть итог'
                        : 'Siguiente • Далее'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        /* Level Finished Screen */
        <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-blue-500/30 p-8 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-1 mx-auto shadow-2xl">
            <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-3xl">
              🏆
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              ¡Nivel {selectedLevel} completado!
            </h3>
            <p className="text-sm text-slate-300">
              Уровень {selectedLevel} завершён! Ваш результат:
            </p>
          </div>

          {/* Stars */}
          <div className="flex justify-center gap-2 text-3xl text-amber-400">
            <Star className={`w-8 h-8 ${levelScore >= 40 ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
            <Star className={`w-8 h-8 ${levelScore >= 70 ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
            <Star className={`w-8 h-8 ${levelScore >= 90 ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 max-w-sm mx-auto space-y-1 text-sm">
            <div>Баллы за уровень: <strong className="text-[#FFD447]">{levelScore} / 100</strong></div>
            <div>Ошибок: <strong className={mistakesList.length === 0 ? 'text-emerald-400' : 'text-rose-400'}>{mistakesList.length}</strong></div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => startLevel(selectedLevel)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Repetir nivel • Начать уровень заново</span>
            </button>

            {mistakesList.length > 0 && (
              <button
                onClick={() => {
                  setIsReviewingMistakes(true);
                  setIsLevelFinished(false);
                  setCurrentQIndex(0);
                  setSelectedChoice(null);
                  setIsAnswered(false);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/40 text-rose-200 border border-rose-500/50 text-xs font-bold"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Repetir errores • Повторить ошибки ({mistakesList.length})</span>
              </button>
            )}

            {selectedLevel < 5 && (
              <button
                onClick={() => startLevel(selectedLevel + 1)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#175CD3] to-[#67D5FF] text-white text-xs font-bold shadow-lg hover:brightness-110"
              >
                <span>Siguiente nivel • Следующий уровень</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
