from datetime import datetime

from telethon.errors import ChatAdminRequiredError
from telethon.tl.types import User as TLUser

from .models import ScrapedMember, ScrapeJob
from .telegram_manager import TelegramNotConnectedError, get_or_create_client

BATCH_SIZE = 500


async def run_scrape_job(job_id: int, user_id: int, target: str, aggressive: bool, db_factory):
    db = db_factory()
    try:
        job = db.query(ScrapeJob).filter_by(id=job_id).first()
        try:
            client = await get_or_create_client(user_id, db)
        except TelegramNotConnectedError as e:
            job.status = "error"
            job.error_message = str(e)
            db.commit()
            return

        job.status = "running"
        db.commit()

        try:
            entity = await client.get_entity(target)
        except (ValueError, TypeError):
            job.status = "error"
            job.error_message = (
                f"Could not resolve '{target}'. Make sure you're a member and the "
                "username or link is correct."
            )
            db.commit()
            return

        batch: list[ScrapedMember] = []
        total = 0
        try:
            async for user in client.iter_participants(entity, aggressive=aggressive):
                if not isinstance(user, TLUser):
                    continue
                batch.append(
                    ScrapedMember(
                        job_id=job_id,
                        tg_user_id=user.id,
                        username=user.username,
                        first_name=user.first_name,
                        last_name=user.last_name,
                        phone=user.phone,
                        is_bot=bool(user.bot),
                        is_deleted=bool(user.deleted),
                        premium=bool(getattr(user, "premium", False)),
                        access_hash=user.access_hash,
                    )
                )
                total += 1
                if len(batch) >= BATCH_SIZE:
                    db.bulk_save_objects(batch)
                    db.commit()
                    job.total_count = total
                    db.commit()
                    batch = []
        except ChatAdminRequiredError:
            if batch:
                db.bulk_save_objects(batch)
                db.commit()
            job.status = "error"
            job.error_message = "Admin rights are required to list this group's full members."
            job.total_count = total
            db.commit()
            return

        if batch:
            db.bulk_save_objects(batch)
            db.commit()

        job.total_count = total
        job.status = "done"
        job.completed_at = datetime.utcnow()
        db.commit()
    except Exception as e:
        job = db.query(ScrapeJob).filter_by(id=job_id).first()
        if job:
            job.status = "error"
            job.error_message = str(e)[:500]
            db.commit()
    finally:
        db.close()
