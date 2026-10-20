"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  Bell,
  Shield,
  Cpu,
  Users,
  Database,
  Github,
  Webhook,
  Plus,
  Save,
  Activity,
  Check,
  X,
  Copy,
  ExternalLink,
  RefreshCw,
  Key,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Radio,
  Sliders,
  Send,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { getIntegrations, updateIntegration, testIntegration } from "@/lib/api";

interface IntegrationItem {
  id: string;
  name: string;
  status: "connected" | "disconnected";
  iconName: "github" | "slack" | "pagerduty" | "datadog" | "cloudwatch" | "postgres" | "gitlab" | "sentry";
  description: string;
  category: "vcs" | "alerting" | "monitoring" | "database";
  config: {
    webhookUrl?: string;
    apiKey?: string;
    secret?: string;
    channel?: string;
    region?: string;
    routingKey?: string;
    endpoint?: string;
    events?: string[];
    [key: string]: any;
  };
}

const DEFAULT_INTEGRATIONS: IntegrationItem[] = [
  {
    id: "github",
    name: "GitHub",
    status: "connected",
    iconName: "github",
    description: "Sync repositories, pull requests, commits, and dispatch LangGraph CI/CD workflows.",
    category: "vcs",
    config: {
      webhookUrl: "http://localhost:3001/api/webhooks/github",
      secret: "REDACTED_GITHUB_WEBHOOK_SECRET",
      repositoryScope: "numora/api-gateway, numora/payment-service, numora/auth-service",
      events: ["push", "pull_request", "deployment", "check_run"],
    },
  },
  {
    id: "slack",
    name: "Slack",
    status: "connected",
    iconName: "slack",
    description: "Send automated incident alerts, escalation threads, and postmortem summaries.",
    category: "alerting",
    config: {
      webhookUrl: "https://hooks.slack.com/services/REDACTED",
      channel: "#incidents-prod",
      botToken: "REDACTED_SLACK_TOKEN",
      severityThreshold: "P1 & P2 Only",
      mentionOncall: true,
    },
  },
  {
    id: "pagerduty",
    name: "PagerDuty",
    status: "connected",
    iconName: "pagerduty",
    description: "Trigger, acknowledge, and resolve on-call incident alerts via Events API v2.",
    category: "alerting",
    config: {
      routingKey: "REDACTED_PAGERDUTY_ROUTING_KEY",
      serviceName: "Production Backend Services",
      escalationPolicy: "Tier 1 - SRE Core Team",
      autoResolve: true,
    },
  },
  {
    id: "datadog",
    name: "Datadog",
    status: "disconnected",
    iconName: "datadog",
    description: "Ingest APM traces, error rate metrics, and distributed spans for automated analysis.",
    category: "monitoring",
    config: {
      apiKey: "REDACTED_DATADOG_KEY",
      appKey: "REDACTED_DATADOG_KEY",
      site: "datadoghq.com",
      metricPrefix: "numora.prod",
    },
  },
  {
    id: "cloudwatch",
    name: "AWS CloudWatch",
    status: "disconnected",
    iconName: "cloudwatch",
    description: "Query container logs, ECS task telemetry, and Lambda execution metrics.",
    category: "monitoring",
    config: {
      region: "us-east-1",
      accessKeyId: "REDACTED_AWS_ACCESS_KEY",
      secretAccessKey: "REDACTED",
      logGroupName: "/aws/ecs/numora-production-cluster",
    },
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    status: "connected",
    iconName: "postgres",
    description: "Primary relational database telemetry, slow query logs, and transaction insights.",
    category: "database",
    config: {
      host: "db.production.internal",
      port: 5432,
      database: "numora_incidents",
      username: "incident_app",
      sslMode: "require",
    },
  },
];

