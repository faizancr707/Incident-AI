export type UserRole = 'owner' | 'admin' | 'engineer' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  team?: string;
}

export const PERMISSIONS = {
  incidents: { view: ['owner','admin','engineer','viewer'], create: ['owner','admin','engineer'], update: ['owner','admin','engineer'], delete: ['owner','admin'] },
  investigations: { view: ['owner','admin','engineer','viewer'], start: ['owner','admin','engineer'], approve: ['owner','admin'] },
  logs: { view: ['owner','admin','engineer','viewer'] },
  metrics: { view: ['owner','admin','engineer','viewer'] },
  traces: { view: ['owner','admin','engineer','viewer'] },
  deployments: { view: ['owner','admin','engineer','viewer'], rollback: ['owner','admin'] },
  github: { view: ['owner','admin','engineer','viewer'] },
  agents: { view: ['owner','admin','engineer'], configure: ['owner','admin'] },
  reports: { view: ['owner','admin','engineer','viewer'], export: ['owner','admin','engineer'], approve: ['owner','admin'] },
  settings: { view: ['owner','admin'], update: ['owner','admin'] },
  team: { view: ['owner','admin'], manage: ['owner'] },
  remediation: { view: ['owner','admin','engineer','viewer'], execute: ['owner','admin','engineer'], approve: ['owner','admin'] },
} as const;

export function hasPermission(role: UserRole, resource: keyof typeof PERMISSIONS, action: string): boolean {
  const resourcePerms = PERMISSIONS[resource] as any;
  if (!resourcePerms || !resourcePerms[action]) return false;
  return resourcePerms[action].includes(role);
}

export function canAccess(role: UserRole, path: string): boolean {
  // Map paths to resources
  const pathMap: Record<string, { resource: keyof typeof PERMISSIONS; action: string }> = {
    '/dashboard': { resource: 'incidents', action: 'view' },
    '/incidents': { resource: 'incidents', action: 'view' },
    '/investigations': { resource: 'investigations', action: 'view' },
    '/services': { resource: 'metrics', action: 'view' },
    '/reports': { resource: 'reports', action: 'view' },
    '/settings': { resource: 'settings', action: 'view' },
  };
  const mapping = pathMap[path];
  if (!mapping) return true;
  return hasPermission(role, mapping.resource, mapping.action);
}
