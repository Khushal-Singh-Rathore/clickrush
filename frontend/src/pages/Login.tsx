import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post<{ access_token: string }>('/auth/login', {
        email,
        password,
      });
      await login(res.data.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md p-8 rounded-3xl bg-[#0f2413]/40 backdrop-blur-xl border border-white/20 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
          <p className="text-xs text-white/70">Sign in to start your click challenge</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/20 border border-red-400/40 flex items-center gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-white/90">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/50 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input focus:border-white focus:outline-none text-sm text-white placeholder-white/40"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-white/90">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-white/50 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input focus:border-white focus:outline-none text-sm text-white placeholder-white/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl glass-btn-primary font-bold text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-white/70 pt-2">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-white hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
