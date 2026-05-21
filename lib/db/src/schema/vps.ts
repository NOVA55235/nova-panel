import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { nodesTable } from "./nodes";

export const vpsStatusEnum = pgEnum("vps_status", [
  "installing", "running", "stopped", "starting", "stopping", "error"
]);

export const osTemplateEnum = pgEnum("os_template", [
  "ubuntu-22.04", "ubuntu-24.04", "debian-12", "debian-11", "alpine-3.19"
]);

export const vpsTable = pgTable("vps", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  nodeId: integer("node_id").notNull().references(() => nodesTable.id),
  status: vpsStatusEnum("status").notNull().default("stopped"),
  osTemplate: osTemplateEnum("os_template").notNull(),
  cpuCores: integer("cpu_cores").notNull(),
  memoryMb: integer("memory_mb").notNull(),
  diskGb: integer("disk_gb").notNull(),
  ipAddress: text("ip_address").notNull(),
  username: text("username").notNull().default("root"),
  sshPort: integer("ssh_port").notNull().default(22),
  containerId: text("container_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVpsSchema = createInsertSchema(vpsTable).omit({ id: true, createdAt: true });
export type InsertVps = z.infer<typeof insertVpsSchema>;
export type Vps = typeof vpsTable.$inferSelect;
