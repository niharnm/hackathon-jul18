const transcript = document.querySelector('#transcript');
const input = document.querySelector('#promptInput');
const micButton = document.querySelector('#micButton');
const sendButton = document.querySelector('#sendButton');
const status = document.querySelector('#runtimeStatus');
const contextList = document.querySelector('#contextList');
const contextCount = document.querySelector('#contextCount');
const latency = document.querySelector('#latency');

const knowledge = [
  { title: 'iPhone 19 Pro / launch offer', tag: 'PRODUCT', text: 'Northstar Wireless offers the fictional iPhone 19 Pro in graphite and starlight. Starting at $0/mo with an eligible 36-month Flex lease and qualifying trade-in. Pro Max adds $8/mo.', url: 'northstar.local/phones/iphone-19-pro' },
  { title: 'Flex Unlimited plan', tag: 'PLAN', text: 'Flex Unlimited is $75/mo for one line, $60 each for lines 2–4, with 120GB premium data, hotspot, and international texting included.', url: 'northstar.local/plans/flex-unlimited' },
  { title: 'Northstar 5G coverage map', tag: 'WEB', text: 'Northstar 5G Ultra is available across San Francisco, Oakland, and San Jose. Dense-building coverage is strongest near Market Street and the Mission.', url: 'northstar.local/coverage' },
  { title: 'Device protection & returns', tag: 'POLICY', text: 'Northstar Care is $14/mo and covers accidental damage, loss, and theft. New devices can be returned within 30 days in like-new condition.', url: 'northstar.local/support/returns' },
  { title: 'Family plan savings', tag: 'PLAN', text: 'A family of four on Flex Unlimited pays $255/mo before taxes, a $45 monthly saving compared with four individual lines.', url: 'northstar.local/plans/family' }
];

const fallbackReplies = [
  ['iphone 19 pro', 'The iPhone 19 Pro is available in graphite or starlight, starting at $0 a month with an eligible 36-month Flex lease and qualifying trade-in. The Pro Max is $8 more per month. Want me to check the best plan for you?'],
  ['coverage', 'Northstar 5G Ultra covers San Francisco, Oakland, and San Jose. In San Francisco, our strongest dense-building coverage is around Market Street and the Mission. I can also pull up the coverage map.'],
  ['family', 'For four lines, Flex Unlimited comes to $255 a month before taxes — that is $45 less than four individual lines. It includes 120GB of premium data per line, hotspot, and international texting.'],
  ['plan', 'Flex Unlimited is $75 a month for one line, or $60 each for lines two through four. You get 120GB of premium data, hotspot, and international texting.'],
  ['return', 'Northstar Care is $14 a month and covers accidental damage, loss, and theft. New devices can be returned within 30 days in like-new condition.']
];

let recognition;
let listening = false;
let messages = [];

function search(query) {
  const start = performance.now();
  const terms = query.toLowerCase().split(/\W+/).filter(Boolean);
  const results = knowledge.map(doc => ({ ...doc, score: terms.reduce((sum, term) => sum + ((doc.text + doc.title).toLowerCase().includes(term) ? 1 : 0), 0) })).filter(doc => doc.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  const elapsed = Math.max(2, Math.round(performance.now() - start));
  latency.textContent = `${elapsed}ms`;
  return results.length ? results : knowledge.slice(0, 2);
}

function renderContexts(results) {
  contextCount.textContent = `${results.length} source${results.length === 1 ? '' : 's'}`;
  contextList.innerHTML = results.map(doc => `<article class="context-card"><div class="context-top"><span class="source-tag">${doc.tag}</span><span class="score">${Math.round(78 + doc.score * 6)}%</span></div><h3>${doc.title}</h3><p>${doc.text}</p><small>↗ ${doc.url}</small></article>`).join('');
}

function addMessage(role, text) {
  const empty = transcript.querySelector('.empty-state');
  if (empty) empty.remove();
  const node = document.createElement('div');
  node.className = `message ${role}`;
  node.innerHTML = `<span class="message-label">${role === 'user' ? 'YOU' : 'NORTHSTAR'}</span><p>${text}</p>`;
  transcript.append(node);
  transcript.scrollTop = transcript.scrollHeight;
}

function localReply(query) {
  const lower = query.toLowerCase();
  const match = fallbackReplies.find(([key]) => lower.includes(key));
  return match ? match[1] : 'I can help with the fictional iPhone 19 Pro, Northstar plans, coverage, returns, and device protection. What would you like to explore?';
}

async function ask(query) {
  if (!query.trim()) return;
  input.value = '';
  addMessage('user', query);
  const results = search(query);
  renderContexts(results);
  status.textContent = 'Thinking locally…';
  sendButton.disabled = true;
  let reply;
  try {
    const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, context: results, history: messages }) });
    if (!response.ok) throw new Error('local model unavailable');
    ({ reply } = await response.json());
  } catch { reply = localReply(query); }
  messages.push({ role: 'user', content: query }, { role: 'assistant', content: reply });
  addMessage('assistant', reply);
  status.textContent = 'Ready to listen';
  sendButton.disabled = false;
  speak(reply);
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.02;
  utterance.pitch = 1.02;
  window.speechSynthesis.speak(utterance);
}

function toggleMic() {
  if (!recognition) { status.textContent = 'Text mode · speech unavailable'; input.focus(); return; }
  listening ? recognition.stop() : recognition.start();
}

if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US'; recognition.interimResults = false; recognition.continuous = false;
  recognition.onstart = () => { listening = true; micButton.classList.add('active'); status.textContent = 'Listening…'; };
  recognition.onend = () => { listening = false; micButton.classList.remove('active'); if (status.textContent === 'Listening…') status.textContent = 'Ready to listen'; };
  recognition.onresult = event => ask(event.results[0][0].transcript);
  recognition.onerror = () => { listening = false; micButton.classList.remove('active'); status.textContent = 'Couldn’t hear that — try again'; };
}

micButton.addEventListener('click', toggleMic);
sendButton.addEventListener('click', () => ask(input.value));
input.addEventListener('keydown', event => { if (event.key === 'Enter') ask(input.value); });
document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => ask(button.dataset.prompt)));
document.addEventListener('keydown', event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); input.focus(); } });
setInterval(() => { document.querySelector('#clock').textContent = new Date().toLocaleTimeString([], { hour12: false }); }, 1000);
