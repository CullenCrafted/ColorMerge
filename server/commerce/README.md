# Commerce setup

Commerce is disabled by default. No keys, prices, or live ads are bundled.

Apply migrations/002-commerce.sql before enabling. Set COMMERCE_ENABLED=true,
COMMERCE_ORIGIN to the exact HTTPS web origin, STRIPE_SECRET_KEY,
STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_HEARTS_5, STRIPE_PRICE_HEARTS_20,
STRIPE_PRICE_HEARTS_60. Price IDs must refer to active one-time prices.
Catalog values come from Stripe; amounts are never supplied by the browser.

Mount commerceHandler at /api/commerce with express.raw({type:'application/json',
limit:'256kb'}) BEFORE express.json(). Vercel api/commerce.ts reads raw bytes.
Configure Stripe webhook endpoint /api/commerce?action=webhook for
checkout.session.completed, checkout.session.async_payment_succeeded and
charge.refunded. Use test keys and signed test events first. Refunds revoke
proportional hearts (rounded upward); already-spent refunded hearts create a debt
settled by future credits. Payment disputes need an operational review process;
no automated dispute/fraud tooling is included.

Wallet cookie is HttpOnly, SameSite=Strict and independent of Classic sessions.
Recovery uses a separate random 256-bit parent-held code, stored hashed in DB.
The code is never put in URLs. Restoring rotates the cookie capability and signs
other browsers out. No child email/account collection is introduced. Parent
must save the code; cookie loss plus code loss needs manual support. Recovery
code is displayed once and held in tab sessionStorage until the tab closes;
never send it to analytics/logs. The arithmetic parent area deters accidental
purchase, NOT verified parental consent. Configure appropriate child-audience
privacy disclosures and a parent support/refund process before enabling.

consume returns a stable authorization per wallet and idempotency key. Persist
the failed run and its consume key BEFORE spending; reuse the key after a lost
response. A client-only Remix continuation is not an authoritative competitive
score. Classic requires a separate transaction restoring its server game state.

AdMob is separately disabled until ADMOB_REWARDS_ENABLED=true and
ADMOB_CHILD_AUDIENCE_READY=true, ADMOB_REWARD_SECRET and a comma-separated
ADMOB_REWARDED_AD_UNITS allowlist are configured. These flags are deployment
readiness acknowledgments, not consent. Native SDK must use child-directed,
under-age-of-consent, G-rated non-personalized configuration. Challenge issuance
requires parentApproved in the request; this is UI intent, not legal consent.
Google SSV callback URL MUST be /api/commerce?action=admob-ssv (action first).
Challenge custom_data binds the wallet; fixed reward is one heart regardless of
provider reward_amount. Ledger enforces nonce and transaction uniqueness.
Client SDK callbacks never credit hearts. ad-status only reports DB-granted
rewards. Do not activate ads until provider/store/legal child-audience setup is
complete. Native purchases require Apple/Google billing; Stripe is web-only.

Verification gates: run unit tests; test SQL concurrency against disposable Neon
database; verify raw signed webhook in Express and Vercel; replay event twice;
race two debits with one heart; refund before/after spending; verify restore
after clearing cookie; ensure native checkout blocked; test Safari/iOS and
Android. Repository-only implementation is not proof these integration gates pass.


## Native purchases and authenticated rewards

Apply migrations/004-native-commerce.sql after 002. Run the mobile setup script
to install RevenueCat Purchases Capacitor v11 and Preferences. Configure real
consumable products with identical product identifiers across the two stores
(or extend the server catalog per platform before using different IDs).
Set NATIVE_COMMERCE_ENABLED=true, COMMERCE_ORIGIN to canonical HTTPS,
NATIVE_COMMERCE_ORIGINS to explicit WebView origins (for example
capacitor://localhost,http://localhost; use actual generated app origins),
REVENUECAT_WEBHOOK_SECRET to at least 32 random characters,
REVENUECAT_PRODUCT_HEARTS_5/_20/_60, and REVENUECAT_ENVIRONMENT=SANDBOX during
testing or PRODUCTION for release. Do not enable sandbox events in production.
Configure RevenueCat webhook /api/commerce?action=revenuecat-webhook with
Authorization: Bearer <secret>. Only APP_STORE/PLAY_STORE configured consumable
NON_RENEWING_PURCHASE/CANCELLATION events affect the ledger. Unknown products,
environments, transfers, aliases and subscription events do not grant hearts.
Configure project ownership/transfer behavior so consumables remain bound to
the original server-issued appUserID.

Build public variables VITE_COMMERCE_ORIGIN, VITE_REVENUECAT_IOS_KEY and
VITE_REVENUECAT_ANDROID_KEY are SDK public keys, not webhook/server secrets.
Native bootstrap issues a server UUID appUserID and an independent random
wallet bearer. Requests need both allowlisted WebView origin and bearer;
Classic cookie-origin protections remain unchanged. Bearer lives in Capacitor
Preferences (app-private preferences, NOT an encrypted credential vault).
Threat model and backup policies must be reviewed before production; consider
a keychain/keystore adapter if stronger at-rest protection is required.
Restoration by parent code rotates access and logs RevenueCat into the recovered
wallet. We deliberately do not offer StoreKit restore as recovery for spent
consumables. Native purchases load real localized prices and invoke the store
sheet. Only provider webhook updates credit the wallet; SDK success polls that
authoritative balance and may remain pending. App resumes refresh balance.

AdMob uses the same native bearer API. Parent area persists optional ad preference
as cm-parent-ads-approved; event cm-ad-preference notifies gameplay UI. This is
a UI preference, not verified parental consent. Native SDK child-directed
settings and legal/store/provider setup still must be completed before enabling.
No email, advertising identifier collection call, or subscriber-attribute
collection is added to RevenueCat integration. Audit SDK default collection and
publish accurate disclosures before release.

Native transaction SQL serializes each store transaction, deduplicates events,
and records refund-first tombstones. Refunds can create a negative internal debt
if hearts were already used; visible spendable balance is zero until settled.
Test both event orders, duplicate delivery, bad webhook secrets, unknown SKU,
sandbox isolation, interrupted purchase, parent wallet recovery and physical
device billing. Stub-store unit tests do not replace live Postgres/store tests.


Authenticated recovery-code rotation: POST rotate-recovery requires the current
web wallet cookie or native bearer, generates a new random code server-side and
atomically replaces only that wallet's recovery hash. Old codes immediately stop
working; the wallet token does not change. A lost rotation response can be
recovered by rotating again while still authenticated. Parent UI never enables
purchase buttons without a displayed code and an explicit saved-code checkbox.
A new session with no locally retained code must generate a replacement before
purchase. Session storage is convenience only, not a recovery guarantee.
