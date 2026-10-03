# ColorMerge expansion design

## Product decision

Keep two choices: Classic and Remix. Classic preserves the original five-pigment mixing rules and familiar circle/background presentation. Remix is one progressive journey that teaches new ways to use those same rules. “Chaos” describes the later moving-shape challenges but would misrepresent the calm puzzles and Zen, so Remix is the clearer umbrella name.

New styles are deliberately spaced apart. Each introduction receives three focused levels, then previously learned styles return. Players can replay any unlocked level. Progress and personal times are device-local, not competitive server rankings.

| First level | Style | Play |
| --- | --- | --- |
| 1 | Color mix | Learn the existing palette and background matching. |
| 11 | Rings | Work outward through cumulative concentric recipes; elapsed time measures speed without a deadline. |
| 21 | Color fall | Complete the lowest falling shape before the floor; rounds grow toward 20 shapes. |
| 36 | Strands | Select overlapping bands, including curved strands, and blend them into the background. |
| 51 | Recall | Memorize a brief target flash, then submit a mixture while the target is hidden. |
| 66 | Tower | Complete arriving blocks to build upward; later blocks allow less time. |
| 81 | Swarm | Select bouncing shapes and manage incoming shapes before overload. A three-second warning permits recovery. |
| 101 | Zen | Match opaque targets between fades through white. Success shortens the next window; mistakes reset the streak without costing lives. Missed targets remain required. |
| 121 | Sphere | Rotate a projected 3D sphere, select dimples, and clear their missing pigments; begins with one dimple. |
| 141 | Strands + Recall | Combine previously learned selection and memory mechanics; revisit every twelve levels. |

## Shared rules and visual continuity

Blue and yellow combine into one green mixing unit, exactly as Classic does. Matching compares rounded RGB channels, rather than inventing a new tolerance system. White and black remain explicit pigments. A blank shape looks white but contains no pigment. Zen changes display opacity only; fading does not add white.

Shapes start with subsets of their target recipes, and player additions remain attached to each selected object. Undo removes an addition; reset clears the additions without changing the starting mixture. Recall uses an explicit Check action so intermediate correctness does not reveal the answer.

Keep the existing simple geometry, full-color backgrounds, rounded controls and five-color palette. Selection outlines, pigment labels, keyboard controls, expanded strand hit areas and sphere rotation buttons supplement touch. Decorative effects, sound and haptics are optional. Moving objects remain part of arcade gameplay even with reduced effects.

## Difficulty and scoring

Later levels increase recipe complexity up to six pigment units and missing subsets up to three, with deterministic seeded puzzles. Rings use cumulative single-pigment steps, up to six rings. Puzzle object counts and arcade speeds are bounded; endless level numbering does not imply infinitely increasing speed. Recall flashes shorten from two seconds to a bounded minimum.

Rings, ordinary Strands and Sphere are untimed. Fall, Tower, Swarm, Recall and early mixing use timers or object pressure. Zen is gentle and requires successful matches to finish, with no life loss. Ordinary levels provide three attempts and unlimited free retries. Backgrounding pauses gameplay and requires an intentional resume.

Every completed level unlocks the next. Personal best times require a complete, unassisted clear without lost attempts; Zen also requires an uninterrupted success streak. Purchased continuations are marked assisted and never set a personal best. Remix saves are local convenience, not an anti-cheat authority.

## Revenue and hearts

The parent wallet sells configured packs of 5, 20 and 60 hearts. Prices come from the payment provider or device store, never hard-coded amounts. A heart optionally continues a failed attempt; restarting remains free. Web purchases use Stripe. Native digital goods use Apple/Google billing through RevenueCat, with server webhook confirmation before any balance credit.

The wallet ledger enforces idempotent credits/debits and refund adjustments. Web Classic continuation debits the wallet and restores the server game in one database transaction. Native Classic uses the original engine locally; native and Remix heart balances remain server-authoritative. Parent-held recovery codes reconnect a wallet after device/storage loss. The parent area is an accidental-purchase barrier, not verified parental consent.

AdMob is native-only and disabled until explicitly configured. Parent preference, child-audience readiness flags and valid placements are required. Child-directed, under-age-of-consent, G-rated non-personalized defaults apply. Interstitials appear only at selected completed-level breaks, outside introductory lessons, with a three-minute cap. Optional rewarded continues require signed server-side verification; an SDK callback alone never grants a heart.

## Architecture and delivery

Shared pure reducers own gameplay; separate puzzle and arcade scenes render them. The shell owns navigation, progression, pause, local recovery, sound/haptics and monetization entry points. Classic server protections remain in place on the web, while native Classic can run offline.

See [mobile setup](MOBILE_SETUP.md), [commerce setup](../server/commerce/README.md) and [.env.example](../.env.example). Apply database migrations in numeric order before enabling commerce. Native setup generates bundled Capacitor projects; Android CI produces a debug APK. iOS requires macOS/Xcode and targets iOS 16.

## Release acceptance

Automated gates cover original mixing parity, generated-level solvability, reveal/fade boundaries, retries, saved runs, ad policy and signed rewards, wallet concurrency/idempotency/refunds, TypeScript, production build and mobile browser interactions for every style. Android CI compiles actual billing and ad SDK adapters.

Before publishing: run physical Android/iOS usability, interruption and offline tests; exercise sandbox purchases, refunds, wallet recovery and actual signed ad rewards; configure store products, signing, icons and screenshots; publish accurate audience/privacy/support disclosures; verify current child-audience SDK and store eligibility. Live credentials and store enrollment are not supplied by this repository. Ads and purchases remain disabled until their release configuration is ready.

After device playtesting, tune timings and the spacing using observed completion/mistake rates. Additional combinations should be introduced deliberately after mastery rather than randomizing every mechanic at once.
