"use client";

import React from "react";
import { Menu, Bell } from "lucide-react";

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <header className="h-14 bg-white border-b border-porcelain-200 flex items-center justify-between px-4 lg:hidden sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-graphite-500 hover:text-graphite-900 rounded-lg transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-bold text-graphite-900">Incident AI</span>
      </div>
      <button className="p-2 -mr-2 text-graphite-500 hover:text-graphite-900 rounded-lg">
        <Bell className="w-5 h-5" />
      </button>
    </header>
  );
}
