"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Activity, Clock, CheckCircle2, BrainCircuit, ShieldAlert, Zap, ChevronRight, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getIncidents, getKpiMetrics, getServicesHealth } from "@/lib/api";
import Link from "next/link";

export default function DashboardPage() {
  const { data: incidents = [], isLoading: isLoading_incidents } = useQuery({ queryKey: ['incidents'], queryFn: getIncidents });
  const { data: kpiMetrics, isLoading: isLoading_kpi } = useQuery({ queryKey: ['kpiMetrics'], queryFn: getKpiMetrics });
  const { data: serviceHealthData = [], isLoading: isLoading_services } = useQuery({ queryKey: ['servicesHealth'], queryFn: getServicesHealth });

  const activeIncidents = incidents.filter(i => i.status !== "resolved").slice(0, 3);
  const recentInvestigations = incidents.filter(i => i.aiInvestigation && i.aiInvestigation.confidence).slice(0, 3);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (isLoading_incidents || isLoading_kpi || isLoading_services) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-signal-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen bg-porcelain-50">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-graphite-900 tracking-tight">Incident Overview</h1>
        <p className="text-graphite-500">Real-time system health and AI investigation status</p>
      </div>

      <motion.div 
        variants={container} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        <KpiCard title="Active Incidents" value={kpiMetrics?.activeIncidents ?? 0} icon={Activity} color="signal" />
        <KpiCard title="Critical Incidents" value={kpiMetrics?.criticalIncidents ?? 0} icon={ShieldAlert} color="champagne" />
        <KpiCard title="MTTD" value={`${kpiMetrics?.mttd ?? 0}m`} icon={Zap} color="signal" />
        <KpiCard title="MTTR" value={`${kpiMetrics?.mttr ?? 0}m`} icon={Clock} color="signal" />
        <KpiCard title="Investigations Running" value={kpiMetrics?.investigationsRunning ?? 0} icon={BrainCircuit} color="iris" />
        <KpiCard title="AI-Assisted Resolutions" value={kpiMetrics?.aiAssistedResolutions ?? 0} icon={CheckCircle2} color="lime" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={container} initial="hidden" animate="show" className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-graphite-900">Active Incidents</h2>
            <Link href="/incidents" className="text-sm text-signal-600 hover:text-signal-700 font-medium flex items-center">
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {activeIncidents.length === 0 ? (
              <div className="surface-card bg-white border border-dashed border-porcelain-300 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <div>
                  <p className="text-sm font-semibold text-graphite-800">All Systems Operational</p>
                  <p className="text-xs text-graphite-500 mt-1">No active incidents detected. Ingest an alert or report an incident to begin.</p>
                </div>
                <Link
                  href="/incidents"
                  className="mt-1 px-3 py-1.5 bg-signal-600 hover:bg-signal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Report Incident
                </Link>
              </div>
            ) : (
              activeIncidents.map((incident) => (
                <motion.div key={incident.id} variants={item} className="surface-card bg-white border border-porcelain-300 rounded-xl p-5 flex flex-col gap-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-sm text-graphite-500">{incident.id}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          incident.severity === "critical" ? "badge-critical bg-red-100 text-red-800" :
                          incident.severity === "high" ? "badge-high bg-champagne-100 text-champagne-800" :
                          incident.severity === "medium" ? "badge-medium bg-signal-100 text-signal-800" :
                          "badge-low bg-graphite-100 text-graphite-800"
                        )}>{incident.severity?.toUpperCase()}</span>
                      </div>
                      <Link href={`/incidents/${incident.id}`} className="text-lg font-medium text-graphite-900 hover:text-signal-600 transition-colors">
                        {incident.title}
                      </Link>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-graphite-900">{incident.service}</div>
                      <div className="text-xs text-graphite-500">{incident.duration || 0}m ago</div>
                    </div>
                  </div>
                  {incident.aiInvestigation?.active && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-iris-700 font-medium flex items-center gap-1.5">
                          <BrainCircuit className="w-3.5 h-3.5" />
                          {incident.aiInvestigation.stage || "Investigating"}
                        </span>
                        <span className="text-graphite-500">{incident.aiInvestigation.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-porcelain-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-iris-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${incident.aiInvestigation.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          <h2 className="text-lg font-medium text-graphite-900">Service Health</h2>
          <div className="grid grid-cols-1 gap-3">
            {serviceHealthData.length === 0 ? (
              <div className="surface-card bg-white border border-dashed border-porcelain-300 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-2 shadow-sm text-graphite-500 text-xs">
                <p className="font-semibold text-graphite-700">No Services Registered</p>
                <p>Configure monitored services or APM integrations to display real-time service health.</p>
              </div>
            ) : (
              serviceHealthData.map((service, i) => (
                <motion.div key={i} variants={item} className="surface-card bg-white border border-porcelain-300 rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      service.status === "healthy" ? "status-dot-healthy bg-lime-500" :
                      service.status === "degraded" ? "status-dot-warning bg-champagne-500" :
                      "status-dot-critical bg-red-500"
                    )} />
                    <span className="font-medium text-graphite-900 text-sm">{service.name}</span>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-graphite-500">Latency</span>
                      <span className="text-sm font-mono text-graphite-900">{service.latencyP99 ?? 0}ms</span>
                    </div>
                    <div className="flex flex-col items-end w-12">
                      <span className="text-xs text-graphite-500">Errors</span>
                      <span className={cn(
                        "text-sm font-mono",
                        (service.errorRate ?? 0) > 5 ? "text-red-600" : "text-graphite-900"
                      )}>{service.errorRate ?? 0}%</span>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-4 pt-4">
        <h2 className="text-lg font-medium text-graphite-900">Recent Investigations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentInvestigations.length === 0 ? (
            <div className="col-span-full surface-card bg-white border border-dashed border-porcelain-300 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-2 shadow-sm text-graphite-500 text-xs">
              <BrainCircuit className="w-8 h-8 text-graphite-400" />
              <p className="font-semibold text-graphite-700">No AI Investigations Conducted</p>
              <p>When an incident is reported with auto-investigation or investigated via the agent, root cause analyses will appear here.</p>
            </div>
          ) : (
            recentInvestigations.map(inc => (
              <motion.div key={inc.id} variants={item} className="surface-card bg-white border border-porcelain-300 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-graphite-500">{inc.id}</span>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                    Confidence: {inc.aiInvestigation?.confidence || 0}%
                  </span>
                </div>
                <h3 className="font-medium text-sm text-graphite-900">{inc.title}</h3>
                {inc.aiInvestigation?.rootCause && (
                  <p className="text-sm text-graphite-600 line-clamp-2">
                    <span className="font-medium text-graphite-700">Root Cause:</span> {inc.aiInvestigation.rootCause}
                  </p>
                )}
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, color }: any) {
  const colorMap: Record<string, string> = {
    signal: "text-signal-600 bg-signal-50",
    champagne: "text-champagne-600 bg-champagne-50",
    iris: "text-iris-600 bg-iris-50",
    lime: "text-lime-600 bg-lime-50",
  };
  const iconColorMap: Record<string, string> = {
    signal: "text-signal-600",
    champagne: "text-champagne-600",
    iris: "text-iris-600",
    lime: "text-lime-600",
  };

  return (
    <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="metric-card surface-card bg-white border border-porcelain-300 rounded-xl p-4 flex flex-col justify-between h-28 relative overflow-hidden shadow-sm">
      <div className="flex justify-between items-start z-10">
        <span className="text-sm font-medium text-graphite-600">{title}</span>
        <div className={cn("p-1.5 rounded-md", colorMap[color])}>
          <Icon className={cn("w-4 h-4", iconColorMap[color])} />
        </div>
      </div>
      <div className="z-10 mt-1">
        <span className="text-2xl font-semibold text-graphite-900">{value}</span>
      </div>
    </motion.div>
  );
}
