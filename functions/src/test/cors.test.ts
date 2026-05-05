import {describe, expect, test} from "@jest/globals";
import type {Request} from "firebase-functions/v2/https";
import type {Response} from "express";
import {getAllowedOrigins, isOriginAllowed, setCors} from "../lib/cors";

function makeReq(origin?: string): Request {
  return {headers: origin ? {origin} : {}} as unknown as Request;
}

function makeRes(): {res: Response; headers: Record<string, string>} {
  const headers: Record<string, string> = {};
  const res = {
    setHeader(name: string, value: string) {
      headers[name] = value;
    },
  } as unknown as Response;
  return {res, headers};
}

describe("getAllowedOrigins", () => {
  test("returns documented + dev defaults when env is unset", () => {
    const defaults = getAllowedOrigins(undefined);
    expect(defaults).toEqual([
      /^https:\/\/.*\.wgu\.edu$/,
      /^chrome-extension:\/\/[a-p]{32}$/,
      /^moz-extension:\/\/[a-f0-9-]{36}$/,
      "https://wgu-extension.web.app",
      "https://wgu-extension.firebaseapp.com",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ]);
  });

  test("returns defaults when env is empty/whitespace", () => {
    expect(getAllowedOrigins("")).toEqual(getAllowedOrigins(undefined));
    expect(getAllowedOrigins("   ")).toEqual(getAllowedOrigins(undefined));
  });

  test("env override returns user strings only (no defaults)", () => {
    const result = getAllowedOrigins("https://a.example, https://b.example");
    expect(result).toEqual(["https://a.example", "https://b.example"]);
  });

  test("env override trims and drops empty entries", () => {
    expect(getAllowedOrigins(" https://x.example ,, https://y.example ")).toEqual([
      "https://x.example",
      "https://y.example",
    ]);
  });
});

describe("isOriginAllowed (default policy)", () => {
  const defaults = getAllowedOrigins(undefined);

  test("rejects empty/undefined origin", () => {
    expect(isOriginAllowed(undefined, defaults)).toBe(false);
    expect(isOriginAllowed("", defaults)).toBe(false);
  });

  test("accepts wgu.edu subdomains", () => {
    expect(isOriginAllowed("https://my.wgu.edu", defaults)).toBe(true);
    expect(isOriginAllowed("https://tasks.wgu.edu", defaults)).toBe(true);
    expect(isOriginAllowed("https://wguconnect.wgu.edu", defaults)).toBe(true);
  });

  test("rejects bare wgu.edu (regex requires a subdomain)", () => {
    expect(isOriginAllowed("https://wgu.edu", defaults)).toBe(false);
  });

  test("rejects http (non-TLS) wgu.edu", () => {
    expect(isOriginAllowed("http://my.wgu.edu", defaults)).toBe(false);
  });

  test("rejects look-alike domains", () => {
    expect(isOriginAllowed("https://wgu.edu.evil.com", defaults)).toBe(false);
    expect(isOriginAllowed("https://evilwgu.edu", defaults)).toBe(false);
    expect(isOriginAllowed("https://evil.com", defaults)).toBe(false);
  });

  test("accepts chrome-extension origin with 32-char id", () => {
    const id = "a".repeat(32);
    expect(isOriginAllowed(`chrome-extension://${id}`, defaults)).toBe(true);
  });

  test("rejects malformed chrome-extension origins", () => {
    expect(isOriginAllowed(`chrome-extension://${"a".repeat(31)}`, defaults)).toBe(false);
    expect(isOriginAllowed(`chrome-extension://${"a".repeat(33)}`, defaults)).toBe(false);
    expect(isOriginAllowed(`chrome-extension://${"A".repeat(32)}`, defaults)).toBe(false);
    // Real Chrome IDs are limited to a-p; characters outside that range must be rejected.
    expect(isOriginAllowed(`chrome-extension://${"q".repeat(32)}`, defaults)).toBe(false);
    expect(isOriginAllowed(`chrome-extension://${"z".repeat(32)}`, defaults)).toBe(false);
  });

  test("accepts moz-extension origin with UUID", () => {
    expect(
      isOriginAllowed("moz-extension://12345678-1234-1234-1234-123456789abc", defaults)
    ).toBe(true);
  });

  test("rejects malformed moz-extension origins", () => {
    expect(isOriginAllowed("moz-extension://not-a-uuid", defaults)).toBe(false);
    // Wrong length
    expect(isOriginAllowed("moz-extension://12345678-1234-1234-1234-123456789ab", defaults)).toBe(false);
    // Uppercase / out-of-charset characters
    expect(isOriginAllowed("moz-extension://12345678-1234-1234-1234-123456789ABC", defaults)).toBe(false);
    expect(isOriginAllowed("moz-extension://gggggggg-gggg-gggg-gggg-gggggggggggg", defaults)).toBe(false);
  });

  test("accepts Firebase Hosting origins (docs site)", () => {
    expect(isOriginAllowed("https://wgu-extension.web.app", defaults)).toBe(true);
    expect(isOriginAllowed("https://wgu-extension.firebaseapp.com", defaults)).toBe(true);
  });

  test("accepts localhost dev origins", () => {
    expect(isOriginAllowed("http://localhost:5173", defaults)).toBe(true);
    expect(isOriginAllowed("http://127.0.0.1:5173", defaults)).toBe(true);
  });

  test("rejects other localhost ports", () => {
    expect(isOriginAllowed("http://localhost:3000", defaults)).toBe(false);
  });

  test("is idempotent across calls when allowlist contains a stateful regex", () => {
    // Caller-supplied `g`-flagged regex would have stateful lastIndex; the helper
    // should reset it so repeated calls return the same result.
    const stateful = /^https:\/\/example\.com$/g;
    const rules: typeof defaults = [stateful];

    expect(isOriginAllowed("https://example.com", rules)).toBe(true);
    expect(isOriginAllowed("https://example.com", rules)).toBe(true);
    expect(isOriginAllowed("https://example.com", rules)).toBe(true);
  });
});

describe("setCors", () => {
  test("echoes Access-Control-Allow-Origin only when origin is allowed", () => {
    const allowed = getAllowedOrigins(undefined);
    const {res, headers} = makeRes();

    setCors(makeReq("https://my.wgu.edu"), res, allowed);

    expect(headers["Access-Control-Allow-Origin"]).toBe("https://my.wgu.edu");
    expect(headers["Vary"]).toBe("Origin");
    expect(headers["Access-Control-Allow-Methods"]).toBe("POST, OPTIONS");
    expect(headers["Access-Control-Allow-Headers"]).toContain("Content-Type");
  });

  test("never sets Access-Control-Allow-Origin for disallowed origin", () => {
    const allowed = getAllowedOrigins(undefined);
    const {res, headers} = makeRes();

    setCors(makeReq("https://evil.com"), res, allowed);

    expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
    expect(headers["Vary"]).toBe("Origin");
  });

  test("does not set Access-Control-Allow-Origin when origin header missing", () => {
    const allowed = getAllowedOrigins(undefined);
    const {res, headers} = makeRes();

    setCors(makeReq(undefined), res, allowed);

    expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
    expect(headers["Vary"]).toBe("Origin");
  });
});
