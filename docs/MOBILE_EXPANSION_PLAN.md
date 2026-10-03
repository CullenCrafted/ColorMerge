# ColorMerge expansion and mobile release plan

Status: proposed implementation specification; no gameplay changes in this document.
Prepared: 2026-10-03.
Audited baseline: CullenCrafted/ColorMerge main at f20b48151e728777a1d980666f4ebbf75b5da49d.

This plan captures all eight gameplay ideas supplied by the owner, reconciles them with the source, and defines an implementation sequence for the website, Apple App Store, and Google Play. Four parallel review streams covered mixing, arcade design, interface/rendering, and mobile/monetization.

Source files and tests were inspected through GitHub. The deployed ColorMerge.xyz build, browser rendering, build commands, live database, advertising providers, and physical devices were not exercised. Source appearance is the design reference until screenshots and device behavior are verified. Numerical pacing values below are initial playtest hypotheses, not measured balance.

## 1. Product direction and scope

Ship one ColorMerge application with Classic plus eight modes: Rings, Colorfall, Recall, Chaos, Zen, Sphere, Strands, and Tower. Names are working names.

Keep the recognizable full-screen color field, simple shapes, five pigment buttons, translucent controls, and satisfying disappearance/bubble feedback. Add a compact mode chooser and mode-specific tutorials. Keep navigation outside active play visually quiet.

All eight modes remain in scope. Build each as a complete tutorial-to-results loop before expanding its level count. Release sequencing can expose completed modes gradually; unfinished modes should not appear as working choices.

Initial content target per mode: three short teaching challenges and twelve authored campaign levels. Expand toward twenty-four campaign levels only after testing the first set. Procedural endless play follows a validated generator; it does not replace authored onboarding.

Accounts, subscriptions, consumable currencies, energy timers, social messaging, and public competitive leaderboards are not first-release dependencies. Keep personal bests and progress useful without an account.

## 2. What exists today

| Area | Verified source behavior | Planning consequence |
| --- | --- | --- |
| Application | React 18, TypeScript, Vite, Tailwind/Radix; App directly mounts ColorMerge | Retain this stack and introduce a mode shell. Other prototype pages are not a functioning mode hub. |
| Palette | Buttons ordered blue, red, yellow, white, black | Preserve order and exact pigment values. Green is an internal result, not another button. |
| Mixing | Each blue/yellow pair becomes ONE green unit; average the remaining effective RGB units | Share this custom model across modes. Do not substitute a standard paint/RGB library. |
| Empty state | White display with zero ingredients | Empty and added white must remain distinct. |
| Matching | Equality of individually rounded RGB channels | Equivalent and shorter recipes remain valid. No hidden-recipe equality requirement. |
| Classic | Level N permits N taps, targets sampled with replacement; three starting hearts | Preserve Classic's current rules while adding separate new-mode difficulty settings. |
| Rewards/failure | Early match grants a heart; entering every tenth level grants a heart; exhausted failed attempt loses a heart and retries the same target | These are Classic rules, not a universal rule for all modes. |
| Authority | Every tap, advance, and restart is a server command with round ID and revision | Current serialized network input is unsuitable for time-sensitive local arcade controls. |
| Storage | Neon-backed guest session, HttpOnly SameSite=Strict cookie, 30-day inactivity expiry | This is not durable cross-device account progress. |
| Security | Active recipe withheld; replay/concurrency checks; strict same-origin API | Preserve this boundary for existing web Classic. Do not relax origin checks to make a wrapper work. |
| Ads/purchases | No active ad integration found; old web code is under legacy-ads; Stripe packages alone do not establish a purchase flow | Native ads and store entitlements need a new integration. |
| Mobile | No native projects/Capacitor config or service worker/manifest in audited tree | Packaging and offline play remain implementation work. |
| Tests | Focused Node tests and TypeScript scripts exist | Inspect/run the actual scripts; README's Vitest/PWA descriptions are not proof of readiness. |

