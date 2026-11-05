# LangGraph AI Workflow Engine & Webhook Integrations

## Overview

A production-ready **LangGraph AI Workflow Engine** integrated with the Incident Investigator application. It processes incoming push, pull request, CI/CD pipeline, and deployment events from **GitHub**, **GitLab**, and **Vercel** via asynchronous **BullMQ** job queues and autonomous multi-agent state machines with persistent checkpoints.

---

## Architecture Diagram

```
                 Incoming Webhooks
  GitHub (/api/webhooks/github)  [HMAC-SHA256, X-Hub-Signature-256]
  GitLab (/api/webhooks/gitlab)  [X-Gitlab-Token]
  Vercel (/api/webhooks/vercel)  [HMAC-SHA1, x-vercel-signature]
                         │
                         ▼
             Network Boundary & Ingestion
  ├── 1. Signature Verification (timingSafeEqual)
  ├── 2. Event Normalization (WorkflowEvent schema)
  └── 3. Idempotency Guard (In-memory TTL cache)
                         │
                         ▼
                   Job Queue Layer
  ├── BullMQ Queue ("workflow-events")
  ├── Concurrency: 3 workers
  ├── Exponential Backoff Retries (max 5)
  └── Fallback: In-memory MockQueue if Redis unavailable
                         │
                         ▼
             LangGraph StateGraph Engine
  ├── Annotation.Root State Machine
  ├── Checkpoint Persistence (WorkflowCheckpoint records)
  └── Dynamic Workflow Dispatch:
      ├── CI/CD Pipeline (validate → test → sec_scan → deploy_check → report)
      ├── Code Review (analyze → review → suggestions → report)
      ├── Failure Analysis (detect → collect_logs → analyze_failure → report)
      └── Deployment Health Monitor (monitor → health_check → rollback_decision)
                         │
                         ▼
               Human-in-the-Loop Gates
  ├── Conditional Approval Intercepts
  └── Approve / Reject Endpoints with RBAC
                         │
                         ▼
                React Dashboard Pages
  ├── /workflows (Workflow executions list, filters, real-time status)
  ├── /workflows/[id] (Interactive LangGraph pipeline, node outputs, checkpoints)
  └── /integrations (Webhook URLs, HMAC secret keys, connection tester)
```

---

## Webhook Endpoints

| Provider | Endpoint | Signature Header | Event Types Supported |
|---|---|---|---|
| **GitHub** | `POST /api/webhooks/github` | `X-Hub-Signature-256` | `push`, `pull_request`, `pull_request_review`, `check_suite`, `check_run` |
| **GitLab** | `POST /api/webhooks/gitlab` | `X-Gitlab-Token` | `push`, `merge_request`, `pipeline`, `deployment`, `tag_push` |
| **Vercel** | `POST /api/webhooks/vercel` | `x-vercel-signature` | `deployment.created`, `deployment.succeeded`, `deployment.failed`, `deployment.ready` |

---

## Workflow Engine REST APIs

- `GET /api/workflows` — List all workflow executions (filter by `status`, `type`, `provider`, with pagination).
- `GET /api/workflows/stats` — Metrics breakdown by status, type, provider, and duration.
- `GET /api/workflows/:id` — Full execution details, node states, and state checkpoints.
- `POST /api/workflows/:id/approve` — Approve a workflow held at a human approval gate.
- `POST /api/workflows/:id/retry` — Retry a failed workflow using preserved trigger context.
- `GET /api/workflows/integrations/list` — List configured webhook integrations.
- `POST /api/workflows/integrations/:provider/test` — Trigger a test connection and synthetic event.

---

## Verification & Test Results

1. **GitHub Push Event**: Triggered `ci_cd_pipeline` StateGraph; executed all 7 nodes, passed 135 assertions, saved 7 checkpoints, completed with 92% confidence.
2. **GitHub Pull Request Event**: Triggered `code_review` StateGraph; analyzed changes, reviewed code, and generated AI recommendations.
3. **GitLab Pipeline Failure**: Triggered `failure_analysis` StateGraph; ingested failure logs, determined root cause, and suggested remediation.
4. **Vercel Deployment Event**: Triggered `deploy_monitor` StateGraph; evaluated environment health metrics.
5. **Idempotency Guard**: Tested duplicate delivery with same delivery ID; returned `{ received: true, duplicate: true }` without redundant execution.
6. **Next.js Frontend Build**: All 15 routes compiled with 0 errors. Verified HTTP 200 on `/workflows`, `/workflows/[id]`, and `/integrations`.
