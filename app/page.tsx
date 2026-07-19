"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Eye,
  Globe2,
  Headphones,
  Menu,
  Pause,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Waves,
  Wrench,
  X,
} from "lucide-react";

const slides = ["The promise", "Resolve", "Live vision", "The system"];

function Eyebrow({ number, children }: { number: string; children: React.ReactNode }) {
  return <p className="eyebrow"><span>{number}</span><i />{children}</p>;
}

function SlideOne() {
  return <section className="slide slide-one" aria-labelledby="slide-one-title">
    <div className="sky-glow" />
    <div className="wave-field" aria-hidden="true"><span /><span /><span /></div>
    <div className="slide-content hero-content">
      <Eyebrow number="01 / 04">Voice + vision for the real world</Eyebrow>
      <div className="hero-layout">
        <div>
          <p className="kicker"><span className="live-ping" /> BUILT FOR THE PROBLEM IN FRONT OF YOU</p>
          <h1 id="slide-one-title">Show it.<br /><em>Solve it.</em></h1>
          <p className="hero-copy">Armani sees what you see, researches the live web, and talks you through the next useful move. No login, no prompt engineering, no ten-step lecture.</p>
          <div className="hero-route">
            <span className="route-chip"><Camera size={15} /> show it</span><b>→</b>
            <span className="route-chip"><Headphones size={15} /> explain it</span><b>→</b>
            <span className="route-chip active"><Wrench size={15} /> resolve it</span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="sun-rays" /><div className="sun-disc" /><div className="horizon" /><div className="beach-sand" />
          <div className="palm-silhouette"><i /><b /><em /></div>
          <div className="float-card card-a"><span className="mini-icon"><Camera size={14} /></span><span><small>YOU SHOW</small><b>Dishwasher / E24</b></span></div>
          <div className="float-card card-b"><span className="mini-icon blue"><Search size={14} /></span><span><small>ARMANI CHECKS</small><b>Manual + live web</b></span></div>
          <div className="answer-card"><div className="answer-top"><span className="status-dot" /> NEXT MOVE <span>RESOLVE</span></div><p>“Check the drain hose for kinks. Show me what you find.”</p><div className="answer-line"><span /><span /><span /></div></div>
        </div>
      </div>
    </div>
    <div className="slide-foot"><span>CAMERA / VOICE / LIVE WEB / ONE STEP</span><span>ARMANI / 2026</span></div>
  </section>;
}

function SlideTwo() {
  const steps = [
    { icon: Camera, label: "Show", detail: "Point the camera at the object, label, or error." },
    { icon: Eye, label: "Identify", detail: "Read the visible model, condition, and clues." },
    { icon: Wrench, label: "Guide", detail: "Give one safe, concrete action—not a checklist." },
    { icon: Check, label: "Verify", detail: "Look again, hear what changed, then continue." },
  ];
  return <section className="slide slide-two" aria-labelledby="slide-two-title">
    <div className="slide-content">
      <Eyebrow number="02 / 04">Armani Resolve</Eyebrow>
      <div className="split-heading"><div><h2 id="slide-two-title">One step.<br /><em>Then check.</em></h2></div><p className="lede">Resolve Mode stays with the problem. Armani gives the next move, waits for the result, and adapts instead of reading an answer at you.</p></div>
      <div className="loop-grid">{steps.map(({ icon: Icon, label, detail }, index) => <div className={`loop-card card-${index}`} key={label}><div className="loop-number">0{index + 1}</div><div className="loop-icon"><Icon size={22} /></div><h3>{label}</h3><p>{detail}</p>{index < 3 && <span className="loop-arrow"><ArrowRight size={17} /></span>}</div>)}</div>
      <div className="quote-bar"><span>THE CONVERSATION RULE</span><strong>Short answer. Natural pause. You can cut in anytime.</strong></div>
    </div>
  </section>;
}

function SlideThree() {
  return <section className="slide slide-three" aria-labelledby="slide-three-title">
    <div className="slide-content">
      <Eyebrow number="03 / 04">Camera context + current information</Eyebrow>
      <div className="split-heading"><div><h2 id="slide-three-title">It sees the clue.<br /><em>Then checks the web.</em></h2></div><p className="lede">A spoken question and one camera frame become a precise search using visible labels, model numbers, error codes, and object condition.</p></div>
      <div className="scrape-stage">
        <div className="browser-card"><div className="browser-bar"><span className="browser-dots"><i /><i /><i /></span><span className="address"><Camera size={13} /> camera frame / E24 label</span><span className="secure">LIVE</span></div><div className="browser-page"><div className="page-skeleton wide" /><div className="page-skeleton medium" /><div className="page-skeleton small" /><div className="page-copy"><span>VISUAL SEARCH QUERY</span><strong>Bosch dishwasher E24 drain error</strong><small>Visible clue + spoken problem · just now</small></div><div className="research-pills"><span>official manual</span><span>support</span><span>repair guidance</span><span>parts</span></div><div className="scrape-cursor"><Sparkles size={14} /> identified</div></div></div>
        <div className="signal-panel"><div className="signal-head"><span className="status-dot" /> RESOLVE MODE ACTIVE <b>LIVE</b></div><div className="signal-answer"><small>ONE SAFE STEP</small><p>“Check the drain hose for kinks or blockages. Show me the hose.”</p></div><div className="source-list"><div><Check size={14} /><span><b>Visual clue</b><small>Model and error visible in the frame</small></span></div><div><Check size={14} /><span><b>Live web</b><small>Current documentation and support context</small></span></div><div><Check size={14} /><span><b>Conversation</b><small>Follow-ups stay inside the same problem</small></span></div><div><ShieldCheck size={14} /><span><b>Safety first</b><small>Hazards come before repair instructions</small></span></div></div><div className="signal-foot"><span>short by default</span><span>asks to verify</span></div></div>
      </div>
    </div>
  </section>;
}

