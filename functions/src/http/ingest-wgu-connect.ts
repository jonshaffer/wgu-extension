import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { auth } from "../lib/firebase";
import { getAllowedOrigins, setCors } from "../lib/cors";
import { isFingerprintValid, isIsoDateWithin48h } from "../lib/validation";
import { checkRateLimit } from "../lib/rate-limit";
import { storeEvent } from "../lib/storage";

const INGEST_API_KEY = defineSecret("INGEST_API_KEY");
const EXTENSION_ORIGINS = defineSecret("EXTENSION_ORIGINS");

export type WguConnectIngestEvent = {
  type: "wgu_connect_summary";
  groupId: string;
  groupName: string;
  activeTab: string;
  resourceCount: number;
  collectedAt: string; // ISO
  fingerprint?: string;
  meta?: {
    extensionVersion?: string;
    client?: string;
    userAgent?: string;
  };
};

export const ingestWguConnect = onRequest({
  region: "us-central1",
  timeoutSeconds: 10,
  secrets: [INGEST_API_KEY, EXTENSION_ORIGINS],
}, async (req: any, res: any) => {
  const allowedOrigins = getAllowedOrigins(EXTENSION_ORIGINS.value());
  setCors(req, res, allowedOrigins);
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  // Auth optional: prefer Firebase ID token, fallback API key if set, otherwise allow anon
  const authz = req.headers?.authorization as string | undefined;
  if (authz?.startsWith("Bearer ")) {
    try { await auth.verifyIdToken(authz.substring(7).trim()); } catch { return res.status(401).json({ error: "unauthorized" }); }
  } else {
    const expected = (INGEST_API_KEY.value() ?? "").trim();
    const provided = (req.headers?.["x-api-key"] as string | undefined)?.trim();
    if (expected && expected !== provided) return res.status(401).json({ error: "unauthorized" });
  }

  let body: WguConnectIngestEvent | undefined;
  try { body = typeof req.body === "object" ? req.body : JSON.parse(req.body); } catch { return res.status(400).json({ error: "validation_error", details: ["Malformed JSON"] }); }

  const errs: string[] = [];
  if (!body || body.type !== "wgu_connect_summary") errs.push("type must be 'wgu_connect_summary'");
  if (!body?.groupId || typeof body.groupId !== "string") errs.push("groupId is required string");
  if (!body?.groupName || typeof body.groupName !== "string") errs.push("groupName is required string");
  if (!body?.activeTab || typeof body.activeTab !== "string") errs.push("activeTab is required string");
  if (typeof body?.resourceCount !== "number" || body.resourceCount < 0 || body.resourceCount > 10000) errs.push("resourceCount must be 0..10000");
  if (!body?.collectedAt || !isIsoDateWithin48h(body.collectedAt)) errs.push("collectedAt must be ISO within ±48h");
  if (!isFingerprintValid(body?.fingerprint)) errs.push("fingerprint must be hex 32..64 if provided");
  if (errs.length || !body) return res.status(400).json({ error: "validation_error", details: errs.length ? errs : ["Invalid body"] });

  const event: WguConnectIngestEvent = body;
  event.meta = {
    extensionVersion: event.meta?.extensionVersion ?? (req.headers?.["x-extension-version"] as string | undefined),
    client: event.meta?.client ?? (req.headers?.["x-client"] as string | undefined),
    userAgent: event.meta?.userAgent ?? (req.headers?.["user-agent"] as string | undefined),
  };

  const scope = `${event.groupId}:${event.activeTab}`;
  const rate = await checkRateLimit("wgu_connect", scope);
  if (!rate.ok) return res.status(429).setHeader("Retry-After", String(rate.retryAfter ?? 60)).json({ error: "rate_limited" });

  const result = await storeEvent({
    type: "wgu_connect_summary",
    scope,
    payload: event as unknown as Record<string, any>,
    fingerprint: event.fingerprint,
    names: { nameKey: "groupName", nameValue: event.groupName },
    counts: { countKey: "resourceCount", countValue: event.resourceCount },
  });

  return res.status(202).json({ status: "accepted", deduped: result.deduped, storedAt: result.storedAt });
});
