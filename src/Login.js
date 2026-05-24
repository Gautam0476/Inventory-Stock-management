import React, { useState } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Warehouse,
} from 'lucide-react';
import { loginUser, signupUser, startSession } from './api';
import PortfolioParticles from './PortfolioParticles';
import ThemeToggle from './ThemeToggle';

export default function Login({ mode = 'login', setPage, theme, toggleTheme }) {
  const isSignup = mode === 'signup';
  const [name, setName] = useState('');
  const [email, setEmail] = useState(isSignup ? '' : 'Example@gmail.com');
  const [password, setPassword] = useState(isSignup ? '' : 'admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignup) {
        if (!name.trim()) {
          setError('Please enter your full name.');
          setIsLoading(false);
          return;
        }

        const session = await signupUser({ name: name.trim(), email: email.trim(), password });
        startSession(session);
        setPage('dashboard');
        return;
      }

      const session = await loginUser({ email: email.trim(), password });
      startSession(session);
      setPage('dashboard');
    } catch (apiError) {
      setError(apiError.message || 'Unable to connect to backend.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-particles-shell relative flex min-h-screen min-h-[100svh] overflow-hidden px-3 py-4 text-slate-900 dark:text-slate-100 sm:px-4 sm:py-6 lg:py-8">
      <div className="auth-particles-bg absolute inset-0" />
      <div className="auth-particles-layer absolute inset-0 z-0">
        <PortfolioParticles />
      </div>
      <div className="auth-particles-overlay absolute inset-0 z-[1]" />

      <div className="absolute right-3 top-3 z-20 sm:right-5 sm:top-5">
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>

      <div className="relative z-10 m-auto w-full max-w-[34rem] overflow-hidden rounded-[1.6rem] border border-white/12 bg-white/95 shadow-2xl shadow-black/35 backdrop-blur-md dark:bg-slate-900/92 sm:rounded-[2rem]">
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="mb-7 flex min-w-0 items-center gap-3 sm:mb-8">
            <span className="shrink-0 rounded-2xl bg-indigo-600 p-3 text-white">
              <Warehouse className="h-5 w-5 sm:h-6 sm:w-6" />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight dark:text-white sm:text-2xl">Inventory-&-Stock-management</h1>
              <p className="max-w-[14rem] text-sm leading-5 text-slate-500 dark:text-slate-400 sm:max-w-none">{isSignup ? 'Create your inventory account' : 'Welcome back to inventory control'}</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {isSignup && (
              <label className="block">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Full name</span>
                <span className="relative mt-2 block">
                  <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-medium outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900 sm:text-base"
                    placeholder="Your name"
                  />
                </span>
              </label>
            )}

            <label className="block">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Email</span>
              <span className="relative mt-2 block">
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-medium outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900 sm:text-base"
                  placeholder="Example@gmail.com"
                />
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Password</span>
              <span className="relative mt-2 block">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-12 text-sm font-medium outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900 sm:text-base"
                  placeholder="Password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-800 dark:hover:text-white">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
            >
              {isLoading ? 'Please wait...' : isSignup ? 'Create Account' : 'Login'}
              {!isLoading && <ArrowRight className="h-5 w-5" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
            {isSignup ? 'Already have an account?' : 'New to Inventory-&-Stock-management?'}{' '}
            <button onClick={() => setPage(isSignup ? 'login' : 'signup')} className="font-bold text-indigo-600 hover:text-indigo-700">
              {isSignup ? 'Login' : 'Create account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
