from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .database import engine, Base, SessionLocal
from . import models, crud
from .auth import hash_password
from .routers import auth_router, users_router, admin_router, trading_router, subscriptions_router
import json
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_database():
    db = SessionLocal()
    try:
        # Seed admin user
        admin = crud.get_user_by_email(db, "admin@forexpredictbot.com")
        if not admin:
            from . import schemas
            admin = crud.create_user(db, schemas.UserCreate(
                email="admin@forexpredictbot.com",
                name="Admin",
                password="Admin@2024!",
            ))
            admin.role = "admin"
            db.commit()
            logger.info("Admin user created: admin@forexpredictbot.com / Admin@2024!")

        # Seed subscription plans
        existing_plans = db.query(models.Subscription).count()
        if existing_plans == 0:
            plans = [
                {
                    "name": "Free",
                    "price_monthly": 0.0,
                    "price_yearly": 0.0,
                    "features": json.dumps([
                        "5 analyses per day",
                        "Basic indicators",
                        "Forex & Crypto markets",
                        "Email support",
                    ]),
                    "max_analyses_per_day": 5,
                    "has_ai_chat": False,
                    "has_advanced_indicators": False,
                    "is_active": True,
                },
                {
                    "name": "Pro",
                    "price_monthly": 19.99,
                    "price_yearly": 199.0,
                    "features": json.dumps([
                        "Unlimited analyses",
                        "AI chat assistant",
                        "All technical indicators",
                        "All markets",
                        "Priority email support",
                        "Trade history export",
                    ]),
                    "max_analyses_per_day": -1,
                    "has_ai_chat": True,
                    "has_advanced_indicators": True,
                    "is_active": True,
                },
                {
                    "name": "Elite",
                    "price_monthly": 49.99,
                    "price_yearly": 499.0,
                    "features": json.dumps([
                        "Everything in Pro",
                        "Priority support",
                        "Advanced ML signals",
                        "Custom alerts",
                        "API access",
                        "Dedicated account manager",
                    ]),
                    "max_analyses_per_day": -1,
                    "has_ai_chat": True,
                    "has_advanced_indicators": True,
                    "is_active": True,
                },
            ]
            for plan_data in plans:
                db.add(models.Subscription(**plan_data))
            db.commit()
            logger.info("Subscription plans seeded")

        # Seed default settings
        settings = [
            ("site_name", "ForexPredictBot AI", "Application name"),
            ("site_tagline", "Precision Trading Intelligence", "Tagline"),
            ("contact_email", "admin@forexpredictbot.com", "Contact email"),
            ("maintenance_mode", "false", "Maintenance mode"),
            ("registration_open", "true", "Allow new registrations"),
            ("default_daily_limit", "5", "Default daily analysis limit"),
        ]
        for key, value, desc in settings:
            existing = crud.get_setting(db, key)
            if not existing:
                crud.upsert_setting(db, key, value, desc)

        # Give admin a free subscription if none
        admin_sub = crud.get_user_subscription(db, admin.id)
        if not admin_sub:
            free_plan = db.query(models.Subscription).filter_by(name="Free").first()
            if free_plan:
                crud.create_user_subscription(db, admin.id, free_plan.id, "monthly")

        logger.info("Database seeded successfully")
    except Exception as e:
        logger.error(f"Seeding error: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield


app = FastAPI(title="ForexPredictBot AI", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api/auth", tags=["auth"])
app.include_router(users_router.router, prefix="/api/users", tags=["users"])
app.include_router(admin_router.router, prefix="/api/admin", tags=["admin"])
app.include_router(trading_router.router, prefix="/api/trading", tags=["trading"])
app.include_router(subscriptions_router.router, prefix="/api/subscriptions", tags=["subscriptions"])


@app.get("/")
def root():
    return {"message": "ForexPredictBot AI API", "version": "1.0.0", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
