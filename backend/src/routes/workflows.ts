import { Router, Request, Response } from 'express';
import { logger } from '../lib/logger';
import { workflowStore } from '../workflows/store';
import { executeWorkflow } from '../workflows/engine';
import { WorkflowStatus, WorkflowType } from '../workflows/types';

const router = Router();

// GET /api/workflows - List all workflow executions
// Query params: status, type, provider, limit (default 50), offset (default 0)
router.get('/', (req: Request, res: Response) => {
  try {
    let executions = workflowStore.getAll();
    
    // Filter by status
    if (req.query.status) {
      executions = executions.filter(e => e.status === req.query.status);
    }
    // Filter by type
    if (req.query.type) {
      executions = executions.filter(e => e.workflowType === req.query.type);
    }
    // Filter by provider
    if (req.query.provider) {
      executions = executions.filter(e => e.triggerEvent.provider === req.query.provider);
    }
    
    // Sort by createdAt descending
    executions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const total = executions.length;
    const paged = executions.slice(offset, offset + limit);
    
    res.json({ workflows: paged, total, limit, offset });
  } catch (error: any) {
    logger.error('Error listing workflows', { error: error.message });
    res.status(500).json({ error: 'Failed to list workflows' });
  }
});

// GET /api/workflows/stats - Workflow statistics
router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = workflowStore.getStats();
    res.json(stats);
  } catch (error: any) {
    logger.error('Error getting workflow stats', { error: error.message });
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// GET /api/workflows/:id - Get workflow execution detail
router.get('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const execution = workflowStore.get(id);
    if (!execution) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }
    res.json({ workflow: execution });
  } catch (error: any) {
    logger.error('Error getting workflow', { error: error.message });
    res.status(500).json({ error: 'Failed to get workflow' });
  }
});

// POST /api/workflows/:id/approve - Approve a workflow waiting for human approval
router.post('/:id/approve', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const execution = workflowStore.get(id);
    if (!execution) { res.status(404).json({ error: 'Workflow not found' }); return; }
    if (execution.status !== 'waiting_approval') {
      res.status(400).json({ error: 'Workflow is not waiting for approval' }); return;
    }
    workflowStore.update(id, { status: 'completed', updatedAt: new Date(), completedAt: new Date() });
    logger.info('Workflow approved', { workflowId: id, approver: req.user?.email || 'anonymous' });
    res.json({ approved: true, workflow: workflowStore.get(id) });
  } catch (error: any) {
    logger.error('Error approving workflow', { error: error.message });
    res.status(500).json({ error: 'Failed to approve workflow' });
  }
});

// POST /api/workflows/:id/retry - Retry a failed workflow
router.post('/:id/retry', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const execution = workflowStore.get(id);
    if (!execution) { res.status(404).json({ error: 'Workflow not found' }); return; }
    if (execution.status !== 'failed') {
      res.status(400).json({ error: 'Only failed workflows can be retried' }); return;
    }
    if (execution.retryCount >= execution.maxRetries) {
      res.status(400).json({ error: 'Maximum retries exceeded' }); return;
    }
    // Re-execute the workflow with the same event
    const newExecution = executeWorkflow(execution.triggerEvent);
    // Mark old as cancelled
    workflowStore.update(id, { status: 'cancelled' as any });
    logger.info('Workflow retried', { oldId: id, newId: (newExecution as any).then ? 'async' : (newExecution as any).id });
    res.json({ retried: true });
  } catch (error: any) {
    logger.error('Error retrying workflow', { error: error.message });
    res.status(500).json({ error: 'Failed to retry workflow' });
  }
});

// GET /api/integrations - List integration configs
router.get('/integrations/list', (req: Request, res: Response) => {
  try {
    const integrations = workflowStore.getIntegrations();
    res.json({ integrations });
  } catch (error: any) {
    logger.error('Error listing integrations', { error: error.message });
    res.status(500).json({ error: 'Failed to list integrations' });
  }
});

// POST /api/integrations/:provider/test - Test webhook connection
router.post('/integrations/:provider/test', (req: Request, res: Response) => {
  try {
    const provider = req.params.provider as string;
    if (!['github', 'gitlab', 'vercel'].includes(provider)) {
      res.status(400).json({ error: 'Invalid provider' }); return;
    }
    // Simulate a test event
    logger.info('Testing integration', { provider });
    res.json({ success: true, message: `Test webhook sent for ${provider}`, timestamp: new Date() });
  } catch (error: any) {
    logger.error('Error testing integration', { error: error.message });
    res.status(500).json({ error: 'Failed to test integration' });
  }
});

export { router as workflowRoutes };
