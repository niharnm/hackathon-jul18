# Armani Voice

A small, voice-only live-web assistant. The browser handles speech input, ElevenLabs provides the voice, Bright Data retrieves current web results, Moss retrieves useful context, and Groq routes requests and writes the spoken answer. Casual conversation stays conversational instead of triggering a search. There is no chat box or visible transcript.

## Run

Use Python 3.10 or newer.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
set -a; source .env; set +a
uvicorn app:app --reload
```

Open `http://127.0.0.1:8000`, allow microphone access, and tap the microphone.

Secrets remain in the git-ignored `.env`. The server sends only the final spoken answer to the browser.
