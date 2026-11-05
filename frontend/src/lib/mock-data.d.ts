import { Incident, LogEntry, MetricSeries, TraceSpan, Deployment, GitChange, AIAgent, EvaluationMetric, KnowledgeEntry, InvestigationStep, Evidence, RootCauseAnalysis, ServiceHealth } from "./types";
export declare const incidents: Incident[];
export declare const investigationSteps: InvestigationStep[];
export declare const evidence: Evidence[];
export declare const rootCauseAnalysis: RootCauseAnalysis;
export declare const logs: LogEntry[];
export declare const metrics: MetricSeries[];
export declare const traceSpans: TraceSpan[];
export declare const deployments: Deployment[];
export declare const gitChanges: GitChange[];
export declare const agents: AIAgent[];
export declare const evaluationMetrics: EvaluationMetric[];
export declare const knowledgeEntries: KnowledgeEntry[];
export declare const serviceHealth: ServiceHealth[];
export declare const kpiMetrics: {
    activeIncidents: number;
    criticalIncidents: number;
    mttd: number;
    mttr: number;
    investigationsRunning: number;
    aiAssistedResolutions: number;
    totalIncidents30d: number;
    aiAccuracy: number;
};
export declare function generateEvalTrend(base: number, variance: number, improving: boolean): {
    timestamp: string;
    value: number;
}[];
//# sourceMappingURL=mock-data.d.ts.map