Primary evidence:
- [Authoritative mixer and Classic rules](../server/secure/engine.ts)
- [Authoritative transitions and public snapshot filtering](../server/secure/game.ts)
- [API origin/session checks](../server/secure/handler.ts)
- [Database session store](../server/secure/store.ts)
- [Client transport and duplicate visual mixer](../client/src/lib/colormerge-logic.ts)
- [Actual game screen](../client/src/pages/colormerge.tsx)
- [App entry](../client/src/App.tsx)
- [Package scripts](../package.json), [CI](../.github/workflows/ci.yml), [security tests](../tests/secure-game.test.ts)
- [Prior security handoff](../SECURITY-UPDATE.md)

The prior security handoff reports pre-existing full-project TypeScript errors. Re-run to establish today's baseline; do not describe that historical report as a fresh test result.

## 3. Mixing and puzzle-generation contract

### Preserve mathematics and meaningful state

A recipe is a five-element raw pigment-count vector. Each object owns its starting vector, added pigments, and reversible addition history. Never derive its composition from rendered RGB.

For example, one red and two reds look identical, but one white addition produces different mixtures. Likewise, pairing blue and yellow changes the number of effective units. Adding a correct pigment can temporarily move RGB farther from the target, so color-distance progress bars are misleading.

Extract the existing math into a pure shared module. Characterize the old target running-average implementation, server player averaging, and client preview around rounding boundaries before consolidation. Preserve known behavior or explicitly document any separately reviewed numerical correction.

Keep exact rounded RGB matching initially. A perceptual tolerance would be a distinct gameplay change requiring evaluation.

### Generate valid challenges

For each challenge:
1. Choose target raw recipe T within a tested complexity cap.
2. Choose initial recipe S from T, retaining raw counts.
3. Store a valid completion sequence from S to T.
4. Evaluate that sequence through the actual mixer, including blue/yellow pairing.
5. Reject unintentionally pre-matched starts and targets that are too visually similar to their preceding step.
6. Search bounded candidate additions to estimate the shortest valid solution; use that estimate for difficulty, medals, and time budgets.
7. Accept an earlier equivalent RGB match even if it differs from the generated answer.

Distinct pigments, total raw units, effective units, missing additions, palette choices, object count, and pace are separate difficulty variables. Do not use level number as a universal difficulty formula.

Empty objects never auto-clear merely because their blank display equals a white target; require an intentional valid action/submission. Undo in new modes removes the player's most recent addition, not the object's preloaded ingredients. Reset restores that object's initial recipe.

Hidden initial recipes can make quantity ambiguous. Introductory partial-mixture levels should use constrained starting quantities and missing-addition counts. Show remaining addition budget and the player's added counts; optional practice hints can expose more information. Do not claim every recipe can be uniquely inferred from its appearance.

### New-mode action rules

New modes may support undo and selected-object reset; Classic does not gain these by default. Editing and switching preserve per-object state. For moving objects, capture the active object ID at gesture initiation so the clearing tap never affects its successor.

New puzzle-mode addition budgets limit the current added mixture; undo frees an addition slot and reset restores the starting object. Exhausting that budget does not consume Classic hearts: the player can undo/reset. Arcade timers keep running during corrections; floor, overload, or arrival rules determine loss. Recall uses Submit or its answer deadline. Define these budgets per level rather than inheriting Classic's level-number limit.

Seed and version authored/generated levels. Personal records include mode, level/seed, rules version, assistance setting, and result. Compare like challenges.

## 4. Visual and interaction specification

Preserve these source-defined traits:
- A solid full-screen target field during matching.
- White empty geometry and flat, accurate mixture colors.
- Existing blue/red/yellow/white/black palette in the same order.
- Rounded pigment buttons; translucent dark panels with light borders.
- Circular Lucide controls, system sans text, bold score numerals.
- Dark outlines when needed to distinguish white-on-white.
- Outlines disappearing on success, matched-color bubbles, restrained haptic feedback.
- Purple/pink dialog accents, kept away from the color-matching field.

