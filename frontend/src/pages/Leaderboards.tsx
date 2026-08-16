import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Trophy, Calendar, Clock, RefreshCw, Radio, Zap } from 'lucide-react';

export interface LeaderboardEntry {
  rank: number;
  user_name: string;
  score: number;
  click_count: number;
  duration_seconds: number;
  ended_at: string;
}

export interface LeaderboardResponse {
  timeframe: string;
  duration_seconds: number;
  total: number;
  limit: number;
  offset: number;
  entries: LeaderboardEntry[];
}

export const Leaderboards: React.FC = () => {
  const [tab, setTab] = useState<'global' | 'daily' | 'weekly'>('global');
  const [durationMode, setDurationMode] = useState<60 | 15>(60);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchLeaderboard = async (selectedTab: 'global' | 'daily' | 'weekly', selectedDuration: 60 | 15, isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
    try {
      const endpoint = selectedTab === 'global' ? '/leaderboard' : `/leaderboard/${selectedTab}`;
      const res = await api.get<LeaderboardResponse>(endpoint, {
        params: { duration_seconds: selectedDuration },
      });
      setLeaderboardData(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch leaderboard data', err);
      if (!isSilent) setError('Could not load leaderboard entries.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(tab, durationMode);
  }, [tab, durationMode]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLeaderboard(tab, durationMode, true);
    }, 10000);
    return () => clearInterval(interval);
  }, [tab, durationMode, autoRefresh]);

  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 py-4 sm:py-10 space-y-4 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-3xl font-bold text-white flex items-center gap-2 drop-shadow-sm">
            <Trophy className="w-5 h-5 sm:w-7 sm:h-7 text-amber-300 shrink-0" />
            <span>Leaderboards</span>
          </h1>
          <p className="text-xs sm:text-sm text-white/80">Top ranking players across Global, Daily, and Weekly timeframes.</p>
        </div>

        {/* Live Auto-Refresh Controls */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-2.5 pt-1 sm:pt-0">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold border transition-all ${
              autoRefresh
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                : 'bg-white/10 text-white/60 border-white/20'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-pulse text-emerald-300' : ''}`} />
            <span>{autoRefresh ? 'Live Auto-Refresh ON' : 'Auto-Refresh Off'}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[10px] sm:text-xs text-white/70">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <button
              onClick={() => fetchLeaderboard(tab, durationMode)}
              className="p-1.5 sm:p-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
              title="Refresh Leaderboard Now"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mode Selector & Timeframe Tabs */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        {/* Game Mode Filter (60s vs 15s) */}
        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 p-1 rounded-2xl bg-white/10 border border-white/20">
          <button
            onClick={() => setDurationMode(60)}
            className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              durationMode === 60
                ? 'bg-white text-[#0f2112] shadow-md'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>60s Classic</span>
          </button>
          <button
            onClick={() => setDurationMode(15)}
            className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              durationMode === 15
                ? 'bg-white text-[#0f2112] shadow-md'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
            <span>15s Blitz</span>
          </button>
        </div>

        {/* Timeframe Tabs */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 rounded-2xl bg-white/10 border border-white/20">
          <button
            onClick={() => setTab('global')}
            className={`flex items-center justify-center gap-1 px-2.5 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'global'
                ? 'bg-white text-[#0f2112] shadow-md'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Global</span>
          </button>

          <button
            onClick={() => setTab('daily')}
            className={`flex items-center justify-center gap-1 px-2.5 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'daily'
                ? 'bg-white text-[#0f2112] shadow-md'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Daily</span>
          </button>

          <button
            onClick={() => setTab('weekly')}
            className={`flex items-center justify-center gap-1 px-2.5 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'weekly'
                ? 'bg-white text-[#0f2112] shadow-md'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Weekly</span>
          </button>
        </div>
      </div>

      {/* Leaderboard Table Container */}
      <div className="rounded-2xl sm:rounded-3xl bg-[#0f2413]/40 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 sm:p-12 text-center text-sm text-white/70">Loading {durationMode}s ranking data...</div>
        ) : error ? (
          <div className="p-8 sm:p-12 text-center text-sm text-red-300">{error}</div>
        ) : leaderboardData?.entries.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-sm text-white/70">No completed {durationMode}s games in this timeframe yet. Be the first to play!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/20 bg-white/10 text-[11px] sm:text-xs font-semibold text-white/90 uppercase tracking-wider">
                  <th className="py-3 px-3 sm:py-4 sm:px-6 w-14 sm:w-20">Rank</th>
                  <th className="py-3 px-3 sm:py-4 sm:px-6">Player</th>
                  <th className="py-3 px-2 sm:py-4 sm:px-6 text-center">Mode</th>
                  <th className="py-3 px-3 sm:py-4 sm:px-6 text-right">Score</th>
                  <th className="py-3 px-3 sm:py-4 sm:px-6 text-right">Clicks</th>
                  <th className="py-3 px-4 sm:py-4 sm:px-6 text-right hidden md:table-cell">Completed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-xs sm:text-sm">
                {leaderboardData?.entries.map((entry) => (
                  <tr key={entry.rank} className="hover:bg-white/10 transition-colors">
                    <td className="py-3 px-3 sm:py-4 sm:px-6 font-bold text-white">
                      {entry.rank === 1 && <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px]">#1</span>}
                      {entry.rank === 2 && <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-slate-200/20 text-slate-200 border border-slate-300/40 text-[11px]">#2</span>}
                      {entry.rank === 3 && <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-amber-700/20 text-amber-200 border border-amber-600/40 text-[11px]">#3</span>}
                      {entry.rank > 3 && `#${entry.rank}`}
                    </td>
                    <td className="py-3 px-3 sm:py-4 sm:px-6 font-semibold text-white truncate max-w-[100px] sm:max-w-none">
                      {entry.user_name}
                    </td>
                    <td className="py-3 px-2 sm:py-4 sm:px-6 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-white/15 text-white text-[10px] sm:text-xs font-bold border border-white/20">
                        {entry.duration_seconds || 60}s
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:py-4 sm:px-6 font-bold text-amber-300 text-right text-xs sm:text-base">
                      {entry.score}
                    </td>
                    <td className="py-3 px-3 sm:py-4 sm:px-6 text-white/80 text-right">
                      {entry.click_count}
                    </td>
                    <td className="py-3 px-4 sm:py-4 sm:px-6 text-xs text-white/60 text-right hidden md:table-cell">
                      {new Date(entry.ended_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
