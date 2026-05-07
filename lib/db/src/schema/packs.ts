import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const packsTable = pgTable("packs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  category: text("category").notNull(),
  style: text("style").notNull().default("outline"),
  iconCount: integer("icon_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Pack = typeof packsTable.$inferSelect;
