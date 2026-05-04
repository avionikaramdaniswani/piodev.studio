import { Router } from "express";
import { db, redeemCodesTable, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import type { AuthenticatedRequest } from "../middlewares/requireAuth";

const router = Router();

// POST /api/redeem — redeem a code to get Plus
router.post("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.authUserId!;
  const { code } = req.body as { code?: string };

  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "Kode tidak valid." });
  }

  const normalizedCode = code.trim().toUpperCase();

  const [existing] = await db
    .select()
    .from(redeemCodesTable)
    .where(eq(redeemCodesTable.code, normalizedCode))
    .limit(1);

  if (!existing) {
    return res.status(404).json({ error: "Kode tidak ditemukan." });
  }

  if (existing.redeemedBy) {
    return res.status(409).json({ error: "Kode sudah pernah digunakan." });
  }

  if (existing.expiresAt && new Date() > new Date(existing.expiresAt)) {
    return res.status(410).json({ error: "Kode sudah kedaluwarsa." });
  }

  const now = new Date();
  const plusExpiresAt = new Date(now);
  plusExpiresAt.setDate(plusExpiresAt.getDate() + existing.durationDays);

  await db
    .update(redeemCodesTable)
    .set({ redeemedBy: userId, redeemedAt: now })
    .where(eq(redeemCodesTable.id, existing.id));

  await db
    .update(profilesTable)
    .set({ tier: "plus", plusExpiresAt })
    .where(eq(profilesTable.id, userId));

  return res.json({
    success: true,
    plusExpiresAt: plusExpiresAt.toISOString(),
    durationDays: existing.durationDays,
  });
});

export default router;
