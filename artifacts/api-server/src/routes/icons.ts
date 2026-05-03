import { Router } from "express";
import { db } from "@workspace/db";
import { iconsTable } from "@workspace/db";
import { eq, ilike, and, sql, or, ne } from "drizzle-orm";
import {
  ListIconsQueryParams,
  CreateIconBody,
  GetIconBySlugParams,
  DownloadIconParams,
  ToggleLikeParams,
  GetSimilarIconsParams,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router = Router();

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
  const [{ totalIcons }] = await db
    .select({ totalIcons: sql<number>`count(*)::int` })
    .from(iconsTable);

  const [{ totalDownloads }] = await db
    .select({ totalDownloads: sql<number>`coalesce(sum(downloads), 0)::int` })
    .from(iconsTable);

  const [{ totalCategories }] = await db
    .select({ totalCategories: sql<number>`count(distinct category)::int` })
    .from(iconsTable);

  return res.json({
    totalIcons,
    totalDownloads,
    totalCategories,
    totalTools: 8,
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
router.post("/:id/download", async (req, res) => {
  const parsed = DownloadIconParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });

  const [icon] = await db
    .update(iconsTable)
    .set({ downloads: sql`${iconsTable.downloads} + 1` })
    .where(eq(iconsTable.id, parsed.data.id))
    .returning({ downloads: iconsTable.downloads });

  if (!icon) return res.status(404).json({ error: "Not found" });
  return res.json({ downloads: icon.downloads });
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
