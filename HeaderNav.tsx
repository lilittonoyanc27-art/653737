import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Music,
  Gauge,
  Award,
  Sparkles,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import type { AppMode, UserStats, Achievement } from './types.ts';
import { soundEngine } from './audio.ts';
import { INITIAL_ACHIEVEMENTS } from './spanishData.ts';

interface HeaderNavProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  stats: UserStats;
  onResetStats: () => void;
  speechRate: number;
  onToggleSpeechRate: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentMode,
  onSelectMode,
  stats,
  onResetStats,
  speechRate,
  onToggleSpeechRate,
}) => {
  const [isMuted, setIsMuted] = useState(soundEngine.getIsMuted());
  const [isAmbient, setIsAmbient] = useState(soundEngine.isAmbientActive());
  const [showAchievements, setShowAchievements] = useState(false);
  const [showGrammarGuide, setShowGrammarGuide] = useState(false);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    soundEngine.setMuted(nextMuted);
    setIsMuted(nextMuted);
    if (nextMuted) {
      setIsAmbient(false);
    }
  };

  const toggleAmbient = () => {
    const active = soundEngine.toggleAmbientMusic();
    setIsAmbient(active);
    if (active && isMuted) {
      setIsMuted(false);
      soundEngine.setMuted(false);
    }
  };

  const modes: { id: AppMode; labelEs: string; labelRu: string; icon: string }[] = [
    { id: 'piano', labelEs: 'Piano de Números', labelRu: 'Пианино чисел', icon: '🎹' },
    { id: 'listen-number', labelEs: 'Escucha y Toca', labelRu: 'Слушай и нажимай', icon: '🎧' },
    { id: 'math', labelEs: 'Matemáticas', labelRu: 'Муз. математика', icon: '🎼' },
    { id: 'clock', labelEs: 'Reloj Musical', labelRu: 'Музыкальные часы', icon: '🕒' },
    { id: 'listen-clock', labelEs: 'Escucha la Hora', labelRu: 'Угадай время', icon: '⏰' },
    { id: 'concert', labelEs: 'Concierto', labelRu: 'Концерт пианиста', icon: '🎵' },
    { id: 'challenge', labelEs: 'Desafío', labelRu: 'Испытание (5 уровней)', icon: '🏆' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-blue-500/20 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <button
              onClick={() => onSelectMode('piano')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
              title="Inicio / Главный экран"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#175CD3] via-[#67D5FF] to-[#FFD447] p-0.5 shadow-md group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-xl">
                  🎹
                </div>
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-[#67D5FF] via-white to-[#FFD447] bg-clip-text text-transparent">
                  Piano Español
                </h1>
                <p className="text-[11px] text-blue-200/80 font-medium leading-none">
                  Aprende jugando • Испанский для музыкантов
                </p>
              </div>
            </button>

            {/* Quick score display */}
            <div className="flex items-center gap-2 md:hidden">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-[#FFD447] border border-amber-500/30">
                ⭐ {stats.score}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none py-1">
            {modes.map((m) => {
              const active = currentMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectMode(m.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    active
                      ? 'bg-gradient-to-r from-[#175CD3] to-[#67D5FF] text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-300/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                  aria-label={`${m.labelEs} - ${m.labelRu}`}
                >
                  <span className="text-sm shrink-0">{m.icon}</span>
                  <span className="inline">{m.labelEs}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls: Ambient music, Speech speed, Mute, Achievements */}
          <div className="flex items-center gap-1.5 text-xs font-medium">
            {/* Ambient Music Toggle */}
            <button
              onClick={toggleAmbient}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-all ${
                isAmbient
                  ? 'bg-amber-500/20 border-[#FFD447] text-[#FFD447] shadow-sm animate-pulse'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isAmbient ? 'Música de fondo: Activa / Выключить фоновую музыку' : 'Música de fondo: Desactivada / Включить фоновую музыку'}
              aria-label="Toggle ambient piano music"
            >
              <Music className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px] font-semibold">
                {isAmbient ? 'Música: ON' : 'Música: OFF'}
              </span>
            </button>

            {/* Speech Rate Toggle (Más despacio / Normal) */}
            <button
              onClick={onToggleSpeechRate}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-all ${
                speechRate < 0.85
                  ? 'bg-blue-600/30 border-[#67D5FF] text-[#67D5FF]'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Velocidad de pronunciación / Скорость испанского голоса"
              aria-label="Toggle pronunciation speed"
            >
              <Gauge className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">
                {speechRate < 0.85 ? '🐢 0.7x' : '🐇 1.0x'}
              </span>
            </button>

            {/* Sound Mute */}
            <button
              onClick={toggleMute}
              className={`p-1.5 rounded-lg border transition-all ${
                isMuted
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isMuted ? 'Activar sonido / Включить звук' : 'Silenciar sonido / Выключить звук'}
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Grammar cheat sheet modal trigger */}
            <button
              onClick={() => setShowGrammarGuide(true)}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-[#67D5FF] transition-colors"
              title="Reglas y gramática / Грамматическая памятка"
              aria-label="Open grammar guide"
            >
              <BookOpen className="w-4 h-4" />
            </button>

            {/* Achievements button */}
            <button
              onClick={() => setShowAchievements(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-[#FFD447] hover:scale-105 transition-all"
              title="Logros y puntuación / Достижения и баллы"
              aria-label="Open achievements"
            >
              <Award className="w-4 h-4" />
              <span className="font-bold hidden sm:inline">{stats.score}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Grammar Guide Modal */}
      {showGrammarGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-blue-500/30 rounded-2xl max-w-2xl w-full p-6 text-white shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📖</span>
                <div>
                  <h3 className="text-lg font-bold text-[#67D5FF]">
                    Reglas del español • Испанские правила
                  </h3>
                  <p className="text-xs text-slate-400">
                    Числа от 1 до 100 и определение времени
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGrammarGuide(false)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1"
                aria-label="Cerrar / Закрыть"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 pt-4 text-sm text-slate-200">
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30">
                <h4 className="font-bold text-[#67D5FF] mb-1">
                  1. Числа (Los números)
                </h4>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                  <li><strong>1–15:</strong> Уникальные слова (uno, dos... once, quince).</li>
                  <li><strong>16–29:</strong> Пишутся в одно слово: <em>dieciséis, veinticinco</em>.</li>
                  <li><strong>31–99:</strong> Пишутся через союз «y»: <em>treinta y uno, setenta y ocho</em>.</li>
                  <li><strong>Внимание на схожесть:</strong> <em>sesenta</em> (60) и <em>setenta</em> (70) часто путают на слух!</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30">
                <h4 className="font-bold text-[#FFD447] mb-1">
                  2. Время (¿Qué hora es?)
                </h4>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                  <li><strong>Единственное число (1 час):</strong> <em>Es la una</em> (Сейчас час).</li>
                  <li><strong>Множественное число (2–12 часов):</strong> <em>Son las dos, Son las ocho</em>.</li>
                  <li><strong>Четверть:</strong> <em>y cuarto</em> (15 минут), например: <em>Son las tres y cuarto</em>.</li>
                  <li><strong>Половина:</strong> <em>y media</em> (30 минут), например: <em>Son las cinco y media</em>.</li>
                  <li><strong>После половины (без минут):</strong> <em>menos cuarto</em> (без четверти), <em>menos diez</em> (без десяти). Называем следующий час: <em>Son las ocho menos cuarto</em> (7:45).</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                <h4 className="font-bold text-emerald-400 mb-1">
                  3. Во сколько? (¿A qué hora...?)
                </h4>
                <p className="text-xs text-slate-300">
                  Когда мы говорим о времени события (начало концерта, репетиция), используем предлог <strong>A</strong>:<br />
                  • <em>A la una</em> — В час.<br />
                  • <em>A las ocho menos cuarto</em> — Без четверти восемь.<br />
                  • <em>¿A qué hora empieza el concierto?</em> — Во сколько начинается концерт?
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowGrammarGuide(false)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#175CD3] to-[#67D5FF] text-white font-semibold text-sm hover:brightness-110 shadow-md"
              >
                ¡Entendido! • Понятно!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Modal */}
      {showAchievements && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <div>
                  <h3 className="text-lg font-bold text-[#FFD447]">
                    Logros musicales • Музыкальные достижения
                  </h3>
                  <p className="text-xs text-slate-400">
                    Баллы: <strong className="text-amber-300">{stats.score}</strong> | Правильно: <strong className="text-emerald-400">{stats.correctAnswers}</strong> | Ошибок: <strong className="text-rose-400">{stats.wrongAnswers}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAchievements(false)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1"
                aria-label="Cerrar / Закрыть"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pt-4">
              {INITIAL_ACHIEVEMENTS.map((ach) => {
                const isUnlocked = stats.achievements.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                      isUnlocked
                        ? 'bg-amber-950/20 border-amber-500/40 text-amber-100'
                        : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="text-2xl p-2 rounded-lg bg-slate-800/80">
                      {ach.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-white">
                          {ach.titleEs}
                        </h4>
                        <span className="text-[11px] font-semibold text-amber-400">
                          {isUnlocked ? '✓ Desbloqueado' : 'Bloqueado'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{ach.titleRu}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{ach.descRu}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  if (confirm('¿Reiniciar todo el progreso? / Сбросить весь прогресс?')) {
                    onResetStats();
                    setShowAchievements(false);
                  }
                }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar progreso / Сбросить прогресс</span>
              </button>
              <button
                onClick={() => setShowAchievements(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700"
              >
                Cerrar / Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
