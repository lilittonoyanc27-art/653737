import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Volume2, Sparkles, ChevronLeft, ChevronRight, Play, Info } from 'lucide-react';
import { PIANO_KEYS, soundEngine, PianoKey } from './audio.ts';
import { getNumberInfo, capitalizeFirst } from './spanishData.ts';
import type { NumberInfo } from './types.ts';

interface PianoComponentProps {
  onKeyPlayed: (num: number) => void;
  speechRate: number;
}

type NumberRange = '1-10' | '11-20' | '21-50' | '51-100' | '1-100';

export const PianoComponent: React.FC<PianoComponentProps> = ({
  onKeyPlayed,
  speechRate,
}) => {
  const [selectedRange, setSelectedRange] = useState<NumberRange>('1-100');
  const [currentNumber, setCurrentNumber] = useState<number>(25);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [waveAnim, setWaveAnim] = useState(false);

  // Compute number info
  const numberInfo: NumberInfo = useMemo(() => {
    return getNumberInfo(currentNumber);
  }, [currentNumber]);

  // Subscribe to speaking state
  useEffect(() => {
    return soundEngine.subscribeSpeaking((speaking) => {
      setIsSpeaking(speaking);
    });
  }, []);

  // Determine number mapped to a key index based on selected range
  const getNumberForKey = useCallback(
    (keyIndex: number): number => {
      const totalKeys = PIANO_KEYS.length; // 25 keys
      if (selectedRange === '1-10') {
        return (keyIndex % 10) + 1;
      }
      if (selectedRange === '11-20') {
        return 11 + (keyIndex % 10);
      }
      if (selectedRange === '21-50') {
        // 30 numbers across 25 keys
        return 21 + Math.min(29, Math.round((keyIndex / (totalKeys - 1)) * 29));
      }
      if (selectedRange === '51-100') {
        // 50 numbers
        return 51 + Math.min(49, Math.round((keyIndex / (totalKeys - 1)) * 49));
      }
      // '1-100': distributed across 1 to 100
      return Math.max(1, Math.min(100, Math.round((keyIndex / (totalKeys - 1)) * 99) + 1));
    },
    [selectedRange]
  );

  const handleTriggerKey = useCallback(
    (key: PianoKey, index: number) => {
      soundEngine.playPianoNote(key.freq, 1.8, 0.85);
      setActiveKey(`${key.note}${key.octave}`);
      setWaveAnim(true);
      setTimeout(() => setWaveAnim(false), 500);

      const num = getNumberForKey(index);
      setCurrentNumber(num);
      onKeyPlayed(num);

      // Pronounce Spanish number
      const info = getNumberInfo(num);
      soundEngine.speakSpanish(info.spanish, speechRate);

      setTimeout(() => {
        setActiveKey(null);
      }, 250);
    },
    [getNumberForKey, onKeyPlayed, speechRate]
  );

  const playCurrentPronunciation = (customRate?: number) => {
    soundEngine.speakSpanish(numberInfo.spanish, customRate ?? speechRate);
  };

  // Keyboard event listener for physical keyboard playing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      const char = e.key.toUpperCase();
      const index = PIANO_KEYS.findIndex((k) => k.shortcut === char);
      if (index !== -1) {
        handleTriggerKey(PIANO_KEYS[index], index);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTriggerKey]);

  // Separate white and black keys for rendering
  const whiteKeys = PIANO_KEYS.filter((k) => !k.isBlack);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in">
      {/* Intro Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#FFD447]" />
          <span>El piano de los números • Пианино чисел</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          Toca una tecla y aprende el número en español
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto">
          Нажимайте на клавиши пианино: звучит нота, появляется число, произносится по-испански и показывается русский перевод.
        </p>
      </div>

      {/* Main Number Display Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-blue-500/30 p-6 sm:p-8 shadow-2xl">
        {/* Subtle background glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#175CD3]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Big Animated Number */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div
                className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-[#175CD3] via-[#67D5FF] to-[#FFD447] p-1 shadow-xl transition-all duration-300 ${
                  waveAnim ? 'scale-105 shadow-[#67D5FF]/40' : ''
                }`}
              >
                <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight text-white font-mono">
                    {currentNumber}
                  </span>
                </div>
              </div>

              {/* Sound waves icon */}
              {isSpeaking && (
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#FF9635] flex items-center justify-center text-white text-xs animate-bounce shadow-lg">
                  🔊
                </div>
              )}
            </div>

            {/* Middle: Spanish & Russian Text */}
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-bold text-[#67D5FF]">
                  Español (Испанский):
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-200 font-mono">
                  A1-A2
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#FFD447] tracking-wide">
                {capitalizeFirst(numberInfo.spanish)}
              </h3>
              <p className="text-base sm:text-lg font-medium text-slate-300">
                {capitalizeFirst(numberInfo.russian)}
              </p>
              <p className="text-xs text-slate-400 pt-1">
                Пример: <span className="text-blue-300">{currentNumber}</span> —{' '}
                <span className="text-[#FFD447] font-semibold">{numberInfo.spanish}</span> —{' '}
                <span className="text-slate-300">{numberInfo.russian}</span>
              </p>
            </div>
          </div>

          {/* Right: Audio Action Controls & Number Navigation */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto">
            <button
              onClick={() => playCurrentPronunciation()}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#175CD3] to-[#67D5FF] text-white font-bold text-sm shadow-lg shadow-blue-500/30 hover:brightness-110 active:scale-95 transition-all"
              aria-label="Escuchar pronunciación / Послушать произношение"
            >
              <Volume2 className="w-4 h-4" />
              <span>Escuchar • Послушать</span>
            </button>

            <button
              onClick={() => playCurrentPronunciation(0.65)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white hover:border-[#FFD447] font-semibold text-xs transition-all"
              aria-label="Pronunciación lenta / Медленное произношение"
            >
              <span>🐢 Más despacio • Помедленнее</span>
            </button>

            {/* Next/Prev buttons for convenience */}
            <div className="flex items-center gap-2 justify-center pt-1">
              <button
                onClick={() => {
                  const prev = Math.max(1, currentNumber - 1);
                  setCurrentNumber(prev);
                  soundEngine.speakSpanish(getNumberInfo(prev).spanish, speechRate);
                }}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                title="Número anterior (-1)"
                aria-label="Previous number"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400 font-mono">
                {currentNumber} / 100
              </span>
              <button
                onClick={() => {
                  const next = Math.min(100, currentNumber + 1);
                  setCurrentNumber(next);
                  soundEngine.speakSpanish(getNumberInfo(next).spanish, speechRate);
                }}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                title="Número siguiente (+1)"
                aria-label="Next number"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Range Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <span>🎯 Rango de números • Диапазон чисел:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: '1-10', label: '1–10' },
              { id: '11-20', label: '11–20' },
              { id: '21-50', label: '21–50' },
              { id: '51-100', label: '51–100' },
              { id: '1-100', label: '1–100 (Все)' },
            ] as const
          ).map((r) => {
            const active = selectedRange === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRange(r.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-gradient-to-r from-[#FF9635] to-[#FFD447] text-slate-950 shadow-md font-extrabold'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                aria-label={`Seleccionar rango ${r.label}`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grand Piano Interactive Keyboard */}
      <div className="relative rounded-3xl bg-gradient-to-b from-stone-900 via-zinc-900 to-black p-4 sm:p-6 border-2 border-amber-600/30 shadow-2xl overflow-hidden">
        {/* Brass bar aesthetic top */}
        <div className="h-3 bg-gradient-to-r from-amber-700 via-amber-400 to-amber-700 rounded-md mb-4 shadow-inner flex items-center justify-center">
          <div className="text-[9px] tracking-widest font-serif font-black text-amber-950 uppercase">
            Gran Piano Español • 88 Hilos
          </div>
        </div>

        {/* Scrollable container for mobile */}
        <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="relative flex justify-center min-w-[740px] h-60 select-none px-4">
            {whiteKeys.map((key) => {
              const fullKeyIndex = PIANO_KEYS.findIndex(
                (k) => k.note === key.note && k.octave === key.octave
              );
              const mappedNum = getNumberForKey(fullKeyIndex);
              const isPressed = activeKey === `${key.note}${key.octave}`;

              // Check if there is a black key immediately following this white key
              const nextKey = PIANO_KEYS[fullKeyIndex + 1];
              const hasBlackKey = nextKey && nextKey.isBlack;
              const blackIndex = fullKeyIndex + 1;
              const isBlackPressed = hasBlackKey && activeKey === `${nextKey.note}${nextKey.octave}`;
              const blackMappedNum = hasBlackKey ? getNumberForKey(blackIndex) : null;

              return (
                <div key={`${key.note}${key.octave}`} className="relative flex-1 min-w-[46px] max-w-[54px] h-56">
                  {/* White Key */}
                  <button
                    onClick={() => handleTriggerKey(key, fullKeyIndex)}
                    className={`w-full h-full rounded-b-xl border-x border-b border-stone-300 bg-gradient-to-b from-stone-100 via-white to-stone-200 flex flex-col justify-end items-center pb-3 text-slate-800 font-bold transition-all shadow-md group ${
                      isPressed
                        ? '!bg-gradient-to-b !from-sky-200 !via-sky-100 !to-sky-300 !translate-y-1 shadow-inner ring-2 ring-[#67D5FF]'
                        : 'hover:bg-sky-50 active:translate-y-1'
                    }`}
                    aria-label={`Tecla ${key.nameEs} ${key.octave}, número ${mappedNum}`}
                  >
                    <span className="text-[10px] text-slate-400 font-mono mb-1 group-hover:text-blue-600">
                      {key.shortcut}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600">
                      {key.nameEs}
                    </span>
                    <span className="mt-1 px-1.5 py-0.5 rounded-md bg-[#175CD3] text-white text-xs font-mono font-bold shadow-sm">
                      {mappedNum}
                    </span>
                  </button>

                  {/* Accompanying Black Key on right boundary if exists */}
                  {hasBlackKey && nextKey && blackMappedNum !== null && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTriggerKey(nextKey, blackIndex);
                      }}
                      className={`absolute top-0 -right-[15px] z-30 w-7 sm:w-8 h-34 rounded-b-lg border-x border-b border-black bg-gradient-to-b from-stone-900 via-zinc-800 to-black text-white flex flex-col justify-end items-center pb-2 shadow-xl transition-all cursor-pointer ${
                        isBlackPressed
                          ? '!bg-gradient-to-b !from-[#175CD3] !via-[#67D5FF] !to-[#175CD3] translate-y-1 ring-2 ring-[#FFD447]'
                          : 'hover:brightness-125 active:translate-y-1'
                      }`}
                      aria-label={`Tecla negra ${nextKey.nameEs} ${nextKey.octave}, número ${blackMappedNum}`}
                    >
                      <span className="text-[9px] text-amber-400/80 font-mono">
                        {nextKey.shortcut}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[#FFD447] mt-1 px-1 rounded bg-black/60">
                        {blackMappedNum}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Keyboard hint */}
        <div className="mt-2 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <span>💡 Подсказка: можно играть мышкой, пальцем на экране или клавишами клавиатуры (Z, X, C, Q, W, E...)</span>
        </div>
      </div>
    </div>
  );
};
