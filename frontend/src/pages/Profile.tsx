import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth, type UserProfile } from '../context/AuthContext';
import { User as UserIcon, Trophy, Target, Flame, History } from 'lucide-react';

export interface GameHistoryEntry {
  id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  click_count: number;
  score: number;
  duration_seconds?: number;
  started_at: string;
  ended_at: string | null;
}

export interface GameHistoryResponse {
  total: number;
  limit: number;
  offset: number;
  games: GameHistoryEntry[];
}

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(user);
  const [historyData, setHistoryData] = useState<GameHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [profileRes, historyRes] = await Promise.all([
          api.get<UserProfile>('/users/me'),
          api.get<GameHistoryResponse>('/users/me/games?limit=20'),
        ]);
        setProfile(profileRes.data);
        setHistoryData(historyRes.data);
      } catch (err) {
        console.error('Failed to load profile or game history', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Header Profile Info */}
      <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#0f2413]/40 backdrop-blur-xl border border-white/20 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/10 text-white flex items-center justify-center font-bold text-xl sm:text-2xl border border-white/20 shrink-0">
            <UserIcon className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="space-y-0.5 sm:space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white">{profile?.name || user?.name}</h1>
            <p className="text-xs text-white/70">{profile?.email || user?.email}</p>
            <p className="text-[11px] sm:text-xs text-white/50">
              Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        <div className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white/15 border border-white/20 text-xs font-semibold text-white self-start sm:self-auto">
          Global Rank: {profile?.global_rank ? `#${profile.global_rank}` : 'Unranked'}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
        <div className="p-4 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/70">Best Score</span>
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">{profile?.best_score ?? 0}</p>
        </div>

        <div className="p-4 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/70">Total Games</span>
            <Target className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">{profile?.total_games ?? 0}</p>
        </div>

        <div className="p-4 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg space-y-1 sm:space-y-2 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-white/70">Average Score</span>
            <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white">{profile?.average_score ?? 0.0}</p>
        </div>
      </div>

      {/* Game History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 drop-shadow-sm">
            <History className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
            <span>Recent Game History</span>
          </h2>
          <span className="text-xs text-white/70">Total: {historyData?.total ?? 0}</span>
        </div>

        <div className="rounded-2xl sm:rounded-3xl bg-[#0f2413]/40 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 sm:p-12 text-center text-sm text-white/70">Loading history...</div>
          ) : historyData?.games.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-sm text-white/70">No games played yet. Start a new challenge!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/20 bg-white/10 text-xs font-semibold text-white/90 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Status</th>
                    <th className="py-3.5 px-3 sm:px-6 text-center">Mode</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Score</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Clicks</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right hidden sm:table-cell">Started At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-xs sm:text-sm">
                  {historyData?.games.map((game) => (
                    <tr key={game.id} className="hover:bg-white/10 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-semibold">
                        {game.status === 'COMPLETED' && (
                          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] sm:text-xs">
                            COMPLETED
                          </span>
                        )}
                        {game.status === 'ACTIVE' && (
                          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[11px] sm:text-xs">
                            ACTIVE
                          </span>
                        )}
                        {game.status === 'ABANDONED' && (
                          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 text-[11px] sm:text-xs">
                            ABANDONED
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 sm:px-6 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-white/15 text-white text-[11px] sm:text-xs font-bold border border-white/20">
                          {game.duration_seconds || 60}s
                        </span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-amber-300 text-right text-sm sm:text-base">
                        {game.score}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-white/80 text-right">
                        {game.click_count}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-xs text-white/60 text-right hidden sm:table-cell">
                        {new Date(game.started_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
