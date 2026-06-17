import asyncio
import csv
import io
import json

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from .. import crud
from ..auth import get_current_user, get_current_user_from_query_token
from ..database import SessionLocal, get_db
from ..models import CampaignRecipient, ScrapedMember, SendCampaign, User
from ..sender import run_campaign
from ..telegram_manager import register_stop_event, request_stop
from ..schemas import CampaignResponse, CreateCampaignRequest, RecipientInput

router = APIRouter(prefix="/api/send", tags=["sender"])


@router.post("/campaigns/upload-csv")
async def upload_csv(
    file: UploadFile = File(...), current_user: User = Depends(get_current_user)
):
    content = (await file.read()).decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(content))

    recipients = []
    for row in reader:
        raw_id = (row.get("tg_user_id") or "").strip()
        if not raw_id or not raw_id.lstrip("-").isdigit():
            continue
        raw_hash = (row.get("access_hash") or "").strip()
        recipients.append(
            {
                "tg_user_id": int(raw_id),
                "username": (row.get("username") or "").strip() or None,
                "first_name": (row.get("first_name") or "").strip() or None,
                "access_hash": int(raw_hash) if raw_hash.lstrip("-").isdigit() else 0,
            }
        )
        if len(recipients) >= 50000:
            break

    return {"recipients": recipients}


@router.post("/campaigns")
def create_campaign(
    payload: CreateCampaignRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    recipients_data: list[RecipientInput] = []

    if payload.scrape_job_id is not None:
        job = crud.get_scrape_job(db, payload.scrape_job_id, current_user.id)
        if not job:
            raise HTTPException(status_code=404, detail="Scrape job not found")
        query = db.query(ScrapedMember).filter_by(job_id=job.id)
        if payload.selected_tg_user_ids:
            query = query.filter(ScrapedMember.tg_user_id.in_(payload.selected_tg_user_ids))
        for m in query.all():
            recipients_data.append(
                RecipientInput(
                    tg_user_id=m.tg_user_id,
                    username=m.username,
                    first_name=m.first_name,
                    access_hash=m.access_hash,
                )
            )
    elif payload.recipients:
        recipients_data = payload.recipients

    if not recipients_data:
        raise HTTPException(status_code=400, detail="No recipients provided")

    campaign = SendCampaign(
        user_id=current_user.id,
        name=payload.name,
        message_text=payload.message_text,
        delay_seconds=payload.delay_seconds,
        total=len(recipients_data),
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    db.bulk_save_objects(
        [
            CampaignRecipient(
                campaign_id=campaign.id,
                tg_user_id=r.tg_user_id,
                username=r.username,
                first_name=r.first_name,
                access_hash=r.access_hash,
            )
            for r in recipients_data
        ]
    )
    db.commit()

    return {"campaign_id": campaign.id}


@router.post("/campaigns/{campaign_id}/start")
def start_campaign(
    campaign_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaign = crud.get_campaign(db, campaign_id, current_user.id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if campaign.status == "running":
        raise HTTPException(status_code=400, detail="Campaign already running")

    stop_event = register_stop_event(campaign_id)
    background_tasks.add_task(run_campaign, campaign_id, current_user.id, SessionLocal, stop_event)
    return {"status": "running"}


@router.post("/campaigns/{campaign_id}/stop")
def stop_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    campaign = crud.get_campaign(db, campaign_id, current_user.id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    request_stop(campaign_id)
    return {"status": "stopping"}


@router.get("/campaigns", response_model=list[CampaignResponse])
def list_campaigns(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(SendCampaign)
        .filter_by(user_id=current_user.id)
        .order_by(SendCampaign.created_at.desc())
        .all()
    )


@router.get("/campaigns/{campaign_id}", response_model=CampaignResponse)
def get_campaign_detail(
    campaign_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    campaign = crud.get_campaign(db, campaign_id, current_user.id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@router.get("/campaigns/{campaign_id}/progress")
async def campaign_progress(
    campaign_id: int,
    current_user: User = Depends(get_current_user_from_query_token),
    db: Session = Depends(get_db),
):
    campaign = crud.get_campaign(db, campaign_id, current_user.id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    async def event_generator():
        last_sent = -1
        last_failed = -1
        last_status = None
        while True:
            db.expire_all()
            current = db.query(SendCampaign).filter_by(id=campaign_id).first()
            if not current:
                yield f"data: {json.dumps({'type': 'error', 'message': 'not found'})}\n\n"
                return

            changed = (
                current.sent != last_sent
                or current.failed != last_failed
                or current.status != last_status
            )

            if changed:
                last_sent, last_failed, last_status = current.sent, current.failed, current.status
                latest = (
                    db.query(CampaignRecipient)
                    .filter_by(campaign_id=campaign_id, status="sent")
                    .order_by(CampaignRecipient.sent_at.desc())
                    .first()
                )
                payload = {
                    "sent": current.sent,
                    "failed": current.failed,
                    "total": current.total,
                    "status": current.status,
                    "current_username": latest.username if latest else None,
                }
                yield f"data: {json.dumps(payload)}\n\n"

                if current.status in ("done", "stopped", "error"):
                    payload["type"] = "done"
                    yield f"data: {json.dumps(payload)}\n\n"
                    return
            else:
                yield ": ping\n\n"

            await asyncio.sleep(1)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
