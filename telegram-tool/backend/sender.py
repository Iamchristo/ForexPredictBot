import asyncio
from datetime import datetime

from telethon.errors import (
    FloodWaitError,
    InputUserDeactivatedError,
    PeerIdInvalidError,
    UserPrivacyRestrictedError,
)
from telethon.tl.types import InputPeerUser

from .models import CampaignRecipient, SendCampaign
from .telegram_manager import TelegramNotConnectedError, clear_stop_event, get_or_create_client


async def run_campaign(campaign_id: int, user_id: int, db_factory, stop_event: asyncio.Event):
    db = db_factory()
    try:
        campaign = db.query(SendCampaign).filter_by(id=campaign_id).first()
        try:
            client = await get_or_create_client(user_id, db)
        except TelegramNotConnectedError as e:
            campaign.status = "error"
            db.commit()
            return

        campaign.status = "running"
        campaign.started_at = datetime.utcnow()
        db.commit()

        recipients = (
            db.query(CampaignRecipient)
            .filter_by(campaign_id=campaign_id, status="pending")
            .all()
        )

        for recipient in recipients:
            if stop_event.is_set():
                campaign.status = "stopped"
                db.commit()
                return

            try:
                peer = InputPeerUser(recipient.tg_user_id, recipient.access_hash or 0)
                await client.send_message(peer, campaign.message_text)
                recipient.status = "sent"
                recipient.sent_at = datetime.utcnow()
                campaign.sent += 1
            except FloodWaitError as e:
                campaign.status = "paused"
                db.commit()
                wait_seconds = e.seconds + 5
                elapsed = 0
                while elapsed < wait_seconds:
                    if stop_event.is_set():
                        campaign.status = "stopped"
                        db.commit()
                        return
                    await asyncio.sleep(1)
                    elapsed += 1
                campaign.status = "running"
                # Retry this recipient once after the flood wait clears.
                try:
                    peer = InputPeerUser(recipient.tg_user_id, recipient.access_hash or 0)
                    await client.send_message(peer, campaign.message_text)
                    recipient.status = "sent"
                    recipient.sent_at = datetime.utcnow()
                    campaign.sent += 1
                except Exception as retry_err:
                    recipient.status = "failed"
                    recipient.error_msg = str(retry_err)[:200]
                    campaign.failed += 1
            except (UserPrivacyRestrictedError, InputUserDeactivatedError, PeerIdInvalidError) as e:
                recipient.status = "failed"
                recipient.error_msg = type(e).__name__
                campaign.failed += 1
            except Exception as e:
                recipient.status = "failed"
                recipient.error_msg = str(e)[:200]
                campaign.failed += 1

            db.commit()

            delay = campaign.delay_seconds
            elapsed = 0.0
            while elapsed < delay:
                if stop_event.is_set():
                    campaign.status = "stopped"
                    db.commit()
                    return
                await asyncio.sleep(0.25)
                elapsed += 0.25

        campaign.status = "done"
        campaign.finished_at = datetime.utcnow()
        db.commit()
    finally:
        clear_stop_event(campaign_id)
        db.close()
