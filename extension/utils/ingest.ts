import {storage} from "#imports";
import {extensionVersion, wguConnectIngestHistory} from "./storage";
import {getApiBaseUrl} from "./config";

// Persistent anonymous fingerprint for this extension install
const fingerprintKey = "local:fingerprint";

export const fingerprint = storage.defineItem<string>(fingerprintKey, {
  fallback: "",
});

function randomHex(len = 40): string {
  const bytes = new Uint8Array(len / 2);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getOrCreateFingerprint(): Promise<string> {
  let fp = await fingerprint.getValue();
  if (!fp || !/^([a-f0-9]{32,64})$/.test(fp)) {
    fp = randomHex(40); // 20 bytes hex (40 chars)
    await fingerprint.setValue(fp);
  }
  return fp;
}

export function getFunctionsBaseUrl(): string {
  return getApiBaseUrl();
}

// Once/week throttle per scope key (groupId:tab)
export async function shouldThrottleWeekly(scopeKey: string): Promise<{ throttled: boolean; until?: string }> {
  const history = await wguConnectIngestHistory.getValue();
  const last = history[scopeKey];
  if (!last) return {throttled: false};
  const lastTs = Date.parse(last);
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  if (now - lastTs < weekMs) {
    const until = new Date(lastTs + weekMs).toISOString();
    return {throttled: true, until};
  }
  return {throttled: false};
}

export async function markIngest(scopeKey: string): Promise<void> {
  const history = await wguConnectIngestHistory.getValue();
  history[scopeKey] = new Date().toISOString();
  await wguConnectIngestHistory.setValue(history);
}

export type WguConnectResource = {
  id: string;
  title: string;
  category: string;
  // Free-form type from WGU Connect; normalized on client and server
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
  collectedAt: string; // ISO
  fingerprint: string;
  meta?: {
    extensionVersion?: string;
    client?: string;
    userAgent?: string;
  };
};

export async function postWguConnectCollection(
  event: Omit<WguConnectCollectionEvent, "fingerprint" | "meta">,
): Promise<Response | null> {
  const fp = await getOrCreateFingerprint();
  const ver = await extensionVersion.getValue();
  const payload: WguConnectCollectionEvent = {
    ...event,
    type: "wgu_connect",
    fingerprint: fp,
    meta: {
      extensionVersion: ver,
      client: "extension",
      userAgent: navigator.userAgent,
    },
  };

  const scopeKey = `${event.groupId}:${event.activeTab}`;
  const {throttled} = await shouldThrottleWeekly(scopeKey);
  if (throttled) return null;

  try {
    const res = await fetch(`${getFunctionsBaseUrl()}/ingestWguConnectCollection`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Extension-Version": ver,
        "X-Client": "extension",
      },
      body: JSON.stringify(payload),
      // credentials: 'omit' to avoid sending cookies
    });
    if (res.ok) await markIngest(scopeKey);
    return res;
  } catch (e) {
    console.warn("[WGU Extension] Failed to post WGU Connect collection:", e);
    return null;
  }
}
