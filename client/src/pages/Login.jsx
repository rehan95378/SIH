import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      const redirectMap = { ADMIN: '/admin/dashboard', MANAGER: '/manager/dashboard', ENGINEER: '/engineer/dashboard' };
      navigate(redirectMap[user.role] || '/engineer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const creds = {
      ENGINEER: ['engineer@ertmac.demo', 'Demo@2024'],
      MANAGER: ['manager@ertmac.demo', 'Demo@2024'],
      ADMIN: ['admin@ertmac.demo', 'Demo@2024'],
    };
    const [e, p] = creds[role];
    setEmail(e); setPassword(p);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg">
            <svg viewBox="0 0 32 32" className="w-8 h-8 text-white fill-current">
              <circle cx="16" cy="8" r="5" />
              <path d="M14 13 L14 28 L18 28 L18 13 Z" />
              <path d="M10 18 L22 18" strokeWidth="2" stroke="white" fill="none" />
              <path d="M10 22 L22 22" strokeWidth="2" stroke="white" fill="none" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">eRTMAC-NWIS</h1>
          <p className="text-blue-200 text-sm">Nearby Wells Intelligence System</p>
          <p className="text-slate-400 text-xs mt-1">Oil India Limited · Decision Support Platform</p>
        </div>

        {/* Login form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 text-center mb-1">
              Select Demo Account to Fill Form
            </p>
            <p className="text-[11px] text-slate-400 text-center mb-3">
              (Fills email & password above — then click Sign In)
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { role: 'ENGINEER', email: 'engineer@ertmac.demo' },
                { role: 'MANAGER', email: 'manager@ertmac.demo' },
                { role: 'ADMIN', email: 'admin@ertmac.demo' },
              ].map(({ role, email: roleEmail }) => {
                const isSelected = email === roleEmail;
                return (
                  <button
                    type="button"
                    key={role}
                    onClick={() => fillDemo(role)}
                    className={`py-2 text-xs border-2 rounded-lg transition-all font-semibold ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {isSelected ? `✓ ${role}` : role}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 text-center mt-2.5">Password: Demo@2024</p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          "Turning Historical Drilling Experience into Proactive Intelligence"
        </p>
      </div>
    </div>
  );
};

export default Login;
