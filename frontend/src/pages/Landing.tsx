import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Timer, Trophy, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Landing: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col justify-between px-6 py-8 max-w-5xl mx-auto">
      {/* Hero Glass Container */}
      <main className="my-auto text-center space-y-8 p-10 md:p-16 rounded-3xl bg-[#0f2413]/35 backdrop-blur-xl border border-white/20 shadow-2xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 text-xs font-bold text-white shadow-sm">
          <Zap className="w-3.5 h-3.5 text-amber-300 fill-current" />
          <span>Real-Time Server Authoritative Challenge</span>
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white max-w-3xl mx-auto leading-tight drop-shadow-md">
          How fast can you <span className="text-amber-300 underline decoration-amber-300/40 underline-offset-8">click?</span>
        </h1>

        <p className="text-base text-white/80 max-w-xl mx-auto leading-relaxed">
          Test your speed, compete on real-time global leaderboards, and push your limits with low-latency WebSocket gameplay.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to={user ? "/dashboard" : "/register"}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl glass-btn-primary font-bold text-sm shadow-xl group"
          >
            <span>{user ? "Go to Dashboard" : "Start Playing Now"}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>

        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left">
          <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/20">
              <Timer className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-lg text-white">Precise Timers</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Authoritative server clock ensures timing accuracy across 15s Blitz and 60s Endurance modes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-amber-300 border border-white/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <h3 className="font-heading font-bold text-lg text-white">WebSocket Speed</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Ultra low-latency socket connection streaming every click in real-time.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white border border-white/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-lg text-white">Live Rankings</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Compete globally with mode-specific daily, weekly, and all-time rankings.
            </p>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-white/60 pt-6">
        © 2026 ClickRush. Glassmorphism Real-Time Challenge.
      </footer>
    </div>
  );
};
