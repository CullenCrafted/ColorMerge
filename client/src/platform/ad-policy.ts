import type { NativeAds } from "./mobile";
type InterstitialAds = Pick<NativeAds, "initialize" | "prepareInterstitial" | "showInterstitial">;

export interface InterstitialConfig {
  enabled: boolean;
  parentApproved: boolean;
  adId: string;
  testing: boolean;
}
/** Ads must be requested only at an explicit between-level break. Never awards hearts. */
export function createInterstitialController(load: () => Promise<{ AdMob: InterstitialAds } | null>, now = Date.now) {
  let initialized = false;
  let lastShown: number | null = null;
  let busy = false;
  return {
    async showAtBreak(config: InterstitialConfig): Promise<boolean> {
      if (busy || !config.enabled || !config.parentApproved || !/^ca-app-pub-\d{16}\/\d{10}$/.test(config.adId)) return false;
      if (lastShown !== null && now() - lastShown < 180_000) return false;
      busy = true;
      try {
        const services = await load();
        if (!services) return false;
        if (!initialized) {
          await services.AdMob.initialize({
            initializeForTesting: config.testing,
            requestTrackingAuthorization: false,
            tagForChildDirectedTreatment: true,
            tagForUnderAgeOfConsent: true,
            maxAdContentRating: "G",
          });
          initialized = true;
        }
        await services.AdMob.prepareInterstitial({ adId: config.adId, isTesting: config.testing, npa: true });
        await services.AdMob.showInterstitial();
        lastShown = now();
        return true;
      } catch {
        return false; // SDK/network failure must never prevent normal play.
      } finally { busy = false; }
    },
  };
}
