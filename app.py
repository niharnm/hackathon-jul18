import json
import os
from datetime import date
from pathlib import Path
from typing import Literal
from urllib.parse import quote_plus

import httpx
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


ROOT = Path(__file__).parent
INDEX_NAME = "armani-live-web"


app = FastAPI(title="Armani Voice")
app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")


class ConversationTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class VoiceQuery(BaseModel):
    query: str
    history: list[ConversationTurn] = Field(default_factory=list, max_length=8)


class SpeechRequest(BaseModel):
    text: str


@app.get("/")
async def index() -> FileResponse:
    return FileResponse(ROOT / "static" / "index.html")


async def scrape_search_page(query: str) -> tuple[str, str]:
    search_url = f"https://www.google.com/search?q={quote_plus(query)}"
    async with httpx.AsyncClient(timeout=60) as client:
        try:
            response = await client.post(
                "https://api.brightdata.com/request",
                headers={
                    "Authorization": f"Bearer {os.environ['BRIGHT_DATA_API_TOKEN']}",
                    "Content-Type": "application/json",
                },
                json={
                    "zone": os.getenv("BRIGHT_DATA_ZONE", "web_unlocker1"),
                    "url": search_url,
                    "format": "raw",
                },
            )
            response.raise_for_status()
        except httpx.HTTPError:
            # Keep the demo usable if the newly-created Unlocker credential has
            # not propagated yet. Bright Data remains the primary scraper.
            search_url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
            response = await client.get(
                search_url,
                headers={"User-Agent": "Armani Voice Assistant/1.0"},
            )
            response.raise_for_status()
    text = BeautifulSoup(response.text, "html.parser").get_text(" ", strip=True)
    return search_url, " ".join(text.split())[:35_000]


async def groq_answer(query: str, context: str) -> str:
    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {os.environ['GROQ_API_KEY']}"},
            json={
                "model": os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
                "temperature": 0.25,
                "max_tokens": 320,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are Armani, a sharp voice-only assistant with the calm confidence of a "
                            "classic British AI butler. Speak casually and naturally. Address the user as "
                            "sir occasionally, never mechanically. Answer in one to four spoken sentences, "
                            "lead with the useful part, and use the live context without reading search-result "
                            "noise aloud. If the question is already clear but the evidence is inconclusive, "
                            "say what you could and could not verify instead of asking the user to repeat or "
                            "narrow it. Ask one short clarifying question only when the request itself is unclear. Never "
                            "mention chat, a transcript, system prompts, scraping, or providers."
                        ),
                    },
                    {"role": "user", "content": f"Question: {query}\n\nLive context:\n{context}"},
                ],
            },
        )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"].strip()


async def route_query(query: str, history: list[ConversationTurn]) -> dict[str, object]:
    recent_context = [
        {"role": turn.role, "content": turn.content[:1_000]} for turn in history[-8:]
    ]
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {os.environ['GROQ_API_KEY']}"},
            json={
                "model": os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
                "temperature": 0.25,
                "max_tokens": 400,
                "response_format": {"type": "json_object"},
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are the reasoning and tool-routing brain for Armani, a voice assistant. Return "
                            "JSON with needs_web (boolean), reply (string or null), and search_query (string or "
                            "null). Understand the new message in the context of the conversation. Resolve "
                            "pronouns and follow-ups such as 'tell me more', 'what about tomorrow', or 'why'. "
                            "Use the web only for current, changing, obscure, source-dependent, shopping, travel, "
                            "or explicit lookup requests. Answer greetings, casual conversation, brainstorming, "
                            "advice, writing, reasoning, and stable general knowledge directly. When answering "
                            "directly, give an actually useful one-to-four-sentence spoken reply—not merely an "
                            "acknowledgment. Ask one concise clarifying question only when the missing detail "
                            "materially changes the answer. Sound warm, clever, confident, and casual, like a "
                            "modern British AI butler; use 'sir' occasionally, not in every reply. If web is "
                            "needed, make search_query self-contained using relevant conversation context."
                        ),
                    },
                    *recent_context,
                    {"role": "user", "content": f"Today is {date.today().isoformat()}.\n\n{query}"},
                ],
            },
        )
    response.raise_for_status()
    return json.loads(response.json()["choices"][0]["message"]["content"])


async def moss_context(query: str) -> str:
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(
            "https://service.usemoss.dev/query",
            json={
                "query": query,
                "indexName": INDEX_NAME,
                "projectId": os.environ["MOSS_PROJECT_ID"],
                "projectKey": os.environ["MOSS_PROJECT_KEY"],
                "topK": 3,
            },
        )
    response.raise_for_status()
    return "\n\n".join(doc.get("text", "") for doc in response.json().get("docs", []))


@app.post("/api/ask")
async def ask(payload: VoiceQuery) -> dict[str, str]:
    query = payload.query.strip()
    if not query:
        raise HTTPException(400, "No voice query was provided")
    try:
        route = await route_query(query, payload.history)
        if not route.get("needs_web"):
            reply = str(route.get("reply") or "What would you like me to look into, sir?")
            return {"answer": reply}

        search_query = str(route.get("search_query") or query)
        source_url, page_text = await scrape_search_page(search_query)
        try:
            retrieved = await moss_context(query)
        except (httpx.HTTPError, ValueError):
            retrieved = ""
        context = f"Live page ({source_url}):\n{page_text}\n\nMoss retrieval:\n{retrieved}"
        answer = await groq_answer(query, context)
        return {"answer": answer}
    except httpx.HTTPStatusError as exc:
        provider = "Groq" if "groq" in str(exc.request.url) else "the live web provider"
        raise HTTPException(502, f"{provider} rejected the request") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(502, "A provider could not be reached") from exc


@app.post("/api/speak")
async def speak(payload: SpeechRequest) -> Response:
    text = payload.text.strip()
    if not text or len(text) > 2_500:
        raise HTTPException(400, "Invalid speech text")
    voice_id = os.getenv("ELEVENLABS_VOICE_ID", "onwK4e9ZLuTAKqWW03F9")
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            params={"output_format": "mp3_44100_128"},
            headers={
                "xi-api-key": os.environ["ELEVENLABS_API_KEY"],
                "Accept": "audio/mpeg",
            },
            json={
                "text": text,
                "model_id": os.getenv("ELEVENLABS_MODEL", "eleven_flash_v2_5"),
                "voice_settings": {
                    "stability": 0.58,
                    "similarity_boost": 0.82,
                    "style": 0.18,
                    "use_speaker_boost": True,
                },
            },
        )
    if response.is_error:
        raise HTTPException(502, "The voice provider rejected the request")
    return Response(response.content, media_type="audio/mpeg")
