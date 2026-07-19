import os
from pathlib import Path
from urllib.parse import quote_plus

import httpx
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel


ROOT = Path(__file__).parent
INDEX_NAME = "armani-live-web"


app = FastAPI(title="Armani Voice")
app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")


class VoiceQuery(BaseModel):
    query: str


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
                            "You are Armani, a voice-only live web assistant. Answer in two to four "
                            "natural spoken sentences. Use the Moss-retrieved live web context. "
                            "If the context is inconclusive, say so. Never mention chat or a transcript."
                        ),
                    },
                    {"role": "user", "content": f"Question: {query}\n\nLive context:\n{context}"},
                ],
            },
        )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"].strip()


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
        source_url, page_text = await scrape_search_page(query)
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
