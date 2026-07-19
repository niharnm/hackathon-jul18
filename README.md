# Armani Voice

A small, voice-only live-web assistant. The browser handles speech input/output, Bright Data retrieves current web results, Moss indexes and retrieves the useful context, and Groq writes the spoken answer. There is no chat box or visible transcript.

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
