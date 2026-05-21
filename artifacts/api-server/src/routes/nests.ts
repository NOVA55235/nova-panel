import { Router } from "express";
import { requireAuth } from "../lib/auth.js";

const router = Router();
router.use(requireAuth);

const NESTS = [
  {
    id: 1,
    name: "Minecraft",
    description: "Minecraft game servers",
    eggs: [
      { id: 1, name: "Vanilla", dockerImage: "itzg/minecraft-server:java21", startup: "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar nogui", envVars: { EULA: "TRUE", VERSION: "LATEST", TYPE: "VANILLA" } },
      { id: 2, name: "Paper", dockerImage: "itzg/minecraft-server:java21", startup: "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar nogui", envVars: { EULA: "TRUE", VERSION: "LATEST", TYPE: "PAPER" } },
      { id: 3, name: "Forge", dockerImage: "itzg/minecraft-server:java17", startup: "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar nogui", envVars: { EULA: "TRUE", VERSION: "1.20.1", TYPE: "FORGE" } },
      { id: 4, name: "Fabric", dockerImage: "itzg/minecraft-server:java21", startup: "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar nogui", envVars: { EULA: "TRUE", VERSION: "LATEST", TYPE: "FABRIC" } },
    ],
  },
  {
    id: 2,
    name: "Counter-Strike",
    description: "Valve Counter-Strike servers",
    eggs: [
      { id: 5, name: "CS2", dockerImage: "gameservermanagers/counter-strike2:latest", startup: "./game/bin/linuxsteamrt64/cs2 -dedicated +map de_dust2", envVars: { SRCDS_TOKEN: "" } },
      { id: 6, name: "CS:GO", dockerImage: "gameservermanagers/csgo:latest", startup: "./srcds_run -game csgo -console -usercon +sv_setsteamaccount {{TOKEN}}", envVars: { TOKEN: "" } },
    ],
  },
  {
    id: 3,
    name: "Rust",
    description: "Facepunch Rust servers",
    eggs: [
      { id: 7, name: "Rust (Vanilla)", dockerImage: "gameservermanagers/rust:latest", startup: "./RustDedicated -batchmode -nographics -server.hostname {{SERVER_NAME}}", envVars: { SERVER_NAME: "My Rust Server", SERVER_MAXPLAYERS: "100" } },
      { id: 8, name: "Rust (Oxide)", dockerImage: "gameservermanagers/rust:oxide", startup: "./RustDedicated -batchmode -nographics -oxide.enabled 1", envVars: { SERVER_NAME: "Oxide Server", OXIDE_VERSION: "latest" } },
    ],
  },
  {
    id: 4,
    name: "Valheim",
    description: "Iron Gate Studio Valheim servers",
    eggs: [
      { id: 9, name: "Valheim", dockerImage: "lloesche/valheim-server:latest", startup: "./start_server.sh", envVars: { SERVER_NAME: "My Valheim Server", SERVER_PASS: "secret", SERVER_WORLD: "Dedicated" } },
    ],
  },
  {
    id: 5,
    name: "ARK: Survival Evolved",
    description: "Studio Wildcard ARK servers",
    eggs: [
      { id: 10, name: "ARK: SE", dockerImage: "thmhoag/arkserver:latest", startup: "./ShooterGame/Binaries/Linux/ShooterGameServer {{MAP}}?listen", envVars: { MAP: "TheIsland", SESSION_NAME: "ARK Server" } },
    ],
  },
  {
    id: 6,
    name: "Terraria",
    description: "Re-Logic Terraria servers",
    eggs: [
      { id: 11, name: "Terraria", dockerImage: "ryshe/terraria:latest", startup: "mono TerrariaServer.exe -world /root/.local/share/Terraria/Worlds/{{WORLD_NAME}}.wld", envVars: { WORLD_NAME: "World1", MAX_PLAYERS: "8" } },
    ],
  },
  {
    id: 7,
    name: "Voice Servers",
    description: "Voice communication servers",
    eggs: [
      { id: 12, name: "TeamSpeak 3", dockerImage: "teamspeak:latest", startup: "./ts3server_linux_amd64", envVars: { TS3SERVER_LICENSE: "accept" } },
      { id: 13, name: "Mumble", dockerImage: "mumblevoip/mumble-server:latest", startup: "murmurd", envVars: { MUMBLE_CONFIG: "" } },
    ],
  },
  {
    id: 8,
    name: "FiveM / GTA",
    description: "FiveM Grand Theft Auto V servers",
    eggs: [
      { id: 14, name: "FiveM", dockerImage: "spritsail/fivem:latest", startup: "+exec server.cfg", envVars: { LICENSE_KEY: "", STEAM_KEY: "" } },
    ],
  },
];

router.get("/", (_req, res) => {
  res.json(NESTS.map(({ eggs: _, ...n }) => n));
});

router.get("/:id", (req, res) => {
  const nest = NESTS.find(n => n.id === parseInt(req.params.id));
  if (!nest) return res.status(404).json({ error: "Not Found" });
  res.json(nest);
});

router.get("/:id/eggs", (req, res) => {
  const nest = NESTS.find(n => n.id === parseInt(req.params.id));
  if (!nest) return res.status(404).json({ error: "Not Found" });
  res.json(nest.eggs);
});

export default router;
