import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import nodesRouter from "./nodes.js";
import serversRouter from "./servers.js";
import vpsRouter from "./vps.js";
import allocationsRouter from "./allocations.js";
import dashboardRouter from "./dashboard.js";
import locationsRouter from "./locations.js";
import apiKeysRouter from "./api-keys.js";
import nestsRouter from "./nests.js";
import discordBotRouter from "./discord-bot.js";
import brandingRouter from "./branding.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/nodes", nodesRouter);
router.use("/servers", serversRouter);
router.use("/vps", vpsRouter);
router.use("/allocations", allocationsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/locations", locationsRouter);
router.use("/api-keys", apiKeysRouter);
router.use("/nests", nestsRouter);
router.use("/discord-bot", discordBotRouter);
router.use("/branding", brandingRouter);

export default router;