Extract a common shell: target layer, top controls, configurable metrics, playfield, selected-mixture inspector, bottom palette, overlays, and celebration layer. Different modes replace the playfield and rules rather than duplicating the whole page.

Source issues to resolve during extraction:
- Five 64px buttons plus four 16px gaps occupy 384px before padding. Fit narrower phones with responsive gaps/sizes while retaining comfortable hit areas.
- Replace fixed screen-height assumptions with dynamic viewport sizing and safe-area insets.
- Give pigment and icon controls accessible names and state. Offer visible names/symbols as an option.
- Centralize pause and cancelable transitions: the current scheduled advance can fire after pause.
- Distinguish restart object, restart level/run, and return to modes. The current reset-looking control restarts Classic's run.
- Stop timed play under help/results/ad overlays and during backgrounding.
- Repair audio lifecycle: honor mute when returning to foreground, initialize from a user gesture, and stop/dispose appropriately during navigation.
- Add reduced motion and a true haptics-off preference.
- Verify contrast against the actual displayed HUD/background, including Zen transitions.

Preserve the fill-up circle for Classic and suitable new modes. Moving objects must also expose a fully opaque current-mixture sample; liquid-fill geometry must not obscure the color players need to judge.

## 5. Mode specifications

### A. Rings

Owner concept: concentric circles, progressively cumulative mixtures, fastest total completion time.

Loop: edit the center to match the next ring; then activate that next ring, using its own saved initial recipe, and match the ring beyond it. Each outer recipe extends its predecessor.

Accept equivalent matches for the completed region, but do not copy that player's alternate recipe into the next region. Identical RGB can hide different raw counts and break the planned continuation.

Six visible regions produce five inter-region matches. Recommended resolution: make the background the final target so the outermost region also has a matching task.

Progression: three regions/one missing addition; four regions/one to two additions; six regions/two to three additions; more varied recipes only within useful visual limits.

Score: elapsed active gameplay time to finish. Completion is sufficient to pass campaign levels; time benchmarks award optional medals. Undo/reset consume time. Pause, hints, and assistance settings are recorded for comparable time trials. Exclude noninteractive transition time.

### B. Colorfall

Owner concept: differently sized circles and polygons fall; finish the lowest shape before it reaches the floor; roughly twenty shapes per background/round.

Automatically select the lowest unresolved shape. Palette input changes that object; a match dissolves it and selects the next. Use a clear active outline and stationary swatch.

Initial campaign rules: three lives, one lost per floor miss. Resolve twenty scheduled shapes with at least one life to pass. A perfect-clear medal requires zero misses. Keep the target fixed until all previous shapes resolve.

Teach one active shape with one missing addition and roughly nine seconds of travel. Later allow two, then three concurrent shapes. When missing additions increase, grant more travel time before introducing faster pacing. Spawn scheduling must budget the total mixing work, not only each object's individual deadline.

Score: successful clears, small remaining-height bonus, capped accuracy streak. Unlimited random shape density is not an acceptable difficulty mechanism.

### C. Recall

Owner concept: briefly reveal the background, conceal it, reconstruct from memory under a deadline; shorter reveals and more complex mixtures over time.

Phases: ready, reveal, neutral concealment, mixing, explicit Submit, result. Unlike Classic, do not auto-win on every tap: that would leak the hidden answer. A campaign level can comprise five targets and pass with at least four correct; perfect accuracy earns an additional medal.

Initial tuning: two-second reveal; shorten by 0.1 seconds per level with a provisional 0.75-second floor. Increase recipe size in steps, for example once every four levels, to a validated cap. Begin with fifteen seconds to answer rather than shortening every parameter simultaneously.

