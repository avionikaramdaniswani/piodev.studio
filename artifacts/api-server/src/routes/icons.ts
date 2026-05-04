import { Router } from "express";
import type { Request } from "express";
import { db } from "@workspace/db";
import { iconsTable, profilesTable } from "@workspace/db";
import { eq, ilike, and, sql, or, ne } from "drizzle-orm";
import {
  ListIconsQueryParams,
  CreateIconBody,
  UpdateIconBody,
  GetIconBySlugParams,
  DownloadIconParams,
  ToggleLikeParams,
  GetSimilarIconsParams,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const FREE_QUOTA = 50;
const ANON_QUOTA = 5;
const router = Router();

// In-memory store for anonymous IP download tracking
// Structure: Map<ip, { count: number; date: string }>
const anonDownloadStore = new Map<string, { count: number; date: string }>();

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return (Array.isArray(forwarded) ? forwarded[0] : forwarded).split(",")[0].trim();
  }
  return req.socket?.remoteAddress ?? "unknown";
}

function checkAnonQuota(ip: string): { allowed: boolean; used: number } {
  const today = new Date().toISOString().split("T")[0];
  const entry = anonDownloadStore.get(ip);
  if (!entry || entry.date !== today) {
    return { allowed: true, used: 0 };
  }
  return { allowed: entry.count < ANON_QUOTA, used: entry.count };
}

function incrementAnonQuota(ip: string): void {
  const today = new Date().toISOString().split("T")[0];
  const entry = anonDownloadStore.get(ip);
  if (!entry || entry.date !== today) {
    anonDownloadStore.set(ip, { count: 1, date: today });
  } else {
    anonDownloadStore.set(ip, { count: entry.count + 1, date: today });
  }
}

const CATEGORY_COLORS: Record<string, string> = {
  UI: "#FFE034",
  Social: "#FF6B9D",
  Navigation: "#4DBBFF",
  Media: "#00E676",
  Files: "#FF6B35",
  Communication: "#FFE034",
  Weather: "#4DBBFF",
  Finance: "#00E676",
  Security: "#FF6B9D",
  Misc: "#FF6B35",
};

const getColor = (cat: string) => CATEGORY_COLORS[cat] ?? "#FFE034";

function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*')/gi, "")
    .replace(/\bhref\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, "")
    .replace(
      /\bxlink:href\s*=\s*(?:"https?:\/\/[^"]*"|'https?:\/\/[^']*')/gi,
      "",
    )
    .trim();
}

// GET /icons
router.get("/", async (req, res) => {
  const parsed = ListIconsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }

  const { search, category, style, page, limit } = parsed.data;

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(iconsTable.name, `%${search}%`),
        ilike(iconsTable.category, `%${search}%`),
      ),
    );
  }
  if (category) conditions.push(eq(iconsTable.category, category));
  if (style) conditions.push(eq(iconsTable.style, style));

  const where = conditions.length ? and(...conditions) : undefined;

  const [icons, [{ count }]] = await Promise.all([
    db
      .select()
      .from(iconsTable)
      .where(where)
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(iconsTable.createdAt),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(iconsTable)
      .where(where),
  ]);

  return res.json({
    icons: icons.map((i) => ({ ...i, tags: i.tags ?? [] })),
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
  });
});

// POST /icons — requires staff or admin
router.post("/", requireAuth, requireRole("staff"), async (req, res) => {
  const parsed = CreateIconBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.message });
  }

  const { name, slug, description, svgContent, category, tags, style, license } =
    parsed.data;

  const cleanSvg = sanitizeSvg(svgContent);

  if (!cleanSvg.toLowerCase().includes("<svg")) {
    return res.status(400).json({ error: "Invalid SVG content" });
  }

  const [icon] = await db
    .insert(iconsTable)
    .values({
      name,
      slug,
      description,
      svgContent: cleanSvg,
      category,
      tags: tags ?? [],
      style,
      license: license ?? "MIT",
    })
    .returning();

  return res.status(201).json(icon);
});

