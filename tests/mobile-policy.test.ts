import { test } from "node:test";
import assert from "node:assert/strict";
import { createInterstitialController } from "../client/src/platform/ad-policy";
const configured = { enabled: true, parentApproved: true, adId: "ca-app-pub-3940256099942544/1033173712", testing: true };
test("ads require explicit availability, parent choice and a valid placement", async () => {
  let requests = 0;
  const controller = createInterstitialController(async () => { requests++; return null; });
  for (const config of [{ ...configured, enabled: false }, { ...configured, parentApproved: false }, { ...configured, adId: "" }]) {
    assert.equal(await controller.showAtBreak(config), false);
  }
  assert.equal(requests, 0);
  assert.equal(await controller.showAtBreak(configured), false);
});
test("native ads apply child defaults and frequency cap without granting value", async () => {
  let clock = 0; let shows = 0; let options: unknown;
  const controller = createInterstitialController(async () => ({ AdMob: {
    async initialize(value) { options = value; },
    async prepareInterstitial(value) { assert.equal(value.npa, true); },
    async showInterstitial() { shows++; },
  }}), () => clock);
  assert.equal(await controller.showAtBreak(configured), true);
  assert.deepEqual(options, { initializeForTesting: true, requestTrackingAuthorization: false,
    tagForChildDirectedTreatment: true, tagForUnderAgeOfConsent: true, maxAdContentRating: "G" });
  assert.equal(await controller.showAtBreak(configured), false);
  clock = 180_000;
  assert.equal(await controller.showAtBreak(configured), true);
  assert.equal(shows, 2);
});
test("ad SDK failure releases the busy state and does not block play", async () => {
  let attempts = 0;
  const controller = createInterstitialController(async () => { attempts++; throw new Error("offline"); });
  assert.equal(await controller.showAtBreak(configured), false);
  assert.equal(await controller.showAtBreak(configured), false);
  assert.equal(attempts, 2);
});

import { createRewardedController } from "../client/src/platform/rewarded-ads";
test("a rewarded SDK result cannot grant hearts without signed server confirmation", async () => {
  let confirmed = false; let checks = 0;
  const native = { AdMob: {
    async initialize() {}, async prepareInterstitial() {}, async showInterstitial() {},
    async prepareRewardVideoAd(options: { ssv: { customData: string } }) { assert.equal(options.ssv.customData, "signed-challenge"); },
    async showRewardVideoAd() { return { amount: 999 }; },
  }};
  const controller = createRewardedController(async () => native, {
    async challenge() { return { userId: "wallet", challengeId: "nonce", customData: "signed-challenge" }; },
    async credited(id) { checks++; assert.equal(id, "nonce"); return confirmed; },
  }, async () => {});
  assert.equal(await controller.show(configured), "pending");
  assert.equal(checks, 10);
  confirmed = true;
  assert.equal(await controller.show(configured), "credited");
});
