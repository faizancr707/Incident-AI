"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { TabNavigation, TabItem } from "@/components/ui/tab-navigation";
import { cn } from "@/lib/utils";
import {
  GitBranch,
  GitPullRequest,
  AlertTriangle,
  Rocket,
  CheckCircle2,
  Clock,
  XCircle,
  Pause,
  Play,
  RefreshCw,
  Filter,
  ChevronRight,
  Activity,
  Zap,
  Shield,
  Eye,
  BarChart3,
  Search,
  ExternalLink,
  ArrowUpRight,
  Check,
} from "lucide-react";
import { getWorkflows, getWorkflowStats } from "@/lib/api";

interface WorkflowExecution {
  id: string;
  workflowType: "ci_cd_pipeline" | "code_review" | "failure_analysis" | "deploy_monitor";
  status: "queued" | "running" | "waiting_approval" | "completed" | "failed" | "cancelled";
  triggerEvent: {
    id: string;
    provider: "github" | "gitlab" | "vercel";
    eventType: string;
    action: string;
    repository: { name: string; fullName: string; url: string };
    sender: { login: string; avatarUrl?: string };
    commitSha?: string;
    pullRequest?: { number: number; title: string; baseBranch: string; headBranch: string };
    ref?: string;
    timestamp: string;
  };
  currentNode: string;
  nodes: { id: string; name: string; status: string; agent?: string; duration?: number; output?: any }[];
  result?: { summary: string; confidence: number; recommendations: string[] };
  error?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface WorkflowStats {
  total: number;
  running: number;
  completed: number;
  failed: number;
  waitingApproval: number;
  avgDuration: number;
  byType: Record<string, number>;
  byProvider: Record<string, number>;
}

const MOCK_WORKFLOWS: WorkflowExecution[] = [
  {
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
      commitSha: "8f4b12a",
      ref: "refs/heads/main",
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
    currentNode: "completed",
    retryCount: 0,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
    nodes: [
      { id: "receive_event", name: "Receive Event", status: "completed", agent: "event-receiver", duration: 450 },
      { id: "validate_code", name: "Validate Code", status: "completed", agent: "code-validator", duration: 1200, output: { files: 6, lines: 180 } },
      { id: "run_tests", name: "Run Tests", status: "completed", agent: "test-runner", duration: 2400, output: { passed: 184, failed: 0 } },
      { id: "security_scan", name: "Security Scan", status: "completed", agent: "security-scanner", duration: 1100, output: { vulns: 0 } },
      { id: "deploy_check", name: "Deploy Readiness", status: "completed", agent: "deploy-checker", duration: 800, output: { ready: true } },
      { id: "generate_report", name: "Generate Report", status: "completed", agent: "report-generator", duration: 900 },
    ],
    result: {
      summary: "CI/CD pipeline executed smoothly for main branch push. 184 test assertions passed.",
      confidence: 0.98,
      recommendations: ["Maintain current zero-vulnerability package dependencies"],
    },
  },
  {
    id: "wf-102",
    workflowType: "code_review",
    status: "completed",
    triggerEvent: {
      id: "evt-gh-2",
      provider: "github",
      eventType: "pull_request",
      action: "opened",
      repository: { name: "payment-service", fullName: "numora/payment-service", url: "https://github.com/numora/payment-service" },
      sender: { login: "alex-rivera" },
      commitSha: "3d91cf0",
      ref: "refs/heads/feat/idempotent-charge",
      pullRequest: { number: 84, title: "Add idempotent idempotency-key handling in charge endpoint", baseBranch: "main", headBranch: "feat/idempotent-charge" },
      timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    },
    currentNode: "completed",
    retryCount: 0,
    createdAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    nodes: [
      { id: "receive_pr", name: "Receive PR", status: "completed", agent: "pr-receiver", duration: 500 },
      { id: "analyze_changes", name: "Analyze Changes", status: "completed", agent: "change-analyzer", duration: 1800, output: { complexity: "moderate", risk: "low" } },
      { id: "review_code", name: "AI Code Review", status: "completed", agent: "code-reviewer", duration: 2600, output: { score: 9.2 } },
      { id: "suggest_improvements", name: "Suggest Improvements", status: "completed", agent: "improvement-advisor", duration: 950 },
      { id: "generate_report", name: "Generate Report", status: "completed", agent: "report-generator", duration: 900 },
    ],
    result: {
      summary: "AI review approved PR #84. Redis atomic SETNX lock implementation is resilient against duplicate charges.",
      confidence: 0.94,
      recommendations: ["Add a unit test simulating network disconnection during Redis transaction"],
    },
  },
  {
    id: "wf-103",
    workflowType: "failure_analysis",
    status: "running",
    triggerEvent: {
      id: "evt-gl-1",
      provider: "gitlab",
      eventType: "pipeline",
      action: "failed",
      repository: { name: "auth-service", fullName: "numora/auth-service", url: "https://gitlab.com/numora/auth-service" },
      sender: { login: "jordan-lee" },
      ref: "refs/heads/develop",
      timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    },
    currentNode: "analyze_failure",
    retryCount: 0,
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    nodes: [
      { id: "detect_failure", name: "Detect Failure", status: "completed", agent: "failure-detector", duration: 600 },
      { id: "collect_failure_logs", name: "Collect Logs", status: "completed", agent: "log-collector", duration: 2100, output: { logLines: 320 } },
      { id: "analyze_failure", name: "Analyze Failure", status: "running", agent: "failure-analyst" },
      { id: "generate_report", name: "Generate Report", status: "pending", agent: "report-generator" },
    ],
  },
  {
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
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    nodes: [
      { id: "monitor_deploy", name: "Monitor Deployment", status: "completed", agent: "deploy-monitor", duration: 1100 },
      { id: "health_check", name: "Health Check", status: "completed", agent: "health-checker", duration: 3200, output: { healthy: false, p99Latency: "480ms", errorRate: "4.8%" } },
      { id: "rollback_decision", name: "Rollback Decision", status: "completed", agent: "rollback-advisor", duration: 700, output: { recommended: "rollback" } },
      { id: "approval_gate", name: "Human Approval", status: "running", agent: "human-gate" },
      { id: "generate_report", name: "Generate Report", status: "pending", agent: "report-generator" },
    ],
  },
  {
    id: "wf-105",
    workflowType: "ci_cd_pipeline",
    status: "failed",
    triggerEvent: {
      id: "evt-gh-3",
      provider: "github",
      eventType: "push",
      action: "push",
      repository: { name: "notification-service", fullName: "numora/notification-service", url: "https://github.com/numora/notification-service" },
      sender: { login: "alex-rivera" },
      commitSha: "e901a18",
      ref: "refs/heads/feature/sms-gateway",
      timestamp: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    },
    currentNode: "run_tests",
    retryCount: 1,
    createdAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 135 * 60 * 1000).toISOString(),
    nodes: [
      { id: "receive_event", name: "Receive Event", status: "completed", agent: "event-receiver", duration: 400 },
      { id: "validate_code", name: "Validate Code", status: "completed", agent: "code-validator", duration: 1100 },
      { id: "run_tests", name: "Run Tests", status: "failed", agent: "test-runner", duration: 4200, output: { passed: 92, failed: 4 } },
      { id: "security_scan", name: "Security Scan", status: "skipped" },
      { id: "deploy_check", name: "Deploy Readiness", status: "skipped" },
      { id: "generate_report", name: "Generate Report", status: "skipped" },
    ],
    error: "Unit tests failed: 4 tests in SMS webhook adapter timed out against mock provider.",
  },
];

