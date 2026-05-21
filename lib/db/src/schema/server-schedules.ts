import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { serversTable } from "./servers";

export const serverSchedulesTable = pgTable("server_schedules", {
  id: serial("id").primaryKey(),
  serverId: integer("server_id").notNull().references(() => serversTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  cron: text("cron").notNull(),
  action: text("action").notNull(),
  payload: text("payload"),
  isActive: boolean("is_active").notNull().default(true),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertServerScheduleSchema = createInsertSchema(serverSchedulesTable).omit({ id: true, createdAt: true });
export type InsertServerSchedule = z.infer<typeof insertServerScheduleSchema>;
export type ServerSchedule = typeof serverSchedulesTable.$inferSelect;
