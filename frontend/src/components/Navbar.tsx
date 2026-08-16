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
    <header className="sticky top-0 z-50 px-2.5 sm:px-6 py-2.5 sm:py-4">
      <div className="max-w-6xl mx-auto h-12 sm:h-14 px-3 sm:px-6 rounded-2xl bg-[#0d1c10]/40 backdrop-blur-xl border border-white/20 shadow-lg flex items-center justify-between gap-2 overflow-hidden">
        {/* Brand Logo */}
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 group shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-white" />
          </div>
          <span className="font-heading font-bold text-sm sm:text-lg tracking-tight text-white">
            ClickRush
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1.5 sm:gap-5 shrink-0">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="flex items-center gap-1 p-1.5 sm:p-0 text-xs font-semibold text-white/80 hover:text-white transition-colors"
                title="Dashboard"
              >
                <LayoutDashboard className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden md:inline">Dashboard</span>
              </Link>
              <Link
                to="/leaderboards"
                className="flex items-center gap-1 p-1.5 sm:p-0 text-xs font-semibold text-white/80 hover:text-white transition-colors"
                title="Leaderboards"
              >
                <Trophy className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden md:inline">Leaderboards</span>
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-1 p-1.5 sm:p-0 text-xs font-semibold text-white/80 hover:text-white transition-colors"
                title="Profile"
              >
                <UserIcon className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden md:inline">Profile</span>
              </Link>

              <div className="h-4 w-px bg-white/20 mx-0.5" />

              <div className="flex items-center gap-1.5 sm:gap-3">
                <span className="hidden lg:inline-block text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-white border border-white/20 max-w-[120px] truncate">
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
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                to="/login"
                className="text-xs font-semibold text-white/80 hover:text-white px-1.5 py-1 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-bold text-[#0f2112] bg-white hover:bg-white/90 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all shadow-md shrink-0"
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
