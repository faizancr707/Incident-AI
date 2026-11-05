"use client";

import React from "react";
import { Download, Share2, AlertCircle, Clock, ShieldAlert, FileText, CheckCircle2, ChevronRight, BarChart3, Database } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getIncidents } from "@/lib/api";
import { incidents, investigationSteps, rootCauseAnalysis } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { IncidentReport } from "@/lib/types";

// Construct report data inline
const reportData: IncidentReport = {
  incidentId: "INC-4821",
  executiveSummary: "At 14:32 UTC, the Payment API experienced a severe latency spike and elevated error rates, causing payment processing degradation. The incident was detected by anomaly detection systems and automatically investigated by AI agents. The root cause was identified as an N+1 query pattern introduced in the UserService during the v1.8.4 deployment 18 minutes prior. The incident was mitigated by reverting the data access pattern and resolved entirely after 18 minutes of impact.",
  impact: {
    description: "Payment processing degraded — 23% of transactions failing due to timeout.",
    requestsAffected: 14832,
    usersAffected: 3200,
    revenueImpact: "~$45,000"
  },
  timeline: [
    { timestamp: new Date(Date.now() - 18 * 60000), event: "Anomaly detection triggered on Payment API latency. Incident INC-4821 created." },
    { timestamp: new Date(Date.now() - 17 * 60000), event: "Log Analyst agent identified 847 timeout errors in UserService calls." },
    { timestamp: new Date(Date.now() - 15 * 60000), event: "Trace Analyst agent sampled distributed traces, pointing to UserService database queries." },
    { timestamp: new Date(Date.now() - 13 * 60000), event: "GitHub Analyst agent correlated issue with deployment v1.8.4 (18m prior)." },
    { timestamp: new Date(Date.now() - 10 * 60000), event: "Database Analyst agent confirmed query count increased 4.7× (N+1 pattern)." },
    { timestamp: new Date(Date.now() - 7 * 60000), event: "Root Cause Analyst generated hypothesis linking deployment v1.8.4 to latency." },
    { timestamp: new Date(Date.now() - 2 * 60000), event: "Mitigation applied: rolled back UserService to v1.8.3." },
    { timestamp: new Date(), event: "Incident resolved. Metrics returned to baseline." }
  ],
  rootCause: rootCauseAnalysis,
  resolution: {
    steps: [
      "Rolled back UserService deployment from v1.8.4 to v1.8.3",
      "Cleared application-level query caches",
      "Monitored database CPU and connection pool metrics to confirm recovery"
    ],
    resolvedBy: "Sarah Chen (Automated Runbook)",
    resolvedAt: new Date()
  },
  prevention: [
    "Re-implement UserService batch query pattern using DataLoader",
    "Add query count threshold alerts to data access layer",
    "Enforce load testing in CI/CD pipeline for data access changes"
  ],
  aiInvestigationTrace: investigationSteps,
  confidence: 92,
  limitations: [
    "Could not definitively measure exact number of lost transactions due to missing telemetry in edge gateway.",
    "Database query samples were limited to 10% sampling rate."
  ],
  sourceReferences: [
    { title: "Deployment v1.8.4", url: "https://github.com/org/repo/deployments/184", type: "deployment" },
    { title: "PR #1847", url: "https://github.com/org/repo/pull/1847", type: "code_change" },
    { title: "INC-4102 Postmortem", url: "/knowledge/kb5", type: "postmortem" }
  ]
};

