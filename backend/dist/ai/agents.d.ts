/**
 * AI Agent System — LangGraph-based investigation workflow
 *
 * This module defines the multi-agent system that orchestrates
 * incident investigation using specialized agents.
 *
 * Architecture:
 *   Incident Manager (orchestrator)
 *   ├── Log Analyst
 *   ├── Metrics Analyst
 *   ├── Trace Analyst
 *   ├── GitHub Analyst
 *   ├── Database Analyst
 *   ├── Root Cause Analyst
 *   └── Report Generator
 *
 * Each agent has:
 *   - Defined tools (MCP-compatible)
 *   - Structured output schema
 *   - Memory (conversation + investigation context)
 *   - Evaluation hooks
 */
export interface AgentTool {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    execute: (params: Record<string, unknown>) => Promise<unknown>;
}
export interface AgentConfig {
    name: string;
    role: string;
    model: string;
    temperature: number;
    maxTokens: number;
    tools: AgentTool[];
    systemPrompt: string;
}
export interface InvestigationState {
    incidentId: string;
    currentStep: string;
    steps: InvestigationStepState[];
    evidence: EvidenceItem[];
    hypotheses: Hypothesis[];
    rootCause: RootCause | null;
    agentMessages: AgentMessage[];
    metadata: Record<string, unknown>;
}
interface InvestigationStepState {
    id: string;
    agent: string;
    status: "pending" | "running" | "completed" | "failed";
    startedAt?: Date;
    completedAt?: Date;
    findings: string[];
    error?: string;
}
interface EvidenceItem {
    id: string;
    type: string;
    title: string;
    description: string;
    confidence: number;
    source: string;
    timestamp: Date;
    data: Record<string, unknown>;
}
interface Hypothesis {
    id: string;
    summary: string;
    confidence: number;
    supportingEvidence: string[];
    contradictingEvidence: string[];
}
interface RootCause {
    summary: string;
    confidence: number;
    evidence: string[];
    recommendation: string;
    contributingFactors: string[];
}
interface AgentMessage {
    agent: string;
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    timestamp: Date;
    toolCall?: {
        name: string;
        arguments: Record<string, unknown>;
        result: unknown;
    };
}
export declare const agentConfigs: AgentConfig[];
export declare function createInvestigationWorkflow(): import("@langchain/langgraph").CompiledStateGraph<import("@langchain/langgraph").StateType<{
    incidentId: import("@langchain/langgraph").LastValue<string>;
    currentStep: import("@langchain/langgraph").LastValue<string>;
    steps: import("@langchain/langgraph").BinaryOperatorAggregate<InvestigationStepState[], InvestigationStepState[]>;
    evidence: import("@langchain/langgraph").BinaryOperatorAggregate<EvidenceItem[], EvidenceItem[]>;
    hypotheses: import("@langchain/langgraph").BinaryOperatorAggregate<Hypothesis[], Hypothesis[]>;
    rootCause: import("@langchain/langgraph").BinaryOperatorAggregate<RootCause | null, RootCause | null>;
    agentMessages: import("@langchain/langgraph").BinaryOperatorAggregate<AgentMessage[], AgentMessage[]>;
    metadata: import("@langchain/langgraph").BinaryOperatorAggregate<Record<string, unknown>, Record<string, unknown>>;
}>, import("@langchain/langgraph").UpdateType<{
    incidentId: import("@langchain/langgraph").LastValue<string>;
    currentStep: import("@langchain/langgraph").LastValue<string>;
    steps: import("@langchain/langgraph").BinaryOperatorAggregate<InvestigationStepState[], InvestigationStepState[]>;
    evidence: import("@langchain/langgraph").BinaryOperatorAggregate<EvidenceItem[], EvidenceItem[]>;
    hypotheses: import("@langchain/langgraph").BinaryOperatorAggregate<Hypothesis[], Hypothesis[]>;
    rootCause: import("@langchain/langgraph").BinaryOperatorAggregate<RootCause | null, RootCause | null>;
    agentMessages: import("@langchain/langgraph").BinaryOperatorAggregate<AgentMessage[], AgentMessage[]>;
    metadata: import("@langchain/langgraph").BinaryOperatorAggregate<Record<string, unknown>, Record<string, unknown>>;
}>, "collect_logs" | "detect" | "analyze_traces" | "inspect_deployment" | "analyze_database" | "search_knowledge" | "synthesize" | "report" | "__start__", {
    incidentId: import("@langchain/langgraph").LastValue<string>;
    currentStep: import("@langchain/langgraph").LastValue<string>;
    steps: import("@langchain/langgraph").BinaryOperatorAggregate<InvestigationStepState[], InvestigationStepState[]>;
    evidence: import("@langchain/langgraph").BinaryOperatorAggregate<EvidenceItem[], EvidenceItem[]>;
    hypotheses: import("@langchain/langgraph").BinaryOperatorAggregate<Hypothesis[], Hypothesis[]>;
    rootCause: import("@langchain/langgraph").BinaryOperatorAggregate<RootCause | null, RootCause | null>;
    agentMessages: import("@langchain/langgraph").BinaryOperatorAggregate<AgentMessage[], AgentMessage[]>;
    metadata: import("@langchain/langgraph").BinaryOperatorAggregate<Record<string, unknown>, Record<string, unknown>>;
}, {
    incidentId: import("@langchain/langgraph").LastValue<string>;
    currentStep: import("@langchain/langgraph").LastValue<string>;
    steps: import("@langchain/langgraph").BinaryOperatorAggregate<InvestigationStepState[], InvestigationStepState[]>;
    evidence: import("@langchain/langgraph").BinaryOperatorAggregate<EvidenceItem[], EvidenceItem[]>;
    hypotheses: import("@langchain/langgraph").BinaryOperatorAggregate<Hypothesis[], Hypothesis[]>;
    rootCause: import("@langchain/langgraph").BinaryOperatorAggregate<RootCause | null, RootCause | null>;
    agentMessages: import("@langchain/langgraph").BinaryOperatorAggregate<AgentMessage[], AgentMessage[]>;
    metadata: import("@langchain/langgraph").BinaryOperatorAggregate<Record<string, unknown>, Record<string, unknown>>;
}, import("@langchain/langgraph").StateDefinition>;
export declare function getInvestigationState(incidentId: string): import("@langchain/langgraph").StateType<{
    incidentId: import("@langchain/langgraph").LastValue<string>;
    currentStep: import("@langchain/langgraph").LastValue<string>;
    steps: import("@langchain/langgraph").BinaryOperatorAggregate<InvestigationStepState[], InvestigationStepState[]>;
    evidence: import("@langchain/langgraph").BinaryOperatorAggregate<EvidenceItem[], EvidenceItem[]>;
    hypotheses: import("@langchain/langgraph").BinaryOperatorAggregate<Hypothesis[], Hypothesis[]>;
    rootCause: import("@langchain/langgraph").BinaryOperatorAggregate<RootCause | null, RootCause | null>;
    agentMessages: import("@langchain/langgraph").BinaryOperatorAggregate<AgentMessage[], AgentMessage[]>;
    metadata: import("@langchain/langgraph").BinaryOperatorAggregate<Record<string, unknown>, Record<string, unknown>>;
}> | null;
export declare function executeInvestigation(incidentId: string): import("@langchain/langgraph").StateType<{
    incidentId: import("@langchain/langgraph").LastValue<string>;
    currentStep: import("@langchain/langgraph").LastValue<string>;
    steps: import("@langchain/langgraph").BinaryOperatorAggregate<InvestigationStepState[], InvestigationStepState[]>;
    evidence: import("@langchain/langgraph").BinaryOperatorAggregate<EvidenceItem[], EvidenceItem[]>;
    hypotheses: import("@langchain/langgraph").BinaryOperatorAggregate<Hypothesis[], Hypothesis[]>;
    rootCause: import("@langchain/langgraph").BinaryOperatorAggregate<RootCause | null, RootCause | null>;
    agentMessages: import("@langchain/langgraph").BinaryOperatorAggregate<AgentMessage[], AgentMessage[]>;
    metadata: import("@langchain/langgraph").BinaryOperatorAggregate<Record<string, unknown>, Record<string, unknown>>;
}>;
export declare function streamInvestigation(incidentId: string): import("@langchain/langgraph").StateType<{
    incidentId: import("@langchain/langgraph").LastValue<string>;
    currentStep: import("@langchain/langgraph").LastValue<string>;
    steps: import("@langchain/langgraph").BinaryOperatorAggregate<InvestigationStepState[], InvestigationStepState[]>;
    evidence: import("@langchain/langgraph").BinaryOperatorAggregate<EvidenceItem[], EvidenceItem[]>;
    hypotheses: import("@langchain/langgraph").BinaryOperatorAggregate<Hypothesis[], Hypothesis[]>;
    rootCause: import("@langchain/langgraph").BinaryOperatorAggregate<RootCause | null, RootCause | null>;
    agentMessages: import("@langchain/langgraph").BinaryOperatorAggregate<AgentMessage[], AgentMessage[]>;
    metadata: import("@langchain/langgraph").BinaryOperatorAggregate<Record<string, unknown>, Record<string, unknown>>;
}> | null;
export {};
//# sourceMappingURL=agents.d.ts.map