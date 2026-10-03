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
export interface NativePurchases {
  configure(options: { apiKey: string; appUserID: string }): Promise<void>;
  logIn(options: { appUserID: string }): Promise<unknown>;
  getProducts(options: { productIdentifiers: string[] }): Promise<{ products: Array<{ identifier: string; title: string; priceString: string }> }>;
  purchaseProduct(options: { productIdentifier: string }): Promise<unknown>;
  restorePurchases(): Promise<unknown>;
}
export interface NativePreferences {
  get(options: { key: string }): Promise<{ value: string | null }>;
  set(options: { key: string; value: string }): Promise<void>;
  remove(options: { key: string }): Promise<void>;
}
export interface NativeServices { App: NativeApp; AdMob: NativeAds; Purchases: NativePurchases; Preferences: NativePreferences; }
type CapacitorWindow = Window & { Capacitor?: { isNativePlatform(): boolean; getPlatform?(): string } };
export function isNativePlatform(): boolean {
  return typeof window !== "undefined" && Boolean((window as CapacitorWindow).Capacitor?.isNativePlatform());
}
export function getNativePlatform(): "ios" | "android" | "web" {
  if (!isNativePlatform()) return "web";
  const value = (window as CapacitorWindow).Capacitor?.getPlatform?.();
  return value === "ios" || value === "android" ? value : "web";
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
