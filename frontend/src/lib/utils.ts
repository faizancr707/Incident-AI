import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function formatTimestamp(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function getSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical": return "text-severity-critical";
    case "high": return "text-champagne-700";
    case "medium": return "text-signal";
    case "low": return "text-porcelain-700";
    default: return "text-porcelain-700";
  }
}

export function getSeverityBadgeClass(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical": return "badge-critical";
    case "high": return "badge-high";
    case "medium": return "badge-medium";
    case "low": return "badge-low";
    default: return "badge-low";
  }
}

export function getStatusDotClass(status: string): string {
  switch (status.toLowerCase()) {
    case "healthy":
    case "resolved":
    case "operational":
      return "status-dot-healthy";
    case "warning":
    case "degraded":
      return "status-dot-warning";
    case "critical":
    case "down":
      return "status-dot-critical";
    case "running":
    case "investigating":
      return "status-dot-running";
    default:
      return "status-dot";
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
