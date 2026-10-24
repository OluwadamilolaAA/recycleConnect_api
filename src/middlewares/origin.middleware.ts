import type { RequestHandler } from "express";
import { env } from "../config/env.js";

export const requireTrustedOrigin: RequestHandler = (req, res, next) => {
  const origin = req.get("origin");

  if (origin !== env.CLIENT_ORIGIN) {
    res.status(403).json({
      success: false,
      message: "Request origin not allowed",
    });

    return;
  }

  next();
};