import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Team, TimerState, getRandomTeamColor } from './types';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { AdminView } from './components/AdminView';
import { LeaderboardView } from './components/LeaderboardView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { soundManager } from './services/audio';

const DEFAULT_TIMER_STATE: TimerState = {
  duration: 15,
  remainingSeconds: 15,
  status: 'idle',
  targetTimestamp: 0,
  showPodium: false,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'admin' | 'leaderboard'>('leaderboard');
  const [teams, setTeams] = useState<Team[]>([]);
  const [timerState, setTimerState] = useState<TimerState>(DEFAULT_TIMER_STATE);
  const [isLoading, setIsLoading] = useState(true);

  const prevRemainingRef = useRef<number>(15);

  // Fast resolution to prevent UI freezing
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // 1. Realtime Firestore Listener for Teams (Collection: teams)
  useEffect(() => {
    let unsubTeams = () => {};
    try {
      unsubTeams = onSnapshot(
        collection(db, 'teams'),
        (snapshot) => {
          try {
            const list: Team[] = [];
            snapshot.forEach((docSnap) => {
              if (docSnap && docSnap.exists()) {
                const data = docSnap.data();
                list.push({
                  id: docSnap.id,
                  name: data.name || 'Tanpa Nama',
                  school: data.school || '',
                  score: typeof data.score === 'number' ? data.score : 0,
                  color: data.color || 'blue',
                  lastDelta: data.lastDelta,
                  lastDeltaTime: data.lastDeltaTime,
                  createdAt: data.createdAt,
                  updatedAt: data.updatedAt,
                });
              }
            });
            setTeams(list);
            setIsLoading(false);
          } catch (e) {
            console.error('Snapshot parsing error:', e);
            setIsLoading(false);
          }
        },
        (error) => {
          console.error('Firestore teams listener error:', error);
          setIsLoading(false);
        }
      );
    } catch (err) {
      console.error('Firestore teams subscription error:', err);
      setIsLoading(false);
    }

    return () => unsubTeams();
  }, []);

  // 2. Realtime Firestore Listener for Game State / Timer (Document: game_state/active & quiz_settings/timer)
  useEffect(() => {
    let unsubGameState = () => {};
    try {
      const gameStateDocRef = doc(db, 'game_state', 'active');
      unsubGameState = onSnapshot(
        gameStateDocRef,
        (docSnap) => {
          try {
            if (docSnap && docSnap.exists()) {
              const data = docSnap.data() as Partial<TimerState>;
              setTimerState({
                duration: typeof data.duration === 'number' ? data.duration : 15,
                remainingSeconds: typeof data.remainingSeconds === 'number' ? data.remainingSeconds : 15,
                status: data.status || 'idle',
                targetTimestamp: data.targetTimestamp || 0,
                showPodium: !!data.showPodium,
              });
            } else {
              // Initialize default state if document doesn't exist
              setDoc(gameStateDocRef, {
                ...DEFAULT_TIMER_STATE,
                updatedAt: serverTimestamp(),
              }).catch((err) => console.warn('Game state init notice:', err));
            }
          } catch (e) {
            console.error('Game state snapshot error:', e);
          }
        },
        (error) => {
          console.error('Game state listener error:', error);
        }
      );
    } catch (err) {
      console.error('Firestore game_state subscription error:', err);
    }

    return () => unsubGameState();
  }, []);

  // 3. Client countdown loop when timer is running
  useEffect(() => {
    if (timerState.status !== 'running' || !timerState.targetTimestamp) {
      return;
    }

    const interval = setInterval(() => {
      try {
        const now = Date.now();
        const diffMs = (timerState.targetTimestamp || 0) - now;
        const secondsLeft = Math.max(0, Math.ceil(diffMs / 1000));

        if (secondsLeft !== prevRemainingRef.current) {
          if (secondsLeft <= 3 && secondsLeft > 0) {
            try {
              soundManager.playWarningTick();
            } catch (err) {
              console.warn('Tick sound error:', err);
            }
          }
          prevRemainingRef.current = secondsLeft;
        }

        if (secondsLeft <= 0) {
          clearInterval(interval);
          try {
            soundManager.playBuzzer();
          } catch (err) {
            console.warn('Buzzer sound error:', err);
          }

          // Optimistically update local timer
          setTimerState((prev) => ({
            ...prev,
            remainingSeconds: 0,
            status: 'finished',
            targetTimestamp: 0,
          }));

          // Async update Firestore in background
          const payload = {
            remainingSeconds: 0,
            status: 'finished',
            targetTimestamp: 0,
            updatedAt: serverTimestamp(),
          };

          setDoc(doc(db, 'game_state', 'active'), payload, { merge: true }).catch((err) =>
            console.warn('Finish game_state sync error:', err)
          );
          setDoc(doc(db, 'quiz_settings', 'timer'), payload, { merge: true }).catch((err) =>
            console.warn('Finish quiz_settings sync error:', err)
          );
        } else {
          setTimerState((prev) => ({
            ...prev,
            remainingSeconds: secondsLeft,
          }));
        }
      } catch (loopError) {
        console.warn('Timer loop error:', loopError);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [timerState.status, timerState.targetTimestamp]);

  // ==========================================================================
  // OPTIMISTIC UPDATES: UI changes instantly, Firestore syncs in background
  // ==========================================================================

  // Optimistic Timer State Update
  const handleUpdateTimer = useCallback(async (partial: Partial<TimerState>) => {
    // 1. Instant local state update
    setTimerState((prev) => ({ ...prev, ...partial }));

    // 2. Background Firestore update (both game_state and quiz_settings for full sync)
    const payload = {
      ...partial,
      updatedAt: serverTimestamp(),
    };

    setDoc(doc(db, 'game_state', 'active'), payload, { merge: true }).catch((err) =>
      console.error('Background timer sync error (game_state):', err)
    );
    setDoc(doc(db, 'quiz_settings', 'timer'), payload, { merge: true }).catch((err) =>
      console.error('Background timer sync error (quiz_settings):', err)
    );
  }, []);

  // Optimistic Add Team
  const handleAddTeam = useCallback(async (name: string, school: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    const assignedColor = getRandomTeamColor();
    const tempId = 'temp_' + Date.now();

    // 1. Instant local optimistic addition
    const optimisticTeam: Team = {
      id: tempId,
      name: trimmed,
      school: school.trim(),
      score: 0,
      color: assignedColor,
    };

    setTeams((prev) => [...prev, optimisticTeam]);
    soundManager.playScorePlus();

    // 2. Background Firestore document creation
    addDoc(collection(db, 'teams'), {
      name: trimmed,
      school: school.trim(),
      score: 0,
      color: assignedColor,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch((err) => {
      console.error('Background addDoc error:', err);
      // Revert if error
      setTeams((prev) => prev.filter((t) => t.id !== tempId));
    });
  }, []);

  // Optimistic Score Update (+100, +50, -50, -100, or custom)
  const handleUpdateScore = useCallback(async (teamId: string, delta: number) => {
    // 1. Instant local state update
    let updatedScore = 0;
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          updatedScore = t.score + delta;
          return {
            ...t,
            score: updatedScore,
            lastDelta: delta,
            lastDeltaTime: Date.now(),
          };
        }
        return t;
      })
    );

    // Audio feedback immediately
    if (delta > 0) {
      soundManager.playScorePlus();
    } else {
      soundManager.playScoreMinus();
    }

    // 2. Background Firestore update
    updateDoc(doc(db, 'teams', teamId), {
      score: updatedScore,
      lastDelta: delta,
      lastDeltaTime: Date.now(),
      updatedAt: serverTimestamp(),
    }).catch((err) => {
      console.error('Background score update error:', err);
    });
  }, []);

  // Optimistic Delete Team
  const handleDeleteTeam = useCallback(async (teamId: string) => {
    // 1. Instant local removal
    setTeams((prev) => prev.filter((t) => t.id !== teamId));

    // 2. Background Firestore deletion
    deleteDoc(doc(db, 'teams', teamId)).catch((err) => {
      console.error('Background deleteDoc error:', err);
    });
  }, []);

  // Optimistic Reset All Teams
  const handleResetAllTeams = useCallback(async () => {
    const currentTeams = [...teams];
    // 1. Instant local reset
    setTeams([]);
    handleUpdateTimer({
      status: 'idle',
      remainingSeconds: timerState.duration || 15,
      targetTimestamp: 0,
      showPodium: false,
    });

    // 2. Background Firestore batch deletion
    try {
      const batch = writeBatch(db);
      currentTeams.forEach((t) => {
        batch.delete(doc(db, 'teams', t.id));
      });
      await batch.commit();
    } catch (err) {
      console.error('Background reset batch error:', err);
    }
  }, [teams, handleUpdateTimer, timerState.duration]);

  // Optimistic Toggle Podium
  const handleTogglePodium = useCallback(async () => {
    const nextState = !timerState.showPodium;
    handleUpdateTimer({ showPodium: nextState });
  }, [timerState.showPodium, handleUpdateTimer]);

  const isLeaderboardTab = activeTab === 'leaderboard';

  return (
    <div
      className={`bright-bg-pattern text-slate-800 relative selection:bg-blue-600 selection:text-white ${
        isLeaderboardTab
          ? 'h-screen max-h-screen overflow-hidden flex flex-col'
          : 'min-h-screen'
      }`}
    >
      {/* Top Navbar */}
      <Navbar
        teamCount={teams.length}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content with ErrorBoundary protection */}
      <main
        className={`flex-1 min-h-0 w-full ${
          isLeaderboardTab
            ? 'h-[calc(100vh-3.5rem)] max-h-[calc(100vh-3.5rem)] overflow-hidden flex flex-col p-2 sm:p-3'
            : 'max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-24'
        }`}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-xs font-bold text-slate-500">Memuat data...</p>
          </div>
        ) : (
          <ErrorBoundary fallbackTitle="Terjadi Gangguan pada Tampilan Utama">
            {/* Admin View (Kept mounted to preserve inputs, active on mobile) */}
            <div
              className={`h-full ${activeTab === 'admin' ? 'block' : 'hidden'}`}
              aria-hidden={activeTab !== 'admin'}
            >
              <AdminView
                teams={teams}
                timerState={timerState}
                onUpdateTimer={handleUpdateTimer}
                onAddTeam={handleAddTeam}
                onUpdateScore={handleUpdateScore}
                onDeleteTeam={handleDeleteTeam}
                onResetAllTeams={handleResetAllTeams}
                onTogglePodium={handleTogglePodium}
              />
            </div>

            {/* Leaderboard View (Fit-to-Screen on Laptop/Projector) */}
            <div
              className={`h-full flex flex-col overflow-hidden ${
                activeTab === 'leaderboard' ? 'block' : 'hidden'
              }`}
              aria-hidden={activeTab !== 'leaderboard'}
            >
              <LeaderboardView
                teams={teams}
                timerState={timerState}
                onGoToAdmin={() => setActiveTab('admin')}
                isActiveTab={activeTab === 'leaderboard'}
              />
            </div>
          </ErrorBoundary>
        )}
      </main>

      {/* Docked Bottom Navigation Bar (Visible on mobile HP Admin, hidden on projector desktop) */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        teamCount={teams.length}
      />
    </div>
  );
}
