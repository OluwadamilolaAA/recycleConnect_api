import type { CookieOptions } from "express";
import { env } from "./env.js";

export const REFRESH_COOKIE_NAME = env.NODE_ENV === "production"
    ? "__Secure-rc_refresh"
    : "rc_refresh";

export const refreshCookieOptions: CookieOptions = {
    httpOnly: true,

    secure: env.NODE_ENV === "production",

    sameSite: "lax",

    path: "/api/v1/auth",
};