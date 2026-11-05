import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger';
import { WorkflowEvent, WorkflowExecution, WorkflowType, WorkflowNode, WorkflowCheckpoint, WorkflowResult } from './types';
import { workflowStore } from './store';

// WorkflowAnnotation - state for workflows
const WorkflowAnnotation = Annotation.Root({
  executionId: Annotation<string>(),
  event: Annotation<WorkflowEvent>(),
  currentNode: Annotation<string>(),
  nodes: Annotation<WorkflowNode[]>({
    reducer: (state, update) => {
      const newState = [...state];
      for (const u of update) {
        const idx = newState.findIndex(s => s.id === u.id);
        if (idx !== -1) newState[idx] = { ...newState[idx], ...u };
        else newState.push(u);
      }
      return newState;
    }
  }),
  analysis: Annotation<Record<string, unknown>>({
    reducer: (state, update) => ({ ...state, ...update })
  }),
  recommendations: Annotation<string[]>({
    reducer: (state, update) => [...state, ...update]
  }),
  requiresApproval: Annotation<boolean>(),
  approved: Annotation<boolean>(),
  result: Annotation<WorkflowResult | null>({
    reducer: (_, update) => update
  })
});

type WorkflowState = typeof WorkflowAnnotation.State;

// Helper to simulate AI agent processing
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── CI/CD Pipeline Workflow ───
// Nodes: receive_event → validate_code → run_tests → security_scan → deploy_check → report
async function receiveEventNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  await sleep(500);
  const event = state.event;
  return {
    currentNode: 'validate_code',
    nodes: [{ id: 'receive_event', name: 'Receive Event', status: 'completed', agent: 'event-receiver',
      output: { provider: event.provider, type: event.eventType, repo: event.repository?.fullName },
      startedAt: new Date(), completedAt: new Date(), duration: 500 }],
    analysis: { eventReceived: true, provider: event.provider, eventType: event.eventType }
  };
}

async function validateCodeNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  await sleep(1500);
  const findings = [
    'Code follows project conventions',
    'No syntax errors detected',
    state.event.commitSha ? `Commit ${state.event.commitSha.slice(0,7)} validated` : 'No commit SHA available'
  ];
  return {
    currentNode: 'run_tests',
    nodes: [{ id: 'validate_code', name: 'Validate Code', status: 'completed', agent: 'code-validator',
      output: { findings, linesChanged: Math.floor(Math.random() * 500) + 10, filesChanged: Math.floor(Math.random() * 20) + 1 },
      startedAt: new Date(), completedAt: new Date(), duration: 1500 }],
    recommendations: ['Consider adding unit tests for new utility functions']
  };
}

async function runTestsNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  await sleep(2000);
  const passed = Math.floor(Math.random() * 50) + 100;
  const failed = Math.floor(Math.random() * 3);
  return {
    currentNode: 'security_scan',
    nodes: [{ id: 'run_tests', name: 'Run Tests', status: 'completed', agent: 'test-runner',
      output: { totalTests: passed + failed, passed, failed, coverage: (85 + Math.random() * 10).toFixed(1) + '%' },
      startedAt: new Date(), completedAt: new Date(), duration: 2000 }],
    analysis: { testsRun: true, testsPassed: passed, testsFailed: failed }
  };
}

async function securityScanNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  await sleep(1500);
  const vulns = Math.floor(Math.random() * 3);
  return {
    currentNode: 'deploy_check',
    nodes: [{ id: 'security_scan', name: 'Security Scan', status: 'completed', agent: 'security-scanner',
      output: { vulnerabilities: vulns, severity: vulns > 0 ? 'medium' : 'none', dependencies_scanned: 156 },
      startedAt: new Date(), completedAt: new Date(), duration: 1500 }],
    analysis: { securityScanComplete: true, vulnerabilitiesFound: vulns },
    recommendations: vulns > 0 ? ['Review and patch detected vulnerabilities before production deploy'] : []
  };
}

async function deployCheckNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  await sleep(1000);
  const testsFailed = (state.analysis as any)?.testsFailed > 0;
  const vulnsFound = (state.analysis as any)?.vulnerabilitiesFound > 2;
  const needsApproval = testsFailed || vulnsFound;
  return {
    currentNode: needsApproval ? 'approval_gate' : 'generate_report',
    nodes: [{ id: 'deploy_check', name: 'Deploy Readiness', status: 'completed', agent: 'deploy-checker',
      output: { ready: !needsApproval, blockers: testsFailed ? ['Failing tests'] : vulnsFound ? ['Security vulnerabilities'] : [], requiresApproval: needsApproval },
      startedAt: new Date(), completedAt: new Date(), duration: 1000 }],
    requiresApproval: needsApproval
  };
}

