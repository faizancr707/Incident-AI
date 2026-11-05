"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
}

interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function TabNavigation({
  tabs,
  activeTab,
  onChange,
  className,
}: TabNavigationProps) {
  return (
    <div
      className={cn(
        "border-b border-porcelain-200 bg-white px-4 md:px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none shrink-0",
        className
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2.5 px-4 py-3.5 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 group select-none",
              isActive
                ? "text-graphite-950"
                : "text-graphite-500 hover:text-graphite-800 hover:bg-porcelain-50/60 font-medium"
            )}
          >
            <Icon
              className={cn(
                "w-4 h-4 shrink-0 transition-colors",
                isActive
                  ? "text-graphite-950"
                  : "text-graphite-400 group-hover:text-graphite-600"
              )}
            />
            <span className="leading-tight text-left tracking-tight">
              {tab.label}
            </span>

            {tab.badge !== undefined && (
              <span
                className={cn(
                  "ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium",
                  isActive
                    ? "bg-graphite-950 text-white"
                    : "bg-porcelain-100 text-graphite-500"
                )}
              >
                {tab.badge}
              </span>
            )}

            {/* Solid active indicator flush with bottom border line */}
            {isActive && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-graphite-950 rounded-t-sm z-10"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
