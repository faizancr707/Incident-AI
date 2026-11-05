"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, CheckCircle2, Clock, BrainCircuit, Activity,
  Server, Shield, Database, GitCommit, GitBranch, ArrowRight,
  Terminal, BarChart2, Zap, Play, Pause, Download, ExternalLink,
  ChevronLeft, Eye, RefreshCw, FileText, CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getIncident, getInvestigationSteps, getInvestigationEvidence, getInvestigationRootCause } from "@/lib/api";
import { Evidence } from "@/lib/types";
import { TabNavigation, TabItem } from "@/components/ui/tab-navigation";
import { ServiceNodeCard } from "@/components/ui/service-node-card";
import { FlowConnector, BranchConnector } from "@/components/ui/flow-connector";
import Link from "next/link";

/* ── Helpers ─────────────────────────────────────────── */
const getEvidenceStyling = (type: Evidence["type"]) => {
  switch (type) {
    case 'log': return { icon: Terminal, color: 'bg-graphite-100 text-graphite-700 border-graphite-200', bar: 'bg-graphite-500', badge: 'bg-graphite-100 text-graphite-700' };
    case 'trace': return { icon: GitBranch, color: 'bg-signal-100 text-signal-700 border-signal-200', bar: 'bg-signal-500', badge: 'bg-signal-100 text-signal-700' };
    case 'metric': return { icon: BarChart2, color: 'bg-signal-100 text-signal-700 border-signal-200', bar: 'bg-signal-500', badge: 'bg-signal-100 text-signal-700' };
    case 'deployment': return { icon: GitCommit, color: 'bg-champagne-100 text-champagne-700 border-champagne-300', bar: 'bg-champagne-500', badge: 'bg-champagne-100 text-champagne-700' };
    case 'code_change': return { icon: Zap, color: 'bg-iris-100 text-iris-700 border-iris-200', bar: 'bg-iris-500', badge: 'bg-iris-100 text-iris-700' };
    case 'database': return { icon: Database, color: 'bg-emerald-100 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' };
    case 'historical': return { icon: RefreshCw, color: 'bg-porcelain-200 text-graphite-600 border-porcelain-300', bar: 'bg-graphite-400', badge: 'bg-porcelain-200 text-graphite-600' };
    default: return { icon: FileText, color: 'bg-porcelain-100 text-graphite-600 border-porcelain-200', bar: 'bg-graphite-400', badge: 'bg-porcelain-100 text-graphite-600' };
  }
};

