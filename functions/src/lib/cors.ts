export function getAllowedOrigins(raw: string | undefined): string[] {
  if (raw && raw.trim().length > 0) {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];
}

export function setCors(req: any, res: any, allowedOrigins: string[]) {
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
