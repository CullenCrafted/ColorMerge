import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  createRun, getLevelSpec, reducer, rgbString, PIGMENTS, remainingAdditions,
  targetVisible, targetOpacity, restoreRun, type RemixAction, type RemixState, type Pigment,
} from "@shared/remix";
import { ArcadeScene } from "./ArcadeScene";
import { PuzzleScene } from "./PuzzleScene";
import HeartShop from "./HeartShop";
import { consumeHeart } from "@/platform/commerce";
import { loadNativeServices } from "@/platform/mobile";
import { completeLevel, readRemixSave, writeRemixSave, type RemixSave } from "./storage";
import "./remix.css";

const pigmentColors: Record<Pigment, string> = { blue: "#0000ff", red: "#ff0000", yellow: "#ffff00", white: "#ffffff", black: "#000000" };
const time = (ms: number) => (Math.max(0, ms) / 1000).toFixed(1) + "s";
const RUN_KEY = "colormerge.remix.run.v1";
interface SavedRun { version: 1; state: RemixState; continueKey: string }
function restoreSession(): SavedRun | null {
  try {
    const raw = JSON.parse(sessionStorage.getItem(RUN_KEY) || "null") as Partial<SavedRun> | null;
    if (!raw || raw.version !== 1 || typeof raw.continueKey !== "string" || !/^[a-zA-Z0-9-]{10,100}$/.test(raw.continueKey)) return null;
    const state = restoreRun(raw.state);
    if (!state || state.level > readRemixSave().unlockedLevel) return null;
    return { version: 1, state: { ...state, paused: state.phase === "playing" || state.phase === "reveal" || state.paused }, continueKey: raw.continueKey };
  } catch { return null; }
}
function persistSession(state: RemixState, continueKey: string): boolean {
  try { sessionStorage.setItem(RUN_KEY, JSON.stringify({ version: 1, state, continueKey } satisfies SavedRun)); return true; }
  catch { return false; }
}
const makeKey = () => typeof crypto.randomUUID === "function" ? crypto.randomUUID() : "continue-" + Date.now() + "-" + Math.random().toString(36).slice(2);

function Panel({ title, children, onDismiss }: { title: string; children: ReactNode; onDismiss?: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);
  return <dialog ref={ref} className="cm-dialog" aria-label={title} onCancel={event => { event.preventDefault(); onDismiss?.(); }}>
    <h2>{title}</h2>{children}
  </dialog>;
}