Use one reveal/conceal cycle per target, not repeated rapid flashing. Longer-reveal practice and assisted Peek are ordinary options, not accessibility features locked behind ads.

Score correct targets first, total answer time second. Reset the mixing object between targets.

### D. Chaos

Owner concept: blank/partially mixed shapes spawn and bounce; select one to complete; prevent the screen becoming overrun.

Tap to select persistently; palette taps continue editing that object while it moves. Retain other mixtures when switching. Slow selected movement modestly and provide a stationary color preview. Use simple bounded reflection before considering object-to-object physics.

Level one contains one blank object against a simple target. Later introduce finite spawn quotas, partial recipes, faster spawning, and higher movement speed as distinct steps.

Show occupancy/capacity. When capacity is exceeded, start a provisional three-second overload countdown; clearing below the limit cancels it. Campaign victory requires all scheduled objects cleared. Endless play uses waves.

Keep the palette region clear; avoid fully obscuring objects; provide predictable overlap selection. Change the background only between cleared waves.

Score successful clears and clean mixing streaks. Peak occupancy and elapsed time are useful secondary feedback.

### E. Zen

Owner concept: backgrounds fade out to white then in from white using opacity; match before the next fade; successful play gradually accelerates.

Store canonical target recipe separately from presentation opacity. Render target A opacity 1→0 over white, then B opacity 0→1. Never interpret the transition as white/black pigment.

MVP: mixing and its timer are active only during the stable opaque hold. Disable input and stop the matching clock during fades. Each new target begins with an empty mixing object. A success ends the matching window and schedules the transition; a miss resets the streak and moves onward without ending the session.

Initial holds: around fifteen seconds, then twelve, ten, and eight as successful tiers advance. Establish the minimum through testing; offer untimed practice and reduced-motion static transitions.

Score longest streak and total matches. Avoid compulsory ads inside a session. If future play allows mixing during fades, it must show an opaque target reference and continue judging the canonical target.

### F. Sphere

Owner concept: rotate a 3D sphere, finish partially mixed dimples, make its sections disappear into the background.

Tap a visible front-facing patch to select; drag to rotate; preserve unfinished mixtures. Distinguish a tap from a drag with a gesture threshold. Add Next unfinished and a large flat selected-patch preview. Rotating a selected patch out of view does not discard its state.

Start with one patch; prototype four and eight before dense layouts. Potential later counts of twelve to twenty-four depend on tappability, not a fixed commitment.

Use unlit dimple color surfaces and restrained rim geometry. Match using canonical RGB, never sampled shaded pixels. Verify WebGL color management against the CSS background. Success removes local fill/rim/shading; dissolve the remaining scaffold after the final patch. Defer physically cut holes that expose rear geometry.

Default scoring: completion and mixing efficiency. Optional time trials follow. Rotation and selection are not penalized moves.

### G. Strands

Owner concept: bands/lines with partial mixtures overlap a common target background and disappear when completed; later vary width, direction, curvature, and density.

Tap a strand, complete it through the shared palette, and clear it. Switching retains progress.

Teach three broad separated parallel bands with one missing addition. Introduce five angled/variable-width bands, then eight crossing strands, then approximately ten to twelve curves/waves. Increase density independently of mixture complexity.

Expand hit areas beyond thin visual strokes. At crossings, select the top visible strand, then permit repeated taps to cycle candidates with clear feedback. Every remaining strand must have an accessible segment or explicit selection navigation; reject inaccessible generated layouts.

Default is untimed clearing with efficiency medals. Optional seeded time trials follow.

### H. Tower

Owner concept: incoming cube sections contain fewer pigments than the tower base; finish them to grow upward; scenery changes through the sky and space as pace increases.

The tower core/base is the target; one incoming section is active. Completing it snaps it into the tower and scrolls upward. A timeout discards that section and costs one of three stability points.

Campaign goals can begin at ten sections, then twenty and thirty. Endless score is height, with accuracy as secondary feedback. No block-positioning mechanic is required for the first version.

