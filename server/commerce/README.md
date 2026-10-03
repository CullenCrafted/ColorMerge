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
