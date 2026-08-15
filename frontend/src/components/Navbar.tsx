import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Trophy, User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 px-6 py-4">
      <div className="max-w-6xl mx-auto h-14 px-6 rounded-2xl bg-[#0d1c10]/40 backdrop-blur-xl border border-white/20 shadow-lg flex items-center justify-between">
        {/* Brand Logo */}
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Zap className="w-4 h-4 fill-current text-white" />
          </div>
          <span className="font-heading font-bold text-lg tracking-tight text-white">
            ClickRush
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-6">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </Link>
              <Link
                to="/leaderboards"
                className="flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white transition-colors"
              >
                <Trophy className="w-3.5 h-3.5" />
                Leaderboards
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-1.5 text-xs font-semibold text-white/80 hover:text-white transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5" />
                Profile
              </Link>

              <div className="h-4 w-px bg-white/20" />

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-white border border-white/20">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-xs font-semibold text-white/80 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-bold text-[#0f2112] bg-white hover:bg-white/90 px-4 py-2 rounded-xl transition-all shadow-md"
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
