import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 4173);
const model = process.env.LOCAL_MODEL || 'llama3.2';
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json' };

function json(res, status, body) { res.writeHead(status, {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'}); res.end(JSON.stringify(body)); }
function body(req) { return new Promise((resolve, reject) => { let data=''; req.on('data', chunk => data += chunk); req.on('end', () => resolve(JSON.parse(data || '{}'))); req.on('error', reject); }); }

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/chat') {
      const { query, context = [], history = [] } = await body(req);
      const ollama = process.env.OLLAMA_URL || 'http://127.0.0.1:11434/api/chat';
      const system = `You are Northstar, a concise, warm voice sales concierge for a fictional wireless carrier. Never claim the carrier or iPhone 19 Pro is real. Use only the supplied context for facts. Answer in 2-4 spoken sentences. Context:\n${context.map(c => `- ${c.title}: ${c.text}`).join('\n')}`;
      try {
        const upstream = await fetch(ollama, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ model, stream:false, messages:[{role:'system',content:system}, ...history.slice(-6), {role:'user',content:query}] }) });
        if (!upstream.ok) throw new Error('model unavailable');
        const data = await upstream.json();
        return json(res, 200, { reply: data.message?.content || '' });
      } catch { return json(res, 503, { error:'Local model unavailable' }); }
    }
    const safe = normalize((req.url || '/').split('?')[0] === '/' ? 'index.html' : (req.url || '').split('?')[0]).replace(/^\/+/, '').replace(/^\.\.(\/|\\)/, '');
    const file = await readFile(join(root, safe));
    res.writeHead(200, {'Content-Type': mime[extname(safe)] || 'text/plain'}); res.end(file);
  } catch { json(res, 404, { error:'Not found' }); }
});
server.listen(port, () => console.log(`Northstar running at http://localhost:${port} · model ${model}`));
