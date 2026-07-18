import { NextResponse } from "next/server";
import { knowledge, localSearch, type KnowledgeDoc } from "../../../lib/knowledge";

export const runtime = "nodejs";
type MossClient = import("@moss-dev/moss").MossClient;
let mossClient: MossClient | null = null;
let mossIndexReady = false;

async function mossSearch(query: string): Promise<{ results: KnowledgeDoc[]; elapsed: number }> {
  const projectId = process.env.MOSS_PROJECT_ID;
  const projectKey = process.env.MOSS_PROJECT_KEY;
  if (!projectId || !projectKey || projectId === "your-project-id") return localSearch(query);
  const started = performance.now();
  const { MossClient } = await import("@moss-dev/moss");
  mossClient ??= new MossClient(projectId, projectKey);
  const indexId = process.env.MOSS_INDEX_ID || "northstar-wireless";
  try {
    if (!mossIndexReady) {
      try { await mossClient.loadIndex(indexId); }
      catch { await mossClient.createIndex(indexId, knowledge.map(({ id, text }) => ({ id, text }))); await mossClient.loadIndex(indexId); }
      mossIndexReady = true;
    }
    const response = await mossClient.query(indexId, query, { topK: 3 });
    const byText = new Map(knowledge.map((doc) => [doc.text, doc]));
    const results = response.docs.map((doc) => byText.get(doc.text)).filter((doc): doc is KnowledgeDoc => Boolean(doc));
    return { results: results.length ? results : localSearch(query).results, elapsed: Math.max(1, Math.round(performance.now() - started)) };
  } catch { return localSearch(query); }
}

const fallbackReplies: Array<[string, string]> = [
  ["iphone 19 pro", "The iPhone 19 Pro is available in graphite or starlight, starting at $0 a month with an eligible 36-month Flex lease and qualifying trade-in. The Pro Max is $8 more per month. Want me to check the best plan for you?"],
  ["coverage", "Northstar 5G Ultra covers San Francisco, Oakland, and San Jose. In San Francisco, our strongest dense-building coverage is around Market Street and the Mission. I can also pull up the coverage map."],
  ["family", "For four lines, Flex Unlimited comes to $255 a month before taxes — that is $45 less than four individual lines. It includes 120GB of premium data per line, hotspot, and international texting."],
  ["plan", "Flex Unlimited is $75 a month for one line, or $60 each for lines two through four. You get 120GB of premium data, hotspot, and international texting."],
  ["return", "Northstar Care is $14 a month and covers accidental damage, loss, and theft. New devices can be returned within 30 days in like-new condition."],
];

function fallbackReply(query: string) { const lower = query.toLowerCase(); return fallbackReplies.find(([key]) => lower.includes(key))?.[1] ?? "I can help with the fictional iPhone 19 Pro, Northstar plans, coverage, returns, and device protection. What would you like to explore?"; }

export async function POST(request: Request) {
  const { query, history = [] } = await request.json();
  if (!query?.trim()) return NextResponse.json({ error: "A query is required" }, { status: 400 });
  const retrieval = await mossSearch(query);
  const context = retrieval.results.map((doc) => `- ${doc.title}: ${doc.text}`).join("\n");
  const model = process.env.LOCAL_MODEL || "llama3.1:latest";
  let reply = fallbackReply(query); let modelStatus = "demo fallback";
  try {
    const response = await fetch(process.env.OLLAMA_URL || "http://127.0.0.1:11434/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model, stream: false, messages: [{ role: "system", content: `You are Northstar, a concise, warm voice sales concierge for a fictional wireless carrier. Never claim the carrier or iPhone 19 Pro is real. Use only the supplied context. Answer in 2–4 spoken sentences. Context:\n${context}` }, ...history.slice(-6), { role: "user", content: query }] }), signal: AbortSignal.timeout(30_000) });
    if (response.ok) { const data = await response.json(); reply = data.message?.content || reply; modelStatus = model; }
  } catch { /* The deterministic response keeps the demo usable without Ollama. */ }
  return NextResponse.json({ reply, sources: retrieval.results, retrievalMs: retrieval.elapsed, model: modelStatus });
}
