from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .routers import auth_router, scraper_router, sender_router, telegram_router

app = FastAPI(title="Telegram Scraper & Bulk Messenger")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth_router.router)
app.include_router(telegram_router.router)
app.include_router(scraper_router.router)
app.include_router(sender_router.router)
