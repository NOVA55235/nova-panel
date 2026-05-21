import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { nodesTable } from "./nodes";
import { serversTable } from "./servers";

export const allocationsTable = pgTable("allocations", {
  id: serial("id").primaryKey(),
  nodeId: integer("node_id").notNull().references(() => nodesTable.id),
  ip: text("ip").notNull(),
  port: integer("port").notNull(),
  serverId: integer("server_id").references(() => serversTable.id),
  isAssigned: boolean("is_assigned").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAllocationSchema = createInsertSchema(allocationsTable).omit({ id: true, createdAt: true });
export type InsertAllocation = z.infer<typeof insertAllocationSchema>;
export type Allocation = typeof allocationsTable.$inferSelect;
