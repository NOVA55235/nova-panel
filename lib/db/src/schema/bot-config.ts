import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const botConfigTable = pgTable("bot_config", {
  id: serial("id").primaryKey(),
  token: text("token"),
  clientId: text("client_id"),
  guildId: text("guild_id"),
  ownerDiscordId: text("owner_discord_id"),
  enabled: boolean("enabled").notNull().default(false),
  status: text("status").notNull().default("offline"),
  lastError: text("last_error"),
  startedAt: timestamp("started_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type BotConfig = typeof botConfigTable.$inferSelect;
