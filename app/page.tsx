"use client";

import { useEffect, useRef, useState } from "react";
import type { KnowledgeDoc } from "../lib/knowledge";

type Message = { role: "user" | "assistant"; content: string };
type Recognition = new () => { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void; onstart: (() => void) | null; onend: (() => void) | null; onerror: (() => void) | null; onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sources, setSources] = useState<KnowledgeDoc[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("Ready to listen");
  const [model, setModel] = useState("llama3.1:latest");
  const [retrievalMs, setRetrievalMs] = useState("<10ms");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<InstanceType<Recognition> | null>(null);

  useEffect(() => {
    const browser = window as Window & { SpeechRecognition?: Recognition; webkitSpeechRecognition?: Recognition };
    const SpeechRecognition = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition(); recognition.lang = "en-US"; recognition.interimResults = false; recognition.continuous = false;
    recognition.onstart = () => { setListening(true); setStatus("Listening…"); };
    recognition.onend = () => { setListening(false); setStatus("Ready to listen"); };
    recognition.onerror = () => { setListening(false); setStatus("Couldn’t hear that — try again"); };
    recognition.onresult = (event) => ask(event.results[0][0].transcript);
    recognitionRef.current = recognition;
  }, []);

  function speak(text: string) { if (!("speechSynthesis" in window)) return; window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.rate = 1.02; utterance.pitch = 1.02; window.speechSynthesis.speak(utterance); }

  async function ask(query: string) {
    if (!query.trim()) return; const nextMessage = { role: "user" as const, content: query }; setInput(""); setMessages((current) => [...current, nextMessage]); setStatus("Searching locally…");
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, history: messages }) });
      const data = await response.json(); setSources(data.sources || []); setRetrievalMs(`${data.retrievalMs || 2}ms`); setModel(data.model || "llama3.1:latest"); setMessages((current) => [...current, { role: "assistant", content: data.reply }]); setStatus("Ready to listen"); speak(data.reply);
    } catch { setStatus("Connection error — try again"); }
  }

  function toggleMic() { if (!recognitionRef.current) { setStatus("Text mode · speech unavailable"); document.querySelector<HTMLInputElement>("#prompt")?.focus(); return; } if (listening) recognitionRef.current.stop(); else recognitionRef.current.start(); }

  return <div className="shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">✦</span><span>northstar</span><span className="beta">LAB</span></div><div className="topbar-meta"><span className="live-dot" /> LOCAL RUNTIME <span className="divider" /> {new Date().toLocaleTimeString([], { hour12: false })}</div></header>
    <main className="workspace">
      <section className="hero"><div className="eyebrow">VOICE AGENT / CALL INFRASTRUCTURE</div><h1>Make the call<br /><em>feel human.</em></h1><p className="hero-copy">A low-latency sales concierge for Northstar Wireless. Ask about the fictional iPhone 19 Pro lineup, coverage, or a plan — out loud or by text.</p><div className="status-row"><span className="status-pill"><i />{status}</span><span className="latency">retrieval <strong>{retrievalMs}</strong></span></div></section>
      <section className="agent-card"><div className="agent-head"><div><span className="label">NORTHSTAR CONCIERGE</span><h2>What can I find for you?</h2></div><div className="orb-wrap"><div className="orb"><span /></div><div className="orb-ring" /></div></div><div className="transcript">{messages.length === 0 ? <div className="empty-state"><div className="waveform">{[1,2,3,4,5,6,7].map((item) => <b key={item} />)}</div><p>Tap the microphone to start a conversation</p><small>Your voice stays on this device</small></div> : messages.map((message, index) => <div className={`message ${message.role}`} key={`${message.role}-${index}`}><span className="message-label">{message.role === "user" ? "YOU" : "NORTHSTAR"}</span><p>{message.content}</p></div>)}</div><div className="suggestions">{["Tell me about the iPhone 19 Pro offer", "What is the coverage like in San Francisco?", "Which plan is best for a family of four?"].map((prompt) => <button key={prompt} onClick={() => ask(prompt)}>{prompt.replace("Tell me about the ", "").replace("What is the ", "").replace("Which plan is best for a ", "")} <span>↗</span></button>)}</div><div className="composer"><button className={`mic ${listening ? "active" : ""}`} onClick={toggleMic} aria-label="Start voice conversation"><span>●</span></button><input id="prompt" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && ask(input)} placeholder="Or type what you want to know..." autoComplete="off" /><button className="send" onClick={() => ask(input)} aria-label="Send message">↗</button></div><div className="agent-foot"><span><span className="key">⌘</span> <span className="key">K</span> to focus</span><span>Ollama + Moss retrieval</span></div></section>
      <aside className="side-panel"><div className="panel-head"><span className="label">LIVE CONTEXT</span><span className="context-count">{sources.length} sources</span></div><div className="context-list">{sources.length === 0 ? <div className="context-empty">Sources appear here<br />as the agent researches.</div> : sources.map((source) => <article className="context-card" key={source.id}><div className="context-top"><span className="source-tag">{source.tag}</span><span className="score">MOSS</span></div><h3>{source.title}</h3><p>{source.text}</p><small>↗ {source.url}</small></article>)}</div><div className="infra"><div className="panel-head"><span className="label">CALL INFRASTRUCTURE</span><span className="green">● online</span></div><div className="infra-row"><span>Speech input</span><strong>Web Speech API</strong></div><div className="infra-row"><span>Retrieval</span><strong>Moss server-side</strong></div><div className="infra-row"><span>Model</span><strong>{model}</strong></div><div className="infra-row"><span>Voice output</span><strong>Browser native</strong></div></div></aside>
    </main><footer><span>Northstar Wireless is a fictional carrier for demo purposes.</span><span>Next.js / v0.2</span></footer>
  </div>;
}
