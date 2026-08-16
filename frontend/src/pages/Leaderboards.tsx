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
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 drop-shadow-sm">
            <Trophy className="w-7 h-7 text-amber-300" />
            <span>Leaderboards</span>
          </h1>
          <p className="text-sm text-white/80">Top ranking players across Global, Daily, and Weekly timeframes.</p>
        </div>

        {/* Live Auto-Refresh Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              autoRefresh
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                : 'bg-white/10 text-white/60 border-white/20'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-pulse text-emerald-300' : ''}`} />
            <span>{autoRefresh ? 'Live Auto-Refresh ON' : 'Auto-Refresh Off'}</span>
          </button>

          <button
            onClick={() => fetchLeaderboard(tab, durationMode)}
            className="p-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
            title="Refresh Leaderboard Now"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mode Selector & Timeframe Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Game Mode Filter (60s vs 15s) */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/10 border border-white/20">
          <button
            onClick={() => setDurationMode(60)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              durationMode === 60
                ? 'bg-white text-[#0f2112] shadow-md'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            60s Classic
          </button>
          <button
            onClick={() => setDurationMode(15)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              durationMode === 15
                ? 'bg-white text-[#0f2112] shadow-md'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
            15s Speed Blitz
          </button>
        </div>

        {/* Timeframe Tabs */}
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <span className="text-xs text-white/70">
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>

          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/10 border border-white/20">
            <button
              onClick={() => setTab('global')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                tab === 'global'
                  ? 'bg-white text-[#0f2112] shadow-md'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              Global
            </button>

            <button
              onClick={() => setTab('daily')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                tab === 'daily'
                  ? 'bg-white text-[#0f2112] shadow-md'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Daily
            </button>

            <button
              onClick={() => setTab('weekly')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                tab === 'weekly'
                  ? 'bg-white text-[#0f2112] shadow-md'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Weekly
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard Table Container */}
      <div className="rounded-3xl bg-[#0f2413]/40 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-white/70">Loading {durationMode}s ranking data...</div>
        ) : error ? (
          <div className="p-12 text-center text-sm text-red-300">{error}</div>
        ) : leaderboardData?.entries.length === 0 ? (
          <div className="p-12 text-center text-sm text-white/70">No completed {durationMode}s games in this timeframe yet. Be the first to play!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/20 bg-white/10 text-xs font-semibold text-white/90 uppercase tracking-wider">
                  <th className="py-4 px-6 w-20">Rank</th>
                  <th className="py-4 px-6">Player</th>
                  <th className="py-4 px-6 text-center">Mode</th>
                  <th className="py-4 px-6 text-right">Score</th>
                  <th className="py-4 px-6 text-right">Clicks</th>
                  <th className="py-4 px-6 text-right">Completed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-sm">
                {leaderboardData?.entries.map((entry) => (
                  <tr key={entry.rank} className="hover:bg-white/10 transition-colors">
                    <td className="py-4 px-6 font-bold text-white">
                      {entry.rank === 1 && <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs">#1</span>}
                      {entry.rank === 2 && <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-slate-200/20 text-slate-200 border border-slate-300/40 text-xs">#2</span>}
                      {entry.rank === 3 && <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-amber-700/20 text-amber-200 border border-amber-600/40 text-xs">#3</span>}
                      {entry.rank > 3 && `#${entry.rank}`}
                    </td>
                    <td className="py-4 px-6 font-semibold text-white">
                      {entry.user_name}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-white/15 text-white text-xs font-bold border border-white/20">
                        {entry.duration_seconds || 60}s
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-amber-300 text-right text-base">
                      {entry.score}
                    </td>
                    <td className="py-4 px-6 text-white/80 text-right">
                      {entry.click_count}
                    </td>
                    <td className="py-4 px-6 text-xs text-white/60 text-right">
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
