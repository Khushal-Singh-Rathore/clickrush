import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth, type UserProfile } from '../context/AuthContext';
import { Play, Trophy, Flame, Target, Award, ArrowRight, Zap, Timer } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(user);
  const [startingGame, setStartingGame] = useState(false);
  const [gameMode, setGameMode] = useState<'60s' | '15s'>('60s');

  const navigate = useNavigate();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const durationSeconds = gameMode === '15s' ? 15 : 60;
        const res = await api.get<UserProfile>('/users/me', {
          params: { duration_seconds: durationSeconds },
        });
        setProfile(res.data);
      } catch (err) {
        console.error('Failed to load profile stats', err);
      }
    };
    loadProfile();
  }, [gameMode]);

  const handleStartGame = async () => {
    setStartingGame(true);
    try {
      const durationSeconds = gameMode === '15s' ? 15 : 60;
      const res = await api.post<{ id: string }>('/games/start', {
        duration_seconds: durationSeconds,
      });
      navigate(`/game/${res.data.id}`);
    } catch (err) {
      console.error('Failed to start game session', err);
      alert('Could not start a new game session. Please try again.');
    } finally {
      setStartingGame(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      {/* Header Glass Banner */}
      <div className="p-8 rounded-3xl bg-[#0f2413]/40 backdrop-blur-xl border border-white/20 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white drop-shadow-sm">
            Welcome back, <span className="text-amber-300">{profile?.name || user?.name}</span>
          </h1>
          <p className="text-sm text-white/80">
            Choose your game mode and launch your click challenge.
          </p>

          {/* Game Mode Selector */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setGameMode('60s')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                gameMode === '60s'
                  ? 'bg-white text-[#0f2112] border-white shadow-md'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              60s Classic Endurance
            </button>

            <button
              onClick={() => setGameMode('15s')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                gameMode === '15s'
                  ? 'bg-white text-[#0f2112] border-white shadow-md'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
              15s Speed Blitz ⚡
            </button>
          </div>
        </div>

        <button
          onClick={handleStartGame}
          disabled={startingGame}
          className="w-full md:w-auto px-8 py-4 rounded-2xl glass-btn-primary text-base font-bold transition-all shadow-xl flex items-center justify-center gap-3 shrink-0 disabled:opacity-50 group"
        >
          <Play className="w-5 h-5 fill-current transition-transform group-hover:scale-110" />
          <span>{startingGame ? 'Initializing...' : `Start ${gameMode === '60s' ? '60s' : '15s'} Challenge`}</span>
        </button>
      </div>

      {/* Stats Grid for Selected Mode */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/70">Best Score ({gameMode})</span>
            <Trophy className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-white">{profile?.best_score ?? 0}</p>
          <p className="text-xs text-white/70">Personal Best ({gameMode})</p>
        </div>

        <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/70">Global Rank ({gameMode})</span>
            <Award className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-white">
            {profile?.global_rank ? `#${profile.global_rank}` : 'Unranked'}
          </p>
          <p className="text-xs text-white/70">On {gameMode} Leaderboard</p>
        </div>

        <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/70">Total Games ({gameMode})</span>
            <Target className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-white">{profile?.total_games ?? 0}</p>
          <p className="text-xs text-white/70">Sessions Played ({gameMode})</p>
        </div>

        <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/70">Avg Score ({gameMode})</span>
            <Flame className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-white">{profile?.average_score ?? 0.0}</p>
          <p className="text-xs text-white/70">Clicks per game ({gameMode})</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div
          onClick={() => navigate('/leaderboards')}
          className="p-6 rounded-2xl bg-[#0f2413]/30 backdrop-blur-md border border-white/20 hover:border-white/40 shadow-lg cursor-pointer transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-lg text-white">View Leaderboards</h3>
            <p className="text-xs text-white/70">Check top players across Global, Daily, and Weekly rankings.</p>
          </div>
          <ArrowRight className="w-5 h-5 text-white/80 transition-transform group-hover:translate-x-1" />
        </div>

        <div
          onClick={() => navigate('/profile')}
          className="p-6 rounded-2xl bg-[#0f2413]/30 backdrop-blur-md border border-white/20 hover:border-white/40 shadow-lg cursor-pointer transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-lg text-white">My Game History</h3>
            <p className="text-xs text-white/70">Review past completed and abandoned game sessions.</p>
          </div>
          <ArrowRight className="w-5 h-5 text-white/80 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );
};
