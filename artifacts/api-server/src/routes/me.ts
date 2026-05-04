import { Router } from "express";
import { db } from "@workspace/db";
import { profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import type { AuthenticatedRequest } from "../middlewares/requireAuth";

const router = Router();

// GET /api/me — returns the current authenticated user's profile
router.get("/", requireAuth, async (req: AuthenticatedRequest, res) => {
  const userId = req.authUserId!;

  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, userId))
    .limit(1);

  if (!profile) {
    // New user — insert a fresh profile
    const [newProfile] = await db
      .insert(profilesTable)
      .values({ id: userId, role: "user", tier: "free" })
      .returning()
      .catch(() => [null]);

    if (!newProfile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    return res.json({
      role: newProfile.role,
      tier: newProfile.tier,
      username: newProfile.username ?? null,
      downloadsToday: 0,
      quotaResetDate: null,
      plusExpiresAt: null,
    });
  }

  // Auto-expire Plus if the expiry date has passed
  let tier = profile.tier;
  let plusExpiresAt = profile.plusExpiresAt;

  if (tier === "plus" && plusExpiresAt && new Date() > new Date(plusExpiresAt)) {
    await db
      .update(profilesTable)
      .set({ tier: "free" })
      .where(eq(profilesTable.id, userId));
    tier = "free";
    plusExpiresAt = null;
  }

  return res.json({
    role: profile.role,
    tier,
    username: profile.username ?? null,
    downloadsToday: profile.downloadsToday,
    quotaResetDate: profile.quotaResetDate ?? null,
    plusExpiresAt: plusExpiresAt ? new Date(plusExpiresAt).toISOString() : null,
  });
});

export default router;