export default function IncidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  // ── Live Data Queries ──────────────────────────────────
  const { data: incident, isLoading } = useQuery({ queryKey: ['incident', id], queryFn: () => getIncident(id), enabled: !!id });
  const { data: evidence = [] } = useQuery({ queryKey: ['evidence', id], queryFn: () => getInvestigationEvidence(id), enabled: !!id });
  const { data: investigationSteps = [] } = useQuery({ queryKey: ['steps', id], queryFn: () => getInvestigationSteps(id), enabled: !!id });
  const { data: rootCauseAnalysis } = useQuery({ queryKey: ['rootCause', id], queryFn: () => getInvestigationRootCause(id), enabled: !!id });

  const [activeTab, setActiveTab] = useState("overview");
  const [isInvestigating, setIsInvestigating] = useState(false);

  if (isLoading || !incident) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-signal-500"></div></div>;

  const tabs: TabItem[] = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "servicemap", label: "Service Map", icon: Server },
    { id: "evidence", label: "Evidence Cards", icon: Eye, badge: evidence.length },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "rootcause", label: "Root Cause Analysis", icon: BrainCircuit, badge: rootCauseAnalysis?.confidence ? `${rootCauseAnalysis.confidence}%` : "—" },
  ];

  return (
    <div className="flex flex-col h-full bg-porcelain-50 overflow-hidden">
      {/* ── Top Header & Action Bar ───────────────────── */}
      <div className="bg-white border-b border-porcelain-200 px-6 py-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Link
            href="/incidents"
            className="text-xs font-semibold text-graphite-500 hover:text-graphite-800 flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Incidents
          </Link>
          <span className="text-xs text-graphite-300">/</span>
          <span className="text-xs font-mono font-semibold text-graphite-700">{incident.id}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-2xl border",
              incident.severity === "critical" ? "bg-red-50 text-red-600 border-red-200" :
              incident.severity === "high" ? "bg-champagne-50 text-champagne-700 border-champagne-200" :
              "bg-signal-50 text-signal-600 border-signal-200"
            )}>
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-graphite-900 tracking-tight">
                  {incident.id} — {incident.title}
                </h1>
                <span className={cn(
                  "text-xs px-2.5 py-0.5 rounded-md font-bold uppercase border",
                  incident.severity === "critical" ? "bg-red-100 text-red-800 border-red-200" :
                  incident.severity === "high" ? "bg-champagne-100 text-champagne-800 border-champagne-200" :
                  "bg-signal-100 text-signal-800 border-signal-200"
                )}>
                  {incident.severity}
                </span>
                <span className="bg-porcelain-100 text-graphite-700 border border-porcelain-300 text-xs font-semibold px-2 py-0.5 rounded-md capitalize">
                  {incident.status}
                </span>
              </div>
              <p className="text-xs text-graphite-500 mt-1">
                {incident.service} · Environment: <span className="font-semibold text-graphite-700">{incident.environment}</span> · Started {incident.duration}m ago · Assigned to <span className="font-semibold text-graphite-700">{incident.assignee}</span>
                {incident.deploymentVersion && <> · Deploy: <span className="font-mono text-graphite-700 font-semibold">{incident.deploymentVersion}</span></>}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsInvestigating(!isInvestigating)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm",
                isInvestigating
                  ? "bg-iris-50 hover:bg-iris-100 text-iris-700 border border-iris-200"
                  : "bg-lime-400 hover:bg-lime-300 text-graphite-950 font-black shadow-lime-200/50"
              )}
            >
              {isInvestigating ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause Investigation
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Start AI Investigation
                </>
              )}
            </button>

            <Link
              href="/investigations"
              className="flex items-center gap-1.5 text-xs font-semibold text-graphite-700 hover:text-graphite-950 bg-porcelain-100 hover:bg-porcelain-200 border border-porcelain-300 px-3 py-2 rounded-xl transition-colors shadow-sm"
            >
              <BrainCircuit className="w-3.5 h-3.5 text-iris-600" /> Open Workspace
            </Link>

            <button className="flex items-center gap-1.5 text-xs font-semibold text-graphite-700 hover:text-graphite-950 bg-porcelain-100 hover:bg-porcelain-200 border border-porcelain-300 px-3 py-2 rounded-xl transition-colors shadow-sm">
              <Download className="w-3.5 h-3.5" /> Export Report
            </button>

            <button className="flex items-center gap-1.5 text-xs font-bold text-white bg-graphite-900 hover:bg-graphite-800 px-3.5 py-2 rounded-xl transition-colors shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-lime-400" /> Resolve
            </button>
          </div>
        </div>
      </div>

      {/* ── Shared Responsive Tab Navigation ───────────── */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* ── Tab Content Area ───────────────────────────── */}
      <div className="flex-1 overflow-auto p-6">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Root Cause Analytical Card */}
            <div className="bg-gradient-to-r from-[#0A3D2E] to-[#0f5240] rounded-2xl p-6 border border-emerald-800/40 shadow-lg relative overflow-hidden text-white">
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-lime-400 uppercase tracking-widest flex items-center gap-1.5">
                      <BrainCircuit className="w-4 h-4 text-lime-400" />
                      Likely Root Cause
                    </span>
                    <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                  </div>
                  <h2 className="text-xl font-black text-white mb-1.5">
                    N+1 database queries introduced in <span className="text-lime-300 font-mono">UserService</span>
                  </h2>
                  <p className="text-xs text-emerald-200/90 leading-relaxed max-w-2xl">
                    Query count increased 4.7× following deployment v1.8.4. User profile lookups execute sequential individual queries instead of batch fetch.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-4xl font-black text-lime-400">92%</div>
                  <div className="text-xs text-emerald-300 font-medium">Confidence</div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-emerald-800/60 flex flex-wrap gap-2 text-xs">
                <span className="bg-white/10 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-signal-400" /> 37 correlated traces
                </span>
                <span className="bg-white/10 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                  <GitCommit className="w-3.5 h-3.5 text-champagne-300" /> PR #1847 data access changes
                </span>
                <span className="bg-white/10 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-300" /> PostgreSQL CPU: 42% → 88%
                </span>
              </div>
            </div>

            {/* KPI Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-porcelain-200 p-4 shadow-sm">
                <p className="text-xs font-medium text-graphite-500">Impacted Requests</p>
                <p className="text-xl font-black text-graphite-900 mt-1">{incident.impactedRequests.toLocaleString()}</p>
                <p className="text-[11px] text-red-600 font-semibold mt-0.5">23% transaction failures</p>
              </div>
              <div className="bg-white rounded-2xl border border-porcelain-200 p-4 shadow-sm">
                <p className="text-xs font-medium text-graphite-500">Current P99 Latency</p>
                <p className="text-xl font-black text-red-600 mt-1">2,340ms</p>
                <p className="text-[11px] text-graphite-500 mt-0.5">Baseline: 180ms</p>
              </div>
              <div className="bg-white rounded-2xl border border-porcelain-200 p-4 shadow-sm">
                <p className="text-xs font-medium text-graphite-500">Duration</p>
                <p className="text-xl font-black text-graphite-900 mt-1">{incident.duration}m</p>
                <p className="text-[11px] text-champagne-700 font-semibold mt-0.5">Ongoing investigation</p>
              </div>
              <div className="bg-white rounded-2xl border border-porcelain-200 p-4 shadow-sm">
                <p className="text-xs font-medium text-graphite-500">AI Confidence</p>
                <p className="text-xl font-black text-lime-600 mt-1">92%</p>
                <p className="text-[11px] text-graphite-500 mt-0.5">Multi-agent consensus</p>
              </div>
            </div>

            {/* Affected Services & Architecture Overview */}
            <div className="bg-white rounded-2xl border border-porcelain-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-graphite-900 mb-4 flex items-center justify-between">
                <span>Affected Services & Dependency Path</span>
                <button
                  onClick={() => setActiveTab("servicemap")}
                  className="text-xs text-signal-600 hover:text-signal-700 font-semibold flex items-center gap-1"
                >
                  View Full Service Map <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </h3>

              <div className="flex flex-wrap items-center justify-center gap-3 py-2">
                <ServiceNodeCard
                  icon={Server}
                  title="API Gateway"
                  subtitle="Healthy · 45ms"
                  variant="healthy"
                />
                <FlowConnector length={24} vertical={false} withArrow />
                <ServiceNodeCard
                  icon={Activity}
                  title="Payment API"
                  subtitle="Critical · 2,340ms"
                  variant="critical"
                />
                <FlowConnector length={24} vertical={false} withArrow />
                <ServiceNodeCard
                  icon={Server}
                  title="User Service"
                  subtitle="Degraded · 1,890ms"
                  variant="degraded"
                />
                <FlowConnector length={24} vertical={false} withArrow />
                <ServiceNodeCard
                  icon={Database}
                  title="PostgreSQL"
                  subtitle="CPU 88% · High Load"
                  variant="database"
                />
              </div>
            </div>
          </div>
        )}

        {/* SERVICE MAP TAB (Matches Reference Screenshot) */}
        {activeTab === "servicemap" && (
          <div className="max-w-4xl mx-auto flex flex-col items-center py-6">
            <ServiceNodeCard
              icon={Server}
              title="API Gateway"
              subtitle="Healthy · 45ms"
              variant="healthy"
              delay={0}
            />

            <BranchConnector childrenCount={2} />

            <div className="flex items-start justify-center gap-8 sm:gap-20 w-full">
              {/* Left Column: Auth Service */}
              <div className="flex flex-col items-center">
                <ServiceNodeCard
                  icon={Shield}
                  title="Auth Service"
                  subtitle="Healthy · 28ms"
                  variant="healthy"
                  delay={0.15}
                />
              </div>

              {/* Right Column: Incident Service Flow */}
              <div className="flex flex-col items-center">
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}>
                  <ServiceNodeCard
                    icon={Activity}
                    title="Payment Service"
                    subtitle="Degraded · 2,340ms"
                    variant="degraded"
                    delay={0.25}
                  />
                </motion.div>

                <FlowConnector length={24} vertical withArrow />

                <ServiceNodeCard
                  icon={Server}
                  title="UserService"
                  subtitle="Degraded · 1,890ms"
                  variant="degraded"
                  delay={0.35}
                />

                <FlowConnector length={24} vertical withArrow />

                <ServiceNodeCard
                  icon={Database}
                  title="PostgreSQL"
                  subtitle="CPU 88% · Overloaded"
                  variant="database"
                  delay={0.45}
                />

                <FlowConnector length={24} vertical withArrow />

                <ServiceNodeCard
                  icon={CheckCircle2}
                  title="Root Cause Identified"
                  subtitle="N+1 Query Overload"
                  variant="root-cause"
                  delay={0.55}
                />
              </div>
            </div>
          </div>
        )}

        {/* EVIDENCE CARDS TAB */}
        {activeTab === "evidence" && (
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {evidence.map((e, idx) => {
              const { icon: Icon, color, bar, badge } = getEvidenceStyling(e.type);
              return (
                <div
                  key={e.id}
                  className="bg-white rounded-2xl border border-porcelain-200 p-4.5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2.5 rounded-xl border shrink-0', color)}>
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-graphite-900 leading-tight">{e.title}</h4>
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium mt-1 inline-block capitalize', badge)}>
                          {e.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-porcelain-100 px-2 py-1 rounded-md text-graphite-500 font-mono shrink-0 border border-porcelain-200">{e.source}</span>
                  </div>
                  <p className="text-xs text-graphite-600 leading-relaxed">{e.description}</p>
                  <div className="flex items-center gap-3 mt-auto pt-2 border-t border-porcelain-100">
                    <div className="flex-1 h-2 bg-porcelain-200 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${e.confidence}%` }}
                        className={cn('h-full rounded-full', bar)}
                      />
                    </div>
                    <span className="text-xs font-bold text-graphite-800 w-14 text-right">{e.confidence}% conf</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === "timeline" && (
          <div className="max-w-2xl mx-auto py-4">
            <div className="relative border-l-2 border-[#E2E8F0] ml-6 space-y-6">
              {investigationSteps.map((step, idx) => (
                <div key={step.id} className="relative pl-10">
                  <div className="absolute -left-[17px] top-1.5 bg-white border-2 border-porcelain-300 rounded-full p-1 shadow-sm">
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-lime-500" />
                    ) : step.status === 'running' ? (
                      <RefreshCw className="w-3.5 h-3.5 text-iris-500 animate-spin" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full bg-porcelain-300" />
                    )}
                  </div>
                  <div className="bg-white border border-porcelain-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-graphite-900">{step.label}</span>
                      <span className="text-[10px] bg-iris-50 text-iris-700 px-2 py-0.5 rounded-full font-semibold border border-iris-100">
                        {step.agent}
                      </span>
                    </div>
                    <p className="text-xs text-graphite-600">{step.description}</p>
                    {step.findings && step.findings.length > 0 && (
                      <ul className="mt-2.5 pt-2 border-t border-porcelain-100 space-y-1">
                        {step.findings.map((f: string, i: number) => (
                          <li key={i} className="text-[11px] text-graphite-700 flex items-start gap-1.5">
                            <span className="text-lime-600 font-bold">✓</span> {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ROOT CAUSE ANALYSIS TAB */}
        {activeTab === "rootcause" && (
          <div className="max-w-4xl mx-auto space-y-6">
            {rootCauseAnalysis ? (
            <div className="bg-white rounded-2xl border border-porcelain-200 p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-porcelain-100">
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Root Cause Finding</span>
                  <h3 className="text-lg font-bold text-graphite-900 mt-0.5">{rootCauseAnalysis.summary}</h3>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-emerald-700">{rootCauseAnalysis.confidence}%</span>
                  <p className="text-[11px] text-graphite-500 font-medium">Confidence Score</p>
                </div>
              </div>

              <div className="py-4 space-y-3">
                <h4 className="text-xs font-bold text-graphite-700 uppercase tracking-wider">Contributing Factors</h4>
                <ul className="space-y-2">
                  {(rootCauseAnalysis.contributingFactors || []).map((factor: string, i: number) => (
                    <li key={i} className="text-xs text-graphite-700 flex items-start gap-2 bg-porcelain-50 p-2.5 rounded-xl border border-porcelain-200">
                      <span className="text-champagne-700 font-bold mt-0.5">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-porcelain-100 space-y-3">
                <h4 className="text-xs font-bold text-graphite-700 uppercase tracking-wider">Recommended Remediation</h4>
                <div className="bg-lime-50/60 border border-lime-200 rounded-xl p-4 text-xs text-graphite-800 leading-relaxed">
                  <p className="font-semibold text-graphite-950 mb-1">Actionable Fix:</p>
                  {rootCauseAnalysis.recommendation}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button className="bg-lime-400 hover:bg-lime-300 text-graphite-950 font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-sm">
                    Revert Deployment v1.8.4
                  </button>
                  <button className="bg-porcelain-100 hover:bg-porcelain-200 text-graphite-800 font-semibold text-xs px-4 py-2 rounded-xl border border-porcelain-300 transition-colors">
                    Create Incident Task
                  </button>
                </div>
              </div>
            </div>
            ) : (
              <div className="bg-white rounded-2xl border border-porcelain-200 p-8 shadow-sm text-center">
                <BrainCircuit className="w-10 h-10 text-graphite-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-graphite-700">Root cause analysis not yet available</p>
                <p className="text-xs text-graphite-500 mt-1">Start an AI investigation to generate root cause analysis.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
