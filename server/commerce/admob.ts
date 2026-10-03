import { createHmac, createPublicKey, randomBytes, timingSafeEqual, verify, type KeyObject } from "node:crypto";

const KEY_URL = "https://www.gstatic.com/admob/reward/verifier-keys.json";
const KEY_TTL_MS = 6 * 60 * 60 * 1000;
const REFRESH_INTERVAL_MS = 60 * 1000;
const CHALLENGE_TTL_MS = 30 * 60 * 1000;
const CALLBACK_MAX_AGE_MS = 15 * 60 * 1000;
const FUTURE_SKEW_MS = 2 * 60 * 1000;
const WALLET_ID = /^[A-Za-z0-9_-]{16,128}$/;
const NONCE = /^[A-Za-z0-9_-]{32}$/;

export interface AdMobKeyDocument {
  keys: Array<{ keyId: string | number; pem: string }>;
}
export interface AdRewardOptions {
  secret: string;
  allowedAdUnits: readonly string[];
  /** Trusted server-side injection for offline tests; never taken from an HTTP request. */
  fetchKeys?: () => Promise<AdMobKeyDocument>;
}
export class AdRewardError extends Error {
  constructor(public readonly code: "INVALID_REWARD" | "KEYS_UNAVAILABLE" | "NOT_CONFIGURED", message: string) {
    super(message);
    this.name = "AdRewardError";
  }
}
function invalid(message = "Invalid rewarded-ad callback."): never {
  throw new AdRewardError("INVALID_REWARD", message);
}
function checkSecret(secret: string) {
  if (typeof secret !== "string" || Buffer.byteLength(secret, "utf8") < 32) {
    throw new AdRewardError("NOT_CONFIGURED", "Reward signing secret is not configured.");
  }
}
function checkNow(now: number) {
  if (!Number.isSafeInteger(now) || now < 0) invalid();
}
function mac(payload: string, secret: string) {
  return createHmac("sha256", secret).update("colormerge-ad-challenge-v1:").update(payload).digest();
}

/** No identity or advertising identifier belongs in this token: walletId is an opaque random ID. */
export function createAdChallenge(walletId: string, secret: string, now = Date.now()) {
  checkSecret(secret);
  checkNow(now);
  if (!WALLET_ID.test(walletId)) invalid("Invalid opaque wallet ID.");
  const nonce = randomBytes(24).toString("base64url");
  const expiresAt = now + CHALLENGE_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ v: 1, walletId, nonce, issuedAt: now, expiresAt })).toString("base64url");
  return { token: payload + "." + mac(payload, secret).toString("base64url"), nonce, expiresAt };
}

function readChallenge(token: string, secret: string, now: number, callbackTime: number) {
  if (token.length > 2048) invalid("Invalid reward challenge.");
  const parts = token.split(".");
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[1])) invalid("Invalid reward challenge.");
  const expected = mac(parts[0], secret);
  const supplied = Buffer.from(parts[1], "base64url");
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) invalid("Invalid reward challenge.");
  let body: unknown;
  try { body = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")); }
  catch { invalid("Invalid reward challenge."); }
  if (!body || typeof body !== "object") invalid("Invalid reward challenge.");
  const value = body as Record<string, unknown>;
  if (value.v !== 1 || typeof value.walletId !== "string" || !WALLET_ID.test(value.walletId)
    || typeof value.nonce !== "string" || !NONCE.test(value.nonce)
    || typeof value.issuedAt !== "number" || !Number.isSafeInteger(value.issuedAt)
    || typeof value.expiresAt !== "number" || !Number.isSafeInteger(value.expiresAt)
    || value.expiresAt - value.issuedAt !== CHALLENGE_TTL_MS
    || value.issuedAt < 0 || value.issuedAt > now + FUTURE_SKEW_MS
    || value.expiresAt <= now || callbackTime < value.issuedAt - FUTURE_SKEW_MS
    || callbackTime >= value.expiresAt) invalid("Invalid or expired reward challenge.");
  return { walletId: value.walletId, nonce: value.nonce };
}

function parseKeys(document: AdMobKeyDocument): Map<string, KeyObject> {
  if (!document || !Array.isArray(document.keys) || document.keys.length === 0 || document.keys.length > 100) {
    throw new Error("Invalid verifier keys.");
  }
  const result = new Map<string, KeyObject>();
  for (const entry of document.keys) {
    if (!entry || !/^[0-9]{1,20}$/.test(String(entry.keyId)) || typeof entry.pem !== "string"
      || entry.pem.length > 4096 || result.has(String(entry.keyId))) throw new Error("Invalid verifier key.");
    const key = createPublicKey(entry.pem);
    if (key.asymmetricKeyType !== "ec" || key.asymmetricKeyDetails?.namedCurve !== "prime256v1") {
      throw new Error("Unsupported verifier key.");
    }
    result.set(String(entry.keyId), key);
  }
  return result;
}

let cachedKeys: Map<string, KeyObject> | undefined;
let cacheExpiresAt = 0;
let lastRefreshAt = 0;
let pendingRefresh: Promise<Map<string, KeyObject>> | undefined;