function SlideFour({ onRestart }: { onRestart: () => void }) {
  return <section className="slide slide-four" aria-labelledby="slide-four-title">
    <div className="deep-wave" aria-hidden="true" />
    <div className="slide-content"><Eyebrow number="04 / 04">The shipped system</Eyebrow><div className="final-layout"><div><p className="kicker light"><span className="live-ping" /> WEB + NATIVE iOS / AVAILABLE NOW</p><h2 id="slide-four-title">Less assistant.<br /><em>More resolution.</em></h2><p className="final-copy">Saved conversation copies stay on the device, are excluded from iCloud backup, and auto-delete after 30 days by default. Camera frames are never stored. Current requests still go to external providers for answers—clearly disclosed, never hidden.</p><button className="replay-button" onClick={onRestart}><Play size={15} /> Replay the story</button></div><div className="system-stack"><div className="stack-label">ARMANI RUNTIME</div><div className="stack-row"><span className="stack-icon"><Headphones size={17} /></span><span><b>Natural voice</b><small>Short turns + interruption</small></span><span className="stack-live">LIVE</span></div><div className="stack-row"><span className="stack-icon"><Camera size={17} /></span><span><b>Camera vision</b><small>Frame on ask, never stored</small></span><span className="stack-live">LIVE</span></div><div className="stack-row"><span className="stack-icon"><Globe2 size={17} /></span><span><b>Live web research</b><small>Stateless Armani API</small></span><span className="stack-live">LIVE</span></div><div className="stack-row"><span className="stack-icon"><ShieldCheck size={17} /></span><span><b>On-device history</b><small>30-day cleanup + Delete now</small></span><span className="stack-live">LOCAL</span></div><div className="stack-bottom"><span>NO CLOUD HISTORY</span><span>SHOW IT. SOLVE IT.</span></div></div></div></div>
    <div className="slide-foot light-foot"><span>THE REAL WORLD DOESN’T FIT IN A SEARCH BOX</span><span>THANK YOU</span></div>
  </section>;
}

export default function Home() {
  const [current, setCurrent] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const goTo = useCallback((index: number) => { setCurrent(Math.max(0, Math.min(slides.length - 1, index))); setMenuOpen(false); }, []);
  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const previous = useCallback(() => goTo(current - 1), [current, goTo]);
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (["ArrowRight", " ", "PageDown"].includes(event.key)) { event.preventDefault(); next(); } if (["ArrowLeft", "PageUp"].includes(event.key)) { event.preventDefault(); previous(); } if (event.key === "Home") goTo(0); if (event.key === "End") goTo(slides.length - 1); if (event.key === "Escape") setMenuOpen(false); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [goTo, next, previous]);
  useEffect(() => { if (!playing) return; const timer = window.setInterval(() => setCurrent((value) => value >= slides.length - 1 ? 0 : value + 1), 6500); return () => window.clearInterval(timer); }, [playing]);
  return <main className="deck-shell"><header className="deck-nav"><div className="brand"><span className="brand-mark"><Waves size={15} /></span><span>ARMANI</span><small>REAL-WORLD INTELLIGENCE</small></div><nav className={`slide-nav ${menuOpen ? "is-open" : ""}`} aria-label="Presentation slides">{slides.map((slide, index) => <button key={slide} onClick={() => goTo(index)} className={index === current ? "is-current" : ""} aria-label={`Go to slide ${index + 1}: ${slide}`} aria-current={index === current ? "step" : undefined}><span>0{index + 1}</span><i /><b>{slide}</b></button>)}</nav><div className="nav-controls"><span className="deck-mode">{playing ? "AUTO" : "LIVE"}</span><button className="icon-button play-toggle" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Pause autoplay" : "Play autoplay"}>{playing ? <Pause size={15} /> : <Play size={15} />}</button><span className="slide-counter">0{current + 1} <small>/ 04</small></span><button className="icon-button mobile-menu" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Close slide menu" : "Open slide menu"} aria-expanded={menuOpen}>{menuOpen ? <X size={17} /> : <Menu size={17} />}</button><button className="icon-button" onClick={previous} disabled={current === 0} aria-label="Previous slide"><ArrowLeft size={17} /></button><button className="icon-button" onClick={next} disabled={current === slides.length - 1} aria-label="Next slide"><ArrowRight size={17} /></button></div></header><div className="progress-track"><span style={{ width: `${((current + 1) / slides.length) * 100}%` }} /></div><div className="slide-viewport" aria-live="polite">{current === 0 && <SlideOne />}{current === 1 && <SlideTwo />}{current === 2 && <SlideThree />}{current === 3 && <SlideFour onRestart={() => goTo(0)} />}</div><div className="bottom-hint"><span><kbd>←</kbd><kbd>→</kbd> navigate</span><span>{playing ? "AUTOPLAY ON · 6.5 SEC" : "SPACE TO ADVANCE"}</span></div></main>;
}
