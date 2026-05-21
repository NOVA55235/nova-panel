import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { serversTable } from "./servers";
import { usersTable } from "./users";

export const serverSubusersTable = pgTable("server_subusers", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").notNull().references(() => serversTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  permissions: text("permissions").array().notNull().default(["console.view"]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertServerSubuserSchema = createInsertSchema(serverSubusersTable).omit({ id: true, createdAt: true });
export type InsertServerSubuser = z.infer<typeof insertServerSubuserSchema>;
export type ServerSubuser = typeof serverSubusersTable.$inferSelect;
