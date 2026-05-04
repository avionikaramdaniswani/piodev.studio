import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { profilesTable } from "./profiles";

export const redeemCodesTable = pgTable("redeem_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  label: text("label"),
  durationDays: integer("duration_days").notNull().default(30),
  expiresAt: timestamp("expires_at"),
  redeemedBy: uuid("redeemed_by").references(() => profilesTable.id),
  redeemedAt: timestamp("redeemed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type RedeemCode = typeof redeemCodesTable.$inferSelect;
