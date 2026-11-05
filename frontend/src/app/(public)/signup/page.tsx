"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, UserPlus } from 'lucide-react';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In this demo, we do not have a real backend registration yet, 
    // so we'll just redirect the user to login to use the demo accounts.
    setMessage('Demo mode: Registration is simulated. Please log in using the demo accounts.');
    setTimeout(() => {
      router.push('/login');
    }, 2000);
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
          Create your account to start investigating
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-porcelain-50 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-porcelain-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {message && (
              <div className="p-3 bg-signal-50 border border-signal-200 text-signal-700 rounded-lg text-sm">
                {message}
              </div>
            )}
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-graphite-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full appearance-none rounded-lg border border-porcelain-300 px-3 py-2 placeholder-graphite-400 shadow-sm focus:border-lime-500 focus:outline-none focus:ring-lime-500 sm:text-sm bg-white text-graphite-900"
                />
              </div>
            </div>

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
                  autoComplete="new-password"
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
                <UserPlus className="w-4 h-4" />
                Sign Up
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-graphite-500">Already have an account? </span>
            <Link href="/login" className="font-medium text-signal-600 hover:text-signal-500 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