// ─── Code Review Workflow ───
// Nodes: receive_pr → analyze_changes → review_code → suggest_improvements → report
async function receivePRNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  await sleep(500);
  return {
    currentNode: 'analyze_changes',
    nodes: [{ id: 'receive_pr', name: 'Receive PR', status: 'completed', agent: 'pr-receiver',
      output: { pr: state.event.pullRequest, branch: state.event.pullRequest?.headBranch || 'unknown' },
      startedAt: new Date(), completedAt: new Date(), duration: 500 }]
  };
}

async function analyzeChangesNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  await sleep(2000);
  return {
    currentNode: 'review_code',
    nodes: [{ id: 'analyze_changes', name: 'Analyze Changes', status: 'completed', agent: 'change-analyzer',
      output: { complexity: 'moderate', riskLevel: 'low', patterns: ['Added new API endpoint', 'Updated database schema', 'Modified auth logic'] },
      startedAt: new Date(), completedAt: new Date(), duration: 2000 }],
    analysis: { changeAnalysis: { complexity: 'moderate', riskLevel: 'low' } }
  };
}

async function reviewCodeNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  await sleep(2500);
  return {
    currentNode: 'suggest_improvements',
    nodes: [{ id: 'review_code', name: 'AI Code Review', status: 'completed', agent: 'code-reviewer',
      output: {
        score: 8.2,
        findings: [
          { severity: 'info', message: 'Consider extracting utility function', file: 'src/utils.ts', line: 42 },
          { severity: 'warning', message: 'Missing error handling for edge case', file: 'src/handlers.ts', line: 78 },
          { severity: 'info', message: 'Good use of TypeScript generics', file: 'src/types.ts', line: 15 }
        ]
      },
      startedAt: new Date(), completedAt: new Date(), duration: 2500 }],
    analysis: { codeReviewScore: 8.2 }
  };
}

async function suggestImprovementsNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  await sleep(1000);
  return {
    currentNode: 'generate_report',
    nodes: [{ id: 'suggest_improvements', name: 'Suggest Improvements', status: 'completed', agent: 'improvement-advisor',
      output: { suggestions: ['Add input validation for new endpoints', 'Add integration tests', 'Update API documentation'] },
      startedAt: new Date(), completedAt: new Date(), duration: 1000 }],
    recommendations: ['Add input validation for new endpoints', 'Add integration tests', 'Update API documentation']
  };
}

// ─── Failure Analysis Workflow ───
async function detectFailureNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  await sleep(500);
  return {
    currentNode: 'collect_failure_logs',
    nodes: [{ id: 'detect_failure', name: 'Detect Failure', status: 'completed', agent: 'failure-detector',
      output: { failureType: state.event.pipeline?.status || 'unknown', pipeline: state.event.pipeline?.id },
      startedAt: new Date(), completedAt: new Date(), duration: 500 }]
  };
}

async function collectFailureLogsNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  await sleep(2000);
  return {
    currentNode: 'analyze_failure',
    nodes: [{ id: 'collect_failure_logs', name: 'Collect Logs', status: 'completed', agent: 'log-collector',
      output: { logLines: 247, errorPatterns: ['Connection timeout to database', 'OOM in test runner'], timeRange: '15 minutes' },
      startedAt: new Date(), completedAt: new Date(), duration: 2000 }],
    analysis: { logsCollected: true, errorPatterns: ['Connection timeout', 'OOM'] }
  };
}

async function analyzeFailureNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  await sleep(2500);
  return {
    currentNode: 'generate_report',
    nodes: [{ id: 'analyze_failure', name: 'Analyze Failure', status: 'completed', agent: 'failure-analyst',
      output: {
        rootCause: 'Database connection pool exhaustion during parallel test execution',
        confidence: 0.87,
        contributingFactors: ['Increased test parallelism in recent config change', 'Database connection limit not updated'],
        similarIncidents: ['INC-2025-042', 'INC-2025-018']
      },
      startedAt: new Date(), completedAt: new Date(), duration: 2500 }],
    analysis: { failureAnalysis: { rootCause: 'DB connection pool exhaustion', confidence: 0.87 } },
    recommendations: ['Increase database connection pool limit', 'Add connection retry logic', 'Review test parallelism settings']
  };
}

// ─── Deploy Monitor Workflow ───
async function monitorDeployNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  await sleep(1000);
  return {
    currentNode: 'health_check',
    nodes: [{ id: 'monitor_deploy', name: 'Monitor Deployment', status: 'completed', agent: 'deploy-monitor',
      output: { environment: state.event.deployment?.environment || 'production', deployId: state.event.deployment?.id },
      startedAt: new Date(), completedAt: new Date(), duration: 1000 }]
  };
}

