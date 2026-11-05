# AI Production Incident Investigator

An AI-powered incident investigation and root-cause-analysis platform that connects application logs, metrics, traces, GitHub deployments, database activity, infrastructure signals, and AI agents to investigate production incidents and present evidence-backed findings.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Frontend                               │
│  Next.js · TypeScript · Tailwind CSS · shadcn/ui · Recharts  │
│  Framer Motion · TanStack Query                               │
└──────────────────────┬───────────────────────────────────────┘
                       │ REST API
┌──────────────────────┴───────────────────────────────────────┐
│                        Backend                                │
│  Node.js · Express · TypeScript                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   AI Agent System                        │ │
│  │  LangGraph · OpenAI · Embeddings · RAG · MCP · Tools    │ │
│  │                                                          │ │
│  │  Incident Manager ─── Log Analyst                       │ │
│  │       │              ├── Metrics Analyst                 │ │
│  │       │              ├── Trace Analyst                   │ │
│  │       │              ├── GitHub Analyst                  │ │
│  │       │              ├── Database Analyst                │ │
│  │       │              ├── Root Cause Analyst              │ │
│  │       │              └── Report Generator               │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────┬───────────────────┬───────────────────┬───────────┘
           │                   │                   │
    ┌──────┴──────┐    ┌──────┴──────┐    ┌──────┴──────┐
    │ PostgreSQL  │    │    Redis    │    │ OpenTelemetry│
    │ + pgvector  │    │   (Cache)   │    │ (Telemetry)  │
    └─────────────┘    └─────────────┘    └──────────────┘
```

## Quick Start

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Backend

```bash
cd backend
npm install
npm run dev
```

API runs on [http://localhost:3001](http://localhost:3001)

## Design System

| Token | Hex | Usage |
|-------|-----|-------|
| **Lime Spark** | `#B8E62E` | Success, active states, AI activity, primary actions |
| **Graphite** | `#1E2028` | Dark foundation, navigation, code surfaces |
| **Emerald Ink** | `#0A3D2E` | AI analysis, confidence, deep analytical surfaces |
| **Champagne** | `#F5DEB3` | Warnings, important findings, attention |
| **Royal Iris** | `#7B5EA7` | AI intelligence, agent states, reasoning |
| **Signal Blue** | `#3B82F6` | Telemetry, traces, infrastructure, links |
| **Porcelain** | `#F5F5F0` | Light backgrounds, content surfaces |

## Features

- **Incident Dashboard** — KPI cards, active incidents, service health
- **Incident Investigation** — AI-powered root cause analysis with evidence
- **AI Investigation Workspace** — Split-screen investigation command center
- **Log Explorer** — Terminal-inspired log analysis with AI anomaly detection
- **Metrics Dashboard** — CPU, memory, latency, error rates with Recharts
- **Trace Explorer** — Distributed tracing with waterfall visualization
- **Deployment Analysis** — Before/after deployment comparison
- **GitHub Intelligence** — Code change analysis and impact assessment
- **AI Agent Control Center** — 8 specialized agents with real-time status
- **Knowledge Base** — RAG-powered semantic search of past incidents
- **Evaluation Dashboard** — AI accuracy, cost, and quality metrics
- **Incident Reports** — Professional postmortem generation

## Tech Stack

### Frontend
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui + Radix UI
- Recharts
- Framer Motion
- TanStack Query
- Lucide React

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL + pgvector
- Redis
- OpenAI GPT-4o
- LangGraph (agent orchestration)
- OpenTelemetry
- Prometheus metrics

## License

Private — All rights reserved.
