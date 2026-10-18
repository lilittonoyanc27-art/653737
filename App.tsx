import React, { useState, useEffect, useCallback } from 'react';
import type { AppMode, UserStats } from './types.ts';
import { HeaderNav } from './HeaderNav.tsx';
import { PianoComponent } from './PianoComponent.tsx';
import { ListenNumberModule } from './ListenNumberModule.tsx';
import { MathModule } from './MathModule.tsx';
import { ClockComponent } from './ClockComponent.tsx';
import { ListenClockModule } from './ListenClockModule.tsx';
import { ConcertSchedule } from './ConcertSchedule.tsx';
import { PianistChallenge } from './PianistChallenge.tsx';
import { soundEngine } from './audio.ts';

const STATS_STORAGE_KEY = 'piano_espanol_stats_v1';

const INITIAL_STATS: UserStats = {
  score: 120,
  correctAnswers: 12,
  wrongAnswers: 2,
  keysPlayed: 15,
  completedLevels: [1],
  achievements: ['first_note'],
};

export default function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>('piano');
  const [speechRate, setSpeechRate] = useState<number>(0.9);
  const [stats, setStats] = useState<UserStats>(() => {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return INITIAL_STATS;
  });

  // Save stats to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
    } catch {
      // ignore
    }
  }, [stats]);

  const handleScoreUpdate = useCallback(
    (points: number, isCorrect: boolean, levelIndex?: number) => {
      setStats((prev) => {
        const nextScore = Math.max(0, prev.score + points);
        const nextCorrect = isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers;
        const nextWrong = !isCorrect ? prev.wrongAnswers + 1 : prev.wrongAnswers;
        const nextCompleted = levelIndex && isCorrect && !prev.completedLevels.includes(levelIndex)
          ? [...prev.completedLevels, levelIndex]
          : prev.completedLevels;

        const nextAchievements = [...prev.achievements];
        if (nextCorrect >= 5 && !nextAchievements.includes('perfect_ear')) {
          nextAchievements.push('perfect_ear');
        }
        if (nextScore >= 300 && !nextAchievements.includes('concert_ready')) {
          nextAchievements.push('concert_ready');
        }

        return {
          ...prev,
          score: nextScore,
          correctAnswers: nextCorrect,
          wrongAnswers: nextWrong,
          completedLevels: nextCompleted,
          achievements: nextAchievements,
        };
      });
    },
    []
  );

  const handleKeyPlayed = useCallback((num: number) => {
    setStats((prev) => {
      const nextAchievements = [...prev.achievements];
      if (!nextAchievements.includes('first_note')) {
        nextAchievements.push('first_note');
      }
      if (num === 100 && !nextAchievements.includes('number_100')) {
        nextAchievements.push('number_100');
      }
      return {
        ...prev,
        keysPlayed: prev.keysPlayed + 1,
        achievements: nextAchievements,
      };
    });
  }, []);

  const handleToggleSpeechRate = () => {
    const nextRate = speechRate < 0.85 ? 1.0 : 0.7;
    setSpeechRate(nextRate);
    soundEngine.setSpeechRate(nextRate);
  };

  const handleResetStats = () => {
    setStats(INITIAL_STATS);
    localStorage.removeItem(STATS_STORAGE_KEY);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-[#67D5FF]/30 selection:text-white">
      {/* Navigation Header */}
      <HeaderNav
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        stats={stats}
        onResetStats={handleResetStats}
        speechRate={speechRate}
        onToggleSpeechRate={handleToggleSpeechRate}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:py-8">
        {/* Subtle decorative background music wave lines */}
        <div className="relative">
          {currentMode === 'piano' && (
            <PianoComponent
              onKeyPlayed={handleKeyPlayed}
              speechRate={speechRate}
            />
          )}

          {currentMode === 'listen-number' && (
            <ListenNumberModule
              onScoreUpdate={handleScoreUpdate}
              speechRate={speechRate}
            />
          )}

          {currentMode === 'math' && (
            <MathModule
              onScoreUpdate={handleScoreUpdate}
              speechRate={speechRate}
            />
          )}

          {currentMode === 'clock' && (
            <ClockComponent
              speechRate={speechRate}
              onScoreUpdate={handleScoreUpdate}
              onExploreTime={() => {
                setStats((prev) => {
                  if (!prev.achievements.includes('clock_master')) {
                    return { ...prev, achievements: [...prev.achievements, 'clock_master'] };
                  }
                  return prev;
                });
              }}
            />
          )}

          {currentMode === 'listen-clock' && (
            <ListenClockModule
              onScoreUpdate={handleScoreUpdate}
              speechRate={speechRate}
            />
          )}

          {currentMode === 'concert' && (
            <ConcertSchedule
              onScoreUpdate={handleScoreUpdate}
              speechRate={speechRate}
            />
          )}

          {currentMode === 'challenge' && (
            <PianistChallenge
              stats={stats}
              onUpdateStats={handleScoreUpdate}
              speechRate={speechRate}
            />
          )}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/90 py-5 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🎹</span>
            <span className="text-slate-300 font-semibold">
              Piano Español — Aprende jugando
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-blue-300">Испанский язык для музыкантов</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Правильно: <strong className="text-emerald-400">{stats.correctAnswers}</strong></span>
            <span>Ошибок: <strong className="text-rose-400">{stats.wrongAnswers}</strong></span>
            <span>Клавиш нажато: <strong className="text-amber-400">{stats.keysPlayed}</strong></span>
            <span>Звук: Web Audio API & SpeechSynthesis</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