export default function ReportsPage() {
  const { data: incidentList = incidents, isLoading } = useQuery({ queryKey: ['incidents'], queryFn: getIncidents });

  const formatDate = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' UTC';

    if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-signal-500"></div></div>;

  return (
    <div className="flex flex-col h-full bg-porcelain-50 overflow-auto">
      {/* Report Header - Dark theme for app context */}
      <div className="sticky top-0 z-10 bg-graphite-950 flex items-center justify-between p-4 px-6 border-b border-graphite-800 shrink-0">
        <h1 className="text-xl font-medium text-porcelain-50">Incident Report — {reportData.incidentId}</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-graphite-800 text-porcelain-100 hover:bg-graphite-700 text-sm font-medium transition-colors border border-graphite-700">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-porcelain-100 text-graphite-950 hover:bg-porcelain-200 text-sm font-medium transition-colors">
            <Share2 className="w-4 h-4" />
            Share Report
          </button>
        </div>
      </div>

      {/* Report Body - Document Style */}
      <div className="flex-1 p-8 text-graphite-900 font-sans">
        <div className="max-w-4xl mx-auto bg-white border border-porcelain-300 rounded-lg shadow-sm">
          
          {/* Doc Header */}
          <div className="p-10 border-b border-porcelain-200 pb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-graphite-950 font-serif">Postmortem Report</h2>
                <p className="text-lg text-graphite-500 mt-1">{reportData.incidentId} • Payment API Latency Spike</p>
              </div>
              <div className="text-right text-sm text-graphite-500">
                <p>Date: {new Date().toLocaleDateString()}</p>
                <p>Status: <span className="text-lime-600 font-medium">Resolved</span></p>
              </div>
            </div>
          </div>

          <div className="p-10 space-y-10">
            {/* Executive Summary */}
            <section>
              <h3 className="text-xl font-bold text-graphite-900 font-serif mb-4 flex items-center gap-2 border-b border-porcelain-200 pb-2">
                Executive Summary
              </h3>
              <p className="text-graphite-700 leading-relaxed">
                {reportData.executiveSummary}
              </p>
            </section>

            {/* Impact */}
            <section>
              <h3 className="text-xl font-bold text-graphite-900 font-serif mb-4 flex items-center gap-2 border-b border-porcelain-200 pb-2">
                Impact
              </h3>
              <div className="bg-porcelain-50 rounded-md p-4 border border-porcelain-200">
                <p className="font-medium text-graphite-900 mb-3">{reportData.impact.description}</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-graphite-500">Requests Affected</p>
                    <p className="text-xl font-semibold text-graphite-900">{reportData.impact.requestsAffected.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-graphite-500">Users Affected</p>
                    <p className="text-xl font-semibold text-graphite-900">~{reportData.impact.usersAffected.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-graphite-500">Estimated Revenue Impact</p>
                    <p className="text-xl font-semibold text-graphite-900">{reportData.impact.revenueImpact}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Root Cause & Evidence */}
            <section>
              <h3 className="text-xl font-bold text-graphite-900 font-serif mb-4 flex items-center gap-2 border-b border-porcelain-200 pb-2">
                Root Cause Analysis
              </h3>
              <div className="mb-4">
                <p className="font-semibold text-graphite-900">{reportData.rootCause.summary}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-graphite-500">AI Confidence:</span>
                  <div className="w-32 h-2 bg-porcelain-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${reportData.confidence}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-emerald-700">{reportData.confidence}%</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm font-semibold text-graphite-700 uppercase tracking-wider">Contributing Factors</p>
                <ul className="list-disc pl-5 space-y-1 text-graphite-700">
                  {reportData.rootCause.contributingFactors.map((factor, i) => (
                    <li key={i}>{factor}</li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Timeline */}
            <section>
              <h3 className="text-xl font-bold text-graphite-900 font-serif mb-4 flex items-center gap-2 border-b border-porcelain-200 pb-2">
                Timeline
              </h3>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-porcelain-300 before:to-transparent">
                {reportData.timeline.map((item, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-porcelain-200 text-graphite-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-porcelain-200 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <time className="text-sm font-mono font-medium text-signal-600">{formatDate(item.timestamp)}</time>
                      </div>
                      <div className="text-graphite-700 text-sm">{item.event}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Resolution & Prevention */}
            <section className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-graphite-900 font-serif mb-4 flex items-center gap-2 border-b border-porcelain-200 pb-2">
                  Resolution
                </h3>
                <ul className="space-y-2 text-graphite-700 mb-4">
                  {reportData.resolution.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-lime-600 mt-1 shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-graphite-500">Resolved by: {reportData.resolution.resolvedBy}</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-graphite-900 font-serif mb-4 flex items-center gap-2 border-b border-porcelain-200 pb-2">
                  Prevention Items
                </h3>
                <ul className="space-y-2 text-graphite-700">
                  {reportData.prevention.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-graphite-400 mt-1 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* AI Investigation Trace & References */}
            <section className="border-t border-porcelain-200 pt-8 mt-8">
              <h3 className="text-sm font-semibold text-graphite-500 uppercase tracking-wider mb-4">
                References & AI Trace
              </h3>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="font-medium text-graphite-700 mb-2">Sources Referenced:</p>
                  <ul className="space-y-1">
                    {reportData.sourceReferences.map((ref, i) => (
                      <li key={i}>
                        <a href={ref.url} className="text-signal-600 hover:underline inline-flex items-center gap-1">
                          {ref.title} <span className="text-graphite-400 font-mono text-xs border border-porcelain-200 rounded px-1 bg-porcelain-50">{ref.type}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-graphite-700 mb-2">Investigation Limitations:</p>
                  <ul className="list-disc pl-4 text-graphite-600 space-y-1">
                    {reportData.limitations.map((limit, i) => (
                      <li key={i}>{limit}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
