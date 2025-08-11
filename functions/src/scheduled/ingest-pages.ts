import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { db } from "../lib/firebase";

const DEFAULT_BASE = "https://jonshaffer.github.io/wgu-extension";
const UNIFIED_PATH = "/data/unified-community-data.json";

async function fetchUnified(etag?: string | null) {
  const base = process.env.PAGES_BASE_URL || DEFAULT_BASE;
  const url = `${base}${UNIFIED_PATH}`;
  const headers: Record<string, string> = {};
  if (etag) headers["If-None-Match"] = etag;
  const res = await fetch(url as any, { headers } as any);
  return { res, url } as any;
}

export const ingestPagesData = onSchedule({
  schedule: "every 6 hours",
  timeZone: "Etc/UTC",
}, async () => {
  const metaRef = db.collection("public").doc("unifiedCommunityDataMeta");
  const dataRef = db.collection("public").doc("unifiedCommunityData");
  const metaSnap = await metaRef.get();
  const lastEtag = metaSnap.exists ? (metaSnap.data()?.etag as string | undefined) : undefined;

  try {
    const { res, url } = await fetchUnified(lastEtag);
    if (res.status === 304) {
      logger.info("Pages ingest: Not Modified (304) for", url);
      return;
    }
    if (!res.ok) {
      logger.error("Pages ingest failed", { status: res.status, url });
      return;
    }
    const etag = res.headers.get("etag") || undefined;
    const data = await res.json();

    await dataRef.set(
      {
        ...data,
        etag: etag || null,
        updatedAt: new Date().toISOString(),
        source: url,
      },
      { merge: true }
    );

    await metaRef.set(
      {
        etag: etag || null,
        lastFetchedAt: new Date().toISOString(),
        source: url,
      },
      { merge: true }
    );

    logger.info("Pages ingest: stored unifiedCommunityData", { etag, url });
  } catch (e) {
    logger.error("Pages ingest error", e as any);
  }
});