// GET /icons/slug-start?base=time
// Returns the next available starting index for a given base slug
router.get("/slug-start", async (req, res) => {
  const base = (req.query.base as string | undefined)?.trim();
  if (!base) return res.json({ startIndex: 0 });

  const rows = await db
    .select({ slug: iconsTable.slug })
    .from(iconsTable)
    .where(or(eq(iconsTable.slug, base), ilike(iconsTable.slug, `${base}-%`)));

  if (rows.length === 0) return res.json({ startIndex: 0 });

  let maxIndex = -1;
  for (const { slug } of rows) {
    if (slug === base) {
      maxIndex = Math.max(maxIndex, 0);
    } else {
      const suffix = slug.slice(base.length + 1);
      const num = parseInt(suffix, 10);
      if (!isNaN(num) && num >= 2) {
        maxIndex = Math.max(maxIndex, num - 1);
      }
    }
  }

  return res.json({ startIndex: maxIndex + 1 });
});

// GET /icons/featured
router.get("/featured", async (_req, res) => {
  const icons = await db
    .select()
    .from(iconsTable)
    .where(eq(iconsTable.isFeatured, true))
    .limit(12);

  return res.json(icons.map((i) => ({ ...i, tags: i.tags ?? [] })));
});

// GET /icons/stats
router.get("/stats", async (_req, res) => {
  const [{ totalIcons, totalDownloads, totalLikes, totalCategories }] = await db
    .select({
      totalIcons: sql<number>`count(*)::int`,
      totalDownloads: sql<number>`coalesce(sum(downloads), 0)::int`,
      totalLikes: sql<number>`coalesce(sum(likes), 0)::int`,
      totalCategories: sql<number>`count(distinct category)::int`,
    })
    .from(iconsTable);

  const [{ plusUsers }] = await db
    .select({ plusUsers: sql<number>`count(*)::int` })
    .from(profilesTable)
    .where(sql`tier = 'plus'`);

  return res.json({
    totalIcons,
    totalDownloads,
    totalLikes,
    totalCategories,
    totalTools: 8,
    plusUsers,
  });
});

// GET /icons/categories
router.get("/categories", async (_req, res) => {
  const rows = await db
    .select({
      name: iconsTable.category,
      count: sql<number>`count(*)::int`,
    })
    .from(iconsTable)
    .groupBy(iconsTable.category)
    .orderBy(sql`count(*) desc`);

  return res.json(rows.map((r) => ({ ...r, color: getColor(r.name) })));
});

// GET /icons/similar/:id
router.get("/similar/:id", async (req, res) => {
  const parsed = GetSimilarIconsParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const { id } = parsed.data;
  const [icon] = await db
    .select()
    .from(iconsTable)
    .where(eq(iconsTable.id, id))
    .limit(1);

  if (!icon) return res.status(404).json({ error: "Not found" });

  const similar = await db
    .select()
    .from(iconsTable)
    .where(and(eq(iconsTable.category, icon.category), ne(iconsTable.id, id)))
    .limit(8);

  return res.json(similar.map((i) => ({ ...i, tags: i.tags ?? [] })));
});

// PUT /icons/:id — requires staff or admin
router.put("/:id", requireAuth, requireRole("staff"), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const parsed = UpdateIconBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const updates = parsed.data;
  const setValues: Record<string, unknown> = {};

  if (updates.name !== undefined) setValues.name = updates.name;
  if (updates.slug !== undefined) setValues.slug = updates.slug;
  if (updates.description !== undefined) setValues.description = updates.description;
  if (updates.svgContent !== undefined) setValues.svgContent = sanitizeSvg(updates.svgContent);
  if (updates.category !== undefined) setValues.category = updates.category;
  if (updates.tags !== undefined) setValues.tags = updates.tags;
  if (updates.style !== undefined) setValues.style = updates.style;
  if (updates.license !== undefined) setValues.license = updates.license;
  if (updates.isFeatured !== undefined) setValues.isFeatured = updates.isFeatured;

  if (Object.keys(setValues).length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  const [icon] = await db
    .update(iconsTable)
    .set(setValues)
    .where(eq(iconsTable.id, id))
    .returning();

  if (!icon) return res.status(404).json({ error: "Icon not found" });
  return res.json({ ...icon, tags: icon.tags ?? [] });
});

