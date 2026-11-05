"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type ServiceNodeVariant =
  | "healthy"
  | "neutral"
  | "degraded"
  | "critical"
  | "database"
  | "root-cause"
  | "ai";

interface ServiceNodeCardProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  variant?: ServiceNodeVariant;
  className?: string;
  delay?: number;
  badge?: string;
  onClick?: () => void;
}

export function ServiceNodeCard({
  icon: Icon,
  title,
  subtitle,
  variant = "healthy",
  className,
  delay = 0,
  badge,
  onClick,
}: ServiceNodeCardProps) {
  const variantStyles: Record<
    ServiceNodeVariant,
    {
      card: string;
      iconWrapper: string;
      iconColor: string;
      titleColor: string;
      subtitleColor: string;
    }
  > = {
    healthy: {
      card: "border-porcelain-300/80 bg-white shadow-sm hover:border-porcelain-400 hover:shadow-md",
      iconWrapper: "bg-porcelain-200/70 text-graphite-700",
      iconColor: "text-graphite-700",
      titleColor: "text-graphite-900",
      subtitleColor: "text-graphite-500",
    },
    neutral: {
      card: "border-porcelain-300/80 bg-white shadow-sm hover:border-porcelain-400 hover:shadow-md",
      iconWrapper: "bg-porcelain-200/70 text-graphite-700",
      iconColor: "text-graphite-700",
      titleColor: "text-graphite-900",
      subtitleColor: "text-graphite-500",
    },
    degraded: {
      card: "border-champagne-300 bg-champagne-50/20 shadow-sm shadow-champagne-100/50 hover:border-champagne-400 hover:shadow-md",
      iconWrapper: "bg-champagne-100 text-champagne-700 border border-champagne-200/60",
      iconColor: "text-champagne-700",
      titleColor: "text-graphite-900",
      subtitleColor: "text-champagne-700 font-semibold",
    },
    critical: {
      card: "border-red-300 bg-red-50/20 shadow-sm shadow-red-100/50 hover:border-red-400 hover:shadow-md",
      iconWrapper: "bg-red-100 text-red-600 border border-red-200/60",
      iconColor: "text-red-600",
      titleColor: "text-graphite-900",
      subtitleColor: "text-red-600 font-semibold",
    },
    database: {
      card: "border-emerald-300/90 bg-emerald-50/20 shadow-sm shadow-emerald-100/50 hover:border-emerald-400 hover:shadow-md",
      iconWrapper: "bg-emerald-100 text-emerald-800 border border-emerald-200/60",
      iconColor: "text-emerald-800",
      titleColor: "text-graphite-900",
      subtitleColor: "text-emerald-700 font-medium",
    },
    "root-cause": {
      card: "border-lime-400 bg-lime-50/30 shadow-md shadow-lime-200/60 hover:border-lime-500 ring-2 ring-lime-400/20",
      iconWrapper: "bg-lime-400/30 text-lime-800 border border-lime-400/60",
      iconColor: "text-lime-800",
      titleColor: "text-graphite-950",
      subtitleColor: "text-lime-800 font-bold",
    },
    ai: {
      card: "border-iris-300 bg-iris-50/20 shadow-sm shadow-iris-100/50 hover:border-iris-400 hover:shadow-md",
      iconWrapper: "bg-iris-100 text-iris-700 border border-iris-200/60",
      iconColor: "text-iris-700",
      titleColor: "text-graphite-900",
      subtitleColor: "text-iris-700 font-medium",
    },
  };

  const style = variantStyles[variant];

  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
      onClick={onClick}
      className={cn(
        "relative rounded-2xl border p-4.5 text-center flex flex-col items-center justify-center gap-2.5 min-w-[170px] sm:min-w-[190px] max-w-[230px] transition-all select-none",
        style.card,
        onClick && "cursor-pointer hover:-translate-y-0.5",
        className
      )}
    >
      {badge && (
        <span className="absolute -top-2.5 right-3 bg-graphite-900 text-porcelain-100 text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border border-graphite-700">
          {badge}
        </span>
      )}

      {/* Centered squircle icon container */}
      <div
        className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center transition-transform shrink-0",
          style.iconWrapper
        )}
      >
        <Icon className={cn("w-5 h-5", style.iconColor)} />
      </div>

      {/* Title & Subtitle */}
      <div className="flex flex-col items-center">
        <h4 className={cn("text-sm font-bold tracking-tight leading-tight", style.titleColor)}>
          {title}
        </h4>
        <span className={cn("text-xs mt-0.5 leading-snug", style.subtitleColor)}>
          {subtitle}
        </span>
      </div>
    </motion.div>
  );
}
