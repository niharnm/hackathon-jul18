export type KnowledgeDoc = { id: string; title: string; tag: string; text: string; url: string };

export const knowledge: KnowledgeDoc[] = [
  { id: "iphone-19-pro", title: "iPhone 19 Pro / launch offer", tag: "PRODUCT", text: "Northstar Wireless offers the fictional iPhone 19 Pro in graphite and starlight. Starting at $0/mo with an eligible 36-month Flex lease and qualifying trade-in. Pro Max adds $8/mo.", url: "northstar.local/phones/iphone-19-pro" },
  { id: "flex-unlimited", title: "Flex Unlimited plan", tag: "PLAN", text: "Flex Unlimited is $75/mo for one line, $60 each for lines 2–4, with 120GB premium data, hotspot, and international texting included.", url: "northstar.local/plans/flex-unlimited" },
  { id: "coverage", title: "Northstar 5G coverage map", tag: "WEB", text: "Northstar 5G Ultra is available across San Francisco, Oakland, and San Jose. Dense-building coverage is strongest near Market Street and the Mission.", url: "northstar.local/coverage" },
  { id: "care-returns", title: "Device protection & returns", tag: "POLICY", text: "Northstar Care is $14/mo and covers accidental damage, loss, and theft. New devices can be returned within 30 days in like-new condition.", url: "northstar.local/support/returns" },
  { id: "family", title: "Family plan savings", tag: "PLAN", text: "A family of four on Flex Unlimited pays $255/mo before taxes, a $45 monthly saving compared with four individual lines.", url: "northstar.local/plans/family" },
];

export function localSearch(query: string) {
  const start = performance.now();
  const terms = query.toLowerCase().split(/\W+/).filter(Boolean);
  const results = knowledge.map((doc) => ({ ...doc, score: terms.reduce((sum, term) => sum + ((doc.text + doc.title).toLowerCase().includes(term) ? 1 : 0), 0) })).filter((doc) => doc.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  return { results: results.length ? results : knowledge.slice(0, 2), elapsed: Math.max(2, Math.round(performance.now() - start)) };
}
