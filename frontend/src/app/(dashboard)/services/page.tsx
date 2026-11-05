"use client";

import React, { useState } from "react";
import {
  Server, Activity, Shield, Database, Network,
  Layers, BarChart2, Filter, CheckCircle2, AlertTriangle, AlertCircle
} from "lucide-react";
import { serviceHealth } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { TabNavigation, TabItem } from "@/components/ui/tab-navigation";
import { ServiceNodeCard } from "@/components/ui/service-node-card";
import { FlowConnector, BranchConnector } from "@/components/ui/flow-connector";

// Helper to generate sparkline data
const generateSparkline = (status: string) => {
  const base = status === "healthy" ? 20 : status === "degraded" ? 60 : 100;
  const variance = status === "healthy" ? 5 : 20;
  return Array.from({ length: 15 }, (_, i) => ({
    time: i,
    val: base + (Math.random() - 0.5) * variance + (status === "degraded" && i > 10 ? 40 : 0)
  }));
};

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState("topology");
  const [environment, setEnvironment] = useState("Production");

  const tabs: TabItem[] = [
    { id: "topology", label: "Service Topology", icon: Network },
    { id: "telemetry", label: "Health & Telemetry", icon: BarChart2, badge: serviceHealth.length },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-lime-700 bg-lime-50 border-lime-200";
      case "degraded": return "text-champagne-800 bg-champagne-50 border-champagne-200";
      case "down": return "text-red-700 bg-red-50 border-red-200";
      default: return "text-graphite-600 bg-porcelain-100 border-porcelain-200";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "healthy": return "bg-lime-500";
      case "degraded": return "bg-champagne-500";
      case "down": return "bg-red-500";
      default: return "bg-graphite-400";
    }
  };

  return (
    <div className="flex flex-col h-full bg-porcelain-50 overflow-hidden">
      {/* ── Top Header ────────────────────────────────── */}
      <div className="bg-white border-b border-porcelain-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-signal-100 p-2.5 rounded-2xl border border-signal-200">
            <Server className="w-5 h-5 text-signal-600" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base font-bold text-graphite-900 tracking-tight">Services Overview</h1>
              <span className="bg-lime-50 text-lime-800 border border-lime-200 text-xs font-semibold px-2 py-0.5 rounded-md">
                {serviceHealth.filter(s => s.status === "healthy").length} / {serviceHealth.length} Healthy
              </span>
            </div>
            <p className="text-xs text-graphite-500 mt-0.5">Live service health, inter-service dependency graph, and latency telemetry</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-porcelain-100 border border-porcelain-300 rounded-xl p-1">
            {["Production", "Staging", "Dev"].map((env) => (
              <button
                key={env}
                onClick={() => setEnvironment(env)}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-lg transition-all",
                  environment === env
                    ? "bg-white text-graphite-900 shadow-sm"
                    : "text-graphite-500 hover:text-graphite-800"
                )}
              >
                {env}
              </button>
            ))}
          </div>

          <button className="p-2 text-graphite-500 hover:text-graphite-800 bg-white border border-porcelain-300 rounded-xl shadow-sm transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Shared Responsive Tab Navigation ───────────── */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* ── Main Content Area ──────────────────────────── */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "topology" && (
          <div className="max-w-5xl mx-auto flex flex-col items-center py-4">
            {/* Summary counters strip */}
            <div className="w-full flex items-center justify-between mb-8 pb-4 border-b border-porcelain-200 px-2">
              <div className="flex items-center gap-5 text-xs font-semibold">
                <div className="flex items-center gap-2 text-graphite-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-lime-500" />
                  Healthy: {serviceHealth.filter(s => s.status === 'healthy').length}
                </div>
                <div className="flex items-center gap-2 text-graphite-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-champagne-500" />
                  Degraded: {serviceHealth.filter(s => s.status === 'degraded').length}
                </div>
                <div className="flex items-center gap-2 text-graphite-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  Down: {serviceHealth.filter(s => s.status === 'down').length}
                </div>
              </div>
              <span className="text-xs text-graphite-400 font-mono">
                Environment: {environment}
              </span>
            </div>

            {/* Topology Tree matching reference screenshot */}
            <div className="flex flex-col items-center w-full">
              {/* Root Node: API Gateway */}
              <ServiceNodeCard
                icon={Server}
                title="API Gateway"
                subtitle="Healthy · 45ms P99"
                variant="healthy"
                badge="Ingress"
                delay={0}
              />

              {/* Standardized 1-to-2 Branch Connector */}
              <BranchConnector childrenCount={2} />

              {/* Tier 2: Auth Service (Left) & Payment Service (Right) */}
              <div className="flex items-start justify-center gap-8 sm:gap-20 w-full">
                {/* Left Branch: Auth Service -> Redis Cache */}
                <div className="flex flex-col items-center">
                  <ServiceNodeCard
                    icon={Shield}
                    title="Auth Service"
                    subtitle="Healthy · 28ms P99"
                    variant="healthy"
                    delay={0.15}
                  />

                  <FlowConnector length={24} vertical withArrow />

                  <ServiceNodeCard
                    icon={Database}
                    title="Redis Session Cache"
                    subtitle="Healthy · 2ms latency"
                    variant="healthy"
                    delay={0.25}
                  />
                </div>

                {/* Right Branch: Payment Service -> User Service -> PostgreSQL */}
                <div className="flex flex-col items-center">
                  <ServiceNodeCard
                    icon={Activity}
                    title="Payment Service"
                    subtitle="Degraded · 2,340ms P99"
                    variant="degraded"
                    delay={0.2}
                  />

                  <FlowConnector length={24} vertical withArrow />

                  <ServiceNodeCard
                    icon={Server}
                    title="User Service"
                    subtitle="Degraded · 1,890ms P99"
                    variant="degraded"
                    delay={0.3}
                  />

                  <FlowConnector length={24} vertical withArrow />

                  <ServiceNodeCard
                    icon={Database}
                    title="PostgreSQL Cluster"
                    subtitle="CPU 88% · High Latency"
                    variant="database"
                    delay={0.4}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "telemetry" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
            {serviceHealth.map((service) => (
              <div
                key={service.name}
                className="bg-white rounded-2xl border border-porcelain-200 p-5 flex flex-col shadow-sm hover:shadow-md hover:border-porcelain-300 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-base font-bold text-graphite-900 mb-1.5 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-graphite-400" />
                      {service.name}
                    </h3>
                    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize", getStatusColor(service.status))}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", getStatusDot(service.status))} />
                      {service.status}
                    </div>
                  </div>

                  {/* Sparkline */}
                  <div className="w-18 h-8">
                    <ResponsiveContainer width={72} height={32}>
                      <LineChart data={generateSparkline(service.status)}>
                        <Line
                          type="monotone"
                          dataKey="val"
                          stroke={service.status === 'healthy' ? '#84cc16' : (service.status === 'degraded' ? '#f59e0b' : '#ef4444')}
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 my-auto py-3 border-y border-porcelain-100">
                  <div>
                    <p className="text-[11px] text-graphite-400 font-medium">P99 Latency</p>
                    <p className="text-sm font-bold font-mono text-graphite-900 mt-0.5">{service.latencyP99}ms</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-graphite-400 font-medium">Error Rate</p>
                    <p className={cn("text-sm font-bold font-mono mt-0.5", service.errorRate > 1 ? "text-champagne-700" : "text-graphite-900")}>
                      {service.errorRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-graphite-400 font-medium">Requests</p>
                    <p className="text-sm font-bold font-mono text-graphite-900 mt-0.5">{service.requestRate}/s</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-graphite-400 font-medium">Uptime</p>
                    <p className="text-sm font-bold font-mono text-graphite-900 mt-0.5">{service.uptime}%</p>
                  </div>
                </div>

                <div className="pt-3.5 mt-2">
                  <p className="text-[11px] text-graphite-400 font-medium mb-1.5">Dependencies</p>
                  <div className="flex flex-wrap gap-1.5">
                    {service.dependencies.map((dep) => (
                      <span
                        key={dep}
                        className="text-[10px] text-graphite-600 bg-porcelain-100 border border-porcelain-200 px-2 py-0.5 rounded-md font-mono"
                      >
                        {dep}
                      </span>
                    ))}
                    {service.dependencies.length === 0 && (
                      <span className="text-[10px] text-graphite-400 italic">None</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
