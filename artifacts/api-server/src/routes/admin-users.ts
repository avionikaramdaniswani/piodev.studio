import { Router } from "express";
import { db, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/requireAuth";
import type { AuthenticatedRequest } from "../middlewares/requireAuth";

const router = Router();

// DELETE /api/admin/users/:id — delete a user profile (admin only)
router.delete("/:id", requireAuth, requireRole("admin"), async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  if (id === req.authUserId) {
    return res.status(400).json({ error: "Tidak bisa menghapus akun sendiri." });
  }

  const [deleted] = await db
    .delete(profilesTable)
    .where(eq(profilesTable.id, id))
    .returning({ id: profilesTable.id });

  if (!deleted) {
    return res.status(404).json({ error: "Pengguna tidak ditemukan." });
  }

  return res.status(204).end();
});

export default router;
