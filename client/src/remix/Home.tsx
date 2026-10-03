import { useState } from "react";
import HeartShop from "./HeartShop";
import { readRemixSave } from "./storage";
import "./remix.css";

export default function Home({ onClassic, onRemix }: { onClassic: () => void; onRemix: () => void }) {
  const [shop, setShop] = useState(() => new URLSearchParams(window.location.search).get("shop") === "1");
  const closeShop = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("shop"); url.searchParams.delete("checkout");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    setShop(false);
  };
  const [save] = useState(readRemixSave);
  return (
    <main className="cm-home" data-testid="home-screen">
      <div className="cm-home-orbit" aria-hidden="true"><span /><span /><span /></div>
      <section className="cm-home-content">
        <p className="cm-eyebrow">A little color. Endless possibilities.</p>
        <h1>Color<span>Merge</span></h1>
        <p>Find the missing colors. Make everything belong.</p>
        <div className="cm-mode-grid">
          <button className="cm-mode-card" onClick={onClassic}>
            <span className="cm-mode-icon cm-classic-icon" aria-hidden="true" />
            <strong>Classic</strong>
            <span>The original color challenge. One mixture, one more level.</span>
            <b>Play Classic <span aria-hidden="true">→</span></b>
          </button>
          <button className="cm-mode-card cm-remix-card" onClick={onRemix}>
            <span className="cm-mode-icon cm-remix-icon" aria-hidden="true" />
            <strong>Remix</strong>
            <span>A growing journey. Discover new ways to mix as you climb.</span>
            <b>{save.unlockedLevel > 1 ? "Continue · Level " + save.selectedLevel : "Begin the journey"} <span aria-hidden="true">→</span></b>
          </button>
        </div>
        <p className="cm-home-note">Remix saves your level on this device. Replay and retry for free.</p>
        <button className="cm-text-button" onClick={() => setShop(true)}>Parents &amp; heart shop</button>
      </section>
      {shop && <HeartShop onClose={closeShop} />}
    </main>
  );
}
