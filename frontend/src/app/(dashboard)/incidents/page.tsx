"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getIncidents, createIncident } from "@/lib/api";
import { Incident } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Search, Filter, BrainCircuit, CheckCircle2, AlertTriangle,
  Activity, ShieldAlert, Clock, ArrowRight, RefreshCw, Layers,
  Plus, X, Zap
} from "lucide-react";
import { TabNavigation, TabItem } from "@/components/ui/tab-navigation";

export default function IncidentsPage() {
  const {
    data: rawData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["incidents"],
    queryFn: getIncidents,
    retry: 1,
  });

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  // Report Incident Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newService, setNewService] = useState("");
  const [newSeverity, setNewSeverity] = useState<"critical" | "high" | "medium" | "low">("high");
  const [newEnvironment, setNewEnvironment] = useState<"production" | "staging" | "development">("production");
  const [newImpact, setNewImpact] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newService.trim()) {
      setCreateError("Title and service are required");
      return;
    }
    setCreateError("");
    setIsSubmitting(true);
    try {
      await createIncident({
        title: newTitle.trim(),
        service: newService.trim(),
        severity: newSeverity,
        environment: newEnvironment,
        impact: newImpact.trim() || undefined,
        autoInvestigate: true,
      });
      await refetch();
      setIsCreateModalOpen(false);
      setNewTitle("");
      setNewImpact("");
    } catch (err: any) {
      setCreateError(err?.message || "Failed to create incident");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Robust array extraction that handles any data shape (array, wrapper object, or empty state)
  const displayIncidents: Incident[] = useMemo(() => {
    if (Array.isArray(rawData) && rawData.length > 0) {
      return rawData;
    }
    if (rawData && typeof rawData === "object" && Array.isArray((rawData as any).incidents)) {
      return (rawData as any).incidents;
    }
    return [];
  }, [rawData]);

  // Tab counts
  const counts = useMemo(() => {
    return {
      all: displayIncidents.length,
      investigating: displayIncidents.filter((i) => i.status === "investigating").length,
      critical: displayIncidents.filter((i) => i.severity === "critical").length,
      resolved: displayIncidents.filter((i) => i.status === "resolved").length,
    };
  }, [displayIncidents]);

  const tabs: TabItem[] = [
    { id: "all", label: "All Incidents", icon: Layers, badge: counts.all },
    { id: "investigating", label: "Investigating", icon: BrainCircuit, badge: counts.investigating },
    { id: "critical", label: "Critical", icon: AlertTriangle, badge: counts.critical },
    { id: "resolved", label: "Resolved", icon: CheckCircle2, badge: counts.resolved },
  ];

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    return displayIncidents.filter((incident) => {
      // Tab filter
      if (activeTab === "investigating" && incident.status !== "investigating") return false;
      if (activeTab === "critical" && incident.severity !== "critical") return false;
      if (activeTab === "resolved" && incident.status !== "resolved") return false;

      // Severity dropdown filter
      if (severityFilter !== "all" && incident.severity !== severityFilter) return false;

      // Search filter
      const term = searchTerm.trim().toLowerCase();
      if (!term) return true;

      const titleMatch = (incident.title || "").toLowerCase().includes(term);
      const idMatch = (incident.id || "").toLowerCase().includes(term);
      const serviceMatch = (incident.service || "").toLowerCase().includes(term);
      const assigneeMatch = (incident.assignee || "").toLowerCase().includes(term);

      return titleMatch || idMatch || serviceMatch || assigneeMatch;
    });
  }, [displayIncidents, activeTab, severityFilter, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-porcelain-50 overflow-hidden">
      {/* ── Top Header ────────────────────────────────── */}
      <div className="bg-white border-b border-porcelain-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-red-50 p-2.5 rounded-2xl border border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold text-graphite-900 tracking-tight">Production Incidents</h1>
              <span className="bg-red-100 text-red-800 border border-red-200 text-xs font-bold px-2 py-0.5 rounded-md uppercase">
                {counts.critical} Critical
              </span>
              <span className="bg-champagne-100 text-champagne-800 border border-champagne-200 text-xs font-semibold px-2 py-0.5 rounded-md">
                {counts.investigating} Active
              </span>
            </div>
            <p className="text-xs text-graphite-500 mt-0.5">
              Real-time anomaly detection, telemetry correlations, and automated root-cause investigations
            </p>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-graphite-400" />
            <input
              type="text"
              placeholder="Search incidents or services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-porcelain-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-signal-500/20 focus:border-signal-500 w-60 sm:w-72 bg-white text-graphite-900 placeholder:text-graphite-400 shadow-sm"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="border border-porcelain-300 rounded-xl text-xs py-2 px-3 bg-white text-graphite-700 focus:outline-none focus:ring-2 focus:ring-signal-500/20 shadow-sm font-medium"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            onClick={() => refetch()}
            className="p-2 text-graphite-500 hover:text-graphite-800 bg-white border border-porcelain-300 rounded-xl shadow-sm transition-colors cursor-pointer"
            title="Refresh incidents"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin text-signal-600")} />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Report Incident</span>
          </button>
        </div>
      </div>

      {/* ── Shared Responsive Tab Navigation ───────────── */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* ── Table & Main Content ───────────────────────── */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white border border-porcelain-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-porcelain-50 border-b border-porcelain-200 text-graphite-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Incident ID</th>
                  <th className="px-5 py-3.5">Severity</th>
                  <th className="px-5 py-3.5">Title & Service</th>
                  <th className="px-5 py-3.5">Environment</th>
                  <th className="px-5 py-3.5">Duration</th>
                  <th className="px-5 py-3.5 max-w-xs">Impact Summary</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">AI Investigation</th>
                  <th className="px-5 py-3.5">Assignee</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-porcelain-100 font-medium">
                {filteredIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-12 text-center text-graphite-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-lime-500" />
                        <p className="text-sm font-bold text-graphite-800">No incidents found matching current filters</p>
                        <p className="text-xs text-graphite-500">Your services are running smoothly or filters returned zero results.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredIncidents.map((incident) => {
                    const ai = incident.aiInvestigation || { active: false, progress: 0 };
                    const isCrit = incident.severity === "critical";
                    const isHigh = incident.severity === "high";
                    const isMed = incident.severity === "medium";

                    return (
                      <tr
                        key={incident.id}
                        className="hover:bg-porcelain-50/80 transition-colors group cursor-pointer"
                      >
                        <td className="px-5 py-3.5 font-mono font-bold text-graphite-900">
                          <Link
                            href={`/incidents/${incident.id}`}
                            className="hover:text-signal-600 transition-colors flex items-center gap-1.5"
                          >
                            <span>{incident.id}</span>
                          </Link>
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={cn(
                              "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                              isCrit
                                ? "bg-red-50 text-red-700 border-red-200"
                                : isHigh
                                ? "bg-champagne-50 text-champagne-800 border-champagne-200"
                                : isMed
                                ? "bg-signal-50 text-signal-700 border-signal-200"
                                : "bg-porcelain-100 text-graphite-700 border-porcelain-200"
                            )}
                          >
                            {incident.severity?.toUpperCase() || "LOW"}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <Link href={`/incidents/${incident.id}`} className="block">
                            <span className="font-bold text-graphite-900 group-hover:text-signal-600 transition-colors text-xs">
                              {incident.title}
                            </span>
                            <span className="block text-[11px] text-graphite-400 font-mono mt-0.5">
                              {incident.service}
                            </span>
                          </Link>
                        </td>

                        <td className="px-5 py-3.5 text-graphite-600 capitalize">
                          {incident.environment || "production"}
                        </td>

                        <td className="px-5 py-3.5 text-graphite-600 font-mono">
                          {incident.duration ? `${incident.duration}m` : "Active"}
                        </td>

                        <td
                          className="px-5 py-3.5 text-graphite-600 max-w-xs truncate"
                          title={incident.impact}
                        >
                          {incident.impact || "Service degradation detected"}
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full",
                                incident.status === "resolved"
                                  ? "bg-lime-500"
                                  : incident.status === "investigating"
                                  ? "bg-champagne-500 animate-pulse"
                                  : "bg-signal-500"
                              )}
                            />
                            <span className="capitalize font-semibold text-graphite-800">
                              {incident.status}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          {ai.active ? (
                            <div className="flex items-center gap-2 w-32">
                              <BrainCircuit className="w-3.5 h-3.5 text-iris-600 shrink-0" />
                              <div className="flex-1 bg-porcelain-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-iris-500 h-1.5 rounded-full"
                                  style={{ width: `${ai.progress || 0}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-graphite-500 font-mono w-6 text-right">
                                {ai.progress || 0}%
                              </span>
                            </div>
                          ) : ai.progress === 100 || incident.status === "resolved" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-lime-800 bg-lime-50 px-2.5 py-0.5 rounded-full border border-lime-200">
                              <CheckCircle2 className="w-3 h-3 text-lime-600" /> Complete
                            </span>
                          ) : (
                            <span className="text-graphite-400 text-[11px]">Not started</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-graphite-700">
                          {incident.assignee || "Unassigned"}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={`/incidents/${incident.id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-signal-600 hover:text-signal-700 bg-signal-50 hover:bg-signal-100 border border-signal-200 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            Investigate <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Report / Simulate Incident Modal ────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-porcelain-300 space-y-4">
            <div className="flex items-center justify-between border-b border-porcelain-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-50 border border-red-200 rounded-xl text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-graphite-950 text-base">Report Incident</h3>
                  <p className="text-[11px] text-graphite-500">Dispatch a live production incident to initiate AI investigation</p>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 text-graphite-400 hover:text-graphite-900 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-1">
              {createError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-graphite-700 mb-1">Incident Title *</label>
                <input
                  type="text"
                  placeholder="e.g. 504 Gateway Timeout during checkout authorization"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-porcelain-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-signal-500/20 focus:border-signal-500 bg-white text-graphite-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-graphite-700 mb-1">Affected Service *</label>
                  <input
                    type="text"
                    placeholder="e.g. checkout-service"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-porcelain-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-signal-500/20 bg-white text-graphite-900 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-graphite-700 mb-1">Severity *</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-porcelain-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-signal-500/20 bg-white text-graphite-900 font-medium"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-graphite-700 mb-1">Environment</label>
                  <select
                    value={newEnvironment}
                    onChange={(e) => setNewEnvironment(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-porcelain-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-signal-500/20 bg-white text-graphite-900 font-medium"
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-graphite-700 mb-1">AI Autonomous Investigation</label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-graphite-700 font-medium">Auto-dispatches 7 agents</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-graphite-700 mb-1">Impact Description</label>
                <textarea
                  rows={2}
                  placeholder="Detail symptoms, user impact, or telemetry alerts observed..."
                  value={newImpact}
                  onChange={(e) => setNewImpact(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-porcelain-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-signal-500/20 focus:border-signal-500 bg-white text-graphite-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-porcelain-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-2 text-xs text-graphite-600 hover:text-graphite-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isSubmitting ? "Dispatching..." : "Create & Launch Investigation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
