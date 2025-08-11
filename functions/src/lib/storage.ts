import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebase";
import { isFingerprintValid } from "./validation";

export async function storeEvent(params: {
  type: "discord_summary" | "wgu_connect";
  scope: string;
  payload: Record<string, any>;
  fingerprint?: string;
  names: { nameKey: string; nameValue: string };
  counts: { countKey: string; countValue: number };
}) {
  const { type, scope, payload, fingerprint, names, counts } = params;

  let deduped = false;
  if (fingerprint && isFingerprintValid(fingerprint)) {
    const fpId = `${type}:${scope}:${fingerprint}`;
    const fpRef = db.collection("fingerprints").doc(fpId);
    const fpSnap = await fpRef.get();
    if (fpSnap.exists) {
      deduped = true;
    } else {
      await fpRef.create({ createdAt: FieldValue.serverTimestamp() });
    }
  }

  const receivedAt = new Date().toISOString();
  await db.collection("events").add({
    type,
    scope,
    payload,
    fingerprint: fingerprint ?? null,
    receivedAt: FieldValue.serverTimestamp(),
  });

  const latestRef = db.collection("latest_state").doc(`${type}:${scope}`);
  const latestData: Record<string, any> = {
    type,
    scope,
    lastFingerprint: fingerprint ?? null,
    lastUpdatedAt: FieldValue.serverTimestamp(),
  };
  latestData[names.nameKey] = names.nameValue;
  latestData[counts.countKey] = counts.countValue;
  await latestRef.set(latestData, { merge: true });

  return { deduped, storedAt: receivedAt };
}
