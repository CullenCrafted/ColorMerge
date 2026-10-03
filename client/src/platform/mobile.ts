export interface NativeApp {
  addListener(event: "appStateChange", listener: (state: { isActive: boolean }) => void):
    Promise<{ remove(): Promise<void> }>;
}
export interface NativeAds {
  initialize(options: {
    initializeForTesting: boolean;
    requestTrackingAuthorization: false;
    tagForChildDirectedTreatment: true;
    tagForUnderAgeOfConsent: true;
    maxAdContentRating: "G";
  }): Promise<void>;
  prepareInterstitial(options: { adId: string; isTesting: boolean; npa: true }): Promise<unknown>;
  showInterstitial(): Promise<void>;
  prepareRewardVideoAd(options: { adId: string; isTesting: boolean; npa: true; ssv: { userId: string; customData: string } }): Promise<unknown>;
  showRewardVideoAd(): Promise<unknown>;
}
export interface NativeServices { App: NativeApp; AdMob: NativeAds; }
type CapacitorWindow = Window & { Capacitor?: { isNativePlatform(): boolean } };
export function isNativePlatform(): boolean {
  return typeof window !== "undefined" && Boolean((window as CapacitorWindow).Capacitor?.isNativePlatform());
}
// The setup script creates this file with real native package imports.
// An empty glob is intentional in web-only checkouts.
const installedModules = import.meta.glob<NativeServices>("./native-installed.ts");
export async function loadNativeServices(): Promise<NativeServices | null> {
  if (!isNativePlatform()) return null;
  const load = installedModules["./native-installed.ts"];
  return load ? load() : null;
}

export { createInterstitialController } from "./ad-policy";
