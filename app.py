import hashlib
import os
from contextlib import asynccontextmanager
from pathlib import Path
from urllib.parse import quote_plus

import httpx
from bs4 import BeautifulSoup
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from moss import DocumentInfo, MossClient, QueryOptions
from pydantic import BaseModel


ROOT = Path(__file__).parent
INDEX_NAME = "armani-live-web"


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.moss = MossClient(
        os.environ["MOSS_PROJECT_ID"], os.environ["MOSS_PROJECT_KEY"]
    )
    indexes = await app.state.moss.list_indexes()
    if not any(index.name == INDEX_NAME for index in indexes):
        await app.state.moss.create_index(
            INDEX_NAME,
            [DocumentInfo(id="welcome", text="Armani is a voice-only live web assistant.")],
        )
    yield


app = FastAPI(title="Armani Voice", lifespan=lifespan)
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


@app.post("/api/ask")
async def ask(payload: VoiceQuery) -> dict[str, str]:
    query = payload.query.strip()
    if not query:
        raise HTTPException(400, "No voice query was provided")
    try:
        source_url, page_text = await scrape_search_page(query)
        doc_id = hashlib.sha256(query.encode()).hexdigest()[:24]
        await app.state.moss.add_docs(
            INDEX_NAME,
            [DocumentInfo(id=doc_id, text=page_text, metadata={"source": source_url})],
        )
        try:
            results = await app.state.moss.query(
                INDEX_NAME, query, QueryOptions(top_k=3, alpha=0.7)
            )
            context = "\n\n".join(doc.text for doc in results.docs)
        except Exception:
            # Moss can briefly return 503 while a just-updated index is rebuilt.
            # The page is already stored in Moss, so answer from that same source.
            context = page_text
        answer = await groq_answer(query, context)
        return {"answer": answer}
    except httpx.HTTPStatusError as exc:
        provider = "Groq" if "groq" in str(exc.request.url) else "the live web provider"
        raise HTTPException(502, f"{provider} rejected the request") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(502, "A provider could not be reached") from exc