Begin near eight seconds per section with one missing addition. Add more complex starts before reducing the response window. Restore some time when introducing a new complexity tier.

Scenery progresses through ground, skyline, clouds, upper atmosphere, and stars. It must not silently change the mixing target. If a milestone changes the target, announce it between pieces and update a stable target swatch. Preserve a neutral comparison area so scenery does not distort judgment.

## 6. Progression and results

Keep Classic's existing progression intact. New campaign levels grant completion independently of speed; optional medals reward accuracy/efficiency or mode-appropriate speed.

Use minimal objectives:
- Puzzle: complete all regions/strands/dimples.
- Memory: meet the correct-answer requirement.
- Arcade: clear a quota or reach a height.
- Zen: streak goals without forced session failure.

Unlock mode tutorials early so players can find a preferred style. Do not require mastery of Classic's unbounded levels to reach the new content. Tutorial completion can unlock a mode's initial campaign; completed levels open subsequent levels.

Persist versioned local progress, bests, preferences, tutorial status, and resumable new-mode sessions. Save at meaningful state transitions. Corrupt/incompatible saves should recover safely without deleting unrelated progress. Test upgrades explicitly.

Daily seeded challenges may reuse validated content after launch. Separate assisted results, untimed practice, and differing rules versions. Public ranked timing is deferred.

## 7. Technical design

### Retain React and evaluate Capacitor

Use the current React/Vite implementation for 2D modes. Package bundled assets using Capacitor after a device spike. Add native lifecycle, haptics, ads, purchases, and safe-area support. Build a separate mobile web-assets command; the current build also bundles the Express server. Configure Capacitor's webDir to dist/public and package no Node server. Remove or development-gate the unconditional external Replit banner script in client/index.html, add viewport-fit=cover, and revisit the disabled browser zoom.

Use CSS/SVG for Rings and Strands where suitable. Profile transform-based animation or Canvas for Colorfall/Chaos/Tower rather than committing to a renderer prematurely. A small, lazy-loaded WebGL/Three.js scene is a candidate for Sphere; it does not require a whole-app engine rewrite.

### Authority and offline behavior

Preserve existing web Classic's authoritative endpoint, hidden recipes, revisions, and cookie protections. Extracting math does not require exporting active server recipes.

Introduce a local session adapter for new campaign/practice modes and mobile Classic with the same Classic rules. These use local personal records. The UI should say Local best where distinction matters, without exposing implementation jargon.

Local generation necessarily makes its puzzle data inspectable; it does not provide the current server's secrecy guarantee. Do not import these results into verified records. Do not advertise client clocks or signed seeds alone as proof of fair timed performance.

A later online competitive service needs an explicit event-validation, replay, timing, abuse, and authentication design. Native access to existing Classic also requires deliberate transport/authentication work: a local Capacitor origin cannot reuse the current same-origin fetch and Strict cookie unchanged. Do not broadly enable CORS or accept forged progress to work around this.

Existing web guest progress remains available under its current session. Cross-device migration/cloud saves are separate work; no silent promise that installing the app transfers website progress.

### Proposed source boundaries

All paths below are proposed except where noted.

