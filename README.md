# Northstar voice agent lab

A Next.js fictional Northstar Wireless sales concierge for the Moss hackathon. It combines browser-native speech recognition/synthesis with Moss retrieval and your local Ollama model.

## Run it

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:4173`. Voice input works in browsers that expose `SpeechRecognition` (Chrome is the easiest test target). Without Ollama, the app uses a deterministic demo response so the interaction is still fully testable.

## Local model

Start Ollama and pull a model, then run the app:

```bash
ollama pull llama3.1:latest
npm run dev
```

The app defaults to `llama3.1:latest`, a strong general conversational choice from the models available locally. `qwen2.5vl` is better reserved for image-aware prompts; `gemma4:e2b-it-qat` is a lighter alternative. Ollama generates the assistant text; browser-native speech synthesis provides TTS in this demo.

Use `LOCAL_MODEL` to select another Ollama model and `OLLAMA_URL` to point at a compatible endpoint. The Next.js route keeps the model call off the browser and injects only retrieved context into the system prompt.

## Moss

Set `MOSS_PROJECT_ID`, `MOSS_PROJECT_KEY`, and `MOSS_INDEX_ID` in `.env.local`. The `/api/chat` route loads or creates the Northstar index once, then calls `client.query(index, query, { topK: 3 })`. If Moss is unavailable, the route falls back to the bundled catalog so the demo remains usable. Keep project credentials server-side.

Northstar Wireless, its products, coverage, and offers are fictional.
