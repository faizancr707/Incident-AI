"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    
    try {
      const ok = await login(email, password);
      if (ok) {
        router.push('/dashboard');
      } else {
        setError('Invalid credentials. Please verify your email and password.');
      }
    } catch {
      setError('Unable to reach authentication service. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-graphite-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-lime-500/10 p-3 rounded-xl border border-lime-500/20">
            <ShieldAlert className="w-10 h-10 text-lime-400" />
          </div>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Incident.AI</h2>
        <p className="mt-2 text-sm text-graphite-400">
          Sign in to the AI Production Incident Investigator
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-porcelain-50 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-porcelain-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-graphite-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-porcelain-300 px-3 py-2 placeholder-graphite-400 shadow-sm focus:border-lime-500 focus:outline-none focus:ring-lime-500 sm:text-sm bg-white text-graphite-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-graphite-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-porcelain-300 px-3 py-2 placeholder-graphite-400 shadow-sm focus:border-lime-500 focus:outline-none focus:ring-lime-500 sm:text-sm bg-white text-graphite-900"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full justify-center rounded-lg border border-transparent bg-lime-500 py-2.5 px-4 text-sm font-semibold text-graphite-950 shadow-sm hover:bg-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 transition-colors gap-2 items-center disabled:opacity-60"
              >
                <LogIn className="w-4 h-4" />
                {submitting ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-graphite-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-lime-600 hover:text-lime-500 font-semibold underline">
              Create an account
            </Link>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-porcelain-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-porcelain-50 px-2 text-graphite-500 text-xs">Quick Fill Credentials</span>
              </div>
            </div>

            <div className="mt-4 bg-white border border-porcelain-200 rounded-lg p-3 text-xs">
              <ul className="space-y-2 text-graphite-600">
                <li
                  onClick={() => { setEmail('admin@incident.ai'); setPassword('admin123'); }}
                  className="flex justify-between items-center p-1.5 hover:bg-porcelain-50 rounded cursor-pointer transition"
                >
                  <span><strong className="text-graphite-900">Owner:</strong> admin@incident.ai</span>
                  <code className="text-[11px] bg-porcelain-100 px-1.5 py-0.5 rounded text-graphite-700">admin123</code>
                </li>
                <li
                  onClick={() => { setEmail('engineer@incident.ai'); setPassword('eng123'); }}
                  className="flex justify-between items-center p-1.5 hover:bg-porcelain-50 rounded cursor-pointer transition"
                >
                  <span><strong className="text-graphite-900">Engineer:</strong> engineer@incident.ai</span>
                  <code className="text-[11px] bg-porcelain-100 px-1.5 py-0.5 rounded text-graphite-700">eng123</code>
                </li>
                <li
                  onClick={() => { setEmail('viewer@incident.ai'); setPassword('view123'); }}
                  className="flex justify-between items-center p-1.5 hover:bg-porcelain-50 rounded cursor-pointer transition"
                >
                  <span><strong className="text-graphite-900">Viewer:</strong> viewer@incident.ai</span>
                  <code className="text-[11px] bg-porcelain-100 px-1.5 py-0.5 rounded text-graphite-700">view123</code>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
