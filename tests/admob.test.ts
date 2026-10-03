import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { AdRewardError, createAdChallenge, verifyAdReward, type AdRewardOptions } from "../server/commerce/admob.js";

const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const keys = { keys: [{ keyId: 12345, pem: publicKey.export({ type: "spki", format: "pem" }).toString() }] };
const secret = "test-only-server-secret-with-at-least-32-bytes";
const walletId = "b7b1b4cf-3e25-43f5-a90b-70b6c9e61831";
const now = Date.UTC(2026, 9, 3, 12);
const unit = "ca-app-pub-1234567890123456/1234567890";
const transactionId = "0123456789abcdef0123456789abcdef";
const options: AdRewardOptions = { secret, allowedAdUnits: [unit], fetchKeys: async () => keys };
function signed(query: string, keyId = "12345") {
  const signature = sign("sha256", Buffer.from(query), privateKey).toString("base64url");
  return query + "&signature=" + signature + "&key_id=" + keyId;
}
function query(token: string, overrides: Record<string, string> = {}) {
  return new URLSearchParams({
    ad_network: "5450213213286189855", ad_unit: unit, custom_data: token,
    reward_amount: "1", reward_item: "heart", timestamp: String(now),
    transaction_id: transactionId, ...overrides,
  }).toString();
}
function expectCode(code: AdRewardError["code"]) {
  return (error: unknown) => error instanceof AdRewardError && error.code === code;
}

test("Google-signed callback binds opaque wallet and unique challenge, not provider reward quantity", async () => {
  const challenge = createAdChallenge(walletId, secret, now);
  const other = createAdChallenge(walletId, secret, now);
  assert.notEqual(challenge.nonce, other.nonce);
  assert.match(challenge.nonce, /^[A-Za-z0-9_-]{32}$/);
  assert.equal(challenge.expiresAt, now + 30 * 60 * 1000);
  const result = await verifyAdReward(signed(query(challenge.token, { reward_amount: "999" })), options, now);
  assert.deepEqual(result, { walletId, nonce: challenge.nonce, transactionId });
  assert.equal("rewardAmount" in result, false);
});

test("raw signed query bytes are preserved, including percent escapes and plus characters", async () => {
  const challenge = createAdChallenge(walletId, secret, now);
  const original = query(challenge.token).replace("reward_item=heart", "reward_item=color%20heart");
  const callback = signed(original);
  assert.equal((await verifyAdReward("?" + callback, options, now)).walletId, walletId);
  await assert.rejects(verifyAdReward(callback.replace("color%20heart", "color+heart"), options, now), /signature/);
});

test("tampering signed data fails signature verification before challenge validation", async () => {
  const callback = signed(query("invalid-token"));
  await assert.rejects(verifyAdReward(callback.replace("invalid-token", "tampered-token"), options, now), /signature/);
});

test("a different EC signing key cannot forge a callback", async () => {
  const other = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const original = query(createAdChallenge(walletId, secret, now).token);
  const signature = sign("sha256", Buffer.from(original), other.privateKey).toString("base64url");
  await assert.rejects(verifyAdReward(original + "&signature=" + signature + "&key_id=12345", options, now), /signature/);
});

test("signed callbacks still reject corrupt, unsigned, or wrong-secret custom_data", async () => {
  const valid = createAdChallenge(walletId, secret, now);
  const [body, digest] = valid.token.split(".");
  const tampered = body + "." + (digest[0] === "A" ? "B" : "A") + digest.slice(1);
  const wrongSecret = createAdChallenge(walletId, secret + "-other", now).token;
  for (const token of ["invalid", body, tampered, wrongSecret, "x".repeat(2049)]) {
    await assert.rejects(verifyAdReward(signed(query(token)), options, now), /challenge/);
  }
});

test("challenge expiry and issue time are validated after signature", async () => {
  const expired = createAdChallenge(walletId, secret, now - 31 * 60 * 1000);
  await assert.rejects(verifyAdReward(signed(query(expired.token)), options, now), /expired/);
  const future = createAdChallenge(walletId, secret, now + 3 * 60 * 1000);
  await assert.rejects(verifyAdReward(signed(query(future.token)), options, now), /expired/);
  const valid = createAdChallenge(walletId, secret, now);
  await assert.rejects(verifyAdReward(signed(query(valid.token, { timestamp: String(now - 3 * 60 * 1000) })), options, now), /expired/);
});

