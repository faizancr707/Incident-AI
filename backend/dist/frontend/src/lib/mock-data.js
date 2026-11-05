"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kpiMetrics = exports.serviceHealth = exports.knowledgeEntries = exports.evaluationMetrics = exports.agents = exports.gitChanges = exports.deployments = exports.traceSpans = exports.metrics = exports.logs = exports.rootCauseAnalysis = exports.evidence = exports.investigationSteps = exports.incidents = void 0;
exports.generateEvalTrend = generateEvalTrend;
/* ── Helper ────────────────────────────────────────────── */
const ago = (minutes) => new Date(Date.now() - minutes * 60000);
/* ── Incidents ─────────────────────────────────────────── */
exports.incidents = [
    {
        id: "INC-4821",
        title: "Payment API Latency Spike",
        severity: "critical",
        status: "investigating",
        service: "Payment API",
        environment: "production",
        startedAt: ago(18),
        duration: 18,
        impact: "Payment processing degraded — 23% of transactions failing",
        impactedRequests: 14832,
        assignee: "Sarah Chen",
        deploymentVersion: "v1.8.4",
        aiInvestigation: { active: true, stage: "Analyzing root cause", progress: 78, confidence: 92, rootCause: "N+1 queries in UserService", startedAt: ago(15) },
        affectedServices: ["Payment API", "User Service", "Order Service", "PostgreSQL"],
        tags: ["database", "latency", "deployment"],
    },
    {
        id: "INC-4820",
        title: "Auth Service Memory Leak",
        severity: "high",
        status: "identified",
        service: "Auth Service",
        environment: "production",
        startedAt: ago(47),
        duration: 47,
        impact: "Intermittent 503 errors on authentication endpoints",
        impactedRequests: 8421,
        assignee: "Marcus Rivera",
        deploymentVersion: "v2.3.1",
        aiInvestigation: { active: true, stage: "Validating hypothesis", progress: 92, confidence: 87, rootCause: "Memory leak in JWT token cache", startedAt: ago(40) },
        affectedServices: ["Auth Service", "API Gateway", "Redis"],
        tags: ["memory", "auth", "cache"],
    },
    {
        id: "INC-4819",
        title: "CDN Cache Invalidation Failure",
        severity: "medium",
        status: "monitoring",
        service: "CDN",
        environment: "production",
        startedAt: ago(125),
        duration: 125,
        impact: "Stale content served to 12% of users in EU region",
        impactedRequests: 45200,
        assignee: "Alex Kim",
        aiInvestigation: { active: false, stage: "Investigation complete", progress: 100, confidence: 95 },
        affectedServices: ["CDN", "Content Service"],
        tags: ["cdn", "cache", "regional"],
    },
    {
        id: "INC-4818",
        title: "Search Index Replication Lag",
        severity: "medium",
        status: "resolved",
        service: "Search Service",
        environment: "production",
        startedAt: ago(360),
        resolvedAt: ago(280),
        duration: 80,
        impact: "Search results up to 5 minutes stale",
        impactedRequests: 23100,
        assignee: "Jordan Lee",
        aiInvestigation: { active: false, stage: "Complete", progress: 100, confidence: 91 },
        affectedServices: ["Search Service", "Elasticsearch"],
        tags: ["search", "replication", "data"],
    },
    {
        id: "INC-4817",
        title: "Notification Service Queue Backlog",
        severity: "low",
        status: "resolved",
        service: "Notification Service",
        environment: "production",
        startedAt: ago(1440),
        resolvedAt: ago(1380),
        duration: 60,
        impact: "Email notifications delayed by up to 15 minutes",
        impactedRequests: 5600,
        assignee: "Pat Singh",
        aiInvestigation: { active: false, stage: "Complete", progress: 100, confidence: 88 },
        affectedServices: ["Notification Service", "RabbitMQ"],
        tags: ["queue", "notification"],
    },
    {
        id: "INC-4816",
        title: "Database Connection Pool Exhaustion",
        severity: "critical",
        status: "resolved",
        service: "Order Service",
        environment: "production",
        startedAt: ago(2880),
        resolvedAt: ago(2820),
        duration: 60,
        impact: "Order processing completely halted for 12 minutes",
        impactedRequests: 31200,
        assignee: "Sarah Chen",
        aiInvestigation: { active: false, stage: "Complete", progress: 100, confidence: 96 },
        affectedServices: ["Order Service", "PostgreSQL", "Payment API"],
        tags: ["database", "connection-pool"],
    },
    {
        id: "INC-4815",
        title: "Rate Limiter Misconfiguration",
        severity: "high",
        status: "resolved",
        service: "API Gateway",
        environment: "production",
        startedAt: ago(4320),
        resolvedAt: ago(4260),
        duration: 60,
        impact: "Legitimate API requests throttled — 8% drop in successful calls",
        impactedRequests: 19500,
        assignee: "Marcus Rivera",
        aiInvestigation: { active: false, stage: "Complete", progress: 100, confidence: 94 },
        affectedServices: ["API Gateway"],
        tags: ["config", "rate-limit"],
    },
];
/* ── Investigation Steps (INC-4821) ────────────────────── */
exports.investigationSteps = [
    { id: "s1", label: "Incident detected", description: "Anomaly detection triggered on Payment API latency", status: "completed", timestamp: ago(18), duration: 0, agent: "Incident Manager", findings: ["P99 latency exceeded 2000ms threshold", "Error rate spike to 23%"] },
    { id: "s2", label: "Collecting logs", description: "Gathering error logs from Payment API and dependent services", status: "completed", timestamp: ago(17), duration: 45, agent: "Log Analyst", findings: ["847 error entries in last 15 minutes", "Timeout errors in UserService calls"] },
    { id: "s3", label: "Analyzing traces", description: "Sampling distributed traces for slow requests", status: "completed", timestamp: ago(15), duration: 60, agent: "Trace Analyst", findings: ["37 traces show >2s latency", "UserService spans dominate trace duration"] },
    { id: "s4", label: "Inspecting recent deployment", description: "Checking deployment v1.8.4 changes and timing", status: "completed", timestamp: ago(13), duration: 90, agent: "GitHub Analyst", findings: ["Deployment 18m before incident", "UserService query logic changed", "2 files modified in data access layer"] },
    { id: "s5", label: "Comparing database query performance", description: "Analyzing PostgreSQL query patterns before and after deployment", status: "completed", timestamp: ago(10), duration: 120, agent: "Database Analyst", findings: ["Query count increased 4.7×", "N+1 pattern detected in user lookups", "Database CPU: 42% → 88%"] },
    { id: "s6", label: "Searching historical incidents", description: "Finding similar past incidents in knowledge base", status: "completed", timestamp: ago(7), duration: 30, agent: "Root Cause Analyst", findings: ["INC-4102 had similar N+1 pattern", "Resolved by adding batch query"] },
    { id: "s7", label: "Generating root-cause hypothesis", description: "Synthesizing evidence into root cause analysis", status: "running", timestamp: ago(5), agent: "Root Cause Analyst" },
];
/* ── Evidence (INC-4821) ───────────────────────────────── */
exports.evidence = [
    { id: "e1", type: "metric", title: "P99 Latency Spike", description: "Payment API P99 latency increased from 180ms to 2,340ms", timestamp: ago(18), confidence: 98, source: "Prometheus" },
    { id: "e2", type: "log", title: "Timeout Errors", description: "847 timeout errors in UserService calls within 15 minutes", timestamp: ago(17), confidence: 95, source: "Elasticsearch" },
    { id: "e3", type: "trace", title: "Slow Trace Samples", description: "37 distributed traces showing >2s total duration", timestamp: ago(15), confidence: 96, source: "Jaeger" },
    { id: "e4", type: "deployment", title: "Deployment v1.8.4", description: "Deployed 18 minutes before incident start", timestamp: ago(36), confidence: 92, source: "GitHub Actions" },
    { id: "e5", type: "code_change", title: "UserService Query Change", description: "Modified user lookup to individual queries instead of batch", timestamp: ago(120), confidence: 89, source: "GitHub PR #1847" },
    { id: "e6", type: "database", title: "Query Count Increase", description: "PostgreSQL query count increased 4.7× after deployment", timestamp: ago(18), confidence: 97, source: "pg_stat_statements" },
    { id: "e7", type: "database", title: "Database CPU Spike", description: "Database CPU utilization increased from 42% to 88%", timestamp: ago(18), confidence: 94, source: "CloudWatch" },
    { id: "e8", type: "historical", title: "Similar Incident INC-4102", description: "Previous N+1 query incident resolved with batch query pattern", timestamp: ago(43200), confidence: 78, source: "Knowledge Base" },
];
/* ── Root Cause Analysis ───────────────────────────────── */
exports.rootCauseAnalysis = {
    summary: "N+1 database queries introduced in UserService",
    confidence: 92,
    evidence: exports.evidence,
    contributingFactors: [
        "Query count increased 4.7× after deployment v1.8.4",
        "Latency spike started 18 minutes after deployment",
        "UserService data access layer changed from batch to individual queries",
        "Database CPU utilization increased from 42% to 88%",
        "No load testing performed on the changed query path",
    ],
    recommendation: "Revert UserService to batch query pattern using DataLoader. Add query count monitoring and load tests for data access changes.",
    affectedComponent: "UserService → PostgreSQL",
    relatedDeployment: "v1.8.4",
};
/* ── Logs ──────────────────────────────────────────────── */
exports.logs = [
    { id: "l1", timestamp: ago(1), level: "ERROR", service: "Payment API", message: "Request timeout after 2000ms calling UserService.getUser(id=8842)", traceId: "abc-def-123", requestId: "req-9981", isAnomaly: true },
    { id: "l2", timestamp: ago(1), level: "ERROR", service: "Payment API", message: "Request timeout after 2000ms calling UserService.getUser(id=7731)", traceId: "abc-def-124", requestId: "req-9982", isAnomaly: true },
    { id: "l3", timestamp: ago(2), level: "WARN", service: "User Service", message: "Slow query detected: SELECT * FROM users WHERE id = $1 (487ms)", traceId: "abc-def-123", requestId: "req-9981" },
    { id: "l4", timestamp: ago(2), level: "ERROR", service: "Payment API", message: "Failed to process payment: upstream service timeout", traceId: "abc-def-125", requestId: "req-9983", isAnomaly: true },
    { id: "l5", timestamp: ago(3), level: "WARN", service: "PostgreSQL", message: "Connection pool utilization at 94% (47/50 connections active)", isAnomaly: true },
    { id: "l6", timestamp: ago(3), level: "INFO", service: "API Gateway", message: "Health check passed for Payment API (response_time=1847ms)" },
    { id: "l7", timestamp: ago(4), level: "ERROR", service: "User Service", message: "Query execution exceeded threshold: 23 queries in single request context", traceId: "abc-def-126", requestId: "req-9984", isAnomaly: true },
    { id: "l8", timestamp: ago(5), level: "INFO", service: "Payment API", message: "Processing payment request for order_id=ORD-88421", traceId: "abc-def-127", requestId: "req-9985" },
    { id: "l9", timestamp: ago(5), level: "DEBUG", service: "Auth Service", message: "Token validated for user_id=8842, expires_in=3600s", traceId: "abc-def-127" },
    { id: "l10", timestamp: ago(6), level: "INFO", service: "Order Service", message: "Order ORD-88421 status updated to PROCESSING" },
    { id: "l11", timestamp: ago(7), level: "WARN", service: "User Service", message: "High query count detected: 47 individual user lookups in batch operation", isAnomaly: true },
    { id: "l12", timestamp: ago(8), level: "INFO", service: "API Gateway", message: "Rate limit bucket reset for client api-key-prod-main" },
    { id: "l13", timestamp: ago(10), level: "ERROR", service: "Payment API", message: "Circuit breaker OPEN for UserService after 5 consecutive failures", isAnomaly: true },
    { id: "l14", timestamp: ago(12), level: "INFO", service: "CDN", message: "Cache purge completed for /api/v2/payments/* endpoints" },
    { id: "l15", timestamp: ago(15), level: "WARN", service: "PostgreSQL", message: "Autovacuum running on users table — table bloat detected (1.2GB)" },
];
/* ── Metrics ───────────────────────────────────────────── */
function generateMetricData(baseValue, variance, spike) {
    const data = [];
    for (let i = 60; i >= 0; i--) {
        const t = new Date(Date.now() - i * 60000);
        let value = baseValue + (Math.random() - 0.5) * variance;
        if (spike && i <= spike.at && i >= spike.at - 18) {
            value = baseValue * spike.multiplier + (Math.random() - 0.5) * variance;
        }
        data.push({ timestamp: t.toISOString(), value: Math.max(0, Math.round(value * 100) / 100) });
    }
    return data;
}
exports.metrics = [
    { name: "CPU Utilization", unit: "%", data: generateMetricData(45, 10, { at: 20, multiplier: 1.95 }), current: 88, change: 102, status: "critical" },
    { name: "Memory Usage", unit: "%", data: generateMetricData(62, 5), current: 65, change: 4.8, status: "healthy" },
    { name: "Request Rate", unit: "req/s", data: generateMetricData(1200, 200, { at: 20, multiplier: 0.77 }), current: 924, change: -23, status: "warning" },
    { name: "Error Rate", unit: "%", data: generateMetricData(0.5, 0.3, { at: 20, multiplier: 46 }), current: 23, change: 4500, status: "critical" },
    { name: "P99 Latency", unit: "ms", data: generateMetricData(180, 30, { at: 20, multiplier: 13 }), current: 2340, change: 1200, status: "critical" },
    { name: "Database Connections", unit: "", data: generateMetricData(25, 5, { at: 20, multiplier: 1.88 }), current: 47, change: 88, status: "warning" },
    { name: "Queue Depth", unit: "", data: generateMetricData(12, 8), current: 15, change: 25, status: "healthy" },
    { name: "Cache Hit Ratio", unit: "%", data: generateMetricData(94, 3), current: 92, change: -2.1, status: "healthy" },
];
/* ── Traces ────────────────────────────────────────────── */
exports.traceSpans = [
    {
        id: "span-1", traceId: "trace-abc-123", service: "API Gateway", operation: "POST /api/v2/payments",
        duration: 2847, startTime: 0, status: "error", tags: { "http.method": "POST", "http.status_code": "504" },
        children: [
            {
                id: "span-2", traceId: "trace-abc-123", parentId: "span-1", service: "Auth Service", operation: "ValidateToken",
                duration: 12, startTime: 3, status: "ok", tags: { "auth.method": "JWT" },
            },
            {
                id: "span-3", traceId: "trace-abc-123", parentId: "span-1", service: "Payment Service", operation: "ProcessPayment",
                duration: 2780, startTime: 18, status: "error", tags: { "payment.method": "card" },
                children: [
                    {
                        id: "span-4", traceId: "trace-abc-123", parentId: "span-3", service: "User Service", operation: "GetUserProfile",
                        duration: 2340, startTime: 42, status: "error", tags: {}, databaseQueries: 23,
                        children: [
                            { id: "span-5", traceId: "trace-abc-123", parentId: "span-4", service: "PostgreSQL", operation: "SELECT users", duration: 1890, startTime: 85, status: "ok", tags: { "db.type": "postgresql", "db.statement": "SELECT * FROM users WHERE id = $1" }, databaseQueries: 23 },
                        ],
                    },
                    {
                        id: "span-6", traceId: "trace-abc-123", parentId: "span-3", service: "Order Service", operation: "GetOrder",
                        duration: 45, startTime: 2400, status: "ok", tags: {}, databaseQueries: 1,
                    },
                ],
            },
        ],
    },
];
/* ── Deployments ───────────────────────────────────────── */
exports.deployments = [
    { id: "d1", version: "v1.8.4", commitHash: "a3f8c2e", author: "Jamie Torres", message: "Refactor UserService data access layer", timestamp: ago(36), service: "User Service", environment: "production", status: "success", filesChanged: 4, servicesAffected: ["User Service", "Payment API"], errorRateBefore: 0.5, errorRateAfter: 23.1 },
    { id: "d2", version: "v1.8.3", commitHash: "b7e1d4a", author: "Sarah Chen", message: "Add payment retry logic with exponential backoff", timestamp: ago(1440), service: "Payment API", environment: "production", status: "success", filesChanged: 3, servicesAffected: ["Payment API"], errorRateBefore: 0.8, errorRateAfter: 0.3 },
    { id: "d3", version: "v2.3.1", commitHash: "c9f2e8b", author: "Marcus Rivera", message: "Update JWT token cache implementation", timestamp: ago(2160), service: "Auth Service", environment: "production", status: "success", filesChanged: 2, servicesAffected: ["Auth Service"], errorRateBefore: 0.2, errorRateAfter: 1.8 },
    { id: "d4", version: "v1.8.2", commitHash: "d4a7f1c", author: "Alex Kim", message: "Optimize search indexing pipeline", timestamp: ago(4320), service: "Search Service", environment: "production", status: "success", filesChanged: 6, servicesAffected: ["Search Service"], errorRateBefore: 0.4, errorRateAfter: 0.3 },
    { id: "d5", version: "v3.1.0", commitHash: "e2b9c3d", author: "Jordan Lee", message: "Implement CDN cache invalidation webhook", timestamp: ago(5760), service: "CDN", environment: "production", status: "success", filesChanged: 5, servicesAffected: ["CDN", "Content Service"], errorRateBefore: 0.1, errorRateAfter: 0.1 },
];
/* ── Git Changes ───────────────────────────────────────── */
exports.gitChanges = [
    {
        id: "gc1", prNumber: 1847, title: "Refactor UserService data access layer", author: "Jamie Torres", commitHash: "a3f8c2e", status: "merged",
        additions: 127, deletions: 89, testCoverage: 72,
        aiAnalysis: "Changed batch user query to individual lookups. This could cause N+1 query issues under high load.",
        potentialImpact: "HIGH — Data access pattern change affects all user lookup paths in Payment and Order services.",
        filesChanged: [
            { path: "src/services/UserService.ts", additions: 45, deletions: 38, language: "TypeScript" },
            { path: "src/repositories/UserRepository.ts", additions: 62, deletions: 41, language: "TypeScript" },
            { path: "src/models/User.ts", additions: 12, deletions: 5, language: "TypeScript" },
            { path: "tests/UserService.test.ts", additions: 8, deletions: 5, language: "TypeScript" },
        ],
    },
    {
        id: "gc2", prNumber: 1842, title: "Add payment retry logic", author: "Sarah Chen", commitHash: "b7e1d4a", status: "merged",
        additions: 89, deletions: 12, testCoverage: 94,
        aiAnalysis: "Well-structured retry logic with proper exponential backoff. No performance concerns identified.",
        potentialImpact: "LOW — Additive change with proper error handling and circuit breaker integration.",
        filesChanged: [
            { path: "src/services/PaymentService.ts", additions: 52, deletions: 8, language: "TypeScript" },
            { path: "src/utils/retry.ts", additions: 28, deletions: 0, language: "TypeScript" },
            { path: "tests/PaymentService.test.ts", additions: 9, deletions: 4, language: "TypeScript" },
        ],
    },
];
/* ── AI Agents ─────────────────────────────────────────── */
exports.agents = [
    { id: "a1", name: "Incident Manager", role: "Orchestrates investigation workflow and coordinates other agents", status: "running", currentTask: "Coordinating investigation for INC-4821", tools: ["create_incident", "assign_agent", "update_status", "send_notification", "generate_report"], toolCount: 5, lastExecution: ago(1), successRate: 97.3, avgExecutionTime: 8.2, totalExecutions: 1247 },
    { id: "a2", name: "Log Analyst", role: "Searches and analyzes application logs for anomalies", status: "completed", currentTask: "Analyzed 847 error logs for INC-4821", tools: ["search_logs", "filter_logs", "detect_anomaly", "correlate_events", "extract_patterns"], toolCount: 5, lastExecution: ago(15), successRate: 91.8, avgExecutionTime: 12.4, totalExecutions: 3892 },
    { id: "a3", name: "Metrics Analyst", role: "Monitors and analyzes infrastructure and application metrics", status: "idle", tools: ["query_prometheus", "detect_anomaly", "compare_baselines", "forecast_trend", "correlate_metrics"], toolCount: 5, lastExecution: ago(20), successRate: 93.5, avgExecutionTime: 6.7, totalExecutions: 2156 },
    { id: "a4", name: "Trace Analyst", role: "Analyzes distributed traces to identify bottlenecks", status: "running", currentTask: "Sampling slow traces from Payment API", tools: ["search_traces", "analyze_spans", "detect_bottleneck", "compare_traces", "identify_dependencies", "measure_latency", "find_errors"], toolCount: 7, lastExecution: ago(2), successRate: 94.2, avgExecutionTime: 15.1, totalExecutions: 1834 },
    { id: "a5", name: "GitHub Analyst", role: "Inspects code changes, PRs, and deployment artifacts", status: "completed", tools: ["get_pr", "get_commits", "analyze_diff", "check_coverage", "find_dependencies"], toolCount: 5, lastExecution: ago(10), successRate: 89.4, avgExecutionTime: 9.8, totalExecutions: 967 },
    { id: "a6", name: "Database Analyst", role: "Analyzes database performance, queries, and schema changes", status: "running", currentTask: "Comparing query patterns before/after v1.8.4", tools: ["query_stats", "analyze_slow_queries", "check_connections", "detect_locks", "measure_throughput", "analyze_indexes"], toolCount: 6, lastExecution: ago(3), successRate: 92.1, avgExecutionTime: 11.3, totalExecutions: 1423 },
    { id: "a7", name: "Root Cause Analyst", role: "Synthesizes evidence to determine probable root cause", status: "running", currentTask: "Generating root-cause hypothesis for INC-4821", tools: ["synthesize_evidence", "rank_hypotheses", "calculate_confidence", "find_similar_incidents", "generate_recommendation"], toolCount: 5, lastExecution: ago(1), successRate: 86.7, avgExecutionTime: 18.9, totalExecutions: 892 },
    { id: "a8", name: "Report Generator", role: "Creates structured incident reports and postmortems", status: "idle", tools: ["generate_report", "create_timeline", "format_evidence", "export_pdf", "create_postmortem"], toolCount: 5, lastExecution: ago(60), successRate: 95.8, avgExecutionTime: 22.1, totalExecutions: 634 },
];
/* ── Evaluation Metrics ────────────────────────────────── */
exports.evaluationMetrics = [
    { name: "Investigation Accuracy", value: 91.2, unit: "%", trend: "up", target: 95, category: "accuracy" },
    { name: "Root Cause Accuracy", value: 87.4, unit: "%", trend: "up", target: 90, category: "accuracy" },
    { name: "Evidence Accuracy", value: 93.8, unit: "%", trend: "stable", target: 95, category: "accuracy" },
    { name: "Tool Selection Accuracy", value: 89.1, unit: "%", trend: "up", target: 92, category: "accuracy" },
    { name: "False Positive Rate", value: 6.2, unit: "%", trend: "down", target: 5, category: "quality" },
    { name: "Hallucination Rate", value: 2.1, unit: "%", trend: "down", target: 1, category: "quality" },
    { name: "Avg Investigation Time", value: 4.7, unit: "min", trend: "down", category: "performance" },
    { name: "Token Usage", value: 12400, unit: "tokens", trend: "stable", category: "cost" },
    { name: "Cost per Investigation", value: 0.42, unit: "USD", trend: "down", category: "cost" },
];
/* ── Knowledge Base ────────────────────────────────────── */
exports.knowledgeEntries = [
    { id: "kb1", title: "N+1 Query Pattern in UserService", type: "incident", summary: "Database performance degradation caused by N+1 query pattern in user lookup. Resolved by implementing DataLoader batch queries.", tags: ["database", "n+1", "performance", "UserService"], createdAt: ago(43200), similarityScore: 0.94, relatedIncidents: ["INC-4102", "INC-3847"] },
    { id: "kb2", title: "Payment API Timeout Handling", type: "runbook", summary: "Standard operating procedure for handling Payment API timeouts including circuit breaker configuration and fallback strategies.", tags: ["payment", "timeout", "circuit-breaker"], createdAt: ago(86400), similarityScore: 0.82, relatedIncidents: ["INC-4521", "INC-4102"] },
    { id: "kb3", title: "Database Connection Pool Sizing", type: "architecture", summary: "Guidelines for PostgreSQL connection pool configuration based on workload patterns and service topology.", tags: ["database", "connection-pool", "postgresql"], createdAt: ago(129600), similarityScore: 0.76, relatedIncidents: ["INC-4816"] },
    { id: "kb4", title: "Post-Deployment Monitoring Checklist", type: "runbook", summary: "Checklist for monitoring key metrics after production deployments including latency, error rates, and resource utilization.", tags: ["deployment", "monitoring", "checklist"], createdAt: ago(172800), similarityScore: 0.71, relatedIncidents: [] },
    { id: "kb5", title: "INC-4102 Postmortem: Order Service N+1 Queries", type: "postmortem", summary: "Root cause was N+1 query pattern in OrderService causing database CPU spike. Resolved by implementing batch queries with DataLoader.", tags: ["database", "n+1", "OrderService", "postmortem"], createdAt: ago(216000), similarityScore: 0.91, relatedIncidents: ["INC-4102"] },
];
/* ── Services Health ───────────────────────────────────── */
exports.serviceHealth = [
    { name: "API Gateway", status: "healthy", latencyP99: 45, errorRate: 0.1, requestRate: 4500, uptime: 99.99, dependencies: ["Auth Service", "Payment API", "Order Service", "Search Service"] },
    { name: "Payment API", status: "degraded", latencyP99: 2340, errorRate: 23.1, requestRate: 1200, uptime: 99.87, dependencies: ["User Service", "Order Service", "PostgreSQL", "Stripe API"] },
    { name: "User Service", status: "degraded", latencyP99: 1890, errorRate: 15.2, requestRate: 3200, uptime: 99.91, dependencies: ["PostgreSQL", "Redis"] },
    { name: "Auth Service", status: "healthy", latencyP99: 28, errorRate: 0.3, requestRate: 2800, uptime: 99.98, dependencies: ["Redis", "PostgreSQL"] },
    { name: "Order Service", status: "healthy", latencyP99: 120, errorRate: 0.4, requestRate: 890, uptime: 99.96, dependencies: ["PostgreSQL", "Payment API", "Notification Service"] },
    { name: "Search Service", status: "healthy", latencyP99: 85, errorRate: 0.2, requestRate: 1500, uptime: 99.97, dependencies: ["Elasticsearch"] },
    { name: "Notification Service", status: "healthy", latencyP99: 35, errorRate: 0.1, requestRate: 450, uptime: 99.99, dependencies: ["RabbitMQ", "SendGrid API"] },
    { name: "CDN", status: "healthy", latencyP99: 12, errorRate: 0.05, requestRate: 15000, uptime: 99.995, dependencies: ["Content Service"] },
];
/* ── KPI Metrics ───────────────────────────────────────── */
exports.kpiMetrics = {
    activeIncidents: 3,
    criticalIncidents: 1,
    mttd: 2.4, // minutes
    mttr: 47.8, // minutes
    investigationsRunning: 2,
    aiAssistedResolutions: 156,
    totalIncidents30d: 23,
    aiAccuracy: 91.2,
};
/* ── Evaluation Trend Data ─────────────────────────────── */
function generateEvalTrend(base, variance, improving) {
    const data = [];
    for (let i = 30; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const trend = improving ? (30 - i) * 0.15 : -(30 - i) * 0.1;
        data.push({
            timestamp: d.toISOString().split("T")[0],
            value: Math.min(100, Math.max(0, base + trend + (Math.random() - 0.5) * variance)),
        });
    }
    return data;
}
//# sourceMappingURL=mock-data.js.map