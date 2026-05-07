import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const iconsTable = pgTable("icons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  svgContent: text("svg_content").notNull(),
  category: text("category").notNull(),
  tags: text("tags").array().notNull().default([]),
  style: text("style").notNull().default("outline"),
  downloads: integer("downloads").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  license: text("license").notNull().default("MIT"),
  packId: integer("pack_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertIconSchema = createInsertSchema(iconsTable).omit({
  id: true,
  downloads: true,
  likes: true,
  createdAt: true,
});

export type InsertIcon = z.infer<typeof insertIconSchema>;
export type Icon = typeof iconsTable.$inferSelect;
