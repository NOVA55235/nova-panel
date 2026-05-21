import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    autoLogging: { ignore: (req) => req.url === "/api/healthz" },
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check (used by Docker and load balancers)
app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok", ts: Date.now() });
});

app.use("/api", router);

// In production, serve the built React app for all non-API routes
if (process.env["NODE_ENV"] === "production") {
  const publicPath = path.join(__dirname, "../public");
  app.use(express.static(publicPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });
}

export default app;
