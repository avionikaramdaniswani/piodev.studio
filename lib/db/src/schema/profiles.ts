import { pgTable, uuid, text, integer, date, timestamp } from "drizzle-orm/pg-core";

export const profilesTable = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email"),
  role: text("role").notNull().default("user"),
  tier: text("tier").notNull().default("free"),
  username: text("username"),
  downloadsToday: integer("downloads_today").notNull().default(0),
  quotaResetDate: date("quota_reset_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Profile = typeof profilesTable.$inferSelect;
