import type { Request, Response, NextFunction } from "express";

// VITE_SUPABASE_URL = Supabase REST/Auth API URL (https://xxx.supabase.co)
// SUPABASE_ANON_KEY = Supabase publishable anon key
const SUPABASE_REST_URL = process.env["VITE_SUPABASE_URL"];
const SUPABASE_ANON_KEY = process.env["SUPABASE_ANON_KEY"];

const ROLE_RANK: Record<string, number> = { user: 1, staff: 2, admin: 3 };

export interface AuthenticatedRequest extends Request {
  authUserId?: string;
  authRole?: string;
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}

async function verifyToken(token: string): Promise<{ id: string } | null> {
  if (!SUPABASE_REST_URL || !SUPABASE_ANON_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_REST_URL}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as { id: string };
  } catch {
    return null;
  }
}

async function fetchRole(userId: string, token: string): Promise<string | null> {
  if (!SUPABASE_REST_URL || !SUPABASE_ANON_KEY) return null;
  try {
    const res = await fetch(
      `${SUPABASE_REST_URL}/rest/v1/profiles?id=eq.${userId}&select=role&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_ANON_KEY,
          Accept: "application/json",
        },
      },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ role: string }>;
    return rows[0]?.role ?? null;
  } catch {
    return null;
  }
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  verifyToken(token)
    .then((user) => {
      if (!user) {
        res.status(401).json({ error: "Invalid or expired token" });
        return;
      }
      req.authUserId = user.id;
      next();
    })
    .catch(() => {
      res.status(401).json({ error: "Authentication failed" });
    });
}

export function requireRole(minRole: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const token = extractToken(req);
    if (!token || !req.authUserId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    fetchRole(req.authUserId, token)
      .then((role) => {
        if (!role) {
          res.status(403).json({ error: "User profile not found" });
          return;
        }
        const userRank = ROLE_RANK[role] ?? 0;
        const requiredRank = ROLE_RANK[minRole] ?? 999;
        if (userRank < requiredRank) {
          res.status(403).json({ error: `Requires ${minRole} role or higher` });
          return;
        }
        req.authRole = role;
        next();
      })
      .catch(() => {
        res.status(403).json({ error: "Authorization check failed" });
      });
  };
}
