import type {Request} from "firebase-functions/v2/https";
import type {Response} from "express";

export type AllowedOrigin = string | RegExp;

export function getAllowedOrigins(raw: string | undefined): AllowedOrigin[] {
  if (raw && raw.trim().length > 0) {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  // Default origins: documented policy + Firebase Hosting (docs site) + local dev.
  // The env override (ALLOWED_ORIGINS) accepts comma-separated exact-match strings only.
  return [
    /^https:\/\/.*\.wgu\.edu$/,
    /^chrome-extension:\/\/[a-z]{32}$/,
    /^moz-extension:\/\/[a-f0-9-]{36}$/,
    "https://wgu-extension.web.app",
    "https://wgu-extension.firebaseapp.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];
}

export function isOriginAllowed(
  origin: string | undefined,
  allowed: AllowedOrigin[]
): boolean {
  if (!origin) return false;
  return allowed.some((rule) =>
    typeof rule === "string" ? rule === origin : rule.test(origin)
  );
}

export function setCors(req: Request, res: Response, allowedOrigins: AllowedOrigin[]) {
  const origin = (req.headers?.origin as string | undefined) ?? "";
  if (isOriginAllowed(origin, allowedOrigins)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Api-Key, X-Extension-Version, X-Client"
  );
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
}
