export function isIsoDateWithin48h(iso: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = Date.now();
  const diff = Math.abs(now - d.getTime());
  return diff <= 48 * 60 * 60 * 1000; // 48h
}

export function isFingerprintValid(fp?: string): boolean {
  if (!fp) return true;
  return /^[a-f0-9]{32,64}$/i.test(fp);
}
