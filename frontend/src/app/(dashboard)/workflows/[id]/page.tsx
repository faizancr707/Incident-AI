"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Pause,
  RefreshCw,
  GitBranch,
  GitPullRequest,
  Shield,
  Bot,
  Zap,
  Check,
  AlertTriangle,
  FileText,
  UserCheck,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { getWorkflowById, approveWorkflow, retryWorkflow } from "@/lib/api";

const MOCK_WORKFLOW_MAP: Record<string, any> = {
  "wf-101": {
    id: "wf-101",
    workflowType: "ci_cd_pipeline",
    status: "completed",
    triggerEvent: {
      id: "evt-gh-1",
      provider: "github",
      eventType: "push",
      action: "push",
      repository: { name: "api-gateway", fullName: "numora/api-gateway", url: "https://github.com/numora/api-gateway" },
      sender: { login: "sarah-chen" },
      commitSha: "8f4b12ae398bb2c1f092305dae08711e",
      ref: "refs/heads/main",
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
    currentNode: "completed",
    retryCount: 0,
    maxRetries: 5,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
    nodes: [
      {
        id: "receive_event",
        name: "Receive Event",
        status: "completed",
        agent: "event-receiver",
        duration: 450,
        output: { provider: "github", eventType: "push", repo: "numora/api-gateway", ref: "refs/heads/main" },
      },
      {
        id: "validate_code",
        name: "Validate Code",
        status: "completed",
        agent: "code-validator",
        duration: 1200,
        output: { filesChanged: 6, linesChanged: 180, conventionsChecked: true, linterErrors: 0 },
      },
      {
        id: "run_tests",
        name: "Run Tests",
        status: "completed",
        agent: "test-runner",
        duration: 2400,
        output: { totalTests: 184, passed: 184, failed: 0, testCoverage: "92.4%", executionTime: "2.4s" },
      },
      {
        id: "security_scan",
        name: "Security Scan",
        status: "completed",
        agent: "security-scanner",
        duration: 1100,
        output: { dependenciesScanned: 248, vulnerabilities: 0, severity: "none", secretLeaksDetected: false },
      },
      {
        id: "deploy_check",
        name: "Deploy Readiness",
        status: "completed",
        agent: "deploy-checker",
        duration: 800,
        output: { ready: true, blockers: [], autoApproved: true },
      },
      {
        id: "generate_report",
        name: "Generate Report",
        status: "completed",
        agent: "report-generator",
        duration: 900,
        output: { reportId: "rep-cicd-101", format: "json", destination: "artifacts" },
      },
    ],
    checkpoints: [
      { id: "cp-1", nodeId: "receive_event", timestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString() },
      { id: "cp-2", nodeId: "validate_code", timestamp: new Date(Date.now() - 23.8 * 60 * 1000).toISOString() },
      { id: "cp-3", nodeId: "run_tests", timestamp: new Date(Date.now() - 23.5 * 60 * 1000).toISOString() },
      { id: "cp-4", nodeId: "security_scan", timestamp: new Date(Date.now() - 23.3 * 60 * 1000).toISOString() },
      { id: "cp-5", nodeId: "deploy_check", timestamp: new Date(Date.now() - 23.1 * 60 * 1000).toISOString() },
      { id: "cp-6", nodeId: "generate_report", timestamp: new Date(Date.now() - 23.0 * 60 * 1000).toISOString() },
    ],
    result: {
      summary: "CI/CD pipeline executed smoothly for main branch push. 184 test assertions passed.",
      confidence: 0.98,
      recommendations: [
        "Maintain current zero-vulnerability package dependencies",
        "Pipeline passed all automated security checks and code standards",
      ],
    },
  },
  "wf-104": {
    id: "wf-104",
    workflowType: "deploy_monitor",
    status: "waiting_approval",
    triggerEvent: {
      id: "evt-vc-1",
      provider: "vercel",
      eventType: "deployment",
      action: "created",
      repository: { name: "investigator-web", fullName: "numora/investigator-web", url: "https://github.com/numora/investigator-web" },
      sender: { login: "sarah-chen" },
      ref: "refs/heads/main",
      timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    },
    currentNode: "approval_gate",
    retryCount: 0,
    maxRetries: 5,
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    nodes: [
      { id: "monitor_deploy", name: "Monitor Deployment", status: "completed", agent: "deploy-monitor", duration: 1100, output: { deploymentId: "dpl_981ab2", environment: "production" } },
      { id: "health_check", name: "Health Check", status: "completed", agent: "health-checker", duration: 3200, output: { healthy: false, p99Latency: "480ms", errorRate: "4.8%", http5xxCount: 42 } },
      { id: "rollback_decision", name: "Rollback Decision", status: "completed", agent: "rollback-advisor", duration: 700, output: { recommended: "rollback", reason: "Error rate exceeds 1.5% threshold" } },
      { id: "approval_gate", name: "Human Approval Gate", status: "running", agent: "human-gate", output: { awaitingUserRole: "admin_or_owner", prompt: "Awaiting engineer sign-off to execute automated rollback to release v2.4.1" } },
      { id: "generate_report", name: "Generate Report", status: "pending", agent: "report-generator" },
    ],
    checkpoints: [
      { id: "cp-1", nodeId: "monitor_deploy", timestamp: new Date(Date.now() - 34 * 60 * 1000).toISOString() },
      { id: "cp-2", nodeId: "health_check", timestamp: new Date(Date.now() - 31 * 60 * 1000).toISOString() },
      { id: "cp-3", nodeId: "rollback_decision", timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
    ],
  },
};

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [workflow, setWorkflow] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await getWorkflowById(id);
        if (isMounted && res && res.workflow) {
          setWorkflow(res.workflow);
          setLoading(false);
          return;
        }
      } catch (err) {
        // Fallback to mock
      }

      if (isMounted) {
        const fallback = MOCK_WORKFLOW_MAP[id] || {
          ...MOCK_WORKFLOW_MAP["wf-101"],
          id,
        };
        setWorkflow(fallback);
        setLoading(false);
      }
    }

    if (id) {
      load();
    }
  }, [id]);

  const toggleNodeExpand = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await approveWorkflow(id);
      setWorkflow((prev: any) => ({
        ...prev,
        status: "completed",
        nodes: prev.nodes.map((n: any) =>
          n.id === "approval_gate" ? { ...n, status: "completed" } : n
        ),
      }));
    } catch (err) {
      alert("Error approving workflow");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetry = async () => {
    setActionLoading(true);
    try {
      await retryWorkflow(id);
      alert("Workflow re-queued for execution!");
      router.push("/workflows");
    } catch (err) {
      alert("Error retrying workflow");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !workflow) {
    return (
      <div className="min-h-screen bg-porcelain-100 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-graphite-600">
          <RefreshCw className="w-5 h-5 animate-spin text-graphite-900" />
          <span className="text-sm font-medium">Loading LangGraph state graph...</span>
        </div>
      </div>
    );
  }

  const event = workflow.triggerEvent;

  return (
    <div className="min-h-screen bg-porcelain-100/60 pb-16">
      {/* Top Banner */}
      <div className="bg-white border-b border-porcelain-200 px-6 py-6 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/workflows"
            className="inline-flex items-center gap-2 text-xs font-semibold text-graphite-500 hover:text-graphite-900 mb-3 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Workflows
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-2xl font-bold font-mono text-graphite-950">
                  {workflow.id}
                </span>
                <span className="text-xs uppercase tracking-wider font-bold px-2.5 py-1 rounded-md bg-graphite-900 text-porcelain-100 font-mono">
                  {workflow.workflowType}
                </span>
                {workflow.status === "completed" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Completed
                  </span>
                )}
                {workflow.status === "running" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300 animate-pulse">
                    <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" /> In Progress
                  </span>
                )}
                {workflow.status === "waiting_approval" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                    <Pause className="w-4 h-4 text-amber-700" /> Awaiting Human Approval
                  </span>
                )}
                {workflow.status === "failed" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                    <XCircle className="w-4 h-4 text-red-600" /> Failed
                  </span>
                )}
              </div>
              <p className="text-sm text-graphite-500 mt-1">
                Triggered by webhook from <span className="font-semibold text-graphite-800 uppercase">{event.provider}</span> on repository <span className="font-mono text-graphite-900 font-bold">{event.repository?.fullName}</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {workflow.status === "waiting_approval" && (
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  Approve Execution
                </button>
              )}
              {workflow.status === "failed" && (
                <button
                  onClick={handleRetry}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Failed Workflow
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Trigger Event Meta Card */}
        <div className="bg-white border border-porcelain-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-graphite-400 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-lime-500" />
            Trigger Event Details
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-porcelain-50 p-3 rounded-lg border border-porcelain-200">
              <span className="text-graphite-400 block text-[10px] uppercase">Repository</span>
              <span className="font-bold text-graphite-900">{event.repository?.fullName}</span>
            </div>
            <div className="bg-porcelain-50 p-3 rounded-lg border border-porcelain-200">
              <span className="text-graphite-400 block text-[10px] uppercase">Ref / Branch</span>
              <span className="font-bold text-graphite-900">{event.ref || "default"}</span>
            </div>
            <div className="bg-porcelain-50 p-3 rounded-lg border border-porcelain-200">
              <span className="text-graphite-400 block text-[10px] uppercase">Commit SHA</span>
              <span className="font-bold text-graphite-900">
                {event.commitSha ? event.commitSha.slice(0, 8) : "N/A"}
              </span>
            </div>
            <div className="bg-porcelain-50 p-3 rounded-lg border border-porcelain-200">
              <span className="text-graphite-400 block text-[10px] uppercase">Triggered By</span>
              <span className="font-bold text-graphite-900">@{event.sender?.login}</span>
            </div>
          </div>
        </div>

        {/* AI Result Banner (if completed) */}
        {workflow.result && (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-emerald-950">
                  LangGraph Synthesis: {workflow.result.summary}
                </h3>
                <p className="text-xs text-emerald-800">
                  Confidence Score: <span className="font-bold font-mono">{(workflow.result.confidence * 100).toFixed(0)}%</span>
                </p>
                {workflow.result.recommendations && workflow.result.recommendations.length > 0 && (
                  <div className="mt-2.5">
                    <span className="text-xs font-semibold text-emerald-950 block mb-1">
                      Actionable Recommendations:
                    </span>
                    <ul className="list-disc list-inside text-xs text-emerald-900 space-y-0.5">
                      {workflow.result.recommendations.map((rec: string, i: number) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* LangGraph StateGraph Node Pipeline Execution */}
        <div className="bg-white border border-porcelain-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-graphite-950 flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-600" />
              LangGraph Multi-Agent Execution Pipeline
            </h2>
            <span className="text-xs font-mono text-graphite-400">
              {workflow.nodes.filter((n: any) => n.status === "completed").length} / {workflow.nodes.length} nodes finished
            </span>
          </div>

          <div className="space-y-4">
            {workflow.nodes.map((node: any, idx: number) => {
              const isDone = node.status === "completed";
              const isRunning = node.status === "running";
              const isFailed = node.status === "failed";
              const isPending = node.status === "pending";
              const isExpanded = !!expandedNodes[node.id];

              return (
                <div
                  key={node.id}
                  className={cn(
                    "border rounded-xl p-4 transition",
                    isDone && "bg-white border-porcelain-200",
                    isRunning && "bg-blue-50/40 border-blue-300 ring-2 ring-blue-100",
                    isFailed && "bg-red-50/40 border-red-300",
                    isPending && "bg-porcelain-50/50 border-porcelain-200 opacity-60"
                  )}
                >
                  <div
                    onClick={() => toggleNodeExpand(node.id)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                          isDone && "bg-emerald-600 text-white",
                          isRunning && "bg-blue-600 text-white animate-pulse",
                          isFailed && "bg-red-600 text-white",
                          isPending && "bg-graphite-200 text-graphite-600"
                        )}
                      >
                        {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-graphite-900">{node.name}</span>
                          {node.agent && (
                            <span className="text-[11px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                              agent:{node.agent}
                            </span>
                          )}
                        </div>
                        {node.duration && (
                          <span className="text-[11px] text-graphite-400 font-mono">
                            Duration: {node.duration}ms
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-graphite-400">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </div>

                  {isExpanded && node.output && (
                    <div className="mt-3.5 pt-3 border-t border-porcelain-200 text-xs">
                      <span className="font-semibold text-graphite-600 block mb-1">Node Output Payload:</span>
                      <pre className="bg-graphite-950 text-porcelain-100 p-3 rounded-lg overflow-x-auto text-[11px] font-mono">
                        {JSON.stringify(node.output, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* State Checkpoints */}
        {workflow.checkpoints && workflow.checkpoints.length > 0 && (
          <div className="bg-white border border-porcelain-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-graphite-400 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              State Checkpoint History
            </h2>
            <div className="space-y-2">
              {workflow.checkpoints.map((cp: any, i: number) => (
                <div
                  key={cp.id || i}
                  className="flex items-center justify-between text-xs py-1.5 px-3 bg-porcelain-50 rounded-lg border border-porcelain-200/80 font-mono"
                >
                  <span className="font-semibold text-graphite-800">
                    checkpoint #{i + 1}: node [{cp.nodeId}]
                  </span>
                  <span className="text-graphite-400">{new Date(cp.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