test("stale, future and malformed provider timestamps fail closed", async () => {
  const token = createAdChallenge(walletId, secret, now).token;
  for (const timestamp of [String(now - 16 * 60 * 1000), String(now + 3 * 60 * 1000), "NaN", "1e12", "-1", "9999999999999999"]) {
    await assert.rejects(verifyAdReward(signed(query(token, { timestamp })), options, now), expectCode("INVALID_REWARD"));
  }
});

test("ad unit allowlist is exact and configuration must be explicit", async () => {
  const token = createAdChallenge(walletId, secret, now).token;
  for (const adUnit of ["another-unit", unit + "-suffix", " " + unit]) {
    await assert.rejects(verifyAdReward(signed(query(token, { ad_unit: adUnit })), options, now), /ad unit/);
  }
  await assert.rejects(verifyAdReward(signed(query(token)), { ...options, allowedAdUnits: [] }, now), expectCode("NOT_CONFIGURED"));
  await assert.rejects(verifyAdReward(signed(query(token)), { ...options, secret: "short" }, now), expectCode("NOT_CONFIGURED"));
});

test("transaction IDs must be bounded opaque identifiers", async () => {
  const token = createAdChallenge(walletId, secret, now).token;
  for (const transaction of ["", "short", "../unsafe-transaction", "x".repeat(257), "transaction id has spaces"]) {
    await assert.rejects(verifyAdReward(signed(query(token, { transaction_id: transaction })), options, now), /transaction/);
  }
});

test("duplicate or encoded duplicate callback claims are rejected", async () => {
  const base = query(createAdChallenge(walletId, secret, now).token);
  for (const appended of ["&ad_unit=" + encodeURIComponent(unit), "&%61d_unit=" + encodeURIComponent(unit), "&key_id=12345"]) {
    await assert.rejects(verifyAdReward(signed(base + appended), options, now), expectCode("INVALID_REWARD"));
  }
});

test("signature/key suffix cannot be reordered, extended, duplicated or malformed", async () => {
  const base = query(createAdChallenge(walletId, secret, now).token);
  const callback = signed(base);
  for (const malformed of [base, callback + "&reward_amount=99", callback + "&signature=x",
    callback.replace("&key_id=12345", "&key_id=https://attacker.invalid/key"),
    callback.replace("&signature=", "&signature=%ZZ"), callback + "#fragment",
    callback.replace("&signature=", "&signature= ")]) {
    await assert.rejects(verifyAdReward(malformed, options, now), expectCode("INVALID_REWARD"));
  }
});

test("unknown keys and unavailable key service never grant a reward", async () => {
  const callback = signed(query(createAdChallenge(walletId, secret, now).token));
  await assert.rejects(verifyAdReward(callback.replace("key_id=12345", "key_id=67890"), options, now), /Unknown/);
  await assert.rejects(verifyAdReward(callback, { ...options, fetchKeys: async () => { throw new Error("offline"); } }, now), expectCode("KEYS_UNAVAILABLE"));
  await assert.rejects(verifyAdReward(callback, { ...options, fetchKeys: async () => ({ keys: [] }) }, now), expectCode("KEYS_UNAVAILABLE"));
  await assert.rejects(verifyAdReward(callback, { ...options, fetchKeys: async () => ({ keys: [keys.keys[0], keys.keys[0]] }) }, now), expectCode("KEYS_UNAVAILABLE"));
});

test("challenges require a strong secret and opaque wallet ID", () => {
  assert.throws(() => createAdChallenge(walletId, "short", now), expectCode("NOT_CONFIGURED"));
  assert.throws(() => createAdChallenge("child@example.com", secret, now), /wallet/);
  assert.throws(() => createAdChallenge(walletId, secret, NaN), expectCode("INVALID_REWARD"));
});

test("production loader uses only pinned HTTPS keys, disallows redirects, and caches successful results", async (context) => {
  let requests = 0;
  context.mock.method(globalThis, "fetch", async (input: unknown, init?: RequestInit) => {
    requests++;
    assert.equal(input, "https://www.gstatic.com/admob/reward/verifier-keys.json");
    assert.equal(init?.redirect, "error");
    assert.ok(init?.signal);
    return new Response(JSON.stringify(keys), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  const callback = signed(query(createAdChallenge(walletId, secret, now).token));
  const productionOptions = { secret, allowedAdUnits: [unit] };
  await verifyAdReward(callback, productionOptions, now);
  await verifyAdReward(callback, productionOptions, now);
  assert.equal(requests, 1);
  // Random unknown IDs must not force an unbounded network refresh per request.
  await assert.rejects(verifyAdReward(callback.replace("key_id=12345", "key_id=67890"), productionOptions, now), /Unknown/);
  assert.equal(requests, 1);
});
