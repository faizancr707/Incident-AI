"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import { useAuth } from "@/components/auth/auth-context";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, mounted, router]);

  // Close sidebar on route change on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-graphite-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-graphite-950 text-porcelain-50 font-sans selection:bg-lime-500/30 selection:text-lime-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-graphite-950/80 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="lg:pl-60 flex flex-col min-h-screen transition-all duration-300">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 w-full bg-porcelain-50 text-graphite-900 rounded-tl-none lg:rounded-tl-2xl border-t border-l border-porcelain-200 overflow-hidden relative shadow-2xl">
          {children}
        </main>
      </div>
    </div>
  );
}
