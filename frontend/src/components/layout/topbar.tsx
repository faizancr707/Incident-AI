"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Search, Bell, Clock, ChevronDown, Monitor, Wifi,
  Bot, X, Menu,
} from "lucide-react";

const timeRanges = ["15m", "1h", "3h", "6h", "12h", "24h", "7d", "30d"];

export function TopBar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState("1h");

  return (
    <header className="sticky top-0 z-30 h-12 bg-white/80 backdrop-blur-md border-b border-porcelain-400/60 flex items-center px-5 gap-3">
      <button 
        onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}
        className="lg:hidden p-1.5 hover:bg-porcelain-200 rounded-md"
      >
        <Menu className="w-4 h-4 text-porcelain-700" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-lg">
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md border border-porcelain-400 bg-porcelain-100/50 hover:bg-porcelain-200/50 transition-colors group"
        >
          <Search className="w-3.5 h-3.5 text-porcelain-600" />
          <span className="text-[13px] text-porcelain-600">Search incidents, services, logs…</span>
          <span className="ml-auto text-2xs text-porcelain-500 border border-porcelain-400 rounded px-1.5 py-0.5 font-mono">⌘K</span>
        </button>
      </div>

      {/* Time Range */}
      <div className="flex items-center gap-0.5 bg-porcelain-200/60 rounded-md p-0.5">
        <Clock className="w-3.5 h-3.5 text-porcelain-600 mx-1.5" />
        {timeRanges.slice(0, 6).map((range) => (
          <button
            key={range}
            onClick={() => setSelectedRange(range)}
            className={cn(
              "px-2 py-1 text-2xs font-medium rounded transition-colors",
              selectedRange === range
                ? "bg-white text-graphite-700 shadow-subtle"
                : "text-porcelain-700 hover:text-graphite-700"
            )}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-porcelain-400" />

      {/* System Status */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-lime-50/60 border border-lime-200/40">
        <span className="status-dot-healthy" />
        <span className="text-2xs font-medium text-lime-800">Systems Operational</span>
      </div>

      {/* AI Status */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-iris-50/60 border border-iris-200/40">
        <Bot className="w-3 h-3 text-iris" />
        <span className="text-2xs font-medium text-iris-700">3 Agents Active</span>
      </div>

      {/* Separator */}
      <div className="w-px h-5 bg-porcelain-400" />

      {/* Environment */}
      <button className="flex items-center gap-1.5 text-xs text-porcelain-700 hover:text-graphite-700 transition-colors">
        <Monitor className="w-3.5 h-3.5" />
        <span className="font-medium">Production</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {/* Notifications */}
      <button className="relative p-1.5 rounded-md hover:bg-porcelain-200 transition-colors">
        <Bell className="w-4 h-4 text-porcelain-700" />
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-severity-critical rounded-full flex items-center justify-center">
          <span className="text-[9px] font-bold text-white">2</span>
        </span>
      </button>

      {/* User Menu */}
      <button className="flex items-center gap-2 pl-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-iris to-signal flex items-center justify-center">
          <span className="text-xs font-bold text-white">SC</span>
        </div>
      </button>
    </header>
  );
}
