import { Router } from "express";
import { db, redeemCodesTable, profilesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/requireAuth";
import type { AuthenticatedRequest } from "../middlewares/requireAuth";

const router = Router();

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const seg = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `PIODEV-${seg(4)}-${seg(4)}-${seg(4)}`;
}

// GET /api/admin/codes — list all codes (admin only)
router.get("/", requireAuth, requireRole("admin"), async (_req, res) => {
  const codes = await db
    .select()
    .from(redeemCodesTable)
    .orderBy(desc(redeemCodesTable.createdAt));
  return res.json(codes);
});

// POST /api/admin/codes/generate — generate batch of codes (admin only)
router.post("/generate", requireAuth, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
  const { count = 1, label, durationDays = 30, expiresAt } = req.body as {
    count?: number;
    label?: string;
    durationDays?: number;
    expiresAt?: string;
  };

  const qty = Math.min(Math.max(1, Number(count) || 1), 50);
  const expiry = expiresAt ? new Date(expiresAt) : null;

  const rows = Array.from({ length: qty }, () => ({
    code: generateCode(),
    label: label ?? null,
    durationDays: Number(durationDays) || 30,
    expiresAt: expiry,
  }));

  const inserted = await db.insert(redeemCodesTable).values(rows).returning();
  return res.json(inserted);
});

// DELETE /api/admin/codes/:id — delete a code (admin only)
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  await db.delete(redeemCodesTable).where(eq(redeemCodesTable.id, id));
  return res.status(204).end();
});

export default router;