async function healthCheckNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  await sleep(3000);
  const healthy = Math.random() > 0.2;
  return {
    currentNode: healthy ? 'generate_report' : 'rollback_decision',
    nodes: [{ id: 'health_check', name: 'Health Check', status: 'completed', agent: 'health-checker',
      output: { healthy, responseTime: (120 + Math.random() * 80).toFixed(0) + 'ms', errorRate: healthy ? '0.1%' : '5.3%', endpoints_checked: 12 },
      startedAt: new Date(), completedAt: new Date(), duration: 3000 }],
    analysis: { healthCheckPassed: healthy }
  };
}

async function rollbackDecisionNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  await sleep(500);
  return {
    currentNode: 'generate_report',
    nodes: [{ id: 'rollback_decision', name: 'Rollback Decision', status: 'completed', agent: 'rollback-advisor',
      output: { recommendation: 'rollback', reason: 'Health check failed - elevated error rate detected', autoRollback: false },
      startedAt: new Date(), completedAt: new Date(), duration: 500 }],
    requiresApproval: true,
    recommendations: ['Rollback to previous version', 'Investigate root cause before re-deploying']
  };
}

// ─── Shared Nodes ───
async function approvalGateNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  // In real impl, this would pause and wait for human approval
  // For now, auto-approve after delay
  await sleep(1000);
  return {
    currentNode: 'generate_report',
    nodes: [{ id: 'approval_gate', name: 'Human Approval', status: 'completed', agent: 'approval-gate',
      output: { approved: true, approver: 'system-auto', reason: 'Auto-approved in demo mode' },
      startedAt: new Date(), completedAt: new Date(), duration: 1000 }],
    approved: true
  };
}

async function generateReportNode(state: WorkflowState): Promise<Partial<WorkflowState>> {
  await sleep(1000);
  const summary = (() => {
    switch (state.event.eventType) {
      case 'push': return `CI/CD pipeline completed for push to ${state.event.ref || 'main'}`;
      case 'pull_request': case 'merge_request': return `Code review completed for PR #${state.event.pullRequest?.number || 'unknown'}`;
      case 'pipeline': return `Pipeline failure analysis completed`;
      case 'deployment': case 'deployment_status': case 'deployment_ready': return `Deployment monitoring completed for ${state.event.deployment?.environment || 'production'}`;
      default: return `Workflow completed for ${state.event.eventType} event`;
    }
  })();
  
  return {
    currentNode: 'completed',
    nodes: [{ id: 'generate_report', name: 'Generate Report', status: 'completed', agent: 'report-generator',
      output: { summary, totalNodes: state.nodes.length + 1, recommendations: state.recommendations },
      startedAt: new Date(), completedAt: new Date(), duration: 1000 }],
    result: {
      summary,
      details: state.analysis,
      recommendations: state.recommendations,
      confidence: 0.85 + Math.random() * 0.1,
      artifacts: [{ type: 'report', title: 'Workflow Report', content: summary }]
    }
  };
}

// ─── Workflow Factory ───
function determineWorkflowType(event: WorkflowEvent): WorkflowType {
  switch (event.eventType) {
    case 'pull_request': case 'pull_request_review': case 'merge_request': return 'code_review';
    case 'deployment': case 'deployment_status': case 'deployment_ready': return 'deploy_monitor';
    case 'pipeline': case 'check_suite': case 'check_run': {
      if (event.pipeline?.status === 'failed' || event.action === 'failure') return 'failure_analysis';
      return 'ci_cd_pipeline';
    }
    case 'push': case 'tag_push': default: return 'ci_cd_pipeline';
  }
}

function createCICDWorkflow() {
  return new StateGraph(WorkflowAnnotation)
    .addNode('receive_event', receiveEventNode as any)
    .addNode('validate_code', validateCodeNode as any)
    .addNode('run_tests', runTestsNode as any)
    .addNode('security_scan', securityScanNode as any)
    .addNode('deploy_check', deployCheckNode as any)
    .addNode('approval_gate', approvalGateNode as any)
    .addNode('generate_report', generateReportNode as any)
    .addEdge(START, 'receive_event')
    .addEdge('receive_event', 'validate_code')
    .addEdge('validate_code', 'run_tests')
    .addEdge('run_tests', 'security_scan')
    .addEdge('security_scan', 'deploy_check')
    .addConditionalEdges('deploy_check', (state: any) => state.requiresApproval ? 'approval_gate' : 'generate_report')
    .addEdge('approval_gate', 'generate_report')
    .addEdge('generate_report', END)
    .compile();
}

