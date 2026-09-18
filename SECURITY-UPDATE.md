# ColorMerge security update

Prepared from CullenCrafted/ColorMerge main, commit 03d7be6e2cef200a602e3073bc1ddbb1002ba903 (September 6, 2026).
Replit confirmed its working tree matches this commit with no uncommitted changes.
No GitHub branches or live deployments were changed while preparing this package.

## Upload and run

1. Create a branch named `secure-game-preview` from the latest main. Keep `pre-replit-backup` untouched.
2. Extract this ZIP. Upload the files INSIDE its `source` folder to the repository root, preserving folders and replacing matching files. Do not upload the ZIP itself as game code. Alternatively import the source folder in Replit and push that branch.
3. Use Node 22 or newer. Run `npm ci`.
4. Set the server-only `DATABASE_URL` to a Neon PostgreSQL connection string. Replit reports a database is already configured; its compatibility and connectivity need verification there. Do not put the value in source, chat, or any `VITE_` variable. A plain PostgreSQL server that does not support Neon's HTTP driver needs a different driver.
5. Run `npm run db:secure` once against that database. This only adds the `colormerge_sessions` table and its expiry index; it does not modify existing tables. You can instead execute `migrations/001-secure-game.sql` in the database SQL editor.
6. For Vercel, connect this branch for a preview, use framework Vite, build `npm run build`, output `dist/public`, and set `DATABASE_URL` for Preview. Use a separate test database for preview. The root `api/game.ts` supplies the server endpoint. Do not deploy only the `dist/public` folder: that omits the backend.
7. For Replit, set the database secret, run the migration, then use the existing `npm run dev` or build/start deployment commands. The existing Express server serves the same game endpoint.
8. Run `npm run check:secure`, `npm run test:secure`, and `npm run build`. Test the preview checklist below before merging main or promoting production. Production also needs its own database variable and migration.

Uploading to GitHub, Vercel and Replit separately is not required. GitHub can be the source of truth and Vercel can deploy its branch; Replit can edit the same repository.

## Preview checklist

- Confirm the original interface, sound, bubbles and color controls load on a phone.
- Win a level, reload, and confirm the level, target and hearts persist. Check after a deployment restart too.
- Confirm reordered pigments produce the same mix, blue/yellow pairs become green, early matches award one heart, and level ten awards its bonus.
- Fail a mix: lose one heart, retain the target, and do not expose its recipe. At game over the mistake summary can reveal completed targets.
- Try two tabs and a brief network interruption: stale moves must be rejected and Retry connection must recover authoritative state.
- Check API responses contain no active recipe, and client-supplied hearts/levels are rejected.
- Confirm production API responses are JSON with no-store caching, not static HTML or server source.

## What changed

Target generation, validation, hearts and levels run on the server. A random HttpOnly SameSite session cookie identifies each player; only a SHA-256 digest is stored in PostgreSQL. Each move uses an atomic revision check so concurrent or replayed requests cannot award progress twice. Sessions expire after 30 days without activity. Schedule a database cleanup of expired rows if needed.

The browser predicts only the visible color mix, never progress. It waits for acknowledgment between taps; slower connections can therefore affect tap throughput. The original 800 ms celebration remains. A finished round is locked immediately. Lost responses reload server state instead of automatically replaying taps.

Recipes for a still-playable target stay private, even after a wrong guess. Up to 100 recent mistake records are retained per run. Any matching color is accepted regardless of pigment order or whether it uses the generated recipe. Existing unverified demo scores are not imported. Different browsers/devices have separate guest sessions; there is no account login or public leaderboard in this update.

There is a 600-action/minute per-session guard. This is not full bot or denial-of-service protection: attackers can create guest sessions, and visible RGB targets can still be solved mathematically. Hosting-level rate limits are appropriate before a large public launch. Clearing cookies starts a fresh guest game.

## Ads

Both latest GitHub and Replit source contain NO active advertising integration. The earlier `ads.js`, `ads-config.js`, and associated styles from backup commit 140db0145f8679f41e8aa4c1d3c55f17b5984603 are preserved separately in this download under `legacy-ads`. They are not loaded by the game or included in its public assets.

No working ad code was removed. This package does not activate ads or create a browser-callable heart grant endpoint. A paid rewarded-ad integration still needs its provider's actual verification mechanism; a JavaScript callback alone cannot prove an ad was watched. Do not reconnect the old callback directly to heart totals. Paid ads and revenue are not enabled by this update.

## Verification and limits

The production Vite/Express build and focused security TypeScript check pass. Automated tests cover recipe filtering, retry targets, pigment permutations, early-match and milestone hearts, completed-round locks, replay/concurrent requests, separate sessions, invalid payloads, origin checks, rate limits and unavailable storage.

Tests use an injected in-memory store, not your live database. Production has no memory-store fallback and returns a service error when PostgreSQL is unavailable. Live Neon connectivity, migration execution, Vercel deployment and cross-restart persistence were not verified here because no production database credentials were used. The cloud browser blocked the local preview, so phone layout and interactive browser verification remain on the checklist.

The full repository `npm run check` still reports the 14 pre-existing TypeScript errors in unused prototype pages, the older game-stats component and legacy storage. The focused security check does not replace that full check. Existing dependency audit warnings and the old CI workflow are not fixed or disabled by this patch.

Reference: https://vercel.com/docs/functions/runtimes/node-js and https://neon.com/docs/serverless/serverless-driver
