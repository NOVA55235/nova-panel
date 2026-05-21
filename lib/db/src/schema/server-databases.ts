import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { serversTable } from "./servers";

export const serverDatabasesTable = pgTable("server_databases", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").notNull().references(() => serversTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  host: text("host").notNull().default("127.0.0.1"),
  port: integer("port").notNull().default(3306),
  dbName: text("db_name").notNull(),
  username: text("username").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertServerDatabaseSchema = createInsertSchema(serverDatabasesTable).omit({ id: true, createdAt: true });
export type InsertServerDatabase = z.infer<typeof insertServerDatabaseSchema>;
export type ServerDatabase = typeof serverDatabasesTable.$inferSelect;
