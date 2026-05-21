import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const nodesTable = pgTable("nodes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  fqdn: text("fqdn").notNull(),
  ip: text("ip").notNull(),
  port: integer("port").notNull().default(8080),
  isOnline: boolean("is_online").notNull().default(false),
  cpuCores: integer("cpu_cores").notNull(),
  memoryMb: integer("memory_mb").notNull(),
  diskGb: integer("disk_gb").notNull(),
  location: text("location"),
  description: text("description"),
  apiToken: text("api_token").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNodeSchema = createInsertSchema(nodesTable).omit({ id: true, createdAt: true });
export type InsertNode = z.infer<typeof insertNodeSchema>;
export type Node = typeof nodesTable.$inferSelect;
