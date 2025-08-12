import {FieldValue} from "firebase-admin/firestore";
import {db} from "./firebase";

export async function checkRateLimit(type: string, scope: string, limitPerMinute = 60): Promise<{ ok: boolean; retryAfter?: number }> {
  const docId = `${type}:${scope}`;
  const ref = db.collection("rate_limits").doc(docId);
  const now = Date.now();
  const windowKey = Math.floor(now / 60000).toString();
  const res = await db.runTransaction(async (tx: any) => {
    const snap = await tx.get(ref);
    let count = 0;
    if (snap.exists) {
      const data = snap.data() as { window?: string; count?: number } | undefined;
      if (data && data.window === windowKey) {
        count = Math.max(0, data.count ?? 0);
      }
    }
    if (count >= limitPerMinute) {
      return {limited: true} as const;
    }
    tx.set(ref, {window: windowKey, count: count + 1, updatedAt: FieldValue.serverTimestamp()}, {merge: true});
    return {limited: false} as const;
  });
  if ((res as any).limited) {
    const secondsIntoWindow = Math.floor((now % 60000) / 1000);
    return {ok: false, retryAfter: 60 - secondsIntoWindow};
  }
  return {ok: true};
}