export default function RemixGame({ onHome }: { onHome: () => void }) {
  const [save, setSave] = useState<RemixSave>(readRemixSave);
  const [restored] = useState(restoreSession);
  const [state, setState] = useState<RemixState>(() => restored?.state ?? createRun(readRemixSave().selectedLevel, 20261003));
  const [help, setHelp] = useState(false);
  const [levels, setLevels] = useState(false);
  const [shop, setShop] = useState(() => new URLSearchParams(window.location.search).get("shop") === "1");
  const closeShop = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("shop"); url.searchParams.delete("checkout");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    setShop(false);
  };
  const [levelChoice, setLevelChoice] = useState(state.level);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [storageWarning, setStorageWarning] = useState(false);
  const pending = useRef(false);
  const continueKey = useRef(restored?.continueKey ?? makeKey());
  const latestState = useRef(state);
  latestState.current = state;
  const audio = useRef<AudioContext | null>(null);
  const settings = useRef(save.settings);
  settings.current = save.settings;
  const dispatch = useCallback((action: RemixAction) => setState(current => reducer(current, action)), []);
  const active = state.objects.find(object => object.id === state.selectedId && object.status === "active");
  const stopped = state.paused || state.phase !== "playing" || help || levels || shop || busy;
  const target = state.spec.style === "rings" && active ? active.target : state.target;
  const showTarget = targetVisible(state) && !state.paused;
  const background = showTarget ? rgbString(target) : "#f1f1f1";
  const needsSubmit = state.spec.style === "recall" || state.spec.modifier === "recall";
  const isArcade = ["fall", "swarm", "tower"].includes(state.spec.style);
  const remaining = active ? remainingAdditions(active) : 0;
  const finished = state.phase === "won" || state.phase === "lost";

  useEffect(() => {
    if (!writeRemixSave(save)) setStorageWarning(true);
  }, [save]);

  useEffect(() => {
    if (state.phase === "won") {
      setSave(previous => completeLevel(previous, state.level, state.elapsedMs, state.assisted));
    }
  }, [state.phase, state.level, state.elapsedMs, state.assisted]);

  useEffect(() => {
    persistSession(state, continueKey.current);
  }, [state.phase, state.paused, state.level]);
  useEffect(() => {
    const saveRun = () => { persistSession(latestState.current, continueKey.current); };
    const interval = window.setInterval(saveRun, 1500);
    window.addEventListener("pagehide", saveRun);
    return () => { clearInterval(interval); window.removeEventListener("pagehide", saveRun); saveRun(); };
  }, []);

  // A fresh monotonic timestamp on every restart prevents background time from
  // becoming an instant loss. Cap unusually long frames; this is local play.
  useEffect(() => {
    if (state.paused || help || levels || shop || !["playing", "reveal"].includes(state.phase)) return;
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      if (document.hidden) return;
      const deltaMs = Math.min(100, Math.max(0, now - previous));
      previous = now;
      dispatch({ type: "tick", deltaMs });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state.paused, state.phase, help, levels, shop, dispatch]);

  useEffect(() => {
    const pause = () => { if (document.hidden) dispatch({ type: "pause", paused: true }); };
    const blur = () => dispatch({ type: "pause", paused: true });
    document.addEventListener("visibilitychange", pause);
    window.addEventListener("blur", blur);
    return () => {
      document.removeEventListener("visibilitychange", pause);
      window.removeEventListener("blur", blur);
      void audio.current?.close();
    };
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    let handle: { remove(): Promise<void> } | undefined;
    void loadNativeServices().then(async native => {
      if (!native || cancelled) return;
      const listener = await native.App.addListener("appStateChange", appState => {
        if (!appState.isActive) dispatch({ type: "pause", paused: true });
      });
      if (cancelled) await listener.remove();
      else handle = listener;
    }).catch(() => {});
    return () => { cancelled = true; void handle?.remove().catch(() => {}); };
  }, [dispatch]);

  const feedback = () => {
    if (settings.current.haptics && typeof navigator.vibrate === "function") navigator.vibrate(12);
    if (!settings.current.sound) return;
    try {
      const context = audio.current ?? (audio.current = new AudioContext());
      void context.resume().catch(() => {});
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.frequency.value = 420;
      gain.gain.setValueAtTime(0.035, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.09);
      oscillator.start(); oscillator.stop(context.currentTime + 0.1);
    } catch { /* Unsupported audio never blocks a move. */ }
  };

  const newLevel = (level: number) => {
    if (pending.current) return;
    const safeLevel = Math.max(1, Math.min(save.unlockedLevel, Math.floor(level)));
    setState(createRun(safeLevel, 20261003));
    setSave(previous => ({ ...previous, selectedLevel: safeLevel }));
    setLevelChoice(safeLevel);
    continueKey.current = makeKey();
    setError(""); setLevels(false); setHelp(false);
  };
  const retry = () => {
    if (pending.current) return;
    dispatch({ type: "retry" });
    continueKey.current = makeKey();
    setError("");
  };
  const useHeart = async () => {
    if (pending.current || state.phase !== "lost") return;
    if (!persistSession(state, continueKey.current)) {
      setError("Device storage is unavailable, so a purchased continuation cannot be recovered safely. You can still retry this level for free.");
      return;
    }
    pending.current = true; setBusy(true); setError("");
    try {
      const receipt = await consumeHeart(continueKey.current);
      if (!receipt.authorizationId) throw new Error("The heart could not be verified. Please retry.");
      let resumed = reducer(state, { type: "resume" });
      if (document.hidden) resumed = reducer(resumed, { type: "pause", paused: true });
      const nextKey = makeKey();
      // Save the continued run before rendering it. If the page closes before
      // this response, the old key retrieves the same debit authorization.
      persistSession(resumed, nextKey);
      continueKey.current = nextKey;
      latestState.current = resumed;
      setState(resumed);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to use a heart. Please retry.");
    } finally { pending.current = false; setBusy(false); }
  };
  const setting = (key: keyof RemixSave["settings"]) => {
    setSave(previous => ({ ...previous, settings: { ...previous.settings, [key]: !previous.settings[key] } }));
  };
  const openHelp = () => { dispatch({ type: "pause", paused: true }); setHelp(true); };
  const select = (id: string) => { if (!stopped) dispatch({ type: "select", id }); };

  return <main data-testid="remix-screen" className={"cm-remix" + (save.settings.reducedMotion ? " cm-reduced-motion" : "")}>
    <div className="cm-target-background" style={{ backgroundColor: background, opacity: showTarget ? targetOpacity(state) : 1 }} aria-hidden="true" />
    <div className="cm-remix-content">
      <header className="cm-toolbar cm-glass">
        <button onClick={onHome} disabled={busy}>Home</button>
        <div className="cm-level-heading"><span>Remix · Level {state.level}</span><strong>{state.spec.title}</strong></div>
        <button onClick={() => dispatch({ type: "pause", paused: !state.paused })} disabled={finished || busy} aria-label="Pause game">Pause</button>
        <button onClick={openHelp} disabled={busy} aria-label="Help and settings">?</button>
      </header>
      <div className="cm-status cm-glass">
        <span>{state.solved} / {state.spec.objectCount} matched</span>
        <span aria-label={state.lives + " attempts remaining"}>♥ {state.lives}</span>
        <span>{state.spec.timeLimitMs > 0 ? time(state.remainingMs) : time(state.elapsedMs)}</span>
      </div>
      <p className="cm-stage-instruction cm-glass">{state.phase === "reveal" ? "Remember this color. Mixing starts when it disappears." : state.spec.instruction}</p>
      <div className="cm-scene" style={{ visibility: state.paused ? "hidden" : "visible" }} aria-label={state.spec.title + " play area"}>
        {isArcade ? <ArcadeScene state={state} onSelect={select} /> : <PuzzleScene state={state} onSelect={select} />}
      </div>
      <section className="cm-mixing-controls cm-glass" aria-label="Mix colors">
        <div className="cm-current-mixture">
          <span className="cm-mixture-swatch" style={{ background: active ? rgbString(active.recipe) : "transparent" }} aria-hidden="true" />
          <span>{active ? "Your mixture" : "Waiting for a shape"}<small>{active ? remaining + " additions available" : "Shapes select automatically when needed"}</small></span>
          <div className="cm-addition-history" aria-label="Colors you added">{active?.additions.map((color, index) => <span key={index} title={color} style={{ backgroundColor: pigmentColors[color] }}><span className="cm-sr-only">{color} </span></span>)}</div>
        </div>
        <div className="cm-palette">
          {PIGMENTS.map(color => <button key={color} data-testid={"palette-" + color} className="cm-pigment" style={{ backgroundColor: pigmentColors[color], color: color === "white" || color === "yellow" ? "#161616" : "#fff" }} disabled={stopped || !active || remaining <= 0} aria-label={"Add " + color} onClick={() => { feedback(); dispatch({ type: "add", color }); }}><span>{color}</span></button>)}
        </div>
        <div className="cm-mix-actions">
          <button disabled={stopped || !active?.additions.length} onClick={() => dispatch({ type: "undo" })}>Undo</button>
          <button disabled={stopped || !active?.additions.length} onClick={() => dispatch({ type: "reset" })}>Reset mixture</button>
          {needsSubmit && <button className="cm-primary" disabled={stopped || !active || active.additions.length === 0} onClick={() => dispatch({ type: "submit" })}>Check</button>}
        </div>
      </section>
      <p className="cm-local-note">Progress saved on this device{state.assisted ? " · Assisted run" : ""}</p>
      {storageWarning && <p className="cm-warning" role="status">Device storage is unavailable. Keep this tab open to retain progress.</p>}
    </div>

    {state.phase === "intro" && !help && !levels && !shop && <Panel title={"Level " + state.level + " · " + state.spec.title}>
      <p>{state.spec.instruction}</p>
      <p>Add colors to make your shape match the target. Blue and yellow combine into green. Blank shapes contain no pigment.</p>
      <p>{state.spec.objectCount} matches · {state.lives} attempts{state.spec.timeLimitMs > 0 ? " · " + time(state.spec.timeLimitMs) : ""}</p>
      <button data-testid="remix-start" className="cm-primary" onClick={() => { feedback(); dispatch({ type: "pause", paused: false }); dispatch({ type: "start" }); }}>Start level</button>
      <div className="cm-panel-actions"><button onClick={() => { setLevelChoice(state.level); setLevels(true); }}>Replay levels</button><button onClick={openHelp}>Settings</button><button onClick={onHome}>Home</button></div>
    </Panel>}

    {state.paused && !finished && state.phase !== "intro" && !help && !levels && !shop && <Panel title="Paused" onDismiss={() => dispatch({ type: "pause", paused: false })}>
      <p>Your timer is paused. Resume when you are ready.</p>
      <button className="cm-primary" onClick={() => dispatch({ type: "pause", paused: false })}>Resume</button>
      <div className="cm-panel-actions"><button onClick={openHelp}>Help &amp; settings</button><button onClick={() => { setLevelChoice(state.level); setLevels(true); }}>Replay levels</button><button onClick={retry}>Retry level free</button><button onClick={onHome}>Home</button></div>
    </Panel>}

    {finished && !shop && !help && !levels && <Panel title={state.phase === "won" ? "Beautifully blended!" : "Try another mix"}>
      {state.phase === "won" ? <>
        <p>Level {state.level} complete in {time(state.elapsedMs)}.</p>
        {state.assisted ? <p>Assisted completion. Your next level is unlocked.</p> : <p>Personal best: {time(save.bestTimes[String(state.level)] ?? state.elapsedMs)}</p>}
        <button className="cm-primary" onClick={() => newLevel(Math.min(state.level + 1, save.unlockedLevel))}>Next level</button>
      </> : <>
        <p>You matched {state.solved} of {state.spec.objectCount}. Retry this level for free, or use one purchased heart to continue your current puzzle.</p>
        <button className="cm-primary" onClick={retry} disabled={busy}>Retry level free</button>
        <button onClick={() => void useHeart()} disabled={busy}>{busy ? "Verifying heart…" : "Use 1 purchased heart to continue"}</button>
        <button onClick={() => setShop(true)} disabled={busy}>Parents &amp; heart shop</button>
        {error && <p role="alert" className="cm-warning">{error}</p>}
      </>}
      <div className="cm-panel-actions"><button onClick={() => { setLevelChoice(state.level); setLevels(true); }} disabled={busy}>Replay levels</button><button onClick={onHome} disabled={busy}>Home</button></div>
    </Panel>}

    {help && <Panel title="How to Remix" onDismiss={() => setHelp(false)}>
      <p>{state.spec.instruction}</p>
      <p>Select a shape, then add colors with the five buttons. Your additions stay with each shape. Undo removes your last addition; Reset mixture removes all your additions from the selected shape.</p>
      <p>New challenges arrive gradually as you advance. You can always retry the current level for free. A purchased heart is an optional continuation after losing.</p>
      <div className="cm-settings">
        <button aria-pressed={save.settings.sound} onClick={() => setting("sound")}>Sound: {save.settings.sound ? "on" : "off"}</button>
        <button aria-pressed={save.settings.haptics} onClick={() => setting("haptics")}>Vibration: {save.settings.haptics ? "on" : "off"}</button>
        <button aria-pressed={save.settings.reducedMotion} onClick={() => setting("reducedMotion")}>Reduced effects: {save.settings.reducedMotion ? "on" : "off"}</button>
      </div>
      <p className="cm-small">Reduced effects removes decorative animation. Movement still matters in falling and bouncing challenges.</p>
      <button className="cm-primary" onClick={() => setHelp(false)}>Back</button>
    </Panel>}

    {levels && <Panel title="Replay your journey" onDismiss={() => setLevels(false)}>
      <p>Levels 1–{save.unlockedLevel} are unlocked. Replay any of them or continue your latest level.</p>
      <label className="cm-level-picker">Level<input type="number" min={1} max={save.unlockedLevel} value={levelChoice} onChange={event => setLevelChoice(Math.max(1, Math.min(save.unlockedLevel, Number(event.target.value) || 1)))} /></label>
      <p>{getLevelSpec(levelChoice).title}</p>
      <button className="cm-primary" onClick={() => newLevel(levelChoice)}>Play level {levelChoice}</button>
      <button onClick={() => newLevel(save.unlockedLevel)}>Continue latest · {save.unlockedLevel}</button>
      <button onClick={() => setLevels(false)}>Back</button>
    </Panel>}
    {shop && <HeartShop onClose={closeShop} />}
  </main>;
}
