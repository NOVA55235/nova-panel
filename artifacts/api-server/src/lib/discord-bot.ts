import { db } from "@workspace/db";
import { botConfigTable, usersTable, serversTable, vpsTable, nodesTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

let client: any = null;
let activeToken: string | null = null;

export interface BotStatus {
  enabled: boolean;
  status: "online" | "offline" | "starting" | "error";
  lastError: string | null;
  startedAt: Date | null;
  username?: string;
  guildCount?: number;
}

export async function loadConfig() {
  const [cfg] = await db.select().from(botConfigTable).limit(1);
  return cfg ?? null;
}

export async function saveConfig(patch: Partial<typeof botConfigTable.$inferInsert>) {
  const existing = await loadConfig();
  if (existing) {
    const [updated] = await db.update(botConfigTable).set({ ...patch, updatedAt: new Date() })
      .where(eq(botConfigTable.id, existing.id)).returning();
    return updated;
  }
  const [inserted] = await db.insert(botConfigTable).values({ ...patch, updatedAt: new Date() }).returning();
  return inserted;
}

export async function startBot(): Promise<BotStatus> {
  const cfg = await loadConfig();
  if (!cfg?.token) {
    await saveConfig({ status: "error", lastError: "No token configured", enabled: false });
    return { enabled: false, status: "error", lastError: "No token configured", startedAt: null };
  }
  await stopBot();
  await saveConfig({ status: "starting", lastError: null });
  try {
    const dj: any = await import("discord.js");
    const c = new dj.Client({
      intents: [dj.GatewayIntentBits.Guilds, dj.GatewayIntentBits.DirectMessages],
      partials: [dj.Partials.Channel],
    });

    c.once("ready", async () => {
      await saveConfig({ enabled: true, status: "online", startedAt: new Date(), lastError: null });
      // Register slash commands
      try {
        const cmds = [
          new dj.SlashCommandBuilder().setName("status").setDescription("Get Nova Panel status"),
          new dj.SlashCommandBuilder().setName("servers").setDescription("List game servers"),
          new dj.SlashCommandBuilder().setName("vps").setDescription("List VPS instances"),
          new dj.SlashCommandBuilder().setName("nodes").setDescription("List nodes & their health"),
          new dj.SlashCommandBuilder().setName("help").setDescription("Show Nova Panel bot help"),
        ].map((c: any) => c.toJSON());
        if (cfg.guildId) {
          const guild = await c.guilds.fetch(cfg.guildId).catch(() => null);
          if (guild) await guild.commands.set(cmds);
        } else {
          await c.application?.commands.set(cmds);
        }
      } catch (e: any) {
        // non-fatal
        console.error("Failed to register slash commands:", e?.message);
      }
    });

    c.on("interactionCreate", async (i: any) => {
      if (!i.isChatInputCommand()) return;
      try {
        if (i.commandName === "status") {
          const [s] = await db.select({ c: count() }).from(serversTable);
          const [v] = await db.select({ c: count() }).from(vpsTable);
          const [n] = await db.select({ c: count() }).from(nodesTable);
          const [u] = await db.select({ c: count() }).from(usersTable);
          await i.reply({
            content: `**Nova Panel Status**\n` +
              `> Servers: \`${s.c}\` · VPS: \`${v.c}\` · Nodes: \`${n.c}\` · Users: \`${u.c}\`\n` +
              `> Bot uptime: <t:${Math.floor((Date.now() - (c.readyTimestamp ?? Date.now())) / 1000)}:R>`,
            ephemeral: true,
          });
        } else if (i.commandName === "servers") {
          const list = await db.select().from(serversTable).limit(15);
          if (list.length === 0) return i.reply({ content: "No servers found.", ephemeral: true });
          const txt = list.map(s => `\`${s.id.toString().padStart(3)}\` **${s.name}** · ${s.gameType} · \`${s.status}\``).join("\n");
          await i.reply({ content: `**Game Servers** (${list.length})\n${txt}`, ephemeral: true });
        } else if (i.commandName === "vps") {
          const list = await db.select().from(vpsTable).limit(15);
          if (list.length === 0) return i.reply({ content: "No VPS instances found.", ephemeral: true });
          const txt = list.map(s => `\`${s.id.toString().padStart(3)}\` **${s.name}** · ${s.osTemplate} · \`${s.status}\``).join("\n");
          await i.reply({ content: `**VPS Instances** (${list.length})\n${txt}`, ephemeral: true });
        } else if (i.commandName === "nodes") {
          const list = await db.select().from(nodesTable);
          if (list.length === 0) return i.reply({ content: "No nodes registered.", ephemeral: true });
          const txt = list.map(n => `${n.isOnline ? "🟢" : "🔴"} **${n.name}** \`${n.fqdn}\``).join("\n");
          await i.reply({ content: `**Nodes**\n${txt}`, ephemeral: true });
        } else if (i.commandName === "help") {
          await i.reply({
            content: "**Nova Panel Bot**\n" +
              "> `/status` — overall panel status\n" +
              "> `/servers` — list game servers\n" +
              "> `/vps` — list VPS instances\n" +
              "> `/nodes` — list infrastructure nodes\n" +
              "> `/help` — this message\n\n" +
              "Official: <https://discord.gg/qnMmKQKaZ> · <https://github.com/NOVA55235>",
            ephemeral: true,
          });
        }
      } catch (e: any) {
        await i.reply({ content: `Error: ${e?.message}`, ephemeral: true }).catch(() => {});
      }
    });

    c.on("error", async (err: any) => {
      await saveConfig({ status: "error", lastError: err?.message ?? "Unknown error" });
    });

    await c.login(cfg.token);
    client = c;
    activeToken = cfg.token;
    return {
      enabled: true,
      status: "online",
      lastError: null,
      startedAt: new Date(),
      username: c.user?.username,
      guildCount: c.guilds.cache.size,
    };
  } catch (e: any) {
    await saveConfig({ status: "error", lastError: e?.message ?? "Login failed", enabled: false });
    client = null;
    activeToken = null;
    return { enabled: false, status: "error", lastError: e?.message ?? "Login failed", startedAt: null };
  }
}

export async function stopBot() {
  if (client) {
    try { await client.destroy(); } catch {}
    client = null;
    activeToken = null;
  }
  await saveConfig({ enabled: false, status: "offline" });
}

export async function getStatus(): Promise<BotStatus> {
  const cfg = await loadConfig();
  return {
    enabled: cfg?.enabled ?? false,
    status: (cfg?.status as any) ?? "offline",
    lastError: cfg?.lastError ?? null,
    startedAt: cfg?.startedAt ?? null,
    username: client?.user?.username,
    guildCount: client?.guilds?.cache?.size,
  };
}

export async function dmUser(discordId: string, content: string): Promise<boolean> {
  if (!client) return false;
  try {
    const u = await client.users.fetch(discordId);
    await u.send(content);
    return true;
  } catch {
    return false;
  }
}

// Auto-start bot on server boot if configured
loadConfig().then(cfg => {
  if (cfg?.enabled && cfg?.token) {
    startBot().catch(() => {});
  }
}).catch(() => {});
