import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import authRoutes from "./modules/auth/auth.routes.js";

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use("/api/v1/auth", authRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "RecycleConnect API is running",
  });
});

export default app;