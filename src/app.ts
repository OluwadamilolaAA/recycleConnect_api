import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/user.routes.js"
import addressRoutes from "./modules/address/address.route.js"
import materialRoutes from "./modules/materials/material.route.js"
import recyclerMaterialRoutes from "./modules/recyclers/recycler-material.routes.js"
import { errorMiddleware } from "./middlewares/error.middleware.js";

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
app.use(cookieParser());
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/address", addressRoutes);
app.use("/api/v1/materials", materialRoutes)
app.use("/api/v1/recylers", recyclerMaterialRoutes)

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "RecycleConnect API is running",
  });
});

app.use(errorMiddleware);

export default app;