import csv
import io

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from .. import crud
from ..auth import get_current_user
from ..database import SessionLocal, get_db
from ..models import ScrapedMember, ScrapeJob, User
from ..scraper import run_scrape_job
from ..schemas import MembersPageResponse, ScrapedMemberResponse, ScrapeJobResponse, ScrapeStartRequest

router = APIRouter(prefix="/api/scrape", tags=["scraper"])


@router.post("/start")
def start_scrape(
    payload: ScrapeStartRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = ScrapeJob(user_id=current_user.id, target=payload.target, status="pending")
    db.add(job)
    db.commit()
    db.refresh(job)

    background_tasks.add_task(
        run_scrape_job, job.id, current_user.id, payload.target, payload.aggressive, SessionLocal
    )
    return {"job_id": job.id}


@router.get("/jobs", response_model=list[ScrapeJobResponse])
def list_jobs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    jobs = (
        db.query(ScrapeJob)
        .filter_by(user_id=current_user.id)
        .order_by(ScrapeJob.created_at.desc())
        .all()
    )
    return jobs


@router.get("/jobs/{job_id}", response_model=ScrapeJobResponse)
def get_job(
    job_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    job = crud.get_scrape_job(db, job_id, current_user.id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/jobs/{job_id}/members", response_model=MembersPageResponse)
def get_members(
    job_id: int,
    skip: int = 0,
    limit: int = 100,
    search: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = crud.get_scrape_job(db, job_id, current_user.id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    query = db.query(ScrapedMember).filter_by(job_id=job_id)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (ScrapedMember.username.ilike(like)) | (ScrapedMember.first_name.ilike(like))
        )

    total = query.count()
    members = query.offset(skip).limit(limit).all()
    return MembersPageResponse(total=total, members=members)


@router.get("/jobs/{job_id}/export")
def export_csv(
    job_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    job = crud.get_scrape_job(db, job_id, current_user.id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    members = db.query(ScrapedMember).filter_by(job_id=job_id).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        ["tg_user_id", "username", "first_name", "last_name", "phone", "is_bot", "premium", "access_hash"]
    )
    for m in members:
        writer.writerow(
            [
                m.tg_user_id,
                m.username or "",
                m.first_name or "",
                m.last_name or "",
                m.phone or "",
                str(m.is_bot).lower(),
                str(m.premium).lower(),
                m.access_hash if m.access_hash is not None else "",
            ]
        )
    buffer.seek(0)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=members_{job_id}.csv"},
    )


@router.delete("/jobs/{job_id}")
def delete_job(
    job_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    job = crud.get_scrape_job(db, job_id, current_user.id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    return {"status": "deleted"}
