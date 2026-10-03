# ColorMerge

ColorMerge is a five-pigment color-matching game with two paths: the original **Classic** and a progressive **Remix** journey. Remix adds Rings, Color fall, Strands, Recall, Tower, Swarm, Zen and a rotatable Sphere, introducing them gradually from levels 11 through 121. Later levels combine learned mechanics.

[Game design and progression](docs/REMIX_DESIGN.md) · [Mobile setup](docs/MOBILE_SETUP.md) · [Heart purchases and ads](server/commerce/README.md)

## Development

Use Node.js 22. Install with `npm ci`, copy `.env.example` to your local environment and configure a development database for web Classic. Run `npm run dev`. Never commit real credentials.

`npm run check` checks TypeScript. `npm run test:all` runs the Node test suite; set TEST_POSTGRES_URL to a disposable PostgreSQL database to include real wallet SQL tests. `npm run build` builds the web app and server. CI also installs Playwright and runs `npm run test:browser` against an isolated fixture.

## Mobile and revenue

`npm run mobile:setup -- android` generates an Android Capacitor project; use `ios` on macOS with Xcode. Commit generated native projects and dependency lock changes together when preparing a release. `npm run mobile:sync` refreshes bundled assets. Native Classic and Remix can play locally; wallet actions require connectivity.

Stripe handles web hearts; Apple/Google purchases use RevenueCat on native platforms. AdMob integrations include optional rewarded hearts and spaced level-break interstitials. Provider-confirmed server transactions control heart balances. Apply all SQL migrations in numeric order and follow commerce configuration before enabling providers.

Gameplay always offers a free retry. Purchases live in a parent area, with wallet recovery codes. Child-directed ad defaults are implemented, but actual child-audience disclosures, provider eligibility, store products and release approval still require owner setup. Production ads and purchases are disabled by default.

CI uploads an Android debug APK and browser screenshots. A debug build is not a store release: signing, store artwork/metadata, iOS builds, sandbox provider flows and physical-device testing remain release steps.
