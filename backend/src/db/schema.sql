-- AI Production Incident Investigator
-- PostgreSQL Database Schema

/* ── Extensions ────────────────────────────────────────── */
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector for embeddings

/* ── Enums ─────────────────────────────────────────────── */
CREATE TYPE severity_level AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE incident_status AS ENUM ('detected', 'investigating', 'identified', 'monitoring', 'resolved');
CREATE TYPE environment_type AS ENUM ('production', 'staging', 'development');
CREATE TYPE agent_status AS ENUM ('idle', 'running', 'completed', 'failed', 'paused');
CREATE TYPE evidence_type AS ENUM ('log', 'trace', 'metric', 'deployment', 'code_change', 'database', 'historical');
CREATE TYPE deployment_status AS ENUM ('success', 'failed', 'rolling_back', 'in_progress');

/* ── Core Tables ───────────────────────────────────────── */

CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'engineer',
  avatar_url TEXT,
  workspace_id UUID REFERENCES workspaces(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  repository_url TEXT,
  team VARCHAR(100),
  workspace_id UUID REFERENCES workspaces(id),
  dependencies JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

/* ── Incidents ─────────────────────────────────────────── */

CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id VARCHAR(20) UNIQUE NOT NULL, -- e.g., INC-4821
  title VARCHAR(500) NOT NULL,
  description TEXT,
  severity severity_level NOT NULL,
  status incident_status NOT NULL DEFAULT 'detected',
  environment environment_type NOT NULL DEFAULT 'production',
  service_id UUID REFERENCES services(id),
  assignee_id UUID REFERENCES users(id),
  workspace_id UUID REFERENCES workspaces(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  impact TEXT,
  impacted_requests INTEGER DEFAULT 0,
  affected_services UUID[] DEFAULT '{}',
  deployment_version VARCHAR(50),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_service ON incidents(service_id);
CREATE INDEX idx_incidents_started ON incidents(started_at DESC);

/* ── Investigations ────────────────────────────────────── */

CREATE TABLE investigations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'running',
  current_step VARCHAR(100),
  progress INTEGER DEFAULT 0,
  confidence DECIMAL(5,2),
  root_cause TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE investigation_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investigation_id UUID REFERENCES investigations(id) ON DELETE CASCADE,
  step_name VARCHAR(100) NOT NULL,
  agent_name VARCHAR(100) NOT NULL,
  status agent_status DEFAULT 'pending',
  description TEXT,
  findings JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  error TEXT,
  step_order INTEGER NOT NULL
);

CREATE TABLE evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investigation_id UUID REFERENCES investigations(id) ON DELETE CASCADE,
  type evidence_type NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  confidence DECIMAL(5,2),
  source VARCHAR(255),
  timestamp TIMESTAMPTZ,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE root_cause_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investigation_id UUID REFERENCES investigations(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  confidence DECIMAL(5,2) NOT NULL,
  contributing_factors TEXT[] DEFAULT '{}',
  recommendation TEXT,
  affected_component VARCHAR(255),
  related_deployment VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

/* ── Deployments ───────────────────────────────────────── */

CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version VARCHAR(50) NOT NULL,
  commit_hash VARCHAR(40) NOT NULL,
  author VARCHAR(255),
  message TEXT,
  service_id UUID REFERENCES services(id),
  environment environment_type DEFAULT 'production',
  status deployment_status DEFAULT 'success',
  files_changed INTEGER DEFAULT 0,
  services_affected UUID[] DEFAULT '{}',
  error_rate_before DECIMAL(8,4),
  error_rate_after DECIMAL(8,4),
  deployed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_deployments_service ON deployments(service_id);
CREATE INDEX idx_deployments_deployed ON deployments(deployed_at DESC);

/* ── AI Agents ─────────────────────────────────────────── */

CREATE TABLE agent_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name VARCHAR(100) NOT NULL,
  investigation_id UUID REFERENCES investigations(id),
  status agent_status DEFAULT 'running',
  task TEXT,
  tools_used TEXT[] DEFAULT '{}',
  tokens_used INTEGER DEFAULT 0,
  cost DECIMAL(10,6) DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  result JSONB,
  error TEXT
);

/* ── Knowledge Base (RAG) ──────────────────────────────── */

CREATE TABLE knowledge_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  type VARCHAR(50) NOT NULL, -- incident, runbook, postmortem, architecture, resolution
  summary TEXT,
  content TEXT,
  tags TEXT[] DEFAULT '{}',
  related_incidents UUID[] DEFAULT '{}',
  workspace_id UUID REFERENCES workspaces(id),
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_knowledge_embedding ON knowledge_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_knowledge_type ON knowledge_entries(type);
CREATE INDEX idx_knowledge_tags ON knowledge_entries USING GIN(tags);

/* ── Evaluations ───────────────────────────────────────── */

CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investigation_id UUID REFERENCES investigations(id),
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(10,4) NOT NULL,
  category VARCHAR(50), -- accuracy, performance, cost, quality
  evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evaluations_metric ON evaluations(metric_name);
CREATE INDEX idx_evaluations_date ON evaluations(evaluated_at DESC);

/* ── Incident Reports ──────────────────────────────────── */

CREATE TABLE incident_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  executive_summary TEXT,
  impact JSONB,
  timeline JSONB DEFAULT '[]',
  resolution JSONB,
  prevention TEXT[] DEFAULT '{}',
  ai_trace JSONB DEFAULT '[]',
  confidence DECIMAL(5,2),
  limitations TEXT[] DEFAULT '{}',
  source_references JSONB DEFAULT '[]',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ
);

/* ── Seed Data ─────────────────────────────────────────── */

INSERT INTO workspaces (name, slug) VALUES ('Acme Corp', 'acme-corp');
