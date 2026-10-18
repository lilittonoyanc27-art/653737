import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, Sparkles, Clock, CheckCircle2, XCircle, ArrowRight, RotateCcw, Plus, Minus, Compass, HelpCircle } from 'lucide-react';
import { soundEngine } from './audio.ts';
import { getSpanishTime, getRandomClockTime, generateClockDistractors, getHourAngle, getMinuteAngle } from './clockUtils.ts';
import type { ClockInfo } from './types.ts';

interface ClockComponentProps {
  speechRate: number;
  onExploreTime?: (time: string) => void;
  onScoreUpdate?: (points: number, isCorrect: boolean) => void;
}

interface QuizOption {
  id: string;
  hours: number;
  minutes: number;
  spanish: string;
  russian: string;
  isCorrect: boolean;
}

export const ClockComponent: React.FC<ClockComponentProps> = ({
  speechRate,
  onExploreTime,
  onScoreUpdate,
}) => {
  // Mode: 'quiz' (game with selectable options, default) or 'explore' (free exploration)
  const [activeTab, setActiveTab] = useState<'quiz' | 'explore'>('quiz');

  // Quiz state
  const [targetHours, setTargetHours] = useState<number>(3);
  const [targetMinutes, setTargetMinutes] = useState<number>(15);
  const [quizOptions, setQuizOptions] = useState<QuizOption[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [quizRound, setQuizRound] = useState<number>(1);
  const [streak, setStreak] = useState<number>(0);

  // Explore state
  const [exploreHours, setExploreHours] = useState<number>(5);
  const [exploreMinutes, setExploreMinutes] = useState<number>(30);
  const [isPreciseMode, setIsPreciseMode] = useState<boolean>(false);
  const [isDraggingHand, setIsDraggingHand] = useState<'minute' | 'hour' | null>(null);

  const clockSvgRef = useRef<SVGSVGElement | null>(null);

  // Active time displayed on the clock depending on tab
  const currentHours = activeTab === 'quiz' ? targetHours : exploreHours;
  const currentMinutes = activeTab === 'quiz' ? targetMinutes : exploreMinutes;
  const currentClockInfo: ClockInfo = getSpanishTime(currentHours, currentMinutes);

  // Generate a new quiz challenge with 4 unselected options
  const generateNewQuizRound = useCallback(() => {
    // Generate an interesting time, with emphasis on key rules (en punto, y cuarto, y media, menos cuarto, y diez, menos diez)
    const keyMinutesPool = [0, 10, 15, 20, 30, 40, 45, 50, 5, 25, 35, 55];
    const pickedMinutes = keyMinutesPool[Math.floor(Math.random() * keyMinutesPool.length)];
    const pickedHours = Math.floor(Math.random() * 12) + 1;

    setTargetHours(pickedHours);
    setTargetMinutes(pickedMinutes);
    setSelectedOptionId(null);
    setHasAnswered(false);

    // Build 4 diverse options
    const distractors = generateClockDistractors(pickedHours, pickedMinutes);
    const options: QuizOption[] = distractors.map((d, index) => {
      const isTarget = d.hours === pickedHours && d.minutes === pickedMinutes;
      const info = getSpanishTime(d.hours, d.minutes);
      return {
        id: `opt_${d.hours}_${d.minutes}_${index}_${Date.now()}`,
        hours: d.hours,
        minutes: d.minutes,
        spanish: info.spanish,
        russian: info.russian,
        isCorrect: isTarget,
      };
    });

    setQuizOptions(options);

    // Optional subtle ticking sound on question change
    soundEngine.playChord('tick');
  }, []);

  // Initialize quiz on mount
  useEffect(() => {
    generateNewQuizRound();
  }, [generateNewQuizRound]);

  const handleSelectOption = (option: QuizOption) => {
    if (hasAnswered) return;
    setSelectedOptionId(option.id);
    setHasAnswered(true);

    if (option.isCorrect) {
      soundEngine.playChord('success');
      setStreak((s) => s + 1);
      onScoreUpdate?.(15 + Math.min(streak * 2, 10), true);
    } else {
      soundEngine.playChord('error');
      setStreak(0);
      onScoreUpdate?.(0, false);
    }

    // Pronounce the correct time
    soundEngine.speakSpanish(currentClockInfo.spanish, speechRate);
  };

  const speakTime = (customRate?: number) => {
    soundEngine.speakSpanish(currentClockInfo.spanish, customRate ?? speechRate);
    onExploreTime?.(currentClockInfo.spanish);
  };

  // Preset examples for explore mode
  const explorePresets = [
    { labelEs: 'Es la una', labelRu: '1:00 (ед. число)', h: 1, m: 0 },
    { labelEs: 'Son las dos', labelRu: '2:00 (мн. число)', h: 2, m: 0 },
    { labelEs: 'Son las tres y cuarto', labelRu: '3:15 (четверть)', h: 3, m: 15 },
    { labelEs: 'Son las cinco y media', labelRu: '5:30 (половина)', h: 5, m: 30 },
    { labelEs: 'Son las ocho menos cuarto', labelRu: '7:45 (без четверти)', h: 7, m: 45 },
    { labelEs: 'Son las diez y diez', labelRu: '10:10 (десять минут)', h: 10, m: 10 },
  ];

  const setExploreTime = (h: number, m: number, playAudio: boolean = true) => {
    let normH = h % 12;
    if (normH === 0) normH = 12;
    const normM = (m + 60) % 60;
    setExploreHours(normH);
    setExploreMinutes(normM);
    soundEngine.playChord('tick');

    if (playAudio) {
      const info = getSpanishTime(normH, normM);
      soundEngine.speakSpanish(info.spanish, speechRate);
    }
  };

  const adjustExploreMinutes = (delta: number) => {
    const totalMinutes = exploreHours * 60 + exploreMinutes + delta;
    const newH = Math.floor(totalMinutes / 60) % 12 || 12;
    const newM = (totalMinutes % 60 + 60) % 60;
    setExploreTime(newH, newM);
  };

  // Convert SVG coordinate to angle and minutes in explore mode
  const handleSvgPointer = useCallback(
    (clientX: number, clientY: number, forceMinute: boolean = true) => {
      if (!clockSvgRef.current || activeTab !== 'explore') return;
      const rect = clockSvgRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;

      let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      if (angle < 0) angle += 360;

      const dist = Math.hypot(dx, dy);
      const radius = rect.width / 2;

      if (!forceMinute && dist < radius * 0.55) {
        let h = Math.round(angle / 30);
        if (h === 0) h = 12;
        setExploreHours(h);
        soundEngine.playChord('tick');
      } else {
        let m = Math.round(angle / 6);
        if (!isPreciseMode) {
          m = Math.round(m / 5) * 5;
        }
        if (m === 60) m = 0;
        setExploreMinutes(m);
        soundEngine.playChord('tick');
      }
    },
    [activeTab, isPreciseMode]
  );

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activeTab !== 'explore') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingHand('minute');
    handleSvgPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDraggingHand && activeTab === 'explore') {
      handleSvgPointer(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDraggingHand && activeTab === 'explore') {
      setIsDraggingHand(null);
      e.currentTarget.releasePointerCapture(e.pointerId);
      const info = getSpanishTime(exploreHours, exploreMinutes);
      soundEngine.speakSpanish(info.spanish, speechRate);
    }
  };

  const hourAngle = getHourAngle(currentHours, currentMinutes);
  const minuteAngle = getMinuteAngle(currentMinutes);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      {/* Title Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#FFD447]" />
          <span>El reloj musical • Музыкальные часы</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          ¿Qué hora es? • Который час?
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto">
          {activeTab === 'quiz'
            ? 'Посмотрите на стрелки часов и выберите правильное испанское выражение из четырёх вариантов.'
            : 'Перемещайте стрелки часов свободно, нажимайте на кнопки и изучайте звучание времени.'}
        </p>
      </div>

      {/* Mode Switcher Tabs: Quiz Game (Default) vs Free Explorer */}
      <div className="flex justify-center gap-3">
        <button
          onClick={() => setActiveTab('quiz')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'quiz'
              ? 'bg-gradient-to-r from-[#175CD3] to-[#67D5FF] text-white shadow-lg ring-2 ring-blue-300/40'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-[#FFD447]" />
          <span>Игра: Выберите верный ответ</span>
        </button>
        <button
          onClick={() => setActiveTab('explore')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'explore'
              ? 'bg-gradient-to-r from-[#175CD3] to-[#67D5FF] text-white shadow-lg ring-2 ring-blue-300/40'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Compass className="w-4 h-4 text-emerald-400" />
          <span>Свободное исследование</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: Big Analog Clock */}
        <div className="md:col-span-6 flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-blue-500/30 shadow-2xl relative select-none">
          {activeTab === 'quiz' && (
            <div className="w-full flex items-center justify-between text-xs text-slate-400 pb-3 mb-2 border-b border-slate-800/80">
              <span className="font-semibold text-blue-300">Задание #{quizRound}</span>
              <span className="text-[#FFD447] font-bold">🔥 Серия: {streak}</span>
            </div>
          )}

          <div className="relative w-64 h-64 sm:w-76 sm:h-76 flex items-center justify-center">
            {/* Outer golden rim */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-700 p-2 shadow-2xl">
              <div className="w-full h-full rounded-full bg-slate-950 border-4 border-slate-900 flex items-center justify-center relative">
                {/* SVG Clock Surface */}
                <svg
                  ref={clockSvgRef}
                  viewBox="0 0 300 300"
                  className={`w-full h-full ${activeTab === 'explore' ? 'cursor-pointer touch-none' : ''}`}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                >
                  {/* Decorative minute ticks */}
                  {Array.from({ length: 60 }).map((_, i) => {
                    const isHourTick = i % 5 === 0;
                    const angle = i * 6;
                    const rad = (angle - 90) * (Math.PI / 180);
                    const rInner = isHourTick ? 122 : 128;
                    const rOuter = 136;
                    const x1 = 150 + rInner * Math.cos(rad);
                    const y1 = 150 + rInner * Math.sin(rad);
                    const x2 = 150 + rOuter * Math.cos(rad);
                    const y2 = 150 + rOuter * Math.sin(rad);

                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isHourTick ? '#FFD447' : '#475569'}
                        strokeWidth={isHourTick ? 3 : 1.2}
                        strokeLinecap="round"
                      />
                    );
                  })}

                  {/* Hour numbers 1 to 12 */}
                  {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n, i) => {
                    const angle = i * 30;
                    const rad = (angle - 90) * (Math.PI / 180);
                    const r = 106;
                    const x = 150 + r * Math.cos(rad);
                    const y = 150 + r * Math.sin(rad) + 5;
                    const isTargetHour = n === currentHours;

                    return (
                      <text
                        key={n}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        fill={isTargetHour ? '#FFD447' : '#E2E8F0'}
                        fontSize={isTargetHour ? '17' : '15'}
                        fontWeight={isTargetHour ? '900' : '600'}
                        fontFamily="monospace"
                      >
                        {n}
                      </text>
                    );
                  })}

                  {/* Quarter & Half labels (y cuarto, y media, menos cuarto) */}
                  <text x="245" y="154" fill="#67D5FF" fontSize="10" fontWeight="bold">
                    :15
                  </text>
                  <text x="150" y="248" fill="#67D5FF" fontSize="10" textAnchor="middle" fontWeight="bold">
                    :30
                  </text>
                  <text x="10" y="154" fill="#FF9635" fontSize="10" fontWeight="bold">
                    :45
                  </text>

                  {/* Hour Hand */}
                  <g transform={`rotate(${hourAngle} 150 150)`}>
                    <line
                      x1="150"
                      y1="165"
                      x2="150"
                      y2="78"
                      stroke="#FFD447"
                      strokeWidth="6"
                      strokeLinecap="round"
                      filter="drop-shadow(0px 3px 5px rgba(0,0,0,0.5))"
                    />
                    <circle cx="150" cy="78" r="4" fill="#FF9635" />
                  </g>

                  {/* Minute Hand */}
                  <g transform={`rotate(${minuteAngle} 150 150)`}>
                    <line
                      x1="150"
                      y1="170"
                      x2="150"
                      y2="42"
                      stroke="#67D5FF"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      filter="drop-shadow(0px 3px 5px rgba(0,0,0,0.6))"
                    />
                    <polygon points="150,34 146,45 154,45" fill="#67D5FF" />
                  </g>

                  {/* Center Brass Cap */}
                  <circle cx="150" cy="150" r="8" fill="#FFD447" />
                  <circle cx="150" cy="150" r="4" fill="#175CD3" />
                </svg>
              </div>
            </div>
          </div>

          {/* Clock controls based on tab */}
          {activeTab === 'explore' ? (
            <>
              {/* Interactive Step Adjusters for Explorer mode */}
              <div className="flex items-center gap-2 mt-5">
                <button
                  onClick={() => adjustExploreMinutes(-15)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  -15m
                </button>
                <button
                  onClick={() => adjustExploreMinutes(isPreciseMode ? -1 : -5)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1"
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>{isPreciseMode ? '1m' : '5m'}</span>
                </button>
                <span className="font-mono text-base font-bold text-white px-2">
                  {exploreHours}:{exploreMinutes < 10 ? `0${exploreMinutes}` : exploreMinutes}
                </span>
                <button
                  onClick={() => adjustExploreMinutes(isPreciseMode ? 1 : 5)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isPreciseMode ? '1m' : '5m'}</span>
                </button>
                <button
                  onClick={() => adjustExploreMinutes(15)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  +15m
                </button>
              </div>

              <div className="mt-3">
                <button
                  onClick={() => setIsPreciseMode(!isPreciseMode)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    isPreciseMode
                      ? 'bg-blue-600/30 border-[#67D5FF] text-[#67D5FF]'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400'
                  }`}
                >
                  {isPreciseMode ? 'Режим: Точность 1 мин' : 'Режим: Шаг 5 мин'}
                </button>
              </div>
            </>
          ) : (
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => {
                  setQuizRound((r) => r + 1);
                  generateNewQuizRound();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Другое время</span>
              </button>
              <span className="text-xs text-slate-400 font-mono">
                {targetHours}:{targetMinutes < 10 ? `0${targetMinutes}` : targetMinutes}
              </span>
            </div>
          )}
        </div>

        {/* Right: Game Quiz Options (NOT preselected!) or Explorer details */}
        <div className="md:col-span-6 space-y-4">
          {activeTab === 'quiz' ? (
            /* GAME QUIZ MODE: 4 options to choose from */
            <div className="p-6 rounded-3xl bg-slate-900 border border-blue-500/30 shadow-2xl space-y-5">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#67D5FF]">
                    ¿Qué hora marca el reloj?
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 font-medium">
                    Который час?
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Выберите верный вариант:
                </h3>
                <p className="text-xs text-slate-400">
                  Один из четырёх вариантов формулирует показанное время в правильной испанской форме.
                </p>
              </div>

              {/* 4 Interactive Choice Buttons - None is pre-selected! */}
              <div className="grid grid-cols-1 gap-2.5">
                {quizOptions.map((opt, idx) => {
                  const isSelected = selectedOptionId === opt.id;
                  const letter = String.fromCharCode(65 + idx); // A, B, C, D

                  let buttonClass = 'bg-slate-800/80 border-slate-700 text-white hover:border-[#67D5FF] hover:bg-slate-750';
                  if (hasAnswered) {
                    if (opt.isCorrect) {
                      buttonClass = 'bg-emerald-600/30 border-emerald-500 text-emerald-200 ring-2 ring-emerald-400';
                    } else if (isSelected) {
                      buttonClass = 'bg-rose-600/30 border-rose-500 text-rose-200 ring-2 ring-rose-400';
                    } else {
                      buttonClass = 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-40';
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt)}
                      disabled={hasAnswered}
                      className={`p-3.5 rounded-2xl border-2 text-left flex items-start gap-3 transition-all cursor-pointer shadow-md active:scale-98 ${buttonClass}`}
                    >
                      <span className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center font-mono font-bold text-xs text-[#FFD447] shrink-0 mt-0.5">
                        {letter}
                      </span>
                      <div className="flex-1">
                        <div className="font-bold text-sm sm:text-base leading-snug">
                          {opt.spanish}
                        </div>
                        <div className="text-xs text-slate-300 mt-0.5">
                          {opt.russian}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Result explanation when answered */}
              {hasAnswered && (
                <div
                  className={`p-4 rounded-2xl border text-left animate-in slide-in-from-bottom-2 space-y-3 ${
                    quizOptions.find((o) => o.id === selectedOptionId)?.isCorrect
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {quizOptions.find((o) => o.id === selectedOptionId)?.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 text-xs space-y-1">
                      <div className="font-bold text-sm text-white">
                        {quizOptions.find((o) => o.id === selectedOptionId)?.isCorrect
                          ? '¡Correcto! • Отлично!'
                          : '¡Atención a la regla! • Ошибка в выборе'}
                      </div>
                      <div className="font-semibold text-[#FFD447]">
                        {currentClockInfo.spanish}
                      </div>
                      <div className="text-slate-300">
                        {currentClockInfo.russian}
                      </div>
                      <p className="text-slate-400 pt-1">
                        💡 {currentClockInfo.explanationRu}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <button
                      onClick={() => soundEngine.speakSpanish(currentClockInfo.spanish, speechRate)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Слушать</span>
                    </button>

                    <button
                      onClick={() => {
                        setQuizRound((r) => r + 1);
                        generateNewQuizRound();
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#175CD3] to-[#67D5FF] text-white font-bold text-xs shadow-md hover:brightness-110 active:scale-95"
                    >
                      <span>Следующее время</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* EXPLORE MODE: Free Exploration with Live Translation */
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-slate-900 border border-blue-500/30 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-bold text-[#67D5FF]">
                    Expresión en español:
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-200">
                    {exploreHours}:{exploreMinutes < 10 ? `0${exploreMinutes}` : exploreMinutes}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#FFD447] leading-tight">
                    {currentClockInfo.spanish}
                  </h3>
                  <p className="text-base font-semibold text-slate-200">
                    {currentClockInfo.russian}
                  </p>
                </div>

                {/* Pronounce Action */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => speakTime()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#175CD3] to-[#67D5FF] text-white font-bold text-sm shadow-md hover:brightness-110 active:scale-95 transition-all"
                    aria-label="Escuchar la hora"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Escuchar • Озвучить</span>
                  </button>
                  <button
                    onClick={() => speakTime(0.65)}
                    className="px-3 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold hover:border-amber-400"
                    title="Más despacio"
                  >
                    🐢 0.7x
                  </button>
                </div>

                {/* Rule Explanation Box */}
                <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/20 text-xs text-slate-300 space-y-1.5">
                  <div className="font-bold text-blue-300 flex items-center gap-1.5">
                    <span>💡 Грамматическое правило:</span>
                  </div>
                  <p>{currentClockInfo.explanationRu}</p>
                </div>
              </div>

              {/* Quick Pre-Set Expressions (Key learning points) */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                  Примеры ключевых правил (нажмите, чтобы установить время):
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {explorePresets.map((p) => {
                    const isCurrent = exploreHours === p.h && exploreMinutes === p.m;
                    return (
                      <button
                        key={p.labelEs}
                        onClick={() => setExploreTime(p.h, p.m)}
                        className={`p-2 rounded-xl text-left border text-xs transition-all ${
                          isCurrent
                            ? 'bg-blue-600/30 border-[#67D5FF] text-white font-bold'
                            : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <div className="font-semibold truncate">{p.labelEs}</div>
                        <div className="text-[10px] text-slate-400">{p.labelRu}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
