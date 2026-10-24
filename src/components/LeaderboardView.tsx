import React, { useEffect, useMemo, useRef } from 'react';
import {
  Trophy,
  Crown,
  Medal,
  Award,
  ArrowRight,
  School,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Team, TimerState, TEAM_COLOR_PRESETS } from '../types';
import { soundManager } from '../services/audio';

interface LeaderboardViewProps {
  teams: Team[];
  timerState: TimerState;
  onGoToAdmin: () => void;
  isActiveTab?: boolean;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  teams,
  timerState,
  onGoToAdmin,
  isActiveTab = true,
}) => {
  // Safe sorting descending by score with robust null-safety
  const sortedTeams = useMemo(() => {
    try {
      if (!Array.isArray(teams)) return [];
      return [...teams].sort((a, b) => {
        const scoreA = typeof a?.score === 'number' ? a.score : 0;
        const scoreB = typeof b?.score === 'number' ? b.score : 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        const nameA = a?.name || '';
        const nameB = b?.name || '';
        return nameA.localeCompare(nameB);
      });
    } catch (e) {
      console.warn('Error sorting teams:', e);
      return [];
    }
  }, [teams]);

  const first = sortedTeams[0];
  const second = sortedTeams[1];
  const third = sortedTeams[2];

  // Component mounted & active guard
  const isMountedRef = useRef<boolean>(true);
  const prevShowPodiumRef = useRef<boolean>(false);
  const confettiTimeoutsRef = useRef<number[]>([]);

  // Clear timers on unmount or tab switch
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      confettiTimeoutsRef.current.forEach((id) => clearTimeout(id));
      confettiTimeoutsRef.current = [];
      try {
        confetti.reset();
      } catch {
        // Safe ignore
      }
    };
  }, [isActiveTab]);

  // Safe Confetti Runner
  const safeFireConfetti = (ratio: number, opts: confetti.Options) => {
    try {
      if (!isMountedRef.current || !isActiveTab) return;
      const el = document.getElementById('lcc-podium-section');
      if (!el) return;

      confetti({
        ...opts,
        particleCount: Math.floor(180 * ratio),
        zIndex: 9999,
      });
    } catch (err) {
      console.warn('Confetti burst notice:', err);
    }
  };

  // Trigger celebration only when showPodium transitions from false -> true
  useEffect(() => {
    if (!isActiveTab) {
      prevShowPodiumRef.current = !!timerState?.showPodium;
      return;
    }

    if (!prevShowPodiumRef.current && timerState?.showPodium && sortedTeams.length > 0) {
      try {
        soundManager.playFanfare();
      } catch (err) {
        console.warn('Fanfare sound notice:', err);
      }

      // Initial burst
      safeFireConfetti(0.3, {
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#ffd700', '#2563eb', '#10b981', '#f59e0b'],
      });

      safeFireConfetti(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
        origin: { y: 0.6 },
        colors: ['#ffd700', '#f43f5e', '#3b82f6', '#8b5cf6'],
      });

      // Side cannons after small delay
      const t1 = window.setTimeout(() => {
        safeFireConfetti(0.2, {
          angle: 60,
          spread: 70,
          origin: { x: 0.05, y: 0.65 },
          colors: ['#ffd700', '#f59e0b', '#2563eb'],
        });
      }, 250);

      const t2 = window.setTimeout(() => {
        safeFireConfetti(0.2, {
          angle: 120,
          spread: 70,
          origin: { x: 0.95, y: 0.65 },
          colors: ['#ffd700', '#f59e0b', '#ec4899', '#3b82f6'],
        });
      }, 450);

      confettiTimeoutsRef.current.push(t1, t2);
    }

    prevShowPodiumRef.current = !!timerState?.showPodium;
  }, [timerState?.showPodium, sortedTeams.length, isActiveTab]);

  // Timer percentage calculation
  const timerPercentage = useMemo(() => {
    const duration = timerState?.duration ?? 15;
    const remaining = timerState?.remainingSeconds ?? 15;
    if (!duration || duration <= 0) return 100;
    return Math.max(0, Math.min(100, (remaining / duration) * 100));
  }, [timerState?.remainingSeconds, timerState?.duration]);

  const isLowTime =
    timerState?.status === 'running' &&
    (timerState?.remainingSeconds ?? 15) <= 5 &&
    (timerState?.remainingSeconds ?? 15) > 0;
  const isTimeUp =
    (timerState?.remainingSeconds ?? 15) === 0 || timerState?.status === 'finished';

  const isPodiumActive = !!timerState?.showPodium && sortedTeams.length > 0;

  return (
    <div className="h-full flex flex-col justify-between max-w-7xl mx-auto w-full px-2 sm:px-4 py-1 select-none overflow-hidden animate-fade-in">
      {/* ======================================================== */}
      {/* 1. COMPACT HERO TIMER BANNER (NO "RAYAKAN JUARA" BUTTON) */}
      {/* ======================================================== */}
      <section className="hero-gradient rounded-2xl p-3 sm:p-4 text-white relative overflow-hidden shadow-md shrink-0">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Title & Status */}
          <div className="flex items-center gap-2.5">
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider backdrop-blur-md border ${
                timerState.status === 'running'
                  ? 'bg-emerald-400/25 text-emerald-200 border-emerald-300/50 animate-pulse'
                  : timerState.status === 'paused'
                  ? 'bg-amber-400/25 text-amber-200 border-amber-300/50'
                  : isTimeUp
                  ? 'bg-rose-500/35 text-rose-200 border-rose-300/60'
                  : 'bg-white/20 text-white border-white/25'
              }`}
            >
              {timerState.status === 'running' ? 'Waktu Berjalan' :
               timerState.status === 'paused' ? 'Dijeda' :
               isTimeUp ? 'WAKTU HABIS!' : 'Siap'}
            </span>
            <h2 className="hidden sm:inline-block text-sm sm:text-base font-black tracking-tight text-white/95">
              Hitung Mundur Jawaban
            </h2>
          </div>

          {/* Center: Big Digits Clock */}
          <div className="flex items-center gap-3">
            <div
              className={`font-mono-score font-black tracking-tight text-3xl sm:text-5xl md:text-6xl select-none leading-none transition-all duration-200 ${
                isTimeUp
                  ? 'text-rose-300 animate-pulse'
                  : isLowTime
                  ? 'text-amber-300 animate-urgent'
                  : 'text-white'
              }`}
            >
              {String(Math.floor(timerState.remainingSeconds / 60)).padStart(2, '0')}:
              {String(timerState.remainingSeconds % 60).padStart(2, '0')}
            </div>

            {/* Glowing Slim Progress Bar */}
            <div className="w-28 sm:w-44 md:w-56 h-2 sm:h-2.5 bg-blue-950/60 rounded-full overflow-hidden p-0.5 border border-white/20 shrink-0">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isTimeUp
                    ? 'bg-rose-400'
                    : isLowTime
                    ? 'bg-amber-400'
                    : 'bg-white'
                }`}
                style={{ width: `${timerPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. ANIMASI PODIUM INLINE (SLIDE-DOWN TRANSITION-ALL 500) */}
      {/* ======================================================== */}
      <div
        id="lcc-podium-section"
        className={`transition-all duration-500 ease-in-out overflow-hidden transform origin-top shrink-0 ${
          isPodiumActive
            ? 'max-h-[220px] sm:max-h-[240px] opacity-100 scale-100 translate-y-0 my-1.5'
            : 'max-h-0 opacity-0 scale-95 -translate-y-4 pointer-events-none my-0 py-0'
        }`}
      >
        <div className="bright-card p-2.5 sm:p-3.5 bg-gradient-to-b from-white via-amber-50/20 to-blue-50/15 border-2 border-amber-300 shadow-lg rounded-2xl relative overflow-hidden">
          {/* Top celebratory stripe */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-amber-400 to-indigo-600" />

          {/* Compact Podium Title */}
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-800">
              PODIUM JUARA LOMBA CERDAS CERMAT
            </span>
            <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
          </div>

          {/* 3D Compact Proportional Podium */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-2xl mx-auto pt-1">
            {/* JUARA 2 (Perak - Kiri) */}
            <div className="flex flex-col items-center">
              {second && (
                <div className="w-full flex flex-col items-center text-center mb-1">
                  <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-blue-600 text-white shadow-xs uppercase">
                    JUARA 2
                  </span>
                  <div className="bg-white/95 rounded-xl px-2 py-1 border border-slate-200 shadow-xs w-full mt-1">
                    <h4 className="font-black text-slate-900 text-xs sm:text-sm truncate">
                      {second.name}
                    </h4>
                    <span className="text-sm sm:text-lg font-mono-score font-black text-blue-600">
                      {second.score} <span className="text-[9px] font-bold text-slate-400">poin</span>
                    </span>
                  </div>
                </div>
              )}
              <div className="w-full h-12 sm:h-16 bg-gradient-to-t from-blue-700 via-blue-600 to-indigo-500 rounded-t-xl flex flex-col items-center justify-center text-white shadow-md border-t-2 border-blue-300">
                <span className="font-mono-score font-black text-xl sm:text-2xl leading-none">
                  2
                </span>
                <span className="text-[9px] font-bold text-blue-100 uppercase tracking-wider">
                  Perak
                </span>
              </div>
            </div>

            {/* JUARA 1 (Emas - Tengah - Paling Tinggi) */}
            <div className="flex flex-col items-center -mt-2">
              {first && (
                <div className="w-full flex flex-col items-center text-center mb-1">
                  <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-sm uppercase border border-yellow-200 animate-score-pulse">
                    <Crown className="w-3 h-3 fill-slate-950" />
                    <span>JUARA 1</span>
                  </div>
                  <div className="bg-white rounded-xl px-2.5 py-1.5 border-2 border-amber-300 shadow-sm w-full mt-1">
                    <h4 className="font-black text-slate-900 text-xs sm:text-base truncate">
                      {first.name}
                    </h4>
                    <span className="text-base sm:text-2xl font-mono-score font-black text-amber-500">
                      {first.score} <span className="text-[10px] font-bold text-slate-500">poin</span>
                    </span>
                  </div>
                </div>
              )}
              <div className="w-full h-18 sm:h-24 bg-gradient-to-t from-amber-600 via-amber-400 to-yellow-300 rounded-t-xl flex flex-col items-center justify-center text-amber-950 shadow-xl border-t-3 border-yellow-100">
                <span className="font-mono-score font-black text-2xl sm:text-4xl leading-none">
                  1
                </span>
                <span className="text-[10px] sm:text-xs font-black text-amber-950 uppercase tracking-wider">
                  EMAS
                </span>
              </div>
            </div>

            {/* JUARA 3 (Perunggu - Kanan) */}
            <div className="flex flex-col items-center">
              {third && (
                <div className="w-full flex flex-col items-center text-center mb-1">
                  <span className="px-2 py-0.2 rounded-full text-[9px] font-black bg-orange-600 text-white shadow-xs uppercase">
                    JUARA 3
                  </span>
                  <div className="bg-white/95 rounded-xl px-2 py-1 border border-slate-200 shadow-xs w-full mt-1">
                    <h4 className="font-black text-slate-900 text-xs sm:text-sm truncate">
                      {third.name}
                    </h4>
                    <span className="text-sm sm:text-lg font-mono-score font-black text-orange-600">
                      {third.score} <span className="text-[9px] font-bold text-slate-400">poin</span>
                    </span>
                  </div>
                </div>
              )}
              <div className="w-full h-9 sm:h-12 bg-gradient-to-t from-orange-600 via-amber-600 to-amber-500 rounded-t-xl flex flex-col items-center justify-center text-white shadow-md border-t-2 border-amber-300">
                <span className="font-mono-score font-black text-lg sm:text-xl leading-none">
                  3
                </span>
                <span className="text-[8px] font-bold text-amber-100 uppercase tracking-wider">
                  Perunggu
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. KLASEMEN SEMENTARA (FIT-TO-SCREEN GRID / NO SCROLL)   */}
      {/* ======================================================== */}
      <section className="flex-1 min-h-0 flex flex-col overflow-hidden my-1">
        <div className="flex items-center justify-between px-1 mb-1.5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
              <Trophy className="w-4 h-4 fill-amber-600 text-amber-600" />
            </div>
            <h2 className="text-sm sm:text-base font-black text-slate-900">
              Klasemen Sementara
            </h2>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">
            Realtime Firestore Sync
          </span>
        </div>

        {/* Empty State */}
        {sortedTeams.length === 0 ? (
          <div className="bright-card flex-1 flex flex-col items-center justify-center p-6 text-center border-dashed border-2 border-slate-200">
            <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Trophy className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Belum Ada Tim Terdaftar
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-3">
              Buka Tab Juri di bawah untuk mendaftarkan tim lomba.
            </p>
            <button
              type="button"
              onClick={onGoToAdmin}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs shadow-md transition-all cursor-pointer active:scale-95"
            >
              <span>Buka Menu Juri</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Realtime Teams Grid: Fit on one screen across 2 to 4 columns */
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-0.5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 pb-1">
              {sortedTeams.map((team, index) => {
                const rank = index + 1;
                const isFirst = rank === 1;
                const isSecond = rank === 2;
                const isThird = rank === 3;

                const colorPreset =
                  TEAM_COLOR_PRESETS.find((c) => c.key === team.color) || TEAM_COLOR_PRESETS[0];

                let cardExtraClass = 'bright-card';
                let rankBadge = `${colorPreset.iconBg} ${colorPreset.iconColor} border border-slate-200`;
                let scoreColor = colorPreset.scoreText;
                let topStripe = colorPreset.gradientTop;

                if (isFirst) {
                  cardExtraClass = 'bright-card border-2 border-amber-300 ring-2 ring-amber-400/20 shadow-md bg-amber-50/10';
                  rankBadge = 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 font-black shadow-xs';
                  scoreColor = 'text-amber-500';
                  topStripe = 'from-amber-400 via-yellow-400 to-orange-400';
                } else if (isSecond) {
                  cardExtraClass = 'bright-card border border-blue-200 shadow-xs';
                  rankBadge = 'bg-gradient-to-tr from-slate-200 to-blue-200 text-blue-900 font-black shadow-xs';
                  scoreColor = 'text-blue-600';
                  topStripe = 'from-blue-400 via-sky-400 to-indigo-400';
                } else if (isThird) {
                  cardExtraClass = 'bright-card border border-orange-200 shadow-xs';
                  rankBadge = 'bg-gradient-to-tr from-orange-200 to-amber-200 text-orange-950 font-black shadow-xs';
                  scoreColor = 'text-orange-500';
                  topStripe = 'from-orange-400 via-amber-400 to-rose-400';
                }

                return (
                  <div
                    key={team.id}
                    className={`${cardExtraClass} px-3 py-2.5 relative overflow-hidden flex items-center justify-between gap-2.5 transition-all hover:scale-[1.01]`}
                  >
                    {/* Top Accent Stripe */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${topStripe}`} />

                    {/* Rank & Team Info */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono-score font-black shrink-0 ${rankBadge}`}
                      >
                        {isFirst ? (
                          <Crown className="w-4 h-4 fill-amber-950 text-amber-950" />
                        ) : isSecond ? (
                          <Medal className="w-4 h-4 fill-blue-900 text-blue-900" />
                        ) : isThird ? (
                          <Award className="w-4 h-4 text-orange-950" />
                        ) : (
                          `#${rank}`
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-black text-slate-900 truncate">
                            {team.name}
                          </h3>
                        </div>
                        {team.school && (
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 truncate font-medium">
                            <School className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span className="truncate">{team.school}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-2 shrink-0">
                      {team.lastDelta !== undefined && (
                        <span
                          className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono-score font-black border animate-score-pulse ${
                            team.lastDelta >= 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {team.lastDelta > 0 ? `+${team.lastDelta}` : team.lastDelta}
                        </span>
                      )}

                      <div className="text-right">
                        <div
                          className={`text-2xl sm:text-3xl font-mono-score font-black tracking-tight leading-none ${scoreColor}`}
                        >
                          {team.score}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 block -mt-0.5">
                          poin
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