| Path | Responsibility |
| --- | --- |
| shared/game/color.ts | Typed pigment vectors, existing green pairing, averaging, rounding, visual match |
| shared/game/types.ts | Versioned level, object, action, phase, result definitions |
| shared/game/generator.ts | Seeded new-mode recipes, partial starts, bounded solvability/difficulty checks |
| shared/game/modes/*.ts | Pure state transitions for each mode; independent scoring/loss policies |
| client/src/game/session/* | Local adapter and preserved server transport/reconciliation adapter |
| client/src/game/clock.ts | Monotonic active time; pause/background/overlay handling |
| client/src/game/storage.ts | Versioned local saves, bests, preferences, migrations |
| client/src/components/game/* | Palette, target layer, HUD, selection inspector, overlays, celebration |
| client/src/modes/* | Mode-specific renderers and input bindings |
| client/src/platform/* | Web/native audio, haptics, lifecycle, ads, purchase adapters |
| client/src/content/levels/* | Authored initial level configurations |
| server/secure/* (existing) | Existing Classic authority; future verified services remain deliberate additions |
| capacitor.config.ts, ios/, android/ | Native packaging, added after spike |

Level data includes ID/version, mode, seed, target, per-object starting state, timing/spawn settings, win/loss conditions, scoring, and assistance rules. Keep secret online state separate from any public level DTO.

Session actions include adding a pigment, selecting an object, undoing, resetting the selected object, submitting Recall, pausing, resuming, and mode-specific transitions. Each reducer rejects invalid object IDs and actions in finished/inactive phases. Timed movement consumes monotonic gameplay time, not raw render-frame count.

## 8. Advertising, purchases, and release operations

Business model remains a recommendation pending owner preference: optional rewarded ads, conservatively limited interstitials at natural session breaks, and a one-time entitlement removing automatic ads.

No banners in the playfield. No ads during active mixing, a moving wave, a reveal, a fade challenge, or onboarding. Zen sessions remain uninterrupted. A starting interstitial policy can require both three completed sessions and three minutes since the last ad, with none in the first learning session; tune only after observing retention.

Rewarded ads may offer one continued arcade attempt per run. Show the exact benefit before playback and flag assisted results. Basic hints/practice/accessibility need an ordinary non-ad path. Ad load/fill failure returns cleanly to play; it does not remove the free restart option.

Use native ad SDK integrations, not the archived browser code. Keep reward granting idempotent. For server-owned hearts or valuable verified entitlements, require the provider's server verification mechanism; a client callback or foreground event cannot establish entitlement. Local practice rewards can be local and remain unverified.

Use the appropriate Apple/Google purchase mechanisms for digital entitlements. Define what Remove Ads removes, restore purchases, and handle refunds/revocations. Do not infer a working native purchase system from installed Stripe packages.

Before choosing SDKs, decide intended audience/age range and launch regions. Verify current store and regional requirements during implementation/submission. Inventory actual SDK collection for privacy policy, Apple disclosures, Google Data safety, consent, and tracking authorization where applicable.

Store work includes ownership/developer accounts, bundle/package IDs, signing, app icons, licensed audio/assets, screenshots, descriptions, age ratings, support/privacy URLs, current target SDK requirements, applicable privacy manifests, and testing-track requirements. Avoid requiring accounts for first launch; if accounts are added, include deletion and cloud-progress behavior.

Operational metrics: tutorial completion, level completion/abandonment, misses, active play time, frame-time problems, crashes, ad load/reward errors, and purchase errors. Collect only what is needed, respect consent, and avoid logging personal data or secret Classic state. Maintain the deployed website as a supported channel.

## 9. Delivery backlog and parallel ownership

Sequence is dependency-driven. Estimate calendar duration after the runnable baseline and device spike; source inspection alone is insufficient.

| Milestone | Concrete work | Acceptance gate |
| --- | --- | --- |
| M0 Baseline | Run install/check/test/build; compare deployed look; fix CI/runtime drift and relevant existing errors | Reproducible build/check results, known baseline, screenshots on supported viewports |
| M1 Shared foundation | Extract mixer with parity; session types/local adapter; versioned generation/saves; shell and lifecycle fixes | Existing Classic security/rules tests pass; equivalent mixtures/partial states remain correct |
| M2 First playable expansion | Rings tutorial + initial levels, mode chooser, results; native packaging spike in parallel | One complete new mode works on web/iOS/Android, including offline local play and interruption recovery |
| M3 Puzzle/transition lanes | Recall and Zen; Strands with selection/hit-testing | Recall does not leak correctness; opacity does not alter recipes; every strand selectable |
| M4 Arcade lane | Colorfall, then Tower; Chaos after selection/timing foundations | Fair workload, stable targets, no cross-object tap leakage, deterministic pause/resume |
| M5 Spatial lane | Sphere prototype 1/4/8 patches, then campaign | Reliable rotation/selection, flat color parity, acceptable minimum-device performance |
| M6 Monetization/beta | Native ads, entitlements, consent, settings, store assets and disclosures | Correct reward/restore/failure paths; active play never interrupted; complete device beta |
| M7 Launch/iteration | TestFlight/Play testing, release preparation, monitoring, content tuning | Required store/device checks complete; gradual release and rollback procedures ready |

Parallel responsibilities after M1 interfaces stabilize:
- Foundation owner: shared mixer, types, clocks, generation, save contracts, Classic regression.
- Puzzle owner: Rings, Recall, Strands and authored levels.
- Arcade owner: Colorfall, Tower, Chaos and workload tuning.
- Rendering owner: Zen presentation and Sphere prototype.
- Mobile owner: Capacitor, native services, packaging, store preparation.

Use separate feature branches and bounded source ownership. Shared contracts change through the foundation owner with migration notes; mode work should not independently rewrite the shared palette or mixing rules. Integration happens incrementally, not as one eight-mode merge.

## 10. Validation and definition of done

First establish commands against a supported Node runtime (the prior handoff specifies Node 22+, while existing CI specifies 18). Align the project and CI deliberately. Current scripts: npm run check, npm run check:secure, npm run test:secure, npm run build.

CI must run actual focused tests as well as build/check. Replace the current keyword-based secret grep, which flags ordinary identifiers, with a suitable scanner; do not suppress real findings. Audit dependencies and remedy relevant issues. Validate baseline failures before classifying them as new regressions.

Required automated coverage:
- Existing Classic matching, heart awards, active-recipe filtering, lost/repeated/stale actions, concurrency, origins and storage failures.
- Shared/server/preview parity, repeated ingredients, empty vs white, green pairing, order and rounding boundaries.
- Generated completion paths within budgets; no unintended already-matched starts; reproducible seeds.
- Per-object persistence, undo/reset, invalid selections, phase guards, and no action leaking to the next object.
- Monotonic timers, pause/foreground/ad interruptions, save migrations, idempotent reward/purchase processing.
- Recall submit gating and Zen recipe/opacity separation.

Required device/playtest coverage:
- Small phones, safe areas, larger text and tablets; accessible labels and touch targets.
- Fresh tutorial comprehension without coaching.
- Offline startup/local play, network loss, audio mute, calls/backgrounding, interrupted purchases/ads.
- Sustained maximum designed object load and Sphere rendering on agreed minimum iOS/Android devices.
- Stable 60fps target where supported; measure realistic frame-time/thermal behavior and choose fallbacks from evidence.
- Color sample consistency across CSS/Canvas/WebGL, white targets, dark backgrounds, and optional assistance modes.
- Ad unavailable/cancelled/rewarded paths, purchase restoration, and accurate store disclosures.

A mode is complete only with tutorial, configured levels, win/loss/results, progress persistence, settings, interruption handling, and verification. A store build is complete only after physical-device and distribution-track testing; a generated native project alone is not release-ready.

## 11. Decisions still needed

These do not block the initial engineering foundation:
- Intended audience/age range and launch regions, before advertising SDK selection.
- Monetization preference: rewarded-only or rewarded plus limited automatic ads and removal purchase.
- Whether all eight modes must be public on day one or can arrive in staged releases.
- Minimum supported devices/OS versions.
- Developer-account ownership, final app identifiers, and store branding.
- Whether cross-device saves or public leaderboards justify adding accounts after the initial release.

Default recommendation: retain today's Classic web behavior, build local responsive new modes and same-rule mobile Classic, preserve the visual language, ship complete modes incrementally, and defer competitive online timing until its verification design exists.
