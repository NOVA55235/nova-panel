import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const passwordResetsTable = pgTable("password_resets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  newPassword: text("new_password"),
  used: boolean("used").notNull().default(false),
  deliveredViaEmail: boolean("delivered_via_email").notNull().default(false),
  deliveredViaDiscord: boolean("delivered_via_discord").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PasswordReset = typeof passwordResetsTable.$inferSelect;
