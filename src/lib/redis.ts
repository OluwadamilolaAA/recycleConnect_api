import { Redis } from "ioredis";

import { env } from "../config/env.js";

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  connectTimeout: 5000,
  commandTimeout: 5000,
});

redis.on("error", (error) => {
  console.error(
    "API Redis connection error:",
    error.message,
  );
});