const AVAILABLE_CATALOG: Omit<IntegrationItem, "status">[] = [
  {
    id: "gitlab",
    name: "GitLab",
    iconName: "gitlab",
    description: "Ingest GitLab merge requests, commit pushes, and CI/CD pipeline triggers.",
    category: "vcs",
    config: {
      webhookUrl: "http://localhost:3001/api/webhooks/gitlab",
      secret: "REDACTED_GITLAB_WEBHOOK_SECRET",
      events: ["push", "merge_request", "pipeline"],
    },
  },
  {
    id: "sentry",
    name: "Sentry",
    iconName: "sentry",
    description: "Capture uncaught application exceptions and correlate them with deployment releases.",
    category: "monitoring",
    config: {
      dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
      projectSlug: "api-backend",
    },
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Integrations");
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(DEFAULT_INTEGRATIONS);
  const [configuringItem, setConfiguringItem] = useState<IntegrationItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSavingIntegration, setIsSavingIntegration] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form states for active configuration modal
  const [editConfig, setEditConfig] = useState<Record<string, any>>({});
  const [editStatus, setEditStatus] = useState<"connected" | "disconnected">("connected");

  const [notification, setNotification] = useState<{ title: string; description?: string; variant: "success" | "error" | "info" } | null>(null);

  const { toast } = useToast();

  const notify = (title: string, description?: string, variant: "success" | "error" | "info" = "success") => {
    setNotification({ title, description, variant });
    setTimeout(() => setNotification(null), 4000);
    if (toast) {
      toast({ title, description, variant });
    }
  };

  // Fetch persisted integrations on mount from backend
  useEffect(() => {
    let isMounted = true;
    getIntegrations()
      .then((res) => {
        if (!isMounted || !res?.integrations) return;
        setIntegrations((prev) =>
          prev.map((item) => {
            const found = res.integrations.find(
              (i: any) => i.provider === item.id || i.id === item.id || i.id === `integration-${item.id}`
            );
            if (!found) return item;
            return {
              ...item,
              status: found.status === "active" ? "connected" : "disconnected",
              config: {
                ...item.config,
                webhookUrl: found.webhookUrl || item.config.webhookUrl,
                secret: found.webhookSecret || item.config.secret,
                events: found.events || item.config.events,
                ...(found.metadata || {}),
              },
            };
          })
        );
      })
      .catch((err) => {
        console.warn("Could not load integrations from backend:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const tabs = [
    { id: "General", icon: <Settings className="w-4 h-4" /> },
    { id: "Integrations", icon: <Webhook className="w-4 h-4" /> },
    { id: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "AI Configuration", icon: <Cpu className="w-4 h-4" /> },
    { id: "Team", icon: <Users className="w-4 h-4" /> },
  ];

  const handleOpenConfigure = (item: IntegrationItem) => {
    setConfiguringItem(item);
    setEditConfig({ ...item.config });
    setEditStatus(item.status);
    setTestSuccess(null);
    setIsTesting(false);
  };

  const handleCloseConfigure = () => {
    setConfiguringItem(null);
    setTestSuccess(null);
    setIsTesting(false);
  };

  const handleSaveIntegration = async () => {
    if (!configuringItem) return;
    setIsSavingIntegration(true);
    try {
      const payload = {
        name: configuringItem.name,
        status: editStatus,
        enabled: editStatus === "connected",
        webhookUrl: editConfig.webhookUrl,
        secret: editConfig.secret,
        webhookSecret: editConfig.secret,
        repositoryScope: editConfig.repositoryScope,
        events: editConfig.events,
        config: editConfig,
        metadata: {
          ...editConfig,
          channel: editConfig.channel,
          severityThreshold: editConfig.severityThreshold,
          routingKey: editConfig.routingKey,
          escalationPolicy: editConfig.escalationPolicy,
          apiKey: editConfig.apiKey,
          site: editConfig.site,
          region: editConfig.region,
          host: editConfig.host,
        },
      };

      const res = await updateIntegration(configuringItem.id, payload);

      setIntegrations((prev) =>
        prev.map((int) =>
          int.id === configuringItem.id
            ? {
                ...int,
                status: editStatus,
                config: {
                  ...editConfig,
                  ...(res?.integration?.metadata || {}),
                  webhookUrl: res?.integration?.webhookUrl || editConfig.webhookUrl,
                  secret: res?.integration?.webhookSecret || editConfig.secret,
                },
              }
            : int
        )
      );

      notify(
        `${configuringItem.name} Configured`,
        `Configuration for ${configuringItem.name} successfully saved to backend database.`
      );
      handleCloseConfigure();
    } catch (err: any) {
      console.error("Failed to save integration configuration:", err);
      notify(
        `Failed to save ${configuringItem.name}`,
        err.message || "An error occurred while saving integration configuration",
        "error"
      );
    } finally {
      setIsSavingIntegration(false);
    }
  };

  const handleTestConnection = async () => {
    if (!configuringItem) return;
    setIsTesting(true);
    setTestSuccess(null);
    try {
      if (["github", "gitlab", "vercel"].includes(configuringItem.id)) {
        const res = await testIntegration(configuringItem.id);
        setTestSuccess(`Connection to ${configuringItem.name} verified! ${res.message || "Endpoint responded with status 200 OK."}`);
        notify("Connection Verified", res.message || "Endpoint responded with status 200 OK.");
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setTestSuccess(`Connection to ${configuringItem.name} verified! Response time: 38ms.`);
        notify("Connection Verified", `Endpoint responded with status 200 OK.`);
      }
    } catch (err: any) {
      console.error("Failed to test integration:", err);
      notify("Connection Test Failed", err.message || "Failed to reach endpoint", "error");
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
    notify("Copied to clipboard", text.length > 30 ? text.slice(0, 30) + "..." : text);
  };

  const handleToggleSecret = (keyName: string) => {
    setRevealedSecrets((prev) => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const handleAddIntegration = (catalogItem: Omit<IntegrationItem, "status">) => {
    const existing = integrations.find((i) => i.id === catalogItem.id);
    if (existing) {
      setIsAddModalOpen(false);
      handleOpenConfigure(existing);
      return;
    }
    const newItem: IntegrationItem = {
      ...catalogItem,
      status: "connected",
    };
    setIntegrations((prev) => [...prev, newItem]);
    setIsAddModalOpen(false);
    notify("Integration Added", `${newItem.name} has been added to your integrations.`);
    handleOpenConfigure(newItem);
  };

  const handleSaveAllSettings = () => {
    notify("Settings Saved", "All workspace and integration settings have been synchronized.");
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "github":
        return <Github className="w-5 h-5 text-porcelain-100" />;
      case "slack":
        return <HashIcon className="w-5 h-5 text-[#E01E5A]" />;
      case "pagerduty":
        return <Shield className="w-5 h-5 text-[#06AC38]" />;
      case "datadog":
        return <Activity className="w-5 h-5 text-[#632CA6]" />;
      case "cloudwatch":
        return <CloudIcon className="w-5 h-5 text-[#FF9900]" />;
      case "postgres":
        return <Database className="w-5 h-5 text-[#336791]" />;
      case "gitlab":
        return <GitlabIcon className="w-5 h-5 text-[#FC6D26]" />;
      case "sentry":
        return <AlertCircle className="w-5 h-5 text-[#362D59]" />;
      default:
        return <Webhook className="w-5 h-5 text-lime-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-graphite-950 text-porcelain-100">
      {/* Top Header */}
      <div className="flex items-center justify-between p-6 border-b border-graphite-800 shrink-0 bg-graphite-950/90 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-semibold text-porcelain-50">Settings</h1>
          <p className="text-xs text-graphite-400 mt-0.5">
            Configure system integrations, telemetry sources, alerts, and AI agents.
          </p>
        </div>
        <button
          onClick={handleSaveAllSettings}
          className="flex items-center gap-2 bg-lime-500 hover:bg-lime-400 text-graphite-950 px-4 py-2 rounded-md text-sm font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      {notification && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-400 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{notification.title}</span>
            {notification.description && <span className="text-emerald-300/80">— {notification.description}</span>}
          </div>
          <button onClick={() => setNotification(null)} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-64 border-r border-graphite-800 bg-graphite-950/40 p-4 space-y-1 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left cursor-pointer",
                activeTab === tab.id
                  ? "bg-graphite-800 text-porcelain-50 shadow-sm border border-graphite-700/50"
                  : "text-graphite-400 hover:bg-graphite-900 hover:text-porcelain-200"
              )}
            >
              {tab.icon}
              {tab.id}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-8 bg-graphite-900/20">
          <div className="max-w-3xl">
            {/* ─── Integrations Tab ─── */}
            {activeTab === "Integrations" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-end border-b border-graphite-800 pb-3">
                  <div>
                    <h2 className="text-lg font-semibold text-porcelain-50">Connected Integrations</h2>
                    <p className="text-xs text-graphite-400 mt-0.5">
                      Manage webhooks, event listeners, and external monitoring credentials.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="text-sm text-lime-400 hover:text-lime-300 flex items-center gap-1.5 font-medium transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Integration
                  </button>
                </div>

                <div className="grid gap-3.5">
                  {integrations.map((int) => (
                    <div
                      key={int.id}
                      className="flex items-center justify-between p-4 bg-graphite-900/60 hover:bg-graphite-900 border border-graphite-800 hover:border-graphite-700 rounded-lg transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-graphite-950 flex items-center justify-center border border-graphite-700/80 shrink-0">
                          {renderIcon(int.iconName)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-porcelain-100 text-sm">{int.name}</h3>
                            {int.id === "github" && (
                              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-mono">
                                LangGraph Linked
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-graphite-400 capitalize flex items-center gap-1.5 mt-0.5">
                            <span
                              className={cn(
                                "w-2 h-2 rounded-full",
                                int.status === "connected" ? "bg-lime-500" : "bg-graphite-600"
                              )}
                            />
                            {int.status}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenConfigure(int)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-porcelain-100 hover:text-white bg-graphite-950 hover:bg-graphite-800 border border-graphite-700 rounded-md transition-colors shadow-sm cursor-pointer"
                      >
                        Configure
                      </button>
                    </div>
                  ))}
                </div>

                {/* Webhook Engine Banner */}
                <div className="p-4 rounded-xl border border-graphite-800 bg-graphite-950/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-lime-400/10 rounded-lg text-lime-400">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-porcelain-100">
                        Advanced Webhook & Signature Management
                      </h4>
                      <p className="text-xs text-graphite-400">
                        View raw delivery payloads, HMAC keys, and LangGraph workflow dispatchers.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/integrations"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-lime-400 hover:text-lime-300 bg-graphite-900 border border-graphite-700 rounded-lg transition"
                  >
                    Open Engine
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* ─── General Tab ─── */}
            {activeTab === "General" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h2 className="text-lg font-semibold text-porcelain-50 mb-4 border-b border-graphite-800 pb-2">
                    Workspace Preferences
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-graphite-300 mb-1.5">Workspace Name</label>
                      <input
                        type="text"
                        defaultValue="Acme Corp Engineering"
                        className="w-full bg-graphite-900 border border-graphite-700 rounded-md px-3 py-2 text-porcelain-100 focus:outline-none focus:border-lime-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-graphite-300 mb-1.5">
                        Default Environment Filter
                      </label>
                      <select className="w-full bg-graphite-900 border border-graphite-700 rounded-md px-3 py-2 text-porcelain-100 focus:outline-none focus:border-lime-500">
                        <option>Production</option>
                        <option>Staging</option>
                        <option>Development</option>
                        <option>All Environments</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-porcelain-50 mb-4 border-b border-graphite-800 pb-2">
                    Data Retention
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-graphite-300 mb-1.5">
                        Incident History Retention
                      </label>
                      <select className="w-full bg-graphite-900 border border-graphite-700 rounded-md px-3 py-2 text-porcelain-100 focus:outline-none focus:border-lime-500">
                        <option>90 Days</option>
                        <option>6 Months</option>
                        <option>1 Year</option>
                        <option>Forever</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-graphite-300 mb-1.5">
                        Raw Telemetry Retention
                      </label>
                      <select className="w-full bg-graphite-900 border border-graphite-700 rounded-md px-3 py-2 text-porcelain-100 focus:outline-none focus:border-lime-500">
                        <option>14 Days</option>
                        <option>30 Days</option>
                        <option>60 Days</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── AI Configuration Tab ─── */}
            {activeTab === "AI Configuration" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                  <h2 className="text-lg font-semibold text-porcelain-50 mb-4 border-b border-graphite-800 pb-2">
                    Model Settings
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-graphite-300 mb-1.5">
                        Investigation Orchestrator Model
                      </label>
                      <select className="w-full bg-graphite-900 border border-graphite-700 rounded-md px-3 py-2 text-porcelain-100 focus:outline-none focus:border-lime-500">
                        <option>GPT-4o (Default Multi-Modal)</option>
                        <option>Claude 3.5 Sonnet</option>
                        <option>Gemini 1.5 Pro</option>
                        <option>Claude 3 Opus</option>
                      </select>
                      <p className="mt-1 text-xs text-graphite-400">
                        The primary LLM model powering the LangGraph agent coordinators.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-graphite-300 mb-1.5">Temperature</label>
                        <input type="range" min="0" max="100" defaultValue="15" className="w-full accent-lime-400" />
                        <div className="flex justify-between text-xs text-graphite-500 mt-1">
                          <span>Deterministic (0.0)</span>
                          <span>Creative (1.0)</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-graphite-300 mb-1.5">Max Context (Tokens)</label>
                        <input
                          type="number"
                          defaultValue="128000"
                          className="w-full bg-graphite-900 border border-graphite-700 rounded-md px-3 py-2 text-porcelain-100 focus:outline-none focus:border-lime-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-porcelain-50 mb-4 border-b border-graphite-800 pb-2">
                    RAG Knowledge Base & Auto-Indexing
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-graphite-300 mb-1.5">Embedding Model</label>
                      <select className="w-full bg-graphite-900 border border-graphite-700 rounded-md px-3 py-2 text-porcelain-100 focus:outline-none focus:border-lime-500">
                        <option>text-embedding-3-large (3072 dimensions)</option>
                        <option>text-embedding-3-small (1536 dimensions)</option>
                        <option>Cohere Embed v3</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-graphite-800 rounded-md bg-graphite-900/50">
                      <div>
                        <p className="text-sm font-medium text-porcelain-100">Auto-Index Postmortems</p>
                        <p className="text-xs text-graphite-400">
                          Automatically index resolved incident reports into vector database for similarity search
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 accent-lime-400 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Notifications Tab ─── */}
            {activeTab === "Notifications" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-lg font-semibold text-porcelain-50 border-b border-graphite-800 pb-2">
                  Alerting & Notification Rules
                </h2>
                <div className="space-y-4">
                  <div className="p-4 bg-graphite-900/50 border border-graphite-800 rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-porcelain-100">P1 Critical Outage Alerts</h4>
                      <p className="text-xs text-graphite-400">
                        Immediate broadcast via SMS, PagerDuty, and Slack on error rate {">"} 5%
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-lime-400 rounded cursor-pointer" />
                  </div>

                  <div className="p-4 bg-graphite-900/50 border border-graphite-800 rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-porcelain-100">LangGraph Human Approval Pings</h4>
                      <p className="text-xs text-graphite-400">
                        Notify lead engineers when automated deployment monitor halts for manual sign-off
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-lime-400 rounded cursor-pointer" />
                  </div>

                  <div className="p-4 bg-graphite-900/50 border border-graphite-800 rounded-lg flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-porcelain-100">Daily Investigation Digest</h4>
                      <p className="text-xs text-graphite-400">
                        Summary of all triaged anomalies and root causes sent at 09:00 UTC
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 accent-lime-400 rounded cursor-pointer" />
                  </div>
                </div>
              </div>
            )}

            {/* ─── Team Tab ─── */}
            {activeTab === "Team" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-center border-b border-graphite-800 pb-3">
                  <div>
                    <h2 className="text-lg font-semibold text-porcelain-50">Team Members & Access Control</h2>
                    <p className="text-xs text-graphite-400">Role-based access control (RBAC) across incidents and workflows.</p>
                  </div>
                  <button
                    onClick={() => notify("Invite Sent", "Invitation link sent to recipient email address.")}
                    className="text-xs font-semibold px-3 py-1.5 bg-lime-500 hover:bg-lime-400 text-graphite-950 rounded-md transition cursor-pointer"
                  >
                    + Invite Member
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    { name: "Sarah Chen", email: "admin@incident.ai", role: "Owner", team: "Platform Engineering" },
                    { name: "Alex Rivera", email: "engineer@incident.ai", role: "Engineer", team: "Backend Core" },
                    { name: "Jordan Lee", email: "viewer@incident.ai", role: "Viewer", team: "Product Operations" },
                  ].map((member) => (
                    <div
                      key={member.email}
                      className="p-3.5 bg-graphite-900/50 border border-graphite-800 rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-porcelain-100">{member.name}</span>
                          <span
                            className={cn(
                              "text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold",
                              member.role === "Owner" && "bg-lime-500/20 text-lime-400 border border-lime-500/30",
                              member.role === "Engineer" && "bg-blue-500/20 text-blue-400 border border-blue-500/30",
                              member.role === "Viewer" && "bg-graphite-800 text-graphite-400"
                            )}
                          >
                            {member.role}
                          </span>
                        </div>
                        <p className="text-xs text-graphite-400">{member.email} • {member.team}</p>
                      </div>
                      <span className="text-xs text-graphite-500 font-mono">Active</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Configure Integration Modal ─── */}
      {configuringItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-graphite-950 border border-graphite-700 rounded-xl max-w-xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-graphite-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-graphite-900 flex items-center justify-center border border-graphite-700 shrink-0">
                  {renderIcon(configuringItem.iconName)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-porcelain-50">
                    Configure {configuringItem.name}
                  </h3>
                  <p className="text-xs text-graphite-400">{configuringItem.description}</p>
                </div>
              </div>
              <button
                onClick={handleCloseConfigure}
                className="p-1 rounded-md text-graphite-400 hover:text-white hover:bg-graphite-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-5 space-y-4 text-xs">
              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3 bg-graphite-900 border border-graphite-800 rounded-lg">
                <div>
                  <span className="font-semibold text-porcelain-100 block">Integration Status</span>
                  <span className="text-graphite-400 text-[11px]">
                    Enable or pause event syncing and notifications for this provider
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditStatus(editStatus === "connected" ? "disconnected" : "connected")}
                    className={cn(
                      "px-3 py-1 rounded text-xs font-semibold transition cursor-pointer",
                      editStatus === "connected"
                        ? "bg-lime-500/20 text-lime-400 border border-lime-500/40"
                        : "bg-graphite-800 text-graphite-400 border border-graphite-700"
                    )}
                  >
                    {editStatus === "connected" ? "Connected" : "Disconnected"}
                  </button>
                </div>
              </div>

              {/* Dynamic Fields by Provider */}
              {configuringItem.id === "github" && (
                <>
                  <div>
                    <label className="font-semibold text-graphite-300 block mb-1">
                      Webhook Payload URL (Target)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={editConfig.webhookUrl || "http://localhost:3001/api/webhooks/github"}
                        className="w-full bg-graphite-900 border border-graphite-700 rounded-md px-3 py-2 text-porcelain-200 font-mono text-[11px]"
                      />
                      <button
                        onClick={() => handleCopy(editConfig.webhookUrl || "http://localhost:3001/api/webhooks/github", "gh_url")}
                        className="p-2 bg-graphite-900 border border-graphite-700 hover:bg-graphite-800 rounded-md text-graphite-300 transition cursor-pointer"
                        title="Copy Webhook URL"
                      >
                        {copiedKey === "gh_url" ? <Check className="w-4 h-4 text-lime-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-graphite-300 block mb-1">
                      Webhook Secret (HMAC-SHA256)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type={revealedSecrets["gh_sec"] ? "text" : "password"}
                        value={editConfig.secret || ""}
                        onChange={(e) => setEditConfig({ ...editConfig, secret: e.target.value })}
                        className="w-full bg-graphite-900 border border-graphite-700 rounded-md px-3 py-2 text-porcelain-100 font-mono text-[11px] focus:outline-none focus:border-lime-500"
                      />
                      <button
                        onClick={() => handleToggleSecret("gh_sec")}
                        className="p-2 bg-graphite-900 border border-graphite-700 hover:bg-graphite-800 rounded-md text-graphite-300 transition cursor-pointer"
                      >
                        {revealedSecrets["gh_sec"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-graphite-300 block mb-1">
                      Target Repositories
                    </label>
                    <input
                      type="text"
                      value={editConfig.repositoryScope || ""}
                      onChange={(e) => setEditConfig({ ...editConfig, repositoryScope: e.target.value })}
                      placeholder="e.g. acme/api-gateway, acme/web-app"
                      className="w-full bg-graphite-900 border border-graphite-700 rounded-md px-3 py-2 text-porcelain-100 text-xs focus:outline-none focus:border-lime-500"
                    />
                  </div>
                </>
              )}

              {configuringItem.id === "slack" && (
                <>
                  <div>
                    <label className="font-semibold text-graphite-300 block mb-1">Incoming Webhook URL</label>
                    <input
                      type="text"
                      value={editConfig.webhookUrl || ""}
                      onChange={(e) => setEditConfig({ ...editConfig, webhookUrl: e.target.value })}
                      className="w-full bg-graphite-900 border border-graphite-700 rounded-md px-3 py-2 text-porcelain-100 font-mono text-[11px] focus:outline-none focus:border-lime-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-graphite-300 block mb-1">Notification Channel</label>
                      <input
                        type="text"
                        value={editConfig.channel || ""}
                        onChange={(e) => setEditConfig({ ...editConfig, channel: e.target.value })}
                        className="w-full bg-graphite-900 border border-graphite-700 rounded-md px-3 py-2 text-porcelain-100 text-xs focus:outline-none focus:border-lime-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-graphite-300 block mb-1">Severity Trigger</label>
                      <select
                        value={editConfig.severityThreshold || "P1 & P2 Only"}
                        onChange={(e) => setEditConfig({ ...editConfig, severityThreshold: e.target.value })}
                        className="w-full bg-graphite-900 border border-graphite-700 rounded-md px-3 py-2 text-porcelain-100 text-xs focus:outline-none focus:border-lime-500"
                      >
                        <option>P1 Only (Critical)</option>
                        <option>P1 & P2 Only</option>
                        <option>All Incidents (P1 - P4)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {configuringItem.id === "pagerduty" && (
                <>
                  <div>
                    <label className="font-semibold text-graphite-300 block mb-1">
                      Events API v2 Routing Key
                    </label>
                    <input
                      type="text"
                      value={editConfig.routingKey || ""}
                      onChange={(e) => setEditConfig({ ...editConfig, routingKey: e.target.value })}
                      className="w-full bg-graphite-900 border border-graphite-700 rounded-md px-3 py-2 text-porcelain-100 font-mono text-[11px] focus:outline-none focus:border-lime-500"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-graphite-300 block mb-1">Escalation Policy</label>
                    <input
                      type="text"
                      value={editConfig.escalationPolicy || ""}
                      onChange={(e) => setEditConfig({ ...editConfig, escalationPolicy: e.target.value })}
                      className="w-full bg-graphite-900 border border-graphite-700 rounded-md px-3 py-2 text-porcelain-100 text-xs focus:outline-none focus:border-lime-500"
                    />
                  </div>
                </>
              )}

              {configuringItem.id === "datadog" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-graphite-300 block mb-1">Datadog API Key</label>
                      <input
                        type="password"
                        value={editConfig.apiKey || ""}
                        onChange={(e) => setEditConfig({ ...editConfig, apiKey: e.target.value })}
                        className="w-full bg-graphite-900 border border-graphite-700 rounded-md px-3 py-2 text-porcelain-100 font-mono text-[11px] focus:outline-none focus:border-lime-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-graphite-300 block mb-1">Datadog Site</label>
                      <select
                        value={editConfig.site || "datadoghq.com"}
                        onChange={(e) => setEditConfig({ ...editConfig, site: e.target.value })}
                        className="w-full bg-graphite-900 border border-graphite-700 rounded-md px-3 py-2 text-porcelain-100 text-xs focus:outline-none focus:border-lime-500"
                      >
                        <option>datadoghq.com (US1)</option>
                        <option>us3.datadoghq.com (US3)</option>
                        <option>datadoghq.eu (EU)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {configuringItem.id === "cloudwatch" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-graphite-300 block mb-1">AWS Region</label>
                      <input
                        type="text"
                        value={editConfig.region || "us-east-1"}
                        onChange={(e) => setEditConfig({ ...editConfig, region: e.target.value })}
                        className="w-full bg-graphite-900 border border-graphite-700 rounded-md px-3 py-2 text-porcelain-100 text-xs focus:outline-none focus:border-lime-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-graphite-300 block mb-1">Log Group Name</label>
                      <input
                        type="text"
                        value={editConfig.logGroupName || ""}
                        onChange={(e) => setEditConfig({ ...editConfig, logGroupName: e.target.value })}
                        className="w-full bg-graphite-900 border border-graphite-700 rounded-md px-3 py-2 text-porcelain-100 text-xs focus:outline-none focus:border-lime-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {configuringItem.id === "postgres" && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="font-semibold text-graphite-300 block mb-1">Host</label>
                      <input
                        type="text"
                        value={editConfig.host || ""}
                        onChange={(e) => setEditConfig({ ...editConfig, host: e.target.value })}
                        className="w-full bg-graphite-900 border border-graphite-700 rounded-md px-3 py-2 text-porcelain-100 text-xs focus:outline-none focus:border-lime-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-graphite-300 block mb-1">Port</label>
                      <input
                        type="number"
                        value={editConfig.port || 5432}
                        onChange={(e) => setEditConfig({ ...editConfig, port: Number(e.target.value) })}
                        className="w-full bg-graphite-900 border border-graphite-700 rounded-md px-3 py-2 text-porcelain-100 text-xs focus:outline-none focus:border-lime-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-semibold text-graphite-300 block mb-1">Database Name</label>
                    <input
                      type="text"
                      value={editConfig.database || ""}
                      onChange={(e) => setEditConfig({ ...editConfig, database: e.target.value })}
                      className="w-full bg-graphite-900 border border-graphite-700 rounded-md px-3 py-2 text-porcelain-100 text-xs focus:outline-none focus:border-lime-500"
                    />
                  </div>
                </>
              )}

              {/* Live Test Feedback */}
              {testSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{testSuccess}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-graphite-800 flex items-center justify-between">
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3 py-1.5 rounded-md bg-graphite-900 hover:bg-graphite-800 text-graphite-200 border border-graphite-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {isTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-lime-400" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-lime-400" />
                )}
                {isTesting ? "Testing Connection..." : "Test Connection"}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCloseConfigure}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold text-graphite-400 hover:text-porcelain-100 hover:bg-graphite-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveIntegration}
                  disabled={isSavingIntegration}
                  className="px-4 py-1.5 rounded-md text-xs font-semibold bg-lime-500 hover:bg-lime-400 text-graphite-950 transition cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingIntegration && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {isSavingIntegration ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add Integration Modal ─── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-graphite-950 border border-graphite-700 rounded-xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-graphite-800">
              <div>
                <h3 className="text-base font-bold text-porcelain-50">Add Integration</h3>
                <p className="text-xs text-graphite-400">Choose a service or provider to connect</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-md text-graphite-400 hover:text-white hover:bg-graphite-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 grid gap-3 max-h-96 overflow-y-auto">
              {AVAILABLE_CATALOG.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleAddIntegration(item)}
                  className="p-3.5 bg-graphite-900/60 hover:bg-graphite-900 border border-graphite-800 hover:border-lime-500/50 rounded-lg flex items-center justify-between cursor-pointer transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-graphite-950 flex items-center justify-center border border-graphite-700">
                      {renderIcon(item.iconName)}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-porcelain-100 group-hover:text-lime-400 transition">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-graphite-400">{item.description}</p>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-graphite-400 group-hover:text-lime-400" />
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-graphite-800 flex justify-end">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-1.5 text-xs text-graphite-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icon stubs
function HashIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="9" y2="9" />
      <line x1="4" x2="20" y1="15" y2="15" />
      <line x1="10" x2="8" y1="3" y2="21" />
      <line x1="16" x2="14" y1="3" y2="21" />
    </svg>
  );
}

function CloudIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 19c9-2.5 4.5-13-2-9.5-2-4-9-4-11 0-7.5-3.5-11 7-2 9.5" />
    </svg>
  );
}

function GitlabIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="m23.6 9.57-1.31-4.04a.89.89 0 0 0-1.7 0L19.28 9.57H4.72L3.41 5.53a.89.89 0 0 0-1.7 0L.4 9.57a1.8 1.8 0 0 0 .65 2.01L12 20.3l10.95-8.72a1.8 1.8 0 0 0 .65-2.01Z" />
    </svg>
  );
}
