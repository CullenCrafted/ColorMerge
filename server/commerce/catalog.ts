export const PACKS = [
 {sku:'hearts5', hearts:5, env:'STRIPE_PRICE_HEARTS_5'},
 {sku:'hearts20', hearts:20, env:'STRIPE_PRICE_HEARTS_20'},
 {sku:'hearts60', hearts:60, env:'STRIPE_PRICE_HEARTS_60'},
] as const;
export function configured() {
 return process.env.COMMERCE_ENABLED === 'true' && !!process.env.STRIPE_SECRET_KEY &&
 !!process.env.STRIPE_WEBHOOK_SECRET && !!process.env.COMMERCE_ORIGIN &&
 PACKS.every(p => !!process.env[p.env]);
}
