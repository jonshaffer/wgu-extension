import {onRequest} from "firebase-functions/v2/https";
import type {Request} from "firebase-functions/v2/https";
import type {Response} from "express";
import {defineSecret} from "firebase-functions/params";
import {auth} from "../lib/firebase";
import {getAllowedOrigins, setCors} from "../lib/cors";
import {isFingerprintValid, isIsoDateWithin48h} from "../lib/validation";
import {checkRateLimit} from "../lib/rate-limit";
import {storeEvent} from "../lib/storage";

const INGEST_API_KEY = defineSecret("INGEST_API_KEY");
const EXTENSION_ORIGINS = defineSecret("EXTENSION_ORIGINS");

export type DiscordIngestEvent = {
  type: "discord_summary";
  serverId: string;
  serverName: string;
  channelCount: number;
  memberCount?: number;
  collectedAt: string; // ISO
  fingerprint?: string;
  meta?: {
    extensionVersion?: string;
    client?: string;
    userAgent?: string;
  };
};

export const ingestDiscord = onRequest({
  region: "us-central1",
  timeoutSeconds: 10,
  secrets: [INGEST_API_KEY, EXTENSION_ORIGINS],
}, async (req: Request, res: Response) => {
  const allowedOrigins = getAllowedOrigins(EXTENSION_ORIGINS.value());
  setCors(req, res, allowedOrigins);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    res.status(405).json({error: "method_not_allowed"});
    return;
  }

  // Auth optional: prefer Firebase ID token, fallback API key if set, otherwise allow anon
  const authz = req.headers?.authorization as string | undefined;
  if (authz?.startsWith("Bearer ")) {
    try {
      await auth.verifyIdToken(authz.substring(7).trim());
    } catch {
      res.status(401).json({error: "unauthorized"});
      return;
    }
  } else {
    const expected = (INGEST_API_KEY.value() ?? "").trim();
    const provided = (req.headers?.["x-api-key"] as string | undefined)?.trim();
    if (expected && expected !== provided) {
      res.status(401).json({error: "unauthorized"});
      return;
    }
  }

  let body: DiscordIngestEvent | undefined;
  try {
    body = typeof req.body === "object" ? req.body : JSON.parse(req.body);
  } catch {
    res.status(400).json({error: "validation_error", details: ["Malformed JSON"]});
    return;
  }

  const errs: string[] = [];
  if (!body || body.type !== "discord_summary") {
    errs.push("type must be 'discord_summary'");
  }
  if (!body?.serverId || typeof body.serverId !== "string") {
    errs.push("serverId is required string");
  }
  if (!body?.serverName || typeof body.serverName !== "string") {
    errs.push("serverName is required string");
  }
  if (typeof body?.channelCount !== "number" ||
      body.channelCount < 0 || body.channelCount > 10000) {
    errs.push("channelCount must be 0..10000");
  }
  if (body?.memberCount !== undefined &&
      (typeof body.memberCount !== "number" ||
       body.memberCount < 0 || body.memberCount > 10000000)) {
    errs.push("memberCount must be 0..10000000 if provided");
  }
  if (!body?.collectedAt || !isIsoDateWithin48h(body.collectedAt)) {
    errs.push("collectedAt must be ISO within ±48h");
  }
  if (!isFingerprintValid(body?.fingerprint)) {
    errs.push("fingerprint must be hex 32..64 if provided");
  }
  if (errs.length || !body) {
    res.status(400).json({
      error: "validation_error",
      details: errs.length ? errs : ["Invalid body"],
    });
    return;
  }

  // Augment meta
  const event: DiscordIngestEvent = body;
  event.meta = {
    extensionVersion: event.meta?.extensionVersion ??
      (req.headers?.["x-extension-version"] as string | undefined),
    client: event.meta?.client ?? (req.headers?.["x-client"] as string | undefined),
    userAgent: event.meta?.userAgent ?? (req.headers?.["user-agent"] as string | undefined),
  };

  const rate = await checkRateLimit("discord", event.serverId);
  if (!rate.ok) {
    res.status(429)
      .setHeader("Retry-After", String(rate.retryAfter ?? 60))
      .json({error: "rate_limited"});
    return;
  }

  const result = await storeEvent({
    type: "discord_summary",
    scope: event.serverId,
    payload: event as unknown as Record<string, unknown>,
    fingerprint: event.fingerprint,
    names: {nameKey: "serverName", nameValue: event.serverName},
    counts: {countKey: "channelCount", countValue: event.channelCount},
  });

  res.status(202).json({
    status: "accepted",
    deduped: result.deduped,
    storedAt: result.storedAt,
  });
});
