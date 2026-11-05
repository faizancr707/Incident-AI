"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Circle, Loader2, Server, Database, GitCommit, FileText,
  ArrowRight, Activity, Brain, AlertTriangle, MessageSquare,
  Search, GitBranch, Terminal, BarChart2, Zap, Clock, Shield, TrendingUp,
  Pause, Play, Download, ExternalLink, BrainCircuit, Network, Eye,
  ChevronDown, ChevronUp, ChevronRight, X, Send, Filter, RefreshCw,
  Maximize2, Minimize2, Check, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import {
  getIncidents,
  getInvestigationSteps,
  getInvestigationEvidence,
  getInvestigationRootCause,
  askInvestigationQuestion,
  startLiveInvestigation
} from '@/lib/api';
import { Evidence, InvestigationStep, RootCauseAnalysis } from '@/lib/types';
import { TabNavigation, TabItem } from '@/components/ui/tab-navigation';
import { ServiceNodeCard } from '@/components/ui/service-node-card';
import { FlowConnector, BranchConnector } from '@/components/ui/flow-connector';
import { useToast } from '@/components/ui/toast';

/* ── Helpers ─────────────────────────────────────────── */
const getEvidenceStyling = (type: Evidence["type"]) => {
  switch (type) {
    case 'log':
      return { icon: Terminal, color: 'bg-graphite-100 text-graphite-700 border-graphite-200', bar: 'bg-graphite-600', badge: 'bg-graphite-100 text-graphite-700 border-graphite-200' };
    case 'trace':
      return { icon: GitBranch, color: 'bg-blue-50 text-blue-700 border-blue-200', bar: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'metric':
      return { icon: BarChart2, color: 'bg-blue-50 text-blue-700 border-blue-200', bar: 'bg-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'deployment':
      return { icon: GitCommit, color: 'bg-amber-50 text-amber-800 border-amber-200', bar: 'bg-amber-500', badge: 'bg-amber-50 text-amber-800 border-amber-200' };
    case 'code_change':
      return { icon: Zap, color: 'bg-purple-50 text-purple-700 border-purple-200', bar: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'database':
      return { icon: Database, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'historical':
      return { icon: Search, color: 'bg-porcelain-100 text-graphite-600 border-porcelain-300', bar: 'bg-graphite-400', badge: 'bg-porcelain-100 text-graphite-600 border-porcelain-300' };
    default:
      return { icon: FileText, color: 'bg-porcelain-100 text-graphite-600 border-porcelain-200', bar: 'bg-graphite-400', badge: 'bg-porcelain-100 text-graphite-600 border-porcelain-200' };
  }
};

interface ServiceDetail {
  id: string;
  name: string;
  role: string;
  status: "healthy" | "degraded" | "critical";
  latency: string;
  errorRate: string;
  p99: string;
  throughput: string;
  recentAnomaly?: string;
  correlatedTraces: number;
  recommendation: string;
}

const SERVICE_CATALOG: Record<string, ServiceDetail> = {
  "API Gateway": {
    id: "api-gw",
    name: "API Gateway",
    role: "Edge routing and SSL termination",
    status: "healthy",
    latency: "45ms",
    errorRate: "0.02%",
    p99: "72ms",
    throughput: "14,200 req/s",
    correlatedTraces: 4,
    recommendation: "Operating within normal nominal thresholds. No upstream rate limiting needed."
  },
  "Auth Service": {
    id: "auth-svc",
    name: "Auth Service",
    role: "OAuth2 and JWT token verification",
    status: "healthy",
    latency: "28ms",
    errorRate: "0.01%",
    p99: "42ms",
    throughput: "8,900 req/s",
    correlatedTraces: 2,
    recommendation: "Token caches operating at 94% hit rate. No anomalies detected."
  },
  "Payment Service": {
    id: "payment-svc",
    name: "Payment Service",
    role: "Checkout payment orchestration",
    status: "degraded",
    latency: "2,340ms",
    errorRate: "23.4%",
    p99: "4,890ms",
    throughput: "3,120 req/s",
    recentAnomaly: "Timeout cascade waiting on downstream UserService.getUser calls.",
    correlatedTraces: 37,
    recommendation: "Mitigate by scaling connection pool timeout and enabling circuit breaker on user lookup."
  },
  "UserService": {
    id: "user-svc",
    name: "UserService",
    role: "User profile and account lookup",
    status: "degraded",
    latency: "1,890ms",
    errorRate: "18.2%",
    p99: "3,650ms",
    throughput: "12,800 req/s",
    recentAnomaly: "Introduced unbatched per-record SELECT queries in commit 7d9a1f (PR #1847).",
    correlatedTraces: 42,
    recommendation: "Revert commit 7d9a1f or wrap query logic with DataLoader batch caching."
  },
  "PostgreSQL": {
    id: "postgres-db",
    name: "PostgreSQL Database",
    role: "Primary transaction relational database",
    status: "critical",
    latency: "487ms avg query",
    errorRate: "CPU 88%",
    p99: "5,200ms",
    throughput: "47/50 active connections",
    recentAnomaly: "Query amplification of 4.7x saturation causing lock contention on users table.",
    correlatedTraces: 58,
    recommendation: "Kill idle in transaction queries; scale connection pool from 50 to 100 temporarily."
  },
  "Root Cause Identified": {
    id: "rc-node",
    name: "Root Cause Hypothesis",
    role: "AI Multi-Agent Synthesis",
    status: "degraded",
    latency: "92% Confidence",
    errorRate: "N+1 Query Amplification",
    p99: "4.7x load",
    throughput: "18m after v1.8.4",
    recentAnomaly: "Deployment v1.8.4 changed UserService query logic from batch SQL to per-record SELECT.",
    correlatedTraces: 37,
    recommendation: "Revert deployment to v1.8.3 or apply hotfix to restore batch queries."
  }
};

export default function InvestigationWorkspace() {
  const [selectedIncidentId, setSelectedIncidentId] = useState("INC-4821");
  const [activeTab, setActiveTab] = useState("Service Map");
  const [isPaused, setIsPaused] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [isRootCauseExpanded, setIsRootCauseExpanded] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceDetail | null>(null);

  // Panel toggles for Focus Mode
  const [showLeftTimeline, setShowLeftTimeline] = useState(true);
  const [showRightAgent, setShowRightAgent] = useState(true);

  // Evidence filter
  const [evidenceFilter, setEvidenceFilter] = useState<string>("all");

  // Modals
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  // Chat conversation
  const [agentQuery, setAgentQuery] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string; time: string }>>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // ── Live Data Queries ──────────────────────────────────
  const { data: incidents = [], isLoading: isLoadingIncidents } = useQuery({ queryKey: ['incidents'], queryFn: getIncidents });
  const { data: investigationSteps = [], refetch: refetchSteps } = useQuery({
    queryKey: ['investigationSteps', selectedIncidentId],
    queryFn: () => getInvestigationSteps(selectedIncidentId),
    enabled: !!selectedIncidentId,
  });
  const { data: evidence = [], refetch: refetchEvidence } = useQuery({
    queryKey: ['investigationEvidence', selectedIncidentId],
    queryFn: () => getInvestigationEvidence(selectedIncidentId),
    enabled: !!selectedIncidentId,
  });
  const { data: rootCauseAnalysis, refetch: refetchRootCause } = useQuery({
    queryKey: ['investigationRootCause', selectedIncidentId],
    queryFn: () => getInvestigationRootCause(selectedIncidentId),
    enabled: !!selectedIncidentId,
  });

  const [isTriggering, setIsTriggering] = useState(false);

  const handleTriggerInvestigation = async () => {
    try {
      setIsTriggering(true);
      notify("Investigation Started", `LangGraph multi-agent engine initiated for ${selectedIncidentId}.`, "info");
      await startLiveInvestigation(selectedIncidentId);
      await Promise.all([refetchSteps(), refetchEvidence(), refetchRootCause()]);
      notify("Agents Dispatched", "Log, Trace, GitHub, DB, and Root Cause analysts active.", "success");
    } catch (err: any) {
      notify("Trigger Failed", err?.message || "Could not start investigation", "error");
    } finally {
      setIsTriggering(false);
    }
  };

  // Auto-sync selectedIncidentId with loaded incidents
  useEffect(() => {
    if (incidents.length > 0 && !incidents.some((i) => i.id === selectedIncidentId)) {
      setSelectedIncidentId(incidents[0].id);
    }
  }, [incidents, selectedIncidentId]);

  // Safe toast
  let toast: ((props: any) => void) | undefined;
  try {
    const toastContext = useToast();
    toast = toastContext.toast;
  } catch {
    toast = undefined;
  }

  const notify = (title: string, description?: string, variant: "success" | "error" | "info" = "success") => {
    if (toast) {
      toast({ title, description, variant });
    }
  };

  const incident = useMemo(() => {
    return incidents.find((i) => i.id === selectedIncidentId) || incidents[0] || null;
  }, [incidents, selectedIncidentId]);

  const tabs: TabItem[] = [
    { id: 'Service Map', label: 'Service Map', icon: Server },
    { id: 'Evidence Graph', label: 'Evidence Graph', icon: Network },
    { id: 'Evidence Cards', label: 'Evidence Cards', icon: Eye, badge: evidence.length },
    { id: 'Timeline', label: 'Timeline', icon: Clock },
  ];

  const handleAskQuestion = async (customQuestion?: string) => {
    const q = (customQuestion || agentQuery).trim();
    if (!q) return;

    const userMsg = { sender: "user" as const, text: q, time: "Just now" };
    setChatMessages(prev => [...prev, userMsg]);
    setAgentQuery("");
    setIsAiThinking(true);

    try {
      const res = await askInvestigationQuestion(selectedIncidentId, q);
      setChatMessages(prev => [
        ...prev,
        { sender: "ai", text: res.response, time: "Just now" }
      ]);
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        {
          sender: "ai",
          text: "AI Investigation Agent: " + (err?.message || "Failed to process query. Please ensure backend is running."),
          time: "Just now"
        }
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleResolve = () => {
    setIsResolved(true);
    notify("Incident Resolved", `${incident?.id || selectedIncidentId} marked as resolved. Postmortem generated.`);
  };

  const filteredEvidence = useMemo(() => {
    if (evidenceFilter === "all") return evidence;
    return evidence.filter(e => e.type === evidenceFilter);
  }, [evidenceFilter, evidence]);

  if (isLoadingIncidents) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-signal-500"></div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-3 text-graphite-500 p-8">
        <BrainCircuit className="w-12 h-12 text-graphite-300" />
        <p className="text-base font-semibold text-graphite-700">No Incidents Found</p>
        <p className="text-xs text-graphite-500">Create or trigger an incident to start an AI investigation.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-porcelain-100/70 overflow-hidden text-graphite-900">

      {/* ── Top Header & Context Bar ────────────────────────── */}
      <div className="bg-white border-b border-porcelain-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-2.5 rounded-xl border border-purple-200">
            <BrainCircuit className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-graphite-950 tracking-tight">AI Incident Investigation</h1>
              {/* Incident Dropdown */}
              <select
                value={selectedIncidentId}
                onChange={(e) => setSelectedIncidentId(e.target.value)}
                className="bg-porcelain-100 border border-porcelain-300 text-xs font-mono font-bold text-graphite-800 rounded-md px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-graphite-900 cursor-pointer"
              >
                {incidents.map((inc) => (
                  <option key={inc.id} value={inc.id}>
                    {inc.id} — {inc.title}
                  </option>
                ))}
              </select>

              <span className={cn(
                "text-[10px] font-bold uppercase px-2 py-0.5 rounded-md",
                incident?.severity === "critical" ? "bg-red-100 text-red-700 border border-red-200" :
                incident?.severity === "high" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                "bg-blue-100 text-blue-700 border border-blue-200"
              )}>
                {incident?.severity || "LOW"}
              </span>

              {isResolved && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> Resolved
                </span>
              )}
            </div>
            <p className="text-xs text-graphite-500 mt-0.5">
              {incident?.impact || "Investigating telemetry"} · Assignee: <span className="font-semibold text-graphite-800">{incident?.assignee || "Unassigned"}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold",
            isResolved
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : isPaused
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-purple-50 border-purple-200 text-purple-700"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full",
              isResolved ? "bg-emerald-500" : isPaused ? "bg-amber-500" : "bg-purple-600 animate-pulse"
            )} />
            <span>{isResolved ? "Resolved" : isPaused ? "Paused" : "Investigating"}</span>
          </div>

          {/* Run / Re-run Live LangGraph Investigation */}
          <button
            onClick={handleTriggerInvestigation}
            disabled={isTriggering}
            className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Execute LangGraph Multi-Agent Investigation"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isTriggering && "animate-spin")} />
            {isTriggering ? "Running..." : "Run AI Investigation"}
          </button>

          {/* Pause / Resume */}
          <button
            onClick={() => {
              setIsPaused(!isPaused);
              notify(isPaused ? "Investigation Resumed" : "Investigation Paused", `Agent polling ${isPaused ? "resumed" : "paused"}.`);
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-graphite-700 hover:text-graphite-950 bg-porcelain-50 hover:bg-porcelain-200 border border-porcelain-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-600" /> : <Pause className="w-3.5 h-3.5" />}
            {isPaused ? "Resume" : "Pause"}
          </button>

          {/* Export Report */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-graphite-700 hover:text-graphite-950 bg-porcelain-50 hover:bg-porcelain-200 border border-porcelain-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>

          {/* Resolve */}
          {!isResolved && (
            <button
              onClick={handleResolve}
              className="flex items-center gap-1.5 text-xs font-bold text-graphite-950 bg-lime-400 hover:bg-lime-500 px-3.5 py-1.5 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Resolve
            </button>
          )}

          {/* View Toggles for Focus Mode */}
          <div className="h-4 w-[1px] bg-porcelain-300 mx-1" />
          <button
            onClick={() => setShowLeftTimeline(!showLeftTimeline)}
            title={showLeftTimeline ? "Hide Timeline Panel" : "Show Timeline Panel"}
            className={cn(
              "p-1.5 rounded-lg border text-xs transition cursor-pointer",
              showLeftTimeline ? "bg-porcelain-200 border-porcelain-300 text-graphite-800" : "bg-porcelain-50 border-porcelain-200 text-graphite-400"
            )}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowRightAgent(!showRightAgent)}
            title={showRightAgent ? "Hide AI Panel" : "Show AI Panel"}
            className={cn(
              "p-1.5 rounded-lg border text-xs transition cursor-pointer",
              showRightAgent ? "bg-porcelain-200 border-porcelain-300 text-graphite-800" : "bg-porcelain-50 border-porcelain-200 text-graphite-400"
            )}
          >
            <PanelRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── KPI Strip ────────────────────────────────────────── */}
      <div className="bg-white border-b border-porcelain-200 px-4 sm:px-6 py-2.5 flex items-center gap-3 overflow-x-auto shrink-0 scrollbar-none">
        {[
          { label: 'Confidence Score', value: `${rootCauseAnalysis?.confidence ?? 0}%`, icon: Shield, color: 'text-lime-700', bg: 'bg-lime-50/70 border-lime-200' },
          { label: 'Correlated Evidence', value: `${evidence.length} pieces`, icon: Eye, color: 'text-blue-700', bg: 'bg-blue-50/70 border-blue-200' },
          { label: 'Time to Root Cause', value: `${incident?.duration || 0}m`, icon: Clock, color: 'text-amber-700', bg: 'bg-amber-50/70 border-amber-200' },
          { label: 'Agents Orchestrated', value: '7 agents', icon: BrainCircuit, color: 'text-purple-700', bg: 'bg-purple-50/70 border-purple-200' },
          { label: 'Affected Services', value: `${incident?.affectedServices?.length || 4} services`, icon: Network, color: 'text-blue-700', bg: 'bg-blue-50/70 border-blue-200' },
          { label: 'Query Amplification', value: '4.7×', icon: TrendingUp, color: 'text-red-700', bg: 'bg-red-50/70 border-red-200' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={cn('flex items-center gap-2 px-3 py-1.5 rounded-xl border shrink-0', bg)}>
            <Icon className={cn('w-3.5 h-3.5', color)} />
            <div>
              <div className={cn('text-xs font-black leading-none font-mono', color)}>{value}</div>
              <div className="text-[10px] text-graphite-500 whitespace-nowrap">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Workspace ───────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* LEFT PANEL — Agent Timeline */}
        {showLeftTimeline && (
          <div className="w-72 bg-white border-r border-porcelain-200 flex flex-col shrink-0 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-porcelain-200 bg-porcelain-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-graphite-600" />
                <h2 className="font-semibold text-graphite-900 text-xs">Multi-Agent Timeline</h2>
              </div>
              <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                7 steps
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3.5">
              <div className="relative ml-2">
                <div className="absolute top-2 bottom-4 left-[9px] w-0.5 bg-gradient-to-b from-lime-400 via-purple-300 to-porcelain-200" />
                <div className="space-y-4 relative">
                  {investigationSteps.map((step, idx) => (
                    <div key={step.id} className="relative pl-7 group">
                      <span className="absolute left-0 top-0.5 bg-white rounded-full z-10 border border-porcelain-200 p-0.5 shadow-sm">
                        {step.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : step.status === 'running' ? (
                          <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                        ) : (
                          <Circle className="w-4 h-4 text-porcelain-300" />
                        )}
                      </span>

                      <div className={cn(
                        'rounded-xl p-2.5 border transition-all',
                        step.status === 'running'
                          ? 'bg-purple-50/70 border-purple-200 shadow-sm'
                          : step.status === 'completed'
                          ? 'bg-white border-porcelain-200/90 hover:border-porcelain-300'
                          : 'bg-porcelain-50 border-porcelain-100 opacity-60'
                      )}>
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-xs font-bold text-graphite-900 leading-tight">
                            {step.label}
                          </span>
                          {step.duration !== undefined && (
                            <span className="text-[10px] text-graphite-400 font-mono shrink-0">{step.duration}s</span>
                          )}
                        </div>

                        <p className="text-[10px] text-graphite-500 mt-1 leading-snug">{step.description}</p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 font-mono font-medium">
                            {step.agent}
                          </span>
                        </div>

                        {step.findings && step.findings.length > 0 && (
                          <div className="mt-2 bg-porcelain-50/80 border border-porcelain-200/80 rounded-lg p-2">
                            <ul className="space-y-1">
                              {step.findings.map((f: string, i: number) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                                  <span className="text-[10px] text-graphite-700 leading-snug">{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CENTER CANVAS — Evidence & Topology Workspace */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-white">

          {/* Root Cause Banner (Collapsible to save vertical room) */}
          <div className="px-5 pt-3 pb-1 shrink-0 bg-white border-b border-porcelain-200">
            <div className="bg-gradient-to-r from-[#0A3D2E] to-[#0f5240] rounded-xl p-3.5 border border-emerald-800/40 shadow-sm relative overflow-hidden">
              <div className="flex items-start justify-between relative z-10">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="bg-lime-400/20 p-1 rounded-md border border-lime-400/30">
                      <Brain className="w-3.5 h-3.5 text-lime-400" />
                    </div>
                    <span className="text-[10px] font-bold text-lime-400 uppercase tracking-widest">
                      Synthesized Root Cause
                    </span>
                    <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse shadow-[0_0_6px_#B8E62E]" />
                  </div>
                  <h2 className="text-white font-bold text-sm leading-snug truncate">
                    N+1 database queries introduced in <code className="bg-white/10 px-1.5 py-0.5 rounded text-lime-300 font-mono text-xs">UserService</code>
                  </h2>
                  {isRootCauseExpanded && (
                    <p className="text-emerald-200/90 text-xs leading-relaxed mt-1">
                      Deployment <span className="font-mono font-bold text-white">v1.8.4</span> replaced batch user queries with per-record SELECT statements, triggering 4.7× query amplification under production traffic.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-2xl font-black text-lime-400 leading-none">92%</div>
                    <div className="text-[10px] text-emerald-400 font-medium mt-0.5">Confidence</div>
                  </div>
                  <button
                    onClick={() => setIsRootCauseExpanded(!isRootCauseExpanded)}
                    className="p-1 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 transition"
                    title={isRootCauseExpanded ? "Collapse Banner" : "Expand Banner"}
                  >
                    {isRootCauseExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isRootCauseExpanded && (
                <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-emerald-800/60">
                  <span className="text-[11px] bg-blue-500/20 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/20 flex items-center gap-1 font-medium">
                    <GitBranch className="w-3 h-3" /> 37 correlated traces
                  </span>
                  <span className="text-[11px] bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded-full border border-amber-400/20 flex items-center gap-1 font-medium">
                    <GitCommit className="w-3 h-3" /> PR #1847 committed
                  </span>
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/20 flex items-center gap-1 font-medium">
                    <Database className="w-3 h-3" /> PostgreSQL CPU at 88%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Shared Standard Tab Navigation Bar (Matches user reference screenshot) */}
          <div className="shrink-0 bg-white">
            <TabNavigation
              tabs={tabs}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
          </div>

          {/* Active Canvas Body */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 bg-porcelain-50/40 relative">

            {/* TAB 1: SERVICE MAP (Matches Reference Screenshot layout) */}
            {activeTab === 'Service Map' && (
              <div className="flex flex-col items-center justify-center min-h-[500px] py-4">
                {/* Root: API Gateway */}
                <ServiceNodeCard
                  icon={Server}
                  title="API Gateway"
                  subtitle="Healthy · 45ms"
                  variant="healthy"
                  delay={0}
                  onClick={() => setSelectedService(SERVICE_CATALOG["API Gateway"])}
                />

                {/* 1-to-2 Branch Split with Horizontal Crossbar */}
                <BranchConnector childrenCount={2} />

                {/* Left Branch & Right Branch */}
                <div className="flex items-start justify-center gap-10 sm:gap-20 w-full max-w-4xl">
                  {/* Left: Auth Service */}
                  <div className="flex flex-col items-center">
                    <ServiceNodeCard
                      icon={Shield}
                      title="Auth Service"
                      subtitle="Healthy · 28ms"
                      variant="healthy"
                      delay={0.1}
                      onClick={() => setSelectedService(SERVICE_CATALOG["Auth Service"])}
                    />
                  </div>

                  {/* Right: Degraded Chain */}
                  <div className="flex flex-col items-center">
                    <ServiceNodeCard
                      icon={Activity}
                      title="Payment Service"
                      subtitle="Degraded · 2,340ms"
                      variant="degraded"
                      delay={0.2}
                      onClick={() => setSelectedService(SERVICE_CATALOG["Payment Service"])}
                    />

                    <FlowConnector length={24} vertical withArrow />

                    <ServiceNodeCard
                      icon={Server}
                      title="UserService"
                      subtitle="Degraded · 1,890ms"
                      variant="degraded"
                      delay={0.3}
                      onClick={() => setSelectedService(SERVICE_CATALOG["UserService"])}
                    />

                    <FlowConnector length={24} vertical withArrow />

                    <ServiceNodeCard
                      icon={Database}
                      title="PostgreSQL"
                      subtitle="CPU 88% · Overloaded"
                      variant="database"
                      delay={0.4}
                      onClick={() => setSelectedService(SERVICE_CATALOG["PostgreSQL"])}
                    />

                    <FlowConnector length={24} vertical withArrow />

                    <ServiceNodeCard
                      icon={CheckCircle2}
                      title="Root Cause Identified"
                      subtitle="N+1 Query Overload"
                      variant="root-cause"
                      delay={0.5}
                      onClick={() => setSelectedService(SERVICE_CATALOG["Root Cause Identified"])}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: EVIDENCE GRAPH */}
            {activeTab === 'Evidence Graph' && (
              <div className="flex flex-col items-center justify-center min-h-[500px] py-4">
                <div className="text-center mb-6">
                  <h3 className="text-sm font-bold text-graphite-900">Incident Causal Flow</h3>
                  <p className="text-xs text-graphite-500">Tracing the propagation from anomaly detection to code release</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
                  <div className="p-4 bg-white border border-red-200 rounded-xl shadow-sm space-y-2">
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">1. Alert Triggered</span>
                    <h4 className="text-sm font-bold text-graphite-900">Payment API Latency Spike</h4>
                    <p className="text-xs text-graphite-600">P99 increased from 180ms to 2,340ms across 14,832 checkout transactions.</p>
                  </div>

                  <div className="p-4 bg-white border border-amber-200 rounded-xl shadow-sm space-y-2">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">2. Correlated Release</span>
                    <h4 className="text-sm font-bold text-graphite-900">Deployment v1.8.4</h4>
                    <p className="text-xs text-graphite-600">PR #1847 touched UserService query methods 18 minutes prior to anomaly.</p>
                  </div>

                  <div className="p-4 bg-white border border-purple-200 rounded-xl shadow-sm space-y-2">
                    <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">3. DB Amplification</span>
                    <h4 className="text-sm font-bold text-graphite-900">N+1 Queries Detected</h4>
                    <p className="text-xs text-graphite-600">4.7× query volume caused pool exhaustion (47/50 connections) and 88% CPU load.</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: EVIDENCE CARDS */}
            {activeTab === 'Evidence Cards' && (
              <div className="space-y-4">
                {/* Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <Filter className="w-3.5 h-3.5 text-graphite-400" />
                  {['all', 'metric', 'log', 'trace', 'deployment', 'code_change', 'database', 'historical'].map((ft) => (
                    <button
                      key={ft}
                      onClick={() => setEvidenceFilter(ft)}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-full border capitalize font-medium transition cursor-pointer",
                        evidenceFilter === ft
                          ? "bg-graphite-950 text-porcelain-100 border-graphite-950 font-bold"
                          : "bg-white text-graphite-600 border-porcelain-300 hover:bg-porcelain-100"
                      )}
                    >
                      {ft.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredEvidence.map((e, idx) => {
                    const { icon: Icon, color, bar, badge } = getEvidenceStyling(e.type);
                    return (
                      <div
                        key={e.id}
                        className="bg-white border border-porcelain-200 rounded-xl p-4 shadow-sm hover:shadow-md transition space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={cn("p-2 rounded-lg border", color)}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-graphite-900">{e.title}</h4>
                              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium capitalize border", badge)}>
                                {e.type.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] bg-porcelain-100 px-2 py-0.5 rounded font-mono text-graphite-500 border border-porcelain-200">
                            {e.source}
                          </span>
                        </div>

                        <p className="text-xs text-graphite-600 leading-relaxed">{e.description}</p>

                        <div className="flex items-center gap-2 pt-2 border-t border-porcelain-100 text-xs">
                          <span className="text-graphite-400 text-[11px]">Confidence:</span>
                          <div className="flex-1 h-2 bg-porcelain-200 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", bar)} style={{ width: `${e.confidence}%` }} />
                          </div>
                          <span className="font-bold font-mono text-graphite-800">{e.confidence}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: TIMELINE */}
            {activeTab === 'Timeline' && (
              <div className="max-w-2xl mx-auto py-2">
                <div className="relative border-l-2 border-porcelain-300 ml-6 space-y-5">
                  {[...evidence]
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                    .map((e, idx) => {
                      const { icon: Icon, color, badge } = getEvidenceStyling(e.type);
                      const timeStr = new Date(e.timestamp).toLocaleTimeString();
                      return (
                        <div key={e.id} className="relative pl-8">
                          <div className={cn('absolute -left-[15px] top-1.5 bg-white border-2 rounded-full p-1.5 shadow-sm', color.split(' ').find(c => c.startsWith('border')))}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="bg-white border border-porcelain-200 rounded-xl p-3.5 shadow-sm space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-graphite-900">{e.title}</span>
                              <div className="flex items-center gap-2">
                                <span className={cn('text-[9px] px-2 py-0.2 rounded-full font-medium border', badge)}>
                                  {e.type.replace('_', ' ')}
                                </span>
                                <span className="text-[10px] text-graphite-400 font-mono">{timeStr}</span>
                              </div>
                            </div>
                            <p className="text-xs text-graphite-600">{e.description}</p>
                            <div className="flex items-center justify-between text-[10px] text-graphite-400 pt-1 border-t border-porcelain-100">
                              <span>Source: <code className="text-graphite-700 bg-porcelain-100 px-1 py-0.2 rounded">{e.source}</code></span>
                              <span className="font-bold text-graphite-800">{e.confidence}% confidence</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL — AI Agent Dialogue & Quick Actions */}
        {showRightAgent && (
          <div className="w-80 bg-white border-l border-porcelain-200 flex flex-col shrink-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-porcelain-200 bg-gradient-to-r from-[#0A3D2E] to-emerald-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-purple-500/20 p-1.5 rounded-lg border border-purple-400/30">
                  <Brain className="w-4 h-4 text-purple-300" />
                </div>
                <h2 className="font-semibold text-white text-xs">Investigation Copilot</h2>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse shadow-[0_0_6px_#B8E62E]" />
                <span className="text-[10px] font-bold text-lime-400 uppercase tracking-wide">Ready</span>
              </div>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-3 rounded-xl text-xs space-y-1",
                    msg.sender === "ai"
                      ? "bg-purple-50/70 border border-purple-200/80 text-graphite-900"
                      : "bg-graphite-950 text-porcelain-100 ml-4"
                  )}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={cn("font-bold", msg.sender === "ai" ? "text-purple-700" : "text-lime-400")}>
                      {msg.sender === "ai" ? "Incident AI" : "You"}
                    </span>
                    <span className="text-graphite-400">{msg.time}</span>
                  </div>
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              ))}

              {chatMessages.length === 0 && (
                <div className="p-4 rounded-xl text-xs bg-porcelain-100/70 border border-porcelain-200 text-graphite-500 text-center space-y-1">
                  <BrainCircuit className="w-5 h-5 text-purple-600 mx-auto" />
                  <p className="font-semibold text-graphite-700">AI Investigation Assistant</p>
                  <p className="text-[11px]">Ask questions about root cause, mitigation steps, or correlated repository changes.</p>
                </div>
              )}

              {isAiThinking && (
                <div className="p-3 rounded-xl text-xs bg-purple-50 border border-purple-200 text-purple-700 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                  <span>Synthesizing incident logs & telemetry...</span>
                </div>
              )}

              {/* Quick Query Suggestions */}
              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-graphite-400 block mb-1.5">
                  Suggested Prompts
                </span>
                <div className="flex flex-col gap-1">
                  {[
                    "What is the probable root cause of this incident?",
                    "What is the recommended immediate mitigation?",
                    "Are there recent code commits correlated with this service?",
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleAskQuestion(chip)}
                      className="text-left text-[11px] p-1.5 bg-porcelain-100 hover:bg-porcelain-200 rounded-lg text-graphite-700 transition cursor-pointer border border-porcelain-200"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="p-3 border-t border-porcelain-200 bg-porcelain-50/80 space-y-2 shrink-0">
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  onClick={() => setIsDiffModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 p-2 bg-white hover:bg-porcelain-100 border border-porcelain-300 rounded-lg font-medium text-graphite-800 transition cursor-pointer"
                >
                  <GitCommit className="w-3.5 h-3.5 text-purple-600" /> View Repository
                </button>
                <button
                  onClick={() => setIsTaskModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 p-2 bg-lime-400 hover:bg-lime-500 border border-lime-500 rounded-lg font-bold text-graphite-950 transition cursor-pointer shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5" /> Create Task
                </button>
              </div>

              {/* Chat Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ask a follow-up question..."
                  value={agentQuery}
                  onChange={(e) => setAgentQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAskQuestion()}
                  className="w-full bg-white border border-porcelain-300 rounded-lg py-2 pl-3 pr-9 text-xs text-graphite-900 focus:outline-none focus:ring-2 focus:ring-graphite-900 placeholder:text-graphite-400"
                />
                <button
                  onClick={() => handleAskQuestion()}
                  className="absolute right-1.5 top-1.5 p-1 text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-md transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Slide-over Drawer for Clicked Service Node ───────── */}
      {selectedService && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-5 animate-in slide-in-from-right duration-200">
            <div className="flex items-start justify-between border-b border-porcelain-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-graphite-950">{selectedService.name}</h3>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                    selectedService.status === "healthy" ? "bg-emerald-100 text-emerald-800" :
                    selectedService.status === "degraded" ? "bg-amber-100 text-amber-800" :
                    "bg-red-100 text-red-800"
                  )}>
                    {selectedService.status}
                  </span>
                </div>
                <p className="text-xs text-graphite-500 mt-0.5">{selectedService.role}</p>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="p-1 rounded-md text-graphite-400 hover:text-graphite-900 hover:bg-porcelain-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-porcelain-50 border border-porcelain-200 rounded-xl">
                <span className="text-graphite-400 text-[10px] block uppercase">Average Latency</span>
                <span className="font-bold text-graphite-900 text-sm">{selectedService.latency}</span>
              </div>
              <div className="p-3 bg-porcelain-50 border border-porcelain-200 rounded-xl">
                <span className="text-graphite-400 text-[10px] block uppercase">P99 Latency</span>
                <span className="font-bold text-graphite-900 text-sm">{selectedService.p99}</span>
              </div>
              <div className="p-3 bg-porcelain-50 border border-porcelain-200 rounded-xl">
                <span className="text-graphite-400 text-[10px] block uppercase">Error Rate / Health</span>
                <span className="font-bold text-graphite-900 text-sm">{selectedService.errorRate}</span>
              </div>
              <div className="p-3 bg-porcelain-50 border border-porcelain-200 rounded-xl">
                <span className="text-graphite-400 text-[10px] block uppercase">Throughput</span>
                <span className="font-bold text-graphite-900 text-sm">{selectedService.throughput}</span>
              </div>
            </div>

            {/* Anomaly Callout */}
            {selectedService.recentAnomaly && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs space-y-1">
                <span className="font-bold text-red-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Active Anomaly
                </span>
                <p className="text-red-700 leading-relaxed">{selectedService.recentAnomaly}</p>
              </div>
            )}

            {/* AI Recommendation */}
            <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-xs space-y-1">
              <span className="font-bold text-purple-900 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-purple-700" /> AI Recommendation
              </span>
              <p className="text-purple-800 leading-relaxed">{selectedService.recommendation}</p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setSelectedService(null);
                  setActiveTab("Evidence Cards");
                }}
                className="w-full py-2 bg-graphite-950 text-white font-semibold text-xs rounded-lg hover:bg-graphite-800 transition"
              >
                Inspect All Related Traces ({selectedService.correlatedTraces})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Export Report Modal ───────────────────────────────── */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-porcelain-300 space-y-4">
            <div className="flex items-center justify-between border-b border-porcelain-200 pb-3">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-purple-700" />
                <h3 className="font-bold text-graphite-950 text-base">Export Postmortem Report</h3>
              </div>
              <button onClick={() => setIsExportModalOpen(false)} className="p-1 text-graphite-400 hover:text-graphite-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-graphite-600">
              Download the comprehensive automated incident postmortem including root cause synthesis, timeline, evidence logs, and recommendations.
            </p>

            <div className="p-3 bg-porcelain-50 border border-porcelain-200 rounded-xl text-xs space-y-1 font-mono">
              <div><strong>Incident:</strong> {incident?.id || selectedIncidentId}</div>
              <div><strong>Root Cause:</strong> N+1 queries in UserService (PR #1847)</div>
              <div><strong>Confidence:</strong> 92%</div>
              <div><strong>Correlated Evidence:</strong> 14 items</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-3 py-1.5 text-xs text-graphite-600 hover:text-graphite-900"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsExportModalOpen(false);
                  notify("Report Exported", `Postmortem_${incident?.id || selectedIncidentId}.pdf successfully downloaded.`);
                }}
                className="px-4 py-2 bg-lime-400 hover:bg-lime-500 font-bold text-graphite-950 text-xs rounded-lg shadow-sm"
              >
                Download PDF & Markdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View PR #1847 Diff Modal ─────────────────────────── */}
      {isDiffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-porcelain-300 space-y-4">
            <div className="flex items-center justify-between border-b border-porcelain-200 pb-3">
              <div>
                <h3 className="font-bold text-graphite-950 text-sm flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-purple-600" />
                  GitHub PR #1847 — UserService.ts Diff
                </h3>
                <span className="text-xs text-graphite-500 font-mono">commit 7d9a1f · Merged 18m before incident</span>
              </div>
              <button onClick={() => setIsDiffModalOpen(false)} className="p-1 text-graphite-400 hover:text-graphite-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-graphite-950 text-porcelain-100 p-4 rounded-xl font-mono text-xs overflow-x-auto space-y-1">
              <div className="text-graphite-500">// src/services/UserService.ts</div>
              <div className="text-red-400 line-through bg-red-950/40 px-2 py-0.5 rounded">
                - return await db.query(&quot;SELECT * FROM users WHERE id IN ($1)&quot;, [userIds]);
              </div>
              <div className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded">
                + // Refactored to individual fetch loop
              </div>
              <div className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded">
                + return await Promise.all(userIds.map(id =&gt; db.query(&quot;SELECT * FROM users WHERE id = $1&quot;, [id])));
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-red-600 font-semibold">Introduced 4.7x N+1 query amplification</span>
              <button
                onClick={() => {
                  setIsDiffModalOpen(false);
                  notify("Rollback Requested", "Initiated git revert PR #1847 via LangGraph engine.");
                }}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Revert PR #1847
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create Task Modal ─────────────────────────────────── */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-porcelain-300 space-y-4">
            <div className="flex items-center justify-between border-b border-porcelain-200 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-lime-500" />
                <h3 className="font-bold text-graphite-950 text-base">Create Remediation Task</h3>
              </div>
              <button onClick={() => setIsTaskModalOpen(false)} className="p-1 text-graphite-400 hover:text-graphite-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-graphite-700 block mb-1">Issue Title</label>
                <input
                  type="text"
                  defaultValue="Fix N+1 query pattern in UserService using DataLoader batching"
                  className="w-full border border-porcelain-300 rounded-lg p-2 text-graphite-900"
                />
              </div>
              <div>
                <label className="font-semibold text-graphite-700 block mb-1">Assignee</label>
                <select className="w-full border border-porcelain-300 rounded-lg p-2 text-graphite-900">
                  <option>Sarah Chen (Platform Lead)</option>
                  <option>Alex Rivera (Backend)</option>
                  <option>Marcus Rivera (PR Author)</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-graphite-700 block mb-1">Priority</label>
                <span className="px-2 py-1 rounded bg-red-100 text-red-700 font-bold">P1 - Blocker</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="px-3 py-1.5 text-xs text-graphite-600 hover:text-graphite-900"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsTaskModalOpen(false);
                  notify("Task Created", "Linear issue NUM-4821 created and assigned to team.");
                }}
                className="px-4 py-2 bg-lime-400 hover:bg-lime-500 font-bold text-graphite-950 text-xs rounded-lg shadow-sm"
              >
                Create Jira / Linear Issue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
