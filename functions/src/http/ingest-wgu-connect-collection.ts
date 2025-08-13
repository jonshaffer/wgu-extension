import {onRequest} from "firebase-functions/v2/https";
import type {Request} from "firebase-functions/v2/https";
import type {Response} from "express";
import {defineSecret} from "firebase-functions/params";
import {auth} from "../lib/firebase";
import {getAllowedOrigins, setCors} from "../lib/cors";
import {isFingerprintValid, isIsoDateWithin48h} from "../lib/validation";
import {checkRateLimit} from "../lib/rate-limit";
import {storeEvent} from "../lib/storage";

const EXTENSION_ORIGINS = defineSecret("EXTENSION_ORIGINS");

export type WguConnectResource = {
  id: string;
  title: string;
  category: string;
  // Free-form type from groups; we'll normalize casing/spacing on ingest
  type: string;
  imageUrl?: string;
  link?: string;
  referencePath?: { group: string; tab: string; title: string; key: string };
};

export type WguConnectCollectionEvent = {
  type: "wgu_connect";
  groupId: string;
  groupName: string;
  activeTab: string;
  activeTabId?: string;
  activeTabPanelId?: string;
  url: string;
  resources: WguConnectResource[];
  resourceCount?: number; // optional summary count when resources not provided
  collectedAt: string; // ISO
  fingerprint?: string;
  meta?: {
    extensionVersion?: string;
    client?: string;
    userAgent?: string;
  };
};

export const ingestWguConnectCollection = onRequest({
  region: "us-central1",
  timeoutSeconds: 10,
  secrets: [EXTENSION_ORIGINS],
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

  // Auth optional: prefer Firebase ID token; otherwise allow anon
  const authz = req.headers?.authorization as string | undefined;
  if (authz?.startsWith("Bearer ")) {
    try {
      await auth.verifyIdToken(authz.substring(7).trim());
    } catch {
      res.status(401).json({error: "unauthorized"});
      return;
    }
  }

  let body: WguConnectCollectionEvent | undefined;
  try {
    body = typeof req.body === "object" ? req.body : JSON.parse(req.body);
  } catch {
    res.status(400).json({error: "validation_error", details: ["Malformed JSON"]});
    return;
  }

  // Validate body
  const errs: string[] = [];
  if (!body || body.type !== "wgu_connect") {
    errs.push("type must be 'wgu_connect'");
  }
  if (!body?.groupId || typeof body.groupId !== "string") {
    errs.push("groupId is required string");
  }
  if (!body?.groupName || typeof body.groupName !== "string") {
    errs.push("groupName is required string");
  }
  if (!body?.activeTab || typeof body.activeTab !== "string") {
    errs.push("activeTab is required string");
  }
  if (!body?.url || typeof body.url !== "string") {
    errs.push("url is required string");
  }
  if (!body?.collectedAt || !isIsoDateWithin48h(body.collectedAt)) {
    errs.push("collectedAt must be ISO within ±48h");
  }
  const hasResources = Array.isArray(body?.resources);
  const hasCount = typeof (body as WguConnectCollectionEvent &
    {resourceCount?: number})?.resourceCount === "number";
  if (!hasResources && !hasCount) {
    errs.push("either resources (array) or resourceCount (number) is required");
  }
  const count = hasResources ?
    (body as WguConnectCollectionEvent).resources.length :
    (hasCount ?
      (body as WguConnectCollectionEvent & {resourceCount?: number}).resourceCount ?? 0 :
      0);
  if (hasResources && count > 5000) errs.push("resources length must be 0..5000");
  if (hasCount && (count < 0 || count > 10000)) errs.push("resourceCount must be 0..10000");
  // Require a valid fingerprint for per-user scoping
  if (!body?.fingerprint || !isFingerprintValid(body.fingerprint)) {
    errs.push("fingerprint is required and must be hex 32..64");
  }

  // Validate some resource fields without being overly strict
  if (body && Array.isArray(body.resources)) {
    const resources = body.resources as WguConnectResource[];
    for (let i = 0; i < Math.min(resources.length, 50); i++) {
      const r = resources[i] as WguConnectResource;
      if (!r || typeof r !== "object") {
        errs.push(`resources[${i}] must be object`);
        break;
      }
      if (!r.id || typeof r.id !== "string") {
        errs.push(`resources[${i}].id required string`);
        break;
      }
      if (!r.title || typeof r.title !== "string") {
        errs.push(`resources[${i}].title required string`);
        break;
      }
      if (!r.category || typeof r.category !== "string") {
        errs.push(`resources[${i}].category required string`);
        break;
      }
      if (typeof r.type !== "string") {
        errs.push(`resources[${i}].type must be string`);
        break;
      }
      if (r.link && typeof r.link !== "string") {
        errs.push(`resources[${i}].link must be string if provided`);
        break;
      }
    }
  }

  if (errs.length || !body) {
    res.status(400).json({
      error: "validation_error",
      details: errs.length ? errs : ["Invalid body"],
    });
    return;
  }

  const event: WguConnectCollectionEvent = body as WguConnectCollectionEvent;
  event.meta = {
    extensionVersion: event.meta?.extensionVersion ??
      (req.headers?.["x-extension-version"] as string | undefined),
    client: event.meta?.client ??
      (req.headers?.["x-client"] as string | undefined),
    userAgent: event.meta?.userAgent ??
      (req.headers?.["user-agent"] as string | undefined),
  };

  // Normalize resource.type strings for consistency
  const normalize = (input: string) => (input || "")
    .toLowerCase()
    .replace(/[\s_\-/]+/g, " ")
    .replace(/[^a-z0-9 &]/g, "")
    .replace(/\s*&\s*/g, " and ")
    .replace(/\s+/g, " ")
    .trim();
  if (Array.isArray(event.resources)) {
    event.resources = event.resources.map((r) => ({
      ...r,
      type: normalize(r.type),
      category: typeof r.category === "string" ? r.category.trim() : r.category,
    }));
    event.resourceCount = event.resources.length;
  } else if (typeof event.resourceCount === "number") {
    // Ensure integer bounds
    event.resourceCount = Math.max(0, Math.min(10000, Math.floor(event.resourceCount)));
  }

  // Rate limit per fingerprint + group + tab
  const scope = `${event.fingerprint}:${event.groupId}:${event.activeTab}`;
  const rate = await checkRateLimit("wgu_connect", scope);
  if (!rate.ok) {
    res.status(429)
      .setHeader("Retry-After", String(rate.retryAfter ?? 60))
      .json({error: "rate_limited"});
    return;
  }

  const result = await storeEvent({
    type: "wgu_connect",
    scope,
    payload: event as unknown as Record<string, unknown>,
    fingerprint: event.fingerprint,
    names: {nameKey: "groupName", nameValue: event.groupName},
    counts: {countKey: "resourceCount", countValue: event.resourceCount ?? count},
  });

  res.status(202).json({
    status: "accepted",
    deduped: result.deduped,
    storedAt: result.storedAt,
  });
  return;
});
