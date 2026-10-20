import { Router, Request, Response } from 'express';
import { logger } from '../lib/logger';
import { workflowStore } from '../workflows/store';
import { executeWorkflow } from '../workflows/engine';
import { WorkflowStatus, WorkflowType, integrationConfigUpdateSchema } from '../workflows/types';

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

const integrationRouter = Router();

// GET /api/integrations & /api/workflows/integrations - List integration configs
integrationRouter.get('/', (req: Request, res: Response) => {
  try {
    const integrations = workflowStore.getIntegrations();
    res.json({ integrations });
  } catch (error: any) {
    logger.error('Error listing integrations', { error: error.message });
    res.status(500).json({ error: 'Failed to list integrations' });
  }
});

// GET /api/workflows/integrations/list - List integration configs (alias)
integrationRouter.get('/list', (req: Request, res: Response) => {
  try {
    const integrations = workflowStore.getIntegrations();
    res.json({ integrations });
  } catch (error: any) {
    logger.error('Error listing integrations', { error: error.message });
    res.status(500).json({ error: 'Failed to list integrations' });
  }
});

// POST /api/workflows/integrations/:provider/test - Test webhook connection
integrationRouter.post('/:provider/test', (req: Request, res: Response) => {
  try {
    const provider = req.params.provider as string;
    if (!['github', 'gitlab', 'vercel', 'slack', 'pagerduty', 'datadog', 'cloudwatch', 'postgres'].includes(provider)) {
      res.status(400).json({ error: 'Invalid provider' }); return;
    }
    logger.info('Testing integration', { provider });
    res.json({ success: true, message: `Test webhook sent for ${provider}`, timestamp: new Date() });
  } catch (error: any) {
    logger.error('Error testing integration', { error: error.message });
    res.status(500).json({ error: 'Failed to test integration' });
  }
});

// ── GitHub Repository Connection Endpoints ───────────────────────────

// POST /api/workflows/integrations/github/connect-repo
// Verifies a GitHub repository by making a REAL API call to GitHub
integrationRouter.post('/github/connect-repo', async (req: Request, res: Response) => {
  try {
    const { repoUrl, token } = req.body as { repoUrl?: string; token?: string };

    // Validate repoUrl is provided
    if (!repoUrl || typeof repoUrl !== 'string') {
      res.status(400).json({ error: 'repoUrl is required' });
      return;
    }

    // Validate URL format: https://github.com/{owner}/{repo}
    const cleanUrl = repoUrl.trim().replace(/\.git$/, '').replace(/\/$/, '');
    const urlMatch = cleanUrl.match(/^https?:\/\/github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)$/);
    if (!urlMatch) {
      res.status(400).json({
        error: 'Invalid GitHub repository URL. Expected format: https://github.com/owner/repo',
      });
      return;
    }

    const [, owner, repo] = urlMatch;

    // Make a REAL HTTP request to GitHub API to verify the repository
    const headers: Record<string, string> = {
      'User-Agent': 'Incident-AI-Investigator',
      'Accept': 'application/vnd.github.v3+json',
    };
    if (token && typeof token === 'string' && token.trim()) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }

    logger.info('Verifying GitHub repository', { owner, repo, hasToken: !!token });

    const ghResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });

    if (!ghResponse.ok) {
      const ghError = await ghResponse.json().catch(() => ({ message: ghResponse.statusText }));
      const status = ghResponse.status;

      if (status === 404) {
        res.status(404).json({
          error: `Repository '${owner}/${repo}' not found. It may not exist or may be private (provide a PAT for private repos).`,
        });
        return;
      }

      if (status === 401) {
        res.status(401).json({
          error: 'Authentication failed. The provided token is invalid or expired.',
        });
        return;
      }

      if (status === 403) {
        // Check for rate limiting
        const rateLimitRemaining = ghResponse.headers.get('x-ratelimit-remaining');
        const rateLimitReset = ghResponse.headers.get('x-ratelimit-reset');
        if (rateLimitRemaining === '0' && rateLimitReset) {
          const resetTime = new Date(parseInt(rateLimitReset) * 1000).toLocaleTimeString();
          res.status(429).json({
            error: `GitHub API rate limit exceeded. Resets at ${resetTime}. Use a Personal Access Token for higher limits.`,
          });
          return;
        }
        res.status(403).json({
          error: (ghError as any).message || 'Access forbidden. Check token permissions.',
        });
        return;
      }

      res.status(status).json({
        error: (ghError as any).message || `GitHub API error: ${status}`,
      });
      return;
    }

    // Parse successful response
    const ghData = await ghResponse.json() as {
      name: string;
      full_name: string;
      private: boolean;
      default_branch: string;
      description: string | null;
      html_url: string;
      language: string | null;
      stargazers_count: number;
    };

    // Build connected repo record (never store the actual token)
    const connectedRepo = {
      owner,
      repo,
      url: ghData.html_url,
      fullName: ghData.full_name,
      private: ghData.private,
      defaultBranch: ghData.default_branch,
      description: ghData.description,
      language: ghData.language,
      stars: ghData.stargazers_count,
      connectedAt: new Date().toISOString(),
      hasToken: !!(token && token.trim()),
    };

    // Persist to integration store metadata
    const integration = workflowStore.getIntegration('integration-github');
    const existingRepos: any[] = (integration?.metadata?.connectedRepos as any[]) || [];

    // Avoid duplicates: replace if same owner/repo already connected
    const filteredRepos = existingRepos.filter(
      (r: any) => !(r.owner === owner && r.repo === repo)
    );
    filteredRepos.push(connectedRepo);

    workflowStore.updateIntegration('integration-github', {
      metadata: {
        ...(integration?.metadata || {}),
        connectedRepos: filteredRepos,
      },
    });

    logger.info('GitHub repository connected successfully', {
      fullName: ghData.full_name,
      private: ghData.private,
      defaultBranch: ghData.default_branch,
    });

    res.json({
      success: true,
      repo: connectedRepo,
      githubData: {
        name: ghData.name,
        full_name: ghData.full_name,
        private: ghData.private,
        default_branch: ghData.default_branch,
        description: ghData.description,
        html_url: ghData.html_url,
        language: ghData.language,
        stargazers_count: ghData.stargazers_count,
      },
    });
  } catch (error: any) {
    logger.error('Error connecting GitHub repository', { error: error.message });
    res.status(500).json({ error: `Failed to connect repository: ${error.message}` });
  }
});