const MOCK_STATS: WorkflowStats = {
  total: 184,
  running: 2,
  completed: 168,
  failed: 9,
  waitingApproval: 5,
  avgDuration: 7400,
  byType: {
    ci_cd_pipeline: 98,
    code_review: 48,
    failure_analysis: 22,
    deploy_monitor: 16,
  },
  byProvider: {
    github: 128,
    gitlab: 36,
    vercel: 20,
  },
};

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowExecution[]>(MOCK_WORKFLOWS);
  const [stats, setStats] = useState<WorkflowStats>(MOCK_STATS);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [wfRes, statsRes] = await Promise.all([
          getWorkflows().catch(() => null),
          getWorkflowStats().catch(() => null),
        ]);
        if (isMounted) {
          if (wfRes && wfRes.workflows && wfRes.workflows.length > 0) {
            setWorkflows(wfRes.workflows);
          }
          if (statsRes && statsRes.total) {
            setStats(statsRes);
          }
        }
      } catch (err) {
        // Fallback to initial mock data
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const tabs: TabItem[] = [
    { id: "all", label: "All Workflows", icon: GitBranch, badge: workflows.length },
    { id: "ci_cd_pipeline", label: "CI/CD Pipelines", icon: Rocket, badge: stats.byType?.ci_cd_pipeline || 0 },
    { id: "code_review", label: "AI Code Reviews", icon: GitPullRequest, badge: stats.byType?.code_review || 0 },
    { id: "failure_analysis", label: "Failure Analysis", icon: AlertTriangle, badge: stats.byType?.failure_analysis || 0 },
    { id: "deploy_monitor", label: "Deploy Monitors", icon: Activity, badge: stats.byType?.deploy_monitor || 0 },
  ];

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((wf) => {
      if (activeTab !== "all" && wf.workflowType !== activeTab) {
        return false;
      }
      if (statusFilter !== "all" && wf.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const repo = wf.triggerEvent.repository?.fullName?.toLowerCase() || "";
        const ref = wf.triggerEvent.ref?.toLowerCase() || "";
        const id = wf.id.toLowerCase();
        if (!repo.includes(query) && !ref.includes(query) && !id.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [workflows, activeTab, statusFilter, searchQuery]);

  const getStatusBadge = (status: WorkflowExecution["status"]) => {
    switch (status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" /> In Progress
          </span>
        );
      case "waiting_approval":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Pause className="w-3.5 h-3.5 text-amber-600" /> Awaiting Approval
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-600" /> Failed
          </span>
        );
      case "queued":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Clock className="w-3.5 h-3.5 text-purple-600" /> Queued
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-graphite-100 text-graphite-700 border border-graphite-200">
            {status}
          </span>
        );
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "github":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-graphite-900 text-porcelain-100 flex items-center gap-1">
            GH
          </span>
        );
      case "gitlab":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-orange-600 text-white flex items-center gap-1">
            GL
          </span>
        );
      case "vercel":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-black text-white flex items-center gap-1">
            ▲
          </span>
        );
      default:
        return null;
    }
  };

  const getWorkflowTypeLabel = (type: WorkflowExecution["workflowType"]) => {
    switch (type) {
      case "ci_cd_pipeline":
        return { label: "CI/CD Pipeline", color: "bg-blue-100 text-blue-800 border-blue-200" };
      case "code_review":
        return { label: "AI Code Review", color: "bg-purple-100 text-purple-800 border-purple-200" };
      case "failure_analysis":
        return { label: "Failure Analysis", color: "bg-rose-100 text-rose-800 border-rose-200" };
      case "deploy_monitor":
        return { label: "Deploy Monitor", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
      default:
        return { label: type, color: "bg-gray-100 text-gray-800 border-gray-200" };
    }
  };

  return (
    <div className="min-h-screen bg-porcelain-100/60 pb-16">
      {/* Top Header */}
      <div className="bg-white border-b border-porcelain-200 px-6 py-6 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-graphite-950 text-lime-400 rounded-lg shadow-sm">
                <GitBranch className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-graphite-950">
                LangGraph AI Workflow Engine
              </h1>
            </div>
            <p className="text-sm text-graphite-500 mt-1">
              Autonomous multi-agent execution for CI/CD pipelines, pull requests, and automated failure triage.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-graphite-700 bg-porcelain-50 hover:bg-porcelain-100 border border-porcelain-200 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-graphite-500" />
              Refresh
            </button>
            <Link
              href="/integrations"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-lime-400 hover:bg-lime-500 text-graphite-950 font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Zap className="w-4 h-4" />
              Configure Webhooks
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-6">
          <div className="bg-porcelain-50/80 border border-porcelain-200/80 rounded-xl p-3.5">
            <span className="text-xs font-medium text-graphite-500">Total Workflows</span>
            <div className="text-2xl font-bold text-graphite-900 mt-0.5">{stats.total}</div>
            <span className="text-[11px] text-graphite-400">BullMQ event queue</span>
          </div>
          <div className="bg-blue-50/50 border border-blue-200/60 rounded-xl p-3.5">
            <span className="text-xs font-medium text-blue-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" /> In Progress
            </span>
            <div className="text-2xl font-bold text-blue-900 mt-0.5">{stats.running}</div>
            <span className="text-[11px] text-blue-600">Active LangGraph streams</span>
          </div>
          <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-3.5">
            <span className="text-xs font-medium text-amber-700">Awaiting Approval</span>
            <div className="text-2xl font-bold text-amber-900 mt-0.5">{stats.waitingApproval}</div>
            <span className="text-[11px] text-amber-600">Human gate checkpoint</span>
          </div>
          <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-3.5">
            <span className="text-xs font-medium text-emerald-700">Completed</span>
            <div className="text-2xl font-bold text-emerald-900 mt-0.5">{stats.completed}</div>
            <span className="text-[11px] text-emerald-600">Verified and deployed</span>
          </div>
          <div className="bg-rose-50/50 border border-rose-200/60 rounded-xl p-3.5">
            <span className="text-xs font-medium text-rose-700">Triaged Failures</span>
            <div className="text-2xl font-bold text-rose-900 mt-0.5">{stats.failed}</div>
            <span className="text-[11px] text-rose-600">Root-cause analyzed</span>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <TabNavigation tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Controls / Filter Bar */}
        <div className="bg-white border border-porcelain-200 rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-graphite-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by repository, branch, commit SHA, or execution ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-porcelain-50 border border-porcelain-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-graphite-900 focus:bg-white text-graphite-900 placeholder-graphite-400 transition"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-graphite-600">
              <Filter className="w-4 h-4 text-graphite-400" />
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm bg-porcelain-50 border border-porcelain-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-graphite-900 text-graphite-800"
              >
                <option value="all">All Statuses</option>
                <option value="running">In Progress</option>
                <option value="waiting_approval">Awaiting Approval</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Workflows List */}
        {filteredWorkflows.length === 0 ? (
          <div className="bg-white border border-porcelain-200 rounded-xl p-12 text-center shadow-sm">
            <GitBranch className="w-12 h-12 text-graphite-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-graphite-800">No workflow executions found</h3>
            <p className="text-sm text-graphite-500 max-w-sm mx-auto mt-1">
              Try adjusting your active tab or filter query. When webhooks arrive from GitHub, GitLab, or Vercel, executions appear automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredWorkflows.map((wf) => {
              const typeMeta = getWorkflowTypeLabel(wf.workflowType);
              const event = wf.triggerEvent;
              return (
                <div
                  key={wf.id}
                  className="bg-white border border-porcelain-200 hover:border-porcelain-300 rounded-xl p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Info */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {getProviderIcon(event.provider)}
                        <span className="text-base font-bold text-graphite-950 font-mono">
                          {event.repository.fullName}
                        </span>
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", typeMeta.color)}>
                          {typeMeta.label}
                        </span>
                        {getStatusBadge(wf.status)}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-graphite-500 font-mono">
                        {event.ref && (
                          <span className="flex items-center gap-1 text-graphite-700">
                            <GitBranch className="w-3.5 h-3.5 text-graphite-400" />
                            {event.ref.replace("refs/heads/", "")}
                          </span>
                        )}
                        {event.commitSha && (
                          <span className="bg-porcelain-100 px-1.5 py-0.5 rounded text-graphite-600">
                            sha:{event.commitSha.slice(0, 7)}
                          </span>
                        )}
                        {event.pullRequest && (
                          <span className="flex items-center gap-1 text-purple-700">
                            <GitPullRequest className="w-3.5 h-3.5" />
                            PR #{event.pullRequest.number}
                          </span>
                        )}
                        <span>Author: @{event.sender.login}</span>
                        <span className="text-graphite-400">
                          {new Date(wf.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {wf.error && (
                        <div className="mt-2 text-xs font-mono text-red-700 bg-red-50 border border-red-200 p-2 rounded-lg">
                          {wf.error}
                        </div>
                      )}

                      {wf.result && (
                        <div className="text-xs text-graphite-600 mt-1 line-clamp-1">
                          <span className="font-semibold text-graphite-800">Result: </span>
                          {wf.result.summary}
                        </div>
                      )}
                    </div>

                    {/* Right: LangGraph Node Sequence */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:self-center">
                      <div className="flex items-center gap-1.5 bg-porcelain-50 p-2 rounded-lg border border-porcelain-200/80">
                        {wf.nodes.map((node, i) => {
                          const isDone = node.status === "completed";
                          const isRunning = node.status === "running";
                          const isFailed = node.status === "failed";
                          const isSkipped = node.status === "skipped";
                          return (
                            <React.Fragment key={node.id}>
                              <div
                                title={`${node.name} (${node.status})`}
                                className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition",
                                  isDone && "bg-emerald-500 text-white",
                                  isRunning && "bg-blue-500 text-white animate-pulse ring-2 ring-blue-300",
                                  isFailed && "bg-red-500 text-white",
                                  isSkipped && "bg-graphite-200 text-graphite-500",
                                  node.status === "pending" && "bg-porcelain-200 text-graphite-400"
                                )}
                              >
                                {isDone ? (
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                ) : (
                                  i + 1
                                )}
                              </div>
                              {i < wf.nodes.length - 1 && (
                                <div className="w-2.5 h-[2px] bg-porcelain-300" />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>

                      <Link
                        href={`/workflows/${wf.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-graphite-950 hover:bg-graphite-800 text-porcelain-50 rounded-lg shadow-sm transition whitespace-nowrap"
                      >
                        Details
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
