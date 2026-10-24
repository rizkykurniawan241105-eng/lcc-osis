export interface Team {
  id: string;
  name: string;
  school?: string;
  score: number;
  color?: string;
  lastDelta?: number;
  lastDeltaTime?: number;
  createdAt?: any;
  updatedAt?: any;
}

export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface TimerState {
  duration: number;
  remainingSeconds: number;
  status: TimerStatus;
  targetTimestamp?: number;
  showPodium?: boolean;
  updatedAt?: any;
}

export interface TeamColorOption {
  key: string;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentBg: string;
  accentText: string;
  scoreText: string;
  iconBg: string;
  iconColor: string;
  cardBorder: string;
  gradientTop: string;
}

export const TEAM_COLOR_PRESETS: TeamColorOption[] = [
  {
    key: 'blue',
    label: 'Biru Royal',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    accentBg: 'bg-blue-500',
    accentText: 'text-blue-600',
    scoreText: 'text-blue-600',
    iconBg: 'bg-blue-100/80',
    iconColor: 'text-blue-600',
    cardBorder: 'border-blue-200 hover:border-blue-400',
    gradientTop: 'from-blue-600 to-indigo-600',
  },
  {
    key: 'emerald',
    label: 'Hijau Zamrud',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    accentBg: 'bg-emerald-500',
    accentText: 'text-emerald-600',
    scoreText: 'text-emerald-600',
    iconBg: 'bg-emerald-100/80',
    iconColor: 'text-emerald-600',
    cardBorder: 'border-emerald-200 hover:border-emerald-400',
    gradientTop: 'from-emerald-500 to-teal-600',
  },
  {
    key: 'amber',
    label: 'Kuning Emas',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    accentBg: 'bg-amber-500',
    accentText: 'text-amber-600',
    scoreText: 'text-amber-600',
    iconBg: 'bg-amber-100/80',
    iconColor: 'text-amber-600',
    cardBorder: 'border-amber-200 hover:border-amber-400',
    gradientTop: 'from-amber-500 to-orange-500',
  },
  {
    key: 'purple',
    label: 'Ungu Elegan',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    accentBg: 'bg-purple-500',
    accentText: 'text-purple-600',
    scoreText: 'text-purple-600',
    iconBg: 'bg-purple-100/80',
    iconColor: 'text-purple-600',
    cardBorder: 'border-purple-200 hover:border-purple-400',
    gradientTop: 'from-purple-600 to-fuchsia-600',
  },
  {
    key: 'rose',
    label: 'Merah Coral',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    accentBg: 'bg-rose-500',
    accentText: 'text-rose-600',
    scoreText: 'text-rose-600',
    iconBg: 'bg-rose-100/80',
    iconColor: 'text-rose-600',
    cardBorder: 'border-rose-200 hover:border-rose-400',
    gradientTop: 'from-rose-500 to-pink-600',
  },
  {
    key: 'cyan',
    label: 'Cyan Segar',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-700',
    badgeBorder: 'border-cyan-200',
    accentBg: 'bg-cyan-500',
    accentText: 'text-cyan-600',
    scoreText: 'text-cyan-600',
    iconBg: 'bg-cyan-100/80',
    iconColor: 'text-cyan-600',
    cardBorder: 'border-cyan-200 hover:border-cyan-400',
    gradientTop: 'from-cyan-500 to-blue-500',
  },
];

export function getRandomTeamColor(): string {
  const index = Math.floor(Math.random() * TEAM_COLOR_PRESETS.length);
  return TEAM_COLOR_PRESETS[index].key;
}
