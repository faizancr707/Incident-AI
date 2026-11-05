"use client";

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/auth-context';
import { useRouter } from 'next/navigation';
import { ShieldAlert, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (login(email, password)) {
      router.push('/dashboard');
    } else {
      setError('Invalid credentials. Please use a demo account.');
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
                className="flex w-full justify-center rounded-lg border border-transparent bg-lime-500 py-2.5 px-4 text-sm font-semibold text-graphite-950 shadow-sm hover:bg-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 transition-colors gap-2 items-center"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-porcelain-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-porcelain-50 px-2 text-graphite-500">Demo Credentials</span>
              </div>
            </div>

            <div className="mt-6 bg-white border border-porcelain-200 rounded-lg p-4 text-sm">
              <ul className="space-y-3 text-graphite-600">
                <li className="flex justify-between items-center">
                  <span><strong className="text-graphite-900">Owner:</strong> admin@incident.ai</span>
                  <code className="text-xs bg-porcelain-100 px-1.5 py-0.5 rounded">admin123</code>
                </li>
                <li className="flex justify-between items-center">
                  <span><strong className="text-graphite-900">Eng:</strong> engineer@incident.ai</span>
                  <code className="text-xs bg-porcelain-100 px-1.5 py-0.5 rounded">eng123</code>
                </li>
                <li className="flex justify-between items-center">
                  <span><strong className="text-graphite-900">View:</strong> viewer@incident.ai</span>
                  <code className="text-xs bg-porcelain-100 px-1.5 py-0.5 rounded">view123</code>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
