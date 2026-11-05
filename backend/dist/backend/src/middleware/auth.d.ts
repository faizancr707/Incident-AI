import { Request, Response, NextFunction } from "express";
export type UserRole = "owner" | "admin" | "engineer" | "viewer";
export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    team?: string;
}
export declare const PERMISSIONS: Record<string, Record<string, UserRole[]>>;
export declare function hasPermission(role: UserRole, resource: string, action: string): boolean;
export declare function createSession(email: string, password: string): {
    token: string;
    user: AuthUser;
} | null;
export declare function destroySession(token: string): void;
export declare function getSession(token: string): AuthUser | null;
declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}
/** Extract user from Authorization header (Bearer token) */
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): void;
/** Require authentication */
export declare function requireAuth(req: Request, res: Response, next: NextFunction): void;
/** Require specific permission */
export declare function requirePermission(resource: string, action: string): (req: Request, res: Response, next: NextFunction) => void;
export declare function auditLog(action: string, resource: string, details?: Record<string, unknown>): (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map