function createCodeReviewWorkflow() {
  return new StateGraph(WorkflowAnnotation)
    .addNode('receive_pr', receivePRNode as any)
    .addNode('analyze_changes', analyzeChangesNode as any)
    .addNode('review_code', reviewCodeNode as any)
    .addNode('suggest_improvements', suggestImprovementsNode as any)
    .addNode('generate_report', generateReportNode as any)
    .addEdge(START, 'receive_pr')
    .addEdge('receive_pr', 'analyze_changes')
    .addEdge('analyze_changes', 'review_code')
    .addEdge('review_code', 'suggest_improvements')
    .addEdge('suggest_improvements', 'generate_report')
    .addEdge('generate_report', END)
    .compile();
}

function createFailureAnalysisWorkflow() {
  return new StateGraph(WorkflowAnnotation)
    .addNode('detect_failure', detectFailureNode as any)
    .addNode('collect_failure_logs', collectFailureLogsNode as any)
    .addNode('analyze_failure', analyzeFailureNode as any)
    .addNode('generate_report', generateReportNode as any)
    .addEdge(START, 'detect_failure')
    .addEdge('detect_failure', 'collect_failure_logs')
    .addEdge('collect_failure_logs', 'analyze_failure')
    .addEdge('analyze_failure', 'generate_report')
    .addEdge('generate_report', END)
    .compile();
}

function createDeployMonitorWorkflow() {
  return new StateGraph(WorkflowAnnotation)
    .addNode('monitor_deploy', monitorDeployNode as any)
    .addNode('health_check', healthCheckNode as any)
    .addNode('rollback_decision', rollbackDecisionNode as any)
    .addNode('generate_report', generateReportNode as any)
    .addEdge(START, 'monitor_deploy')
    .addEdge('monitor_deploy', 'health_check')
    .addConditionalEdges('health_check', (state: any) => state.analysis?.healthCheckPassed ? 'generate_report' : 'rollback_decision')
    .addEdge('rollback_decision', 'generate_report')
    .addEdge('generate_report', END)
    .compile();
}

// ─── Main Entry Point ───
export async function executeWorkflow(event: WorkflowEvent): Promise<WorkflowExecution> {
  const workflowType = determineWorkflowType(event);
  const executionId = uuidv4();
  
  // Create initial execution record
  const execution: WorkflowExecution = {
    id: executionId,
    workflowType,
    status: 'running',
    triggerEvent: event,
    currentNode: 'starting',
    nodes: [],
    checkpoints: [],
    retryCount: 0,
    maxRetries: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  workflowStore.create(execution);
  logger.info(`Starting ${workflowType} workflow`, { executionId, eventType: event.eventType, provider: event.provider });
  
  // Select and run the appropriate workflow
  const workflowMap: Record<WorkflowType, () => any> = {
    ci_cd_pipeline: createCICDWorkflow,
    code_review: createCodeReviewWorkflow,
    failure_analysis: createFailureAnalysisWorkflow,
    deploy_monitor: createDeployMonitorWorkflow
  };
  
  const createWorkflow = workflowMap[workflowType];
  const workflow = createWorkflow();
  
  // Run async
  (async () => {
    try {
      const initialState = {
        executionId,
        event,
        currentNode: 'starting',
        nodes: [],
        analysis: {},
        recommendations: [],
        requiresApproval: false,
        approved: false,
        result: null
      };
      
      const stream = await workflow.stream(initialState);
      for await (const stateUpdate of stream) {
        const nodeName = Object.keys(stateUpdate)[0];
        const update = stateUpdate[nodeName];
        
        // Update execution in store
        const current = workflowStore.get(executionId);
        if (current) {
          let mergedNodes = [...current.nodes];
          if (update.nodes) {
            for (const u of update.nodes) {
              const idx = mergedNodes.findIndex(n => n.id === u.id);
              if (idx !== -1) mergedNodes[idx] = { ...mergedNodes[idx], ...u };
              else mergedNodes.push(u);
            }
          }
          
          // Save checkpoint
          const checkpoint: WorkflowCheckpoint = {
            id: uuidv4(),
            nodeId: nodeName,
            state: update,
            timestamp: new Date()
          };
          
          workflowStore.update(executionId, {
            currentNode: update.currentNode || current.currentNode,
            nodes: mergedNodes,
            checkpoints: [...current.checkpoints, checkpoint],
            status: update.currentNode === 'completed' ? 'completed' : update.requiresApproval ? 'waiting_approval' : 'running',
            result: update.result || current.result,
            updatedAt: new Date(),
            completedAt: update.currentNode === 'completed' ? new Date() : undefined
          });
        }
      }
      
      logger.info(`Workflow ${workflowType} completed`, { executionId });
    } catch (error: any) {
      logger.error(`Workflow ${workflowType} failed`, { executionId, error: error.message });
      workflowStore.update(executionId, {
        status: 'failed',
        error: error.message,
        updatedAt: new Date()
      });
    }
  })();
  
  return execution;
}

export { determineWorkflowType };
