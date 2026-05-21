import { pgTable, serial, text, integer, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { nodesTable } from "./nodes";

export const serverStatusEnum = pgEnum("server_status", [
  "installing", "running", "stopped", "starting", "stopping", "error"
]);

export const serversTable = pgTable("servers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  nodeId: integer("node_id").notNull().references(() => nodesTable.id),
  status: serverStatusEnum("status").notNull().default("stopped"),
  gameType: text("game_type").notNull(),
  dockerImage: text("docker_image").notNull(),
  cpuLimit: integer("cpu_limit").notNull(),
  memoryMb: integer("memory_mb").notNull(),
  diskMb: integer("disk_mb").notNull(),
  ip: text("ip").notNull().default("0.0.0.0"),
  port: integer("port").notNull().default(25565),
  startupCommand: text("startup_command").notNull(),
  envVariables: jsonb("env_variables").$type<Record<string, string>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertServerSchema = createInsertSchema(serversTable).omit({ id: true, createdAt: true });
export type InsertServer = z.infer<typeof insertServerSchema>;
export type Server = typeof serversTable.$inferSelect;
