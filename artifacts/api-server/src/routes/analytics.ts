import { Router } from "express";
import { db, iconsTable, profilesTable } from "@workspace/db";
import { sql, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router = Router();

// GET /api/admin/analytics — comprehensive analytics (staff+)
router.get("/", requireAuth, requireRole("staff"), async (_req, res) => {
  const [
    topIcons,
    categoryDist,
    tierDist,
    iconsByMonth,
    totals,
  ] = await Promise.all([
    // Top 10 icons by downloads
    db
      .select({
        id: iconsTable.id,
        name: iconsTable.name,
        slug: iconsTable.slug,
        category: iconsTable.category,
        downloads: iconsTable.downloads,
        likes: iconsTable.likes,
      })
      .from(iconsTable)
      .orderBy(desc(iconsTable.downloads))
      .limit(10),

    // Icons count per category
    db
      .select({
        category: iconsTable.category,
        count: sql<number>`count(*)::int`,
        totalDownloads: sql<number>`coalesce(sum(${iconsTable.downloads}), 0)::int`,
      })
      .from(iconsTable)
      .groupBy(iconsTable.category)
      .orderBy(sql`count(*) desc`),

    // User tier distribution
    db
      .select({
        tier: profilesTable.tier,
        count: sql<number>`count(*)::int`,
      })
      .from(profilesTable)
      .groupBy(profilesTable.tier),

    // Icons uploaded per month (last 12 months)
    db.execute(sql`
      SELECT
        to_char(date_trunc('month', created_at), 'Mon YY') as month,
        date_trunc('month', created_at) as month_date,
        count(*)::int as count
      FROM icons
      WHERE created_at >= now() - interval '12 months'
      GROUP BY month_date, to_char(date_trunc('month', created_at), 'Mon YY')
      ORDER BY month_date ASC
    `),

    // Overall totals
    db
      .select({
        totalIcons: sql<number>`count(*)::int`,
        totalDownloads: sql<number>`coalesce(sum(${iconsTable.downloads}), 0)::int`,
        totalLikes: sql<number>`coalesce(sum(${iconsTable.likes}), 0)::int`,
        featuredCount: sql<number>`count(*) filter (where ${iconsTable.isFeatured} = true)::int`,
      })
      .from(iconsTable),
  ]);

  const iconsByMonthRows = (iconsByMonth as { rows: Array<{ month: string; count: number }> }).rows ?? iconsByMonth;

  return res.json({
    topIcons,
    categoryDist,
    tierDist,
    iconsByMonth: iconsByMonthRows,
    totals: totals[0] ?? { totalIcons: 0, totalDownloads: 0, totalLikes: 0, featuredCount: 0 },
  });
});

export default router;