/** Only Google's pinned HTTPS endpoint is fetched; no caller-controlled URLs or redirects. */
async function refreshKeys(): Promise<Map<string, KeyObject>> {
  if (pendingRefresh) return pendingRefresh;
  lastRefreshAt = Date.now();
  pendingRefresh = (async () => {
    const response = await fetch(KEY_URL, { redirect: "error", signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error("Verifier keys unavailable.");
    const declared = Number(response.headers.get("content-length"));
    if (Number.isFinite(declared) && declared > 65536) throw new Error("Verifier keys too large.");
    if (!response.body) throw new Error("Verifier key body unavailable.");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        length += part.value.byteLength;
        if (length > 65536) {
          await reader.cancel();
          throw new Error("Verifier keys too large.");
        }
        chunks.push(part.value);
      }
    } finally { reader.releaseLock(); }
    const document = JSON.parse(Buffer.concat(chunks).toString("utf8")) as AdMobKeyDocument;
    const keys = parseKeys(document);
    cachedKeys = keys;
    cacheExpiresAt = Date.now() + KEY_TTL_MS;
    return keys;
  })();
  try { return await pendingRefresh; }
  finally { pendingRefresh = undefined; }
}

async function findKey(keyId: string, injected?: AdRewardOptions["fetchKeys"]) {
  try {
    if (injected) return parseKeys(await injected()).get(keyId);
    const now = Date.now();
    // Unknown IDs may request a rotation refresh at most once per minute.
    if (cachedKeys && cacheExpiresAt > now && cachedKeys.has(keyId)) return cachedKeys.get(keyId);
    if (now - lastRefreshAt < REFRESH_INTERVAL_MS && !pendingRefresh) {
      if (cachedKeys && cacheExpiresAt > now) return cachedKeys.get(keyId);
      throw new Error("Verifier refresh is cooling down.");
    }
    return (await refreshKeys()).get(keyId);
  } catch {
    throw new AdRewardError("KEYS_UNAVAILABLE", "Reward verification is temporarily unavailable.");
  }
}

/**
 * Pass the original URL query string, without parsing/re-encoding it.
 * The signature covers the exact bytes preceding &signature; key_id follows it.
 * This verifies authenticity only. The commerce transaction MUST atomically consume
 * both the challenge nonce and provider transaction ID and grant exactly one reward.
 */
export async function verifyAdReward(rawQuery: string, options: AdRewardOptions, now = Date.now()) {
  checkSecret(options.secret);
  checkNow(now);
  if (!Array.isArray(options.allowedAdUnits) || options.allowedAdUnits.length === 0
    || options.allowedAdUnits.some(unit => typeof unit !== "string" || !unit)) {
    throw new AdRewardError("NOT_CONFIGURED", "Rewarded ads are not configured.");
  }
  if (typeof rawQuery !== "string" || rawQuery.length > 16384) invalid();
  const query = rawQuery.startsWith("?") ? rawQuery.slice(1) : rawQuery;
  if (!/^[\x21-\x7e]+$/.test(query) || /%(?![0-9a-f]{2})/i.test(query)) invalid();
  const marker = query.indexOf("&signature=");
  if (marker < 1) invalid();
  const signed = query.slice(0, marker);
  const suffix = /^signature=([^&]+)&key_id=([0-9]{1,20})$/.exec(query.slice(marker + 1));
  if (!suffix) invalid();
  let encodedSignature: string;
  try { encodedSignature = decodeURIComponent(suffix[1]); }
  catch { invalid(); }
  if (!/^[A-Za-z0-9_+/-]+={0,2}$/.test(encodedSignature)) invalid();
  const signature = Buffer.from(encodedSignature, "base64url");
  const canonical = encodedSignature.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  if (signature.length < 8 || signature.length > 80 || signature.toString("base64url") !== canonical) invalid();
  const key = await findKey(suffix[2], options.fetchKeys);
  if (!key) invalid("Unknown reward verification key.");
  let authentic = false;
  try { authentic = verify("sha256", Buffer.from(signed, "utf8"), key, signature); }
  catch { invalid("Invalid reward signature."); }
  if (!authentic) invalid("Invalid reward signature.");

  // Only after Google's signature verifies do any callback claims become trusted.
  const params = new URLSearchParams(signed);
  const names = new Set<string>();
  for (const [name] of params) {
    if (names.has(name) || name === "signature" || name === "key_id") invalid();
    names.add(name);
  }
  const adUnit = params.get("ad_unit");
  const timestamp = params.get("timestamp");
  const transactionId = params.get("transaction_id");
  const challenge = params.get("custom_data");
  if (!adUnit || !options.allowedAdUnits.includes(adUnit)) invalid("Unrecognized reward ad unit.");
  if (!timestamp || !/^[0-9]{1,16}$/.test(timestamp)) invalid("Invalid reward timestamp.");
  const callbackTime = Number(timestamp);
  if (!Number.isSafeInteger(callbackTime) || callbackTime < now - CALLBACK_MAX_AGE_MS
    || callbackTime > now + FUTURE_SKEW_MS) invalid("Reward callback is too old or in the future.");
  if (!transactionId || !/^[A-Za-z0-9_-]{16,256}$/.test(transactionId)) invalid("Invalid reward transaction ID.");
  if (!challenge) invalid("Missing reward challenge.");
  const identity = readChallenge(challenge, options.secret, now, callbackTime);
  return { ...identity, transactionId };
}
