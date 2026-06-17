from datetime import datetime

from sqlalchemy.orm import Session

from . import models


def get_user_by_email(db: Session, email: str) -> models.User | None:
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, email: str, name: str, password_hash: str) -> models.User:
    user = models.User(email=email, name=name, password_hash=password_hash)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def touch_last_login(db: Session, user: models.User) -> None:
    user.last_login = datetime.utcnow()
    db.commit()


def get_telegram_session(db: Session, user_id: int) -> models.TelegramSession | None:
    return (
        db.query(models.TelegramSession)
        .filter(models.TelegramSession.user_id == user_id)
        .first()
    )


def get_scrape_job(db: Session, job_id: int, user_id: int) -> models.ScrapeJob | None:
    return (
        db.query(models.ScrapeJob)
        .filter(models.ScrapeJob.id == job_id, models.ScrapeJob.user_id == user_id)
        .first()
    )


def get_campaign(db: Session, campaign_id: int, user_id: int) -> models.SendCampaign | None:
    return (
        db.query(models.SendCampaign)
        .filter(
            models.SendCampaign.id == campaign_id,
            models.SendCampaign.user_id == user_id,
        )
        .first()
    )
