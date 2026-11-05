"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, AlertTriangle, Search, Server, FileText, Settings,
  Zap, LogOut, GitBranch, Plug2
} from "lucide-react";
import { useAuth } from "@/components/auth/auth-context";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Incidents", href: "/incidents", icon: AlertTriangle, badge: 3 },
  { label: "Investigations", href: "/investigations", icon: Search },
  { label: "Services", href: "/services", icon: Server },
  { label: "Workflows", href: "/workflows", icon: GitBranch },
  { label: "Integrations", href: "/integrations", icon: Plug2 },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-graphite-950 text-porcelain-300 transition-transform duration-300 w-60 border-r border-graphite-800",
        !isOpen && "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-graphite-800 shrink-0 bg-graphite-950/50">
        <div className="w-8 h-8 rounded-lg bg-lime-500/20 border border-lime-500/30 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4.5 h-4.5 text-lime-400" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-porcelain-50 tracking-tight truncate">Incident AI</span>
          <span className="text-[10px] text-graphite-400 truncate">Production Investigator</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative",
                isActive
                  ? "bg-lime-500/10 text-lime-400"
                  : "text-graphite-400 hover:text-porcelain-100 hover:bg-graphite-900"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors",
                  isActive ? "text-lime-400" : "text-graphite-500 group-hover:text-porcelain-300"
                )}
              />
              <span className="truncate">{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-[10px] bg-champagne-500/20 text-champagne-400 px-1.5 py-0.5 rounded-full font-semibold border border-champagne-500/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-graphite-800 bg-graphite-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-graphite-800 border border-graphite-700 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-porcelain-300">
                {user?.name?.substring(0, 2).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-porcelain-200 truncate">{user?.name}</span>
              <span className={cn(
                "text-[10px] uppercase font-bold w-fit px-1.5 rounded",
                user?.role === 'owner' ? 'bg-iris-500/20 text-iris-400' :
                user?.role === 'admin' ? 'bg-champagne-500/20 text-champagne-400' :
                user?.role === 'engineer' ? 'bg-signal-500/20 text-signal-400' :
                'bg-graphite-800 text-graphite-400'
              )}>
                {user?.role}
              </span>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="p-1.5 text-graphite-500 hover:text-porcelain-300 hover:bg-graphite-800 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
