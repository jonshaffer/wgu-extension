export function getAllowedOrigins(raw: string | undefined): string[] {
  if (raw && raw.trim().length > 0) {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  // Default origins: production site + local development
  return [
    "https://wgu-extension.web.app",
    "https://wgu-extension.firebaseapp.com",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];
}

import type {Request} from "firebase-functions/v2/https";
import type {Response} from "express";

export function setCors(req: Request, res: Response, allowedOrigins: string[]) {
  const origin = (req.headers?.origin as string | undefined) ?? "";
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Api-Key, X-Extension-Version, X-Client"
  );
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
}
