# Northstar voice agent lab

A fictional Northstar Wireless sales concierge for the Moss hackathon. It combines browser-native speech recognition/synthesis with a fast local retrieval step and an optional Ollama-compatible local model.

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:4173`. Voice input works in browsers that expose `SpeechRecognition` (Chrome is the easiest test target). Without Ollama, the app uses a deterministic demo response so the interaction is still fully testable.

## Connect a local model

Start Ollama and pull a model, then run the app:

```bash
ollama pull llama3.2
npm run dev
```

Use `LOCAL_MODEL` to select another Ollama model and `OLLAMA_URL` to point at a compatible endpoint. The server keeps the model call off the browser and injects only the retrieved context into the system prompt.

## Moss path

The package includes `@moss-dev/moss` for the production retrieval upgrade. The demo’s `search()` function is intentionally local and dependency-free so the voice loop works immediately. To move to Moss Cloud, create an index with the documents in `src/main.js`, load it once at startup, and replace `search()` with `client.query(index, query, { topK: 3 })`; Moss’s TypeScript SDK returns `docs` and `timeTakenInMs` for the live context panel. Keep project credentials server-side.

Northstar Wireless, its products, coverage, and offers are fictional.
