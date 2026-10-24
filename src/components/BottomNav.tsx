import React from 'react';
import { ShieldCheck, Trophy } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'admin' | 'leaderboard';
  setActiveTab: (tab: 'admin' | 'leaderboard') => void;
  teamCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  teamCount,
}) => {
  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 w-full bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] select-none ${
        activeTab === 'leaderboard' ? 'md:hidden' : 'block'
      }`}
    >
      <div className="max-w-md mx-auto px-6 h-15 flex items-center justify-around">
        {/* Tab Admin (HP Juri) */}
        <button
          type="button"
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer ${
            activeTab === 'admin'
              ? 'text-blue-600 font-black'
              : 'text-slate-500 hover:text-slate-800 font-semibold'
          }`}
        >
          <div
            className={`px-4 py-1 rounded-2xl transition-all duration-200 ${
              activeTab === 'admin' ? 'bg-blue-100/70 text-blue-600' : 'text-slate-500'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5 tracking-tight font-bold">Admin (Juri)</span>
        </button>

        {/* Tab Leaderboard (Laptop Proyektor) */}
        <button
          type="button"
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 cursor-pointer ${
            activeTab === 'leaderboard'
              ? 'text-blue-600 font-black'
              : 'text-slate-500 hover:text-slate-800 font-semibold'
          }`}
        >
          <div
            className={`px-4 py-1 rounded-2xl transition-all duration-200 relative ${
              activeTab === 'leaderboard' ? 'bg-blue-100/70 text-blue-600' : 'text-slate-500'
            }`}
          >
            <Trophy className="w-5 h-5" />
            {teamCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center leading-none">
                {teamCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-0.5 tracking-tight font-bold">Leaderboard</span>
        </button>
      </div>
    </nav>
  );
};
