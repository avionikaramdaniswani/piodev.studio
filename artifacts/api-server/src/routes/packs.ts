import { Router } from "express";
import { db } from "@workspace/db";
import { iconsTable, packsTable } from "@workspace/db";
import { eq, sql, inArray } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router = Router();

function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

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

type IconInput = { name: string; svgContent: string };
type CreatePackInput = {
  packName: string;
  packSlug: string;
  packDescription?: string;
  category: string;
  style?: string;
  license?: string;
  tags?: string[];
  icons: IconInput[];
};

function validateCreatePack(body: unknown): { data: CreatePackInput } | { error: string } {
  const b = body as Record<string, unknown>;
  if (!b || typeof b !== "object") return { error: "Invalid body" };
  if (!b.packName || typeof b.packName !== "string" || !b.packName.trim()) return { error: "packName wajib diisi" };
  if (!b.packSlug || typeof b.packSlug !== "string" || !b.packSlug.trim()) return { error: "packSlug wajib diisi" };
  if (!b.category || typeof b.category !== "string") return { error: "category wajib diisi" };
  if (!Array.isArray(b.icons) || b.icons.length === 0) return { error: "Minimal 1 ikon diperlukan" };
  if (b.icons.length > 200) return { error: "Maksimal 200 ikon per pack" };

  for (const icon of b.icons as unknown[]) {
    const ic = icon as Record<string, unknown>;
    if (!ic.name || typeof ic.name !== "string" || !ic.name.trim()) return { error: "Setiap ikon harus punya nama" };
    if (!ic.svgContent || typeof ic.svgContent !== "string") return { error: "svgContent tidak valid" };
  }

  const VALID_STYLES = ["outline", "filled", "duotone"];
  const style = typeof b.style === "string" && VALID_STYLES.includes(b.style) ? b.style : "outline";

  return {
    data: {
      packName: (b.packName as string).trim(),
      packSlug: (b.packSlug as string).trim(),
      packDescription: typeof b.packDescription === "string" ? b.packDescription.trim() || undefined : undefined,
      category: b.category as string,
      style,
      license: typeof b.license === "string" ? b.license : "MIT",
      tags: Array.isArray(b.tags) ? (b.tags as string[]).filter((t) => typeof t === "string") : [],
      icons: (b.icons as IconInput[]).map((ic) => ({ name: ic.name.trim(), svgContent: ic.svgContent })),
    },
  };
}

// GET /packs
router.get("/", async (_req, res) => {
  const packs = await db
    .select()
    .from(packsTable)
    .orderBy(sql`${packsTable.createdAt} desc`);

  if (packs.length === 0) return res.json([]);

  const packIds = packs.map((p) => p.id);

  const previewIconRows = await db
    .select({
      id: iconsTable.id,
      packId: iconsTable.packId,
      slug: iconsTable.slug,
      svgContent: iconsTable.svgContent,
    })
    .from(iconsTable)
    .where(inArray(iconsTable.packId, packIds));

  const iconsByPack: Record<number, typeof previewIconRows> = {};
  for (const icon of previewIconRows) {
    if (icon.packId == null) continue;
    if (!iconsByPack[icon.packId]) iconsByPack[icon.packId] = [];
    if (iconsByPack[icon.packId].length < 4) iconsByPack[icon.packId].push(icon);
  }

  return res.json(
    packs.map((p) => ({
      ...p,
      previewIcons: iconsByPack[p.id] ?? [],
    })),
  );
});

// GET /packs/:slug
router.get("/:slug", async (req, res) => {
  const slug = req.params.slug?.trim();
  if (!slug) return res.status(400).json({ error: "Invalid slug" });

  const [pack] = await db
    .select()
    .from(packsTable)
    .where(eq(packsTable.slug, slug))
    .limit(1);

  if (!pack) return res.status(404).json({ error: "Pack not found" });

  const icons = await db
    .select()
    .from(iconsTable)
    .where(eq(iconsTable.packId, pack.id))
    .orderBy(iconsTable.name);

  return res.json({
    pack,
    icons: icons.map((i) => ({ ...i, tags: i.tags ?? [] })),
  });
});

// POST /packs — staff+
router.post("/", requireAuth, requireRole("staff"), async (req, res) => {
  const validated = validateCreatePack(req.body);
  if ("error" in validated) return res.status(400).json({ error: validated.error });

  const { packName, packSlug, packDescription, category, style, license, tags, icons } = validated.data;

  const [existing] = await db
    .select({ id: packsTable.id })
    .from(packsTable)
    .where(eq(packsTable.slug, packSlug))
    .limit(1);

  if (existing) return res.status(409).json({ error: "Slug pack sudah digunakan" });

  const prepared = icons.map((icon, i) => {
    const clean = sanitizeSvg(icon.svgContent);
    const nameSlug = toSlug(icon.name) || `icon-${i + 1}`;
    return {
      name: icon.name,
      svgContent: clean,
      valid: clean.toLowerCase().includes("<svg"),
      candidateSlug: `${packSlug}-${nameSlug}`,
    };
  });

  const valid = prepared.filter((p) => p.valid);
  if (valid.length === 0) return res.status(400).json({ error: "Tidak ada SVG yang valid" });

  const candidateSlugs = valid.map((v) => v.candidateSlug);
  const existingSlugRows = await db
    .select({ slug: iconsTable.slug })
    .from(iconsTable)
    .where(inArray(iconsTable.slug, candidateSlugs));

  const existingSlugs = new Set(existingSlugRows.map((r) => r.slug));

  const resolvedSlugs = candidateSlugs.map((s) => {
    if (!existingSlugs.has(s)) return s;
    let c = 2;
    while (existingSlugs.has(`${s}-${c}`)) c++;
    return `${s}-${c}`;
  });

  const [pack] = await db
    .insert(packsTable)
    .values({ name: packName, slug: packSlug, description: packDescription, category, style: style ?? "outline", iconCount: 0 })
    .returning();

  const insertValues = valid.map((icon, i) => ({
    name: icon.name,
    slug: resolvedSlugs[i],
    svgContent: icon.svgContent,
    category,
    tags: tags ?? [],
    style: style ?? "outline",
    license: license ?? "MIT",
    packId: pack.id,
  }));

  const inserted = await db.insert(iconsTable).values(insertValues).returning();

  await db.update(packsTable).set({ iconCount: inserted.length }).where(eq(packsTable.id, pack.id));

  return res.status(201).json({
    pack: { ...pack, iconCount: inserted.length },
    uploaded: inserted.length,
    failed: icons.length - inserted.length,
  });
});

// DELETE /packs/:id — admin only
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  await db.update(iconsTable).set({ packId: null }).where(eq(iconsTable.packId, id));

  const [pack] = await db
    .delete(packsTable)
    .where(eq(packsTable.id, id))
    .returning({ id: packsTable.id });

  if (!pack) return res.status(404).json({ error: "Pack not found" });
  return res.status(204).send();
});

export default router;
