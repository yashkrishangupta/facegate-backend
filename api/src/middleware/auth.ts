import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env";

/**
 * Auth middleware
 *
 * Retrofits real login onto what was previously an open, unauthenticated
 * website (architecture doc Section 9 originally deferred this — this is
 * that follow-up). Every route that isn't explicitly public should get
 * `requireAuth`, then optionally `requireRole([...])`.
 */

export interface AuthUser {
    adminId: string;
    role: "SUPER_ADMIN" | "ADMIN" | "FACULTY" | "VIEWER";
    facultyId: string | null;
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export const requireAuth = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {

    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        res.status(401).json({ success: false, message: "Missing or invalid Authorization header" });
        return;
    }

    const token = header.slice("Bearer ".length);

    try {
        const payload = jwt.verify(token, JWT_SECRET) as AuthUser;
        req.user = {
            adminId: payload.adminId,
            role: payload.role,
            facultyId: payload.facultyId ?? null
        };
        next();
    } catch {
        res.status(401).json({ success: false, message: "Invalid or expired session — please log in again" });
    }

};

/**
 * Restricts a route to specific roles. Always use AFTER requireAuth.
 */
export const requireRole = (allowedRoles: AuthUser["role"][]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            res.status(403).json({ success: false, message: "You don't have permission to do that" });
            return;
        }
        next();
    };
};

/**
 * Shorthand for the common "SUPER_ADMIN or ADMIN" gate used across most
 * management routes (Rooms, Devices, Master Data, Change Log).
 */
export const requireAdmin = requireRole(["SUPER_ADMIN", "ADMIN"]);

/**
 * SUPER_ADMIN only — password resets, role changes, account status changes.
 */
export const requireSuperAdmin = requireRole(["SUPER_ADMIN"]);