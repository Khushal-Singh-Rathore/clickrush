import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGameWebSocket } from '../hooks/useGameWebSocket';
import { api } from '../services/api';
import { Timer, Zap, Trophy, RefreshCw, AlertTriangle, ArrowLeft } from 'lucide-react';

export const Game: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [isClicking, setIsClicking] = useState(false);
  const [restCompletedSession, setRestCompletedSession] = useState<any>(null);

  const {
    gameState,
    clickCount,
    secondsRemaining,
    errorMessage,
    finalResult,
    sendClick,
    finishGame,
  } = useGameWebSocket(gameId || null, token);

  useEffect(() => {
    if ((gameState === 'DISCONNECTED' || gameState === 'ERROR') && gameId) {
      api.get(`/games/${gameId}`)
        .then((res) => {
          if (res.data && res.data.status === 'COMPLETED') {
            setRestCompletedSession(res.data);
          }
        })
        .catch(() => {});
    }
  }, [gameState, gameId]);

  const isGameCompleted = gameState === 'COMPLETED' || Boolean(restCompletedSession);
  const displayedResult = finalResult || restCompletedSession;

  const handleButtonClick = () => {
    if (gameState === 'ACTIVE') {
      sendClick();
      setIsClicking(true);
      setTimeout(() => setIsClicking(false), 80);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
      <div className="w-full max-w-2xl p-6 sm:p-10 md:p-12 rounded-2xl sm:rounded-3xl bg-[#0f2413]/40 backdrop-blur-xl border border-white/20 shadow-2xl text-center space-y-6 sm:space-y-8 relative">

        {/* Back Link */}
        <div className="text-left">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
        </div>

        {/* Active Game State */}
        {gameState === 'ACTIVE' && !isGameCompleted && (
          <div className="space-y-6 sm:space-y-8">
            {/* Top HUD bar */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
              <div className="flex items-center gap-1.5 sm:gap-2 text-white">
                <Timer className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse text-amber-300" />
                <span className="font-heading text-white font-bold text-xl sm:text-2xl">
                  {secondsRemaining.toFixed(1)}s
                </span>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 text-white">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-amber-300" />
                <span className="font-heading text-white font-bold text-xl sm:text-2xl">
                  {clickCount} <span className="text-xs font-normal text-white/70">clicks</span>
                </span>
              </div>
            </div>

            {/* Main Interactive Click Area */}
            <div className="py-4 sm:py-6 flex flex-col items-center justify-center space-y-4 sm:space-y-6">
              <button
                onClick={handleButtonClick}
                className={`w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-gradient-to-b from-white/90 to-white/60 text-[#0f2112] shadow-2xl hover:scale-105 transition-all duration-75 flex flex-col items-center justify-center gap-2 cursor-pointer select-none active:scale-95 border-4 border-white/40 ${
                  isClicking ? 'scale-95 ring-8 ring-white/30' : 'scale-100'
                }`}
              >
                <Zap className={`w-10 h-10 sm:w-12 sm:h-12 fill-current transition-transform ${isClicking ? 'scale-125' : 'scale-100'}`} />
                <span className="font-heading font-bold text-xl sm:text-2xl tracking-wider">CLICK!</span>
              </button>

              <p className="text-[11px] sm:text-xs text-white/80 tracking-wide uppercase font-semibold">
                Tap as fast as you can!
              </p>
            </div>

            <button
              onClick={finishGame}
              className="text-xs font-medium text-white/70 hover:text-white underline underline-offset-4"
            >
              Finish Challenge Early
            </button>
          </div>
        )}

        {/* Connecting State */}
        {gameState === 'CONNECTING' && !isGameCompleted && (
          <div className="py-12 sm:py-16 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center mx-auto animate-spin border border-white/20">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-lg sm:text-xl font-bold text-white">Connecting to Server...</h3>
            <p className="text-xs text-white/70">Establishing low-latency WebSocket connection</p>
          </div>
        )}

        {/* Completed State / Results */}
        {isGameCompleted && (
          <div className="py-4 sm:py-6 space-y-6 animate-fade-in">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 text-amber-300 flex items-center justify-center mx-auto border border-white/30 shadow-inner">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Game Completed!</h2>
              <p className="text-xs sm:text-sm text-white/80">Your score has been verified and saved to the server.</p>
            </div>

            {/* Summary Score Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="space-y-1">
                <span className="text-[10px] sm:text-xs uppercase font-semibold text-white/70">Total Clicks</span>
                <p className="text-2xl sm:text-3xl font-bold text-white">{displayedResult?.click_count ?? clickCount}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] sm:text-xs uppercase font-semibold text-white/70">Final Score</span>
                <p className="text-2xl sm:text-3xl font-bold text-amber-300">{displayedResult?.score ?? clickCount}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl glass-btn-primary font-bold text-sm shadow-lg transition-all"
              >
                Play Another Game
              </button>
              <Link
                to="/leaderboards"
                className="w-full sm:w-auto px-6 py-3 rounded-xl glass-btn-secondary font-bold text-sm shadow-md transition-all"
              >
                View Leaderboard
              </Link>
            </div>
          </div>
        )}

        {/* Error / Disconnected State */}
        {!isGameCompleted && (gameState === 'ERROR' || gameState === 'DISCONNECTED') && (
          <div className="py-10 sm:py-12 space-y-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center mx-auto border border-red-400/40">
              <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {gameState === 'DISCONNECTED' ? 'Session Disconnected' : 'Connection Failed'}
              </h3>
              <p className="text-xs text-white/70">
                {errorMessage || 'The WebSocket session was disconnected before completing.'}
              </p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 rounded-xl glass-btn-primary text-sm font-semibold transition-all"
            >
              Return to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