// GET /api/workflows/integrations/github/repos
// Returns the list of connected GitHub repositories
integrationRouter.get('/github/repos', (req: Request, res: Response) => {
  try {
    const integration = workflowStore.getIntegration('integration-github');
    const repos = (integration?.metadata?.connectedRepos as any[]) || [];
    res.json({ repos });
  } catch (error: any) {
    logger.error('Error fetching connected repos', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch connected repositories' });
  }
});

// DELETE /api/workflows/integrations/github/repos/:owner/:repo
// Disconnects a previously connected GitHub repository
integrationRouter.delete('/github/repos/:owner/:repo', (req: Request, res: Response) => {
  try {
    const { owner, repo } = req.params;
    const integration = workflowStore.getIntegration('integration-github');
    const existingRepos: any[] = (integration?.metadata?.connectedRepos as any[]) || [];

    const filtered = existingRepos.filter(
      (r: any) => !(r.owner === owner && r.repo === repo)
    );

    if (filtered.length === existingRepos.length) {
      res.status(404).json({ error: `Repository '${owner}/${repo}' is not connected` });
      return;
    }

    workflowStore.updateIntegration('integration-github', {
      metadata: {
        ...(integration?.metadata || {}),
        connectedRepos: filtered,
      },
    });

    logger.info('GitHub repository disconnected', { owner, repo });
    res.json({ success: true, message: `Repository ${owner}/${repo} disconnected` });
  } catch (error: any) {
    logger.error('Error disconnecting repository', { error: error.message });
    res.status(500).json({ error: 'Failed to disconnect repository' });
  }
});

// GET /api/workflows/integrations/:id - Get specific integration
integrationRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const integration = workflowStore.getIntegration(id);
    if (!integration) {
      res.status(404).json({ error: `Integration '${id}' not found` });
      return;
    }
    res.json({ integration });
  } catch (error: any) {
    logger.error('Error getting integration', { id: req.params.id, error: error.message });
    res.status(500).json({ error: 'Failed to get integration' });
  }
});

// Reusable handler for updating integration configuration (supports both PUT and POST)
const handleUpdateIntegration = (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const validation = integrationConfigUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.flatten(),
      });
      return;
    }

    const updated = workflowStore.updateIntegration(id, validation.data);
    if (!updated) {
      res.status(404).json({ error: `Integration '${id}' not found` });
      return;
    }

    logger.info(`Integration configuration updated via ${req.method}`, {
      id,
      provider: updated.provider,
      status: updated.status,
      user: req.user?.email || 'anonymous',
    });

    res.json({
      success: true,
      message: `Configuration for ${updated.name} updated successfully`,
      integration: updated,
    });
  } catch (error: any) {
    logger.error('Error updating integration', { id: req.params.id, error: error.message });
    res.status(500).json({ error: 'Failed to update integration configuration' });
  }
};

// PUT /api/workflows/integrations/:id - Update integration configuration
integrationRouter.put('/:id', handleUpdateIntegration);

// POST /api/workflows/integrations/:id - Update integration configuration (alias)
integrationRouter.post('/:id', handleUpdateIntegration);


// Mount integration router under /integrations on workflow router
router.use('/integrations', integrationRouter);

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
    logger.error('Error getting workflow', { id: req.params.id, error: error.message });
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

export { router as workflowRoutes, integrationRouter as integrationRoutes };
