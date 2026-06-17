from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "tt_users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    session = relationship(
        "TelegramSession", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    scrape_jobs = relationship("ScrapeJob", back_populates="user", cascade="all, delete-orphan")
    campaigns = relationship("SendCampaign", back_populates="user", cascade="all, delete-orphan")


class TelegramSession(Base):
    __tablename__ = "tt_telegram_sessions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("tt_users.id"), unique=True, nullable=False)
    api_id = Column(Integer, nullable=False)
    api_hash = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    session_string = Column(Text, nullable=True)
    tg_user_id = Column(BigInteger, nullable=True)
    tg_username = Column(String, nullable=True)
    tg_first_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="session")


class ScrapeJob(Base):
    __tablename__ = "tt_scrape_jobs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("tt_users.id"), nullable=False)
    target = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending|running|done|error
    total_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="scrape_jobs")
    members = relationship(
        "ScrapedMember", back_populates="job", cascade="all, delete-orphan"
    )


class ScrapedMember(Base):
    __tablename__ = "tt_scraped_members"

    id = Column(Integer, primary_key=True)
    job_id = Column(Integer, ForeignKey("tt_scrape_jobs.id"), nullable=False)
    tg_user_id = Column(BigInteger, nullable=False)
    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    is_bot = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    premium = Column(Boolean, default=False)
    access_hash = Column(BigInteger, nullable=True)

    job = relationship("ScrapeJob", back_populates="members")


class SendCampaign(Base):
    __tablename__ = "tt_send_campaigns"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("tt_users.id"), nullable=False)
    name = Column(String, nullable=False)
    message_text = Column(Text, nullable=False)
    delay_seconds = Column(Float, default=3.0)
    status = Column(String, default="pending")  # pending|running|paused|done|stopped|error
    total = Column(Integer, default=0)
    sent = Column(Integer, default=0)
    failed = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="campaigns")
    recipients = relationship(
        "CampaignRecipient", back_populates="campaign", cascade="all, delete-orphan"
    )


class CampaignRecipient(Base):
    __tablename__ = "tt_campaign_recipients"

    id = Column(Integer, primary_key=True)
    campaign_id = Column(Integer, ForeignKey("tt_send_campaigns.id"), nullable=False)
    tg_user_id = Column(BigInteger, nullable=False)
    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    access_hash = Column(BigInteger, nullable=True)
    status = Column(String, default="pending")  # pending|sent|failed|skipped
    error_msg = Column(String, nullable=True)
    sent_at = Column(DateTime, nullable=True)

    campaign = relationship("SendCampaign", back_populates="recipients")
