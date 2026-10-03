import type { NativeAds } from "./mobile";
export interface AdChallenge { userId: string; customData: string; challengeId: string; }
export interface RewardTransport {
  challenge(): Promise<AdChallenge>;
  // Returns true only after the provider's signed server callback has credited the wallet.
  credited(challengeId: string): Promise<boolean>;
}
export interface RewardedConfig { enabled: boolean; parentApproved: boolean; adId: string; testing: boolean; }
export function createRewardedController(
  load: () => Promise<{ AdMob: NativeAds } | null>,
  transport: RewardTransport,
  wait: (milliseconds: number) => Promise<void> = ms => new Promise(resolve => setTimeout(resolve, ms)),
) {
  let busy = false;
  return {
    async show(config: RewardedConfig): Promise<"unavailable" | "pending" | "credited"> {
      if (busy || !config.enabled || !config.parentApproved || !/^ca-app-pub-\d{16}\/\d{10}$/.test(config.adId)) return "unavailable";
      busy = true;
      try {
        const native = await load();
        if (!native) return "unavailable";
        const challenge = await transport.challenge();
        await native.AdMob.initialize({
          initializeForTesting: config.testing, requestTrackingAuthorization: false,
          tagForChildDirectedTreatment: true, tagForUnderAgeOfConsent: true, maxAdContentRating: "G",
        });
        await native.AdMob.prepareRewardVideoAd({
          adId: config.adId, isTesting: config.testing, npa: true,
          ssv: { userId: challenge.userId, customData: challenge.customData },
        });
        // This result is deliberately ignored: client callbacks cannot mint hearts.
        await native.AdMob.showRewardVideoAd();
        for (let attempt = 0; attempt < 10; attempt++) {
          if (await transport.credited(challenge.challengeId)) return "credited";
          await wait(1500);
        }
        return "pending";
      } catch { return "unavailable"; }
      finally { busy = false; }
    },
  };
}
