"use client";

import React, { useState } from "react";
import { Download, Share2, AlertCircle, Clock, ShieldAlert, FileText, CheckCircle2, ChevronRight, BarChart3, Database } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getIncidents, getIncidentReport } from "@/lib/api";
import { cn } from "@/lib/utils";
import { IncidentReport } from "@/lib/types";

export default function ReportsPage() {
  const { data: incidentList = [], isLoading: isLoadingIncidents } = useQuery({ queryKey: ['incidents'], queryFn: getIncidents });
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  // Auto-select the first incident if none selected
  const activeIncidentId = selectedIncidentId || (incidentList.length > 0 ? incidentList[0].id : null);

  const { data: reportData, isLoading: isLoadingReport, isError } = useQuery({
    queryKey: ['report', activeIncidentId],
    queryFn: () => getIncidentReport(activeIncidentId!),
    enabled: !!activeIncidentId,
  });

  const formatDate = (d: Date | string) => {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' UTC';
  };

  if (isLoadingIncidents) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-signal-500"></div></div>;

  if (!activeIncidentId || incidentList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-graphite-500">
        <FileText className="w-12 h-12 text-graphite-300" />
        <p className="text-lg font-medium">No incidents available for reports</p>
        <p className="text-sm">Reports will appear here once incidents are created and investigated.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-porcelain-50 overflow-auto">
      {/* Incident Selector */}
      <div className="bg-white border-b border-porcelain-200 px-6 py-3 flex items-center gap-3 shrink-0 shadow-sm">
        <label className="text-sm font-medium text-graphite-700">Select Incident:</label>
        <select
          value={activeIncidentId || ""}
          onChange={(e) => setSelectedIncidentId(e.target.value)}
          className="border border-porcelain-300 rounded-xl text-xs py-2 px-3 bg-white text-graphite-700 focus:outline-none focus:ring-2 focus:ring-signal-500/20 shadow-sm font-medium"
        >
          {incidentList.map((inc) => (
            <option key={inc.id} value={inc.id}>{inc.id} — {inc.title}</option>
          ))}
        </select>
      </div>

      {isLoadingReport ? (
        <div className="flex-1 flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-signal-500"></div></div>
      ) : isError || !reportData ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-graphite-500">
          <AlertCircle className="w-10 h-10 text-champagne-500" />
          <p className="text-sm font-medium">Could not load report for {activeIncidentId}</p>
          <p className="text-xs">The incident may not have been investigated yet.</p>
        </div>
      ) : (
      <>
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
                <p className="text-lg text-graphite-500 mt-1">{reportData.incidentId} • Incident Postmortem</p>
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
      </>
      )}
    </div>
  );
}