// DELETE /icons/:id — requires staff or admin
router.delete("/:id", requireAuth, requireRole("staff"), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  const [icon] = await db
    .delete(iconsTable)
    .where(eq(iconsTable.id, id))
    .returning({ id: iconsTable.id });

  if (!icon) return res.status(404).json({ error: "Icon not found" });
  return res.status(204).send();
});

// GET /icons/:slug
router.get("/:slug", async (req, res) => {
  const parsed = GetIconBySlugParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid slug" });

  const [icon] = await db
    .select()
    .from(iconsTable)
    .where(eq(iconsTable.slug, parsed.data.slug))
    .limit(1);

  if (!icon) return res.status(404).json({ error: "Icon not found" });

  return res.json({ ...icon, tags: icon.tags ?? [] });
});

// POST /icons/:id/download
// Anonymous users: 5/day per IP. Logged-in free users: 50/day. Plus: unlimited.
router.post("/:id/download", async (req: Request, res) => {
  const parsed = DownloadIconParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const iconId = parsed.data.id;
  const token = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;

  // If user is logged in, check & update quota
  if (token) {
    const SUPABASE_REST_URL = process.env["VITE_SUPABASE_URL"];
    const SUPABASE_ANON_KEY = process.env["SUPABASE_ANON_KEY"];

    try {
      const authRes = await fetch(`${SUPABASE_REST_URL}/auth/v1/user`, {
        headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY! },
      });

      if (authRes.ok) {
        const authUser = await authRes.json() as { id: string };
        const userId = authUser.id;

        const [profile] = await db
          .select()
          .from(profilesTable)
          .where(eq(profilesTable.id, userId))
          .limit(1);

        if (profile) {
          const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
          const isToday = profile.quotaResetDate === today;
          const currentDownloads = isToday ? profile.downloadsToday : 0;
          const isPlus = profile.tier === "plus";
          const quota = isPlus ? -1 : FREE_QUOTA;

          // Check quota for free users
          if (!isPlus && currentDownloads >= FREE_QUOTA) {
            return res.status(429).json({
              allowed: false,
              reason: "quota_exceeded",
              quota: FREE_QUOTA,
              used: currentDownloads,
            });
          }

          // Update profile quota
          await db
            .update(profilesTable)
            .set({
              downloadsToday: currentDownloads + 1,
              quotaResetDate: today,
            })
            .where(eq(profilesTable.id, userId));

          // Increment icon counter
          const [icon] = await db
            .update(iconsTable)
            .set({ downloads: sql`${iconsTable.downloads} + 1` })
            .where(eq(iconsTable.id, iconId))
            .returning({ downloads: iconsTable.downloads });

          if (!icon) return res.status(404).json({ error: "Not found" });

          return res.json({
            allowed: true,
            downloads: icon.downloads,
            quota,
            used: currentDownloads + 1,
          });
        }
      }
    } catch {
      // Fall through to anonymous download if auth fails
    }
  }

  // Anonymous or auth failed: check IP-based quota then increment counter
  const ip = getClientIp(req);
  const anonQuota = checkAnonQuota(ip);
  if (!anonQuota.allowed) {
    return res.status(429).json({
      allowed: false,
      reason: "anon_quota_exceeded",
      quota: ANON_QUOTA,
      used: anonQuota.used,
    });
  }

  incrementAnonQuota(ip);

  const [icon] = await db
    .update(iconsTable)
    .set({ downloads: sql`${iconsTable.downloads} + 1` })
    .where(eq(iconsTable.id, iconId))
    .returning({ downloads: iconsTable.downloads });

  if (!icon) return res.status(404).json({ error: "Not found" });
  const newEntry = anonDownloadStore.get(ip);
  return res.json({ allowed: true, downloads: icon.downloads, used: newEntry?.count ?? 1, quota: ANON_QUOTA });
});

// POST /icons/:id/like
router.post("/:id/like", async (req, res) => {
  const parsed = ToggleLikeParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const [icon] = await db
    .update(iconsTable)
    .set({ likes: sql`${iconsTable.likes} + 1` })
    .where(eq(iconsTable.id, parsed.data.id))
    .returning({ likes: iconsTable.likes });

  if (!icon) return res.status(404).json({ error: "Not found" });
  return res.json({ likes: icon.likes });
});

export default router;
