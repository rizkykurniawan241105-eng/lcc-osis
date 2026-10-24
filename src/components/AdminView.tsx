import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Trash2,
  RotateCcw,
  Play,
  Pause,
  Timer,
  Hash,
  School,
  CheckCircle2,
  Users,
  Plus,
  Minus,
  PartyPopper
} from 'lucide-react';
import { Team, TimerState, TEAM_COLOR_PRESETS } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface AdminViewProps {
  teams: Team[];
  timerState: TimerState;
  onUpdateTimer: (partial: Partial<TimerState>) => Promise<void>;
  onAddTeam: (name: string, school: string) => Promise<void>;
  onUpdateScore: (teamId: string, delta: number) => Promise<void>;
  onDeleteTeam: (teamId: string) => Promise<void>;
  onResetAllTeams: () => Promise<void>;
  onTogglePodium: () => Promise<void>;
}

export const AdminView: React.FC<AdminViewProps> = ({
  teams,
  timerState,
  onUpdateTimer,
  onAddTeam,
  onUpdateScore,
  onDeleteTeam,
  onResetAllTeams,
  onTogglePodium,
}) => {
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamSchool, setNewTeamSchool] = useState('');
  const [manualInputs, setManualInputs] = useState<Record<string, string>>({});

  // Modals & Notices
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [isResetAllModalOpen, setIsResetAllModalOpen] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Custom timer minutes & seconds input
  const [minutesInput, setMinutesInput] = useState<string>(() =>
    String(Math.floor((timerState.duration || 15) / 60))
  );
  const [secondsInput, setSecondsInput] = useState<string>(() =>
    String((timerState.duration || 15) % 60)
  );

  // Sync inputs with duration when duration changes externally and timer is idle
  useEffect(() => {
    if (timerState.status === 'idle') {
      const m = Math.floor((timerState.duration || 15) / 60);
      const s = (timerState.duration || 15) % 60;
      setMinutesInput(String(m));
      setSecondsInput(String(s));
    }
  }, [timerState.duration, timerState.status]);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 2000);
  };

  const computeInputSeconds = (): number => {
    const m = parseInt(minutesInput, 10);
    const s = parseInt(secondsInput, 10);
    const validM = isNaN(m) ? 0 : Math.max(0, m);
    const validS = isNaN(s) ? 0 : Math.max(0, s);
    const total = validM * 60 + validS;
    return total > 0 ? total : 15;
  };

  // 1. Tambah Tim Baru: Instant optimistic submission (NO HANGING PROMISE)
  const handleAddTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTeamName.trim();
    if (!trimmed) return;

    // Reset inputs immediately
    setNewTeamName('');
    setNewTeamSchool('');
    showNotice(`Tim "${trimmed}" ditambahkan.`);

    // Optimistic background execution
    onAddTeam(trimmed, newTeamSchool.trim()).catch((err) => {
      console.warn('handleAddTeam error:', err);
    });
  };

  // 2. Quick Score Update (+100, +50, -50, -100)
  const handleScoreDelta = (team: Team, delta: number) => {
    showNotice(`${team.name} ${delta > 0 ? '+' : ''}${delta}`);
    onUpdateScore(team.id, delta).catch((err) => {
      console.warn('handleScoreDelta error:', err);
    });
  };

  // 3. Manual Score with separate (+) and (-) buttons
  const handleManualAdjust = (team: Team, multiplier: 1 | -1) => {
    const rawVal = manualInputs[team.id];
    if (rawVal === undefined || rawVal.trim() === '') return;

    const parsed = parseInt(rawVal, 10);
    if (isNaN(parsed) || parsed === 0) return;

    const delta = Math.abs(parsed) * multiplier;
    // Clear input field immediately
    setManualInputs((prev) => ({ ...prev, [team.id]: '' }));
    showNotice(`${team.name} ${delta > 0 ? '+' : ''}${delta} poin`);

    onUpdateScore(team.id, delta).catch((err) => {
      console.warn('handleManualAdjust error:', err);
    });
  };

  // 4. Delete Single Team
  const confirmDeleteTeam = () => {
    if (!teamToDelete) return;
    const teamName = teamToDelete.name;
    setTeamToDelete(null);
    showNotice(`Tim "${teamName}" dihapus.`);
    onDeleteTeam(teamToDelete.id).catch((err) => {
      console.warn('confirmDeleteTeam error:', err);
    });
  };

  // 5. Reset Sesi (Delete All Teams)
  const confirmResetAllTeams = () => {
    setIsResetAllModalOpen(false);
    showNotice('Semua tim telah di-reset.');
    onResetAllTeams().catch((err) => {
      console.warn('confirmResetAllTeams error:', err);
    });
  };

  // 6. Quick Presets (10s, 15s, 30s)
  const handleQuickPreset = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    setMinutesInput(String(m));
    setSecondsInput(String(s));

    onUpdateTimer({
      duration: sec,
      remainingSeconds: sec,
      status: 'idle',
      targetTimestamp: 0,
    }).catch((err) => console.warn('Preset timer error:', err));
  };

  // 7. Start Timer
  const handleStartTimer = () => {
    const totalInputSec = computeInputSeconds();
    let remaining = timerState.remainingSeconds;
    if (timerState.status === 'idle' || timerState.status === 'finished' || remaining <= 0) {
      remaining = totalInputSec;
    }

    const targetTimestamp = Date.now() + remaining * 1000;
    onUpdateTimer({
      duration: totalInputSec,
      remainingSeconds: remaining,
      status: 'running',
      targetTimestamp,
    }).catch((err) => console.warn('Start timer error:', err));
  };

  // 8. Pause Timer
  const handlePauseTimer = () => {
    let calculatedRemaining = timerState.remainingSeconds;
    if (timerState.status === 'running' && timerState.targetTimestamp) {
      const diffMs = timerState.targetTimestamp - Date.now();
      calculatedRemaining = Math.max(0, Math.ceil(diffMs / 1000));
    }
    onUpdateTimer({
      remainingSeconds: calculatedRemaining,
      status: 'paused',
      targetTimestamp: 0,
    }).catch((err) => console.warn('Pause timer error:', err));
  };

  // 9. Reset Timer
  const handleResetTimer = () => {
    const totalInputSec = computeInputSeconds();
    onUpdateTimer({
      duration: totalInputSec,
      remainingSeconds: totalInputSec,
      status: 'idle',
      targetTimestamp: 0,
    }).catch((err) => console.warn('Reset timer error:', err));
  };

  // 10. Toggle Podium Celebration
  const handleTogglePodiumClick = () => {
    onTogglePodium().then(() => {
      showNotice(
        !timerState.showPodium
          ? 'Podium Juara aktif di layar Leaderboard!'
          : 'Podium Juara ditutup.'
      );
    }).catch((err) => console.warn('Toggle podium error:', err));
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-20 animate-fade-in">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed top-18 right-4 z-50 flex items-center gap-2 px-4 py-2.5 bg-white border border-blue-200 text-blue-900 rounded-2xl shadow-xl text-xs sm:text-sm font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. KONTROL TIMER SOAL                                     */}
      {/* ======================================================== */}
      <section className="hero-gradient rounded-3xl p-5 sm:p-7 text-white relative overflow-hidden shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/20">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white backdrop-blur-md text-[11px] font-bold mb-2 border border-white/20">
              <Timer className="w-3.5 h-3.5" />
              <span>Kontrol Waktu Soal (HP Juri)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Timer Pertanyaan
            </h2>
          </div>

          {/* Clock Display */}
          <div className="flex items-center gap-3 bg-white/15 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/25 self-start sm:self-auto">
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-blue-100 block">
                {timerState.status}
              </span>
              <div className="text-3xl sm:text-4xl font-mono-score font-black text-white">
                {String(Math.floor(timerState.remainingSeconds / 60)).padStart(2, '0')}:
                {String(timerState.remainingSeconds % 60).padStart(2, '0')}
              </div>
            </div>
          </div>
        </div>

        {/* Timer Presets & Custom Duration */}
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {/* Quick Presets */}
            <div>
              <span className="text-[11px] font-bold text-blue-100 uppercase tracking-wider block mb-1.5">
                Pilihan Durasi Cepat:
              </span>
              <div className="flex items-center gap-2">
                {[10, 15, 30].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => handleQuickPreset(sec)}
                    className={`flex-1 py-2 px-3 rounded-xl font-mono-score font-black text-xs transition-all cursor-pointer ${
                      timerState.duration === sec && timerState.status !== 'running'
                        ? 'bg-white text-blue-900 shadow-md'
                        : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div>
              <span className="text-[11px] font-bold text-blue-100 uppercase tracking-wider block mb-1.5">
                Atur Durasi Kustom:
              </span>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-white/15 backdrop-blur-md rounded-xl border border-white/25 px-3 py-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={minutesInput}
                    onChange={(e) => setMinutesInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                    className="w-full bg-transparent text-center font-mono-score font-black text-white text-sm focus:outline-none"
                  />
                  <span className="text-xs font-bold text-blue-200 ml-1">m</span>
                </div>

                <span className="font-bold text-white">:</span>

                <div className="flex-1 flex items-center bg-white/15 backdrop-blur-md rounded-xl border border-white/25 px-3 py-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={secondsInput}
                    onChange={(e) => setSecondsInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                    className="w-full bg-transparent text-center font-mono-score font-black text-white text-sm focus:outline-none"
                  />
                  <span className="text-xs font-bold text-blue-200 ml-1">s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trigger Buttons */}
          <div className="pt-1 flex items-center gap-2.5">
            {timerState.status !== 'running' ? (
              <button
                type="button"
                onClick={handleStartTimer}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-blue-900 font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Play className="w-4 h-4 fill-blue-900" />
                <span>Mulai Timer</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePauseTimer}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Pause className="w-4 h-4 fill-amber-950" />
                <span>Jeda Timer</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleResetTimer}
              className="py-2.5 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. FORM TAMBAH TIM BARU                                   */}
      {/* ======================================================== */}
      <section className="bright-card p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Tambah Tim Baru
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Skor awal 0 poin &bull; Warna tema acak otomatis
            </p>
          </div>
        </div>

        <form onSubmit={handleAddTeamSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              maxLength={100}
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Nama Tim / Regu..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />

            <input
              type="text"
              maxLength={150}
              value={newTeamSchool}
              onChange={(e) => setNewTeamSchool(e.target.value)}
              placeholder="Sekolah / Anggota (opsional)..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={!newTeamName.trim()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
            >
              + Tambah Tim
            </button>
          </div>
        </form>
      </section>

      {/* ======================================================== */}
      {/* 3. DAFTAR TIM & KONTROL SKOR INSTAN                      */}
      {/* ======================================================== */}
      <section className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900">
              Daftar Tim Terdaftar
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
              {teams.length}
            </span>
          </div>

          {teams.length > 0 && (
            <div className="flex items-center gap-2">
              {/* TOMBOL RAYAKAN JUARA (Hanya ada di Admin HP Juri) */}
              <button
                type="button"
                onClick={handleTogglePodiumClick}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 ${
                  timerState.showPodium
                    ? 'bg-amber-400 text-amber-950 border border-amber-500 shadow-md ring-2 ring-amber-400/40'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                }`}
              >
                <PartyPopper className="w-3.5 h-3.5 text-amber-700" />
                <span>{timerState.showPodium ? 'Tutup Podium Layar ✖' : 'Rayakan Juara 🎉'}</span>
              </button>

              {/* Reset Sesi */}
              <button
                type="button"
                onClick={() => setIsResetAllModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>

        {teams.length === 0 ? (
          <div className="bright-card p-8 text-center border-dashed border-2 border-slate-200">
            <div className="w-12 h-12 mx-auto mb-2.5 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Belum Ada Tim</h3>
            <p className="text-xs text-slate-500 mt-0.5">Gunakan form di atas untuk mendaftarkan tim pertama.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {teams.map((team, idx) => {
              const colorPreset =
                TEAM_COLOR_PRESETS.find((c) => c.key === team.color) || TEAM_COLOR_PRESETS[0];

              return (
                <div
                  key={team.id}
                  className="bright-card p-4 relative overflow-hidden flex flex-col justify-between"
                >
                  {/* Top Color Line */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${colorPreset.gradientTop}`} />

                  <div>
                    {/* Header: Name & Delete */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-xl ${colorPreset.iconBg} ${colorPreset.iconColor} flex items-center justify-center font-mono-score font-black text-xs shrink-0`}
                        >
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-base font-black text-slate-900 leading-snug">
                              {team.name}
                            </h3>
                            <span
                              className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${colorPreset.badgeBg} ${colorPreset.badgeText} ${colorPreset.badgeBorder}`}
                            >
                              {colorPreset.label}
                            </span>
                          </div>
                          {team.school && (
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <School className="w-3 h-3 text-slate-400" />
                              <span>{team.school}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setTeamToDelete(team)}
                        title="Hapus Tim"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Score Box */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center justify-between mb-3">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                          Total Skor
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl font-mono-score font-black ${colorPreset.scoreText}`}>
                            {team.score}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">poin</span>
                        </div>
                      </div>

                      {team.lastDelta !== undefined && (
                        <div
                          className={`px-2.5 py-0.5 rounded-full text-xs font-mono-score font-black border ${
                            team.lastDelta >= 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {team.lastDelta > 0 ? `+${team.lastDelta}` : team.lastDelta}
                        </div>
                      )}
                    </div>

                    {/* Quick Instant Score Buttons */}
                    <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                      <button
                        type="button"
                        onClick={() => handleScoreDelta(team, 100)}
                        className="py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-mono-score font-black text-xs shadow-xs transition-all cursor-pointer active:scale-95 text-center"
                      >
                        +100
                      </button>

                      <button
                        type="button"
                        onClick={() => handleScoreDelta(team, 50)}
                        className="py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-mono-score font-black text-xs shadow-xs transition-all cursor-pointer active:scale-95 text-center"
                      >
                        +50
                      </button>

                      <button
                        type="button"
                        onClick={() => handleScoreDelta(team, -50)}
                        className="py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-mono-score font-black text-xs shadow-xs transition-all cursor-pointer active:scale-95 text-center"
                      >
                        -50
                      </button>

                      <button
                        type="button"
                        onClick={() => handleScoreDelta(team, -100)}
                        className="py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-mono-score font-black text-xs shadow-xs transition-all cursor-pointer active:scale-95 text-center"
                      >
                        -100
                      </button>
                    </div>
                  </div>

                  {/* Manual Points Input with (+) and (-) buttons */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                    <div className="relative flex-1">
                      <Hash className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        value={manualInputs[team.id] ?? ''}
                        onChange={(e) =>
                          setManualInputs((prev) => ({ ...prev, [team.id]: e.target.value }))
                        }
                        placeholder="Ketik poin..."
                        className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-lg pl-7 pr-2 py-1 text-slate-800 text-xs font-mono-score focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleManualAdjust(team, 1)}
                      title="Tambah poin yang diketik"
                      className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-xs cursor-pointer flex items-center justify-center gap-0.5 active:scale-95 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleManualAdjust(team, -1)}
                      title="Kurang poin yang diketik"
                      className="px-3 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-black shadow-xs cursor-pointer flex items-center justify-center gap-0.5 active:scale-95 transition-all"
                    >
                      <Minus className="w-3 h-3" />
                      <span>Kurang</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={!!teamToDelete}
        title="Hapus Tim"
        message={`Apakah Anda yakin ingin menghapus "${teamToDelete?.name}"?`}
        confirmText="Hapus"
        cancelText="Batal"
        isDanger={true}
        onConfirm={confirmDeleteTeam}
        onCancel={() => setTeamToDelete(null)}
      />

      <ConfirmModal
        isOpen={isResetAllModalOpen}
        title="Reset Semua Tim"
        message="Yakin ingin menghapus seluruh data tim dan me-reset sesi perlombaan?"
        confirmText="Hapus Semua"
        cancelText="Batal"
        isDanger={true}
        onConfirm={confirmResetAllTeams}
        onCancel={() => setIsResetAllModalOpen(false)}
      />
    </div>
  );
};
