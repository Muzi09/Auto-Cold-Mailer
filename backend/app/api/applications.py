import os
import shutil
import logging
import base64
from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File
from app.models.application import StartApplicationsRequest, ApplicationResponse
from app.db.database import db
from app.workers.queue_worker import queue_worker

logger = logging.getLogger("auto_cold_mailer")

router = APIRouter(prefix="/applications", tags=["Applications"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/start")
async def start_applications(payload: StartApplicationsRequest):
    """
    Stores incoming Excel application rows into MongoDB with status 'Pending'
    and starts sequential background processing using the provided SMTP configuration.
    """
    raw_apps = [app.model_dump() for app in payload.applications]
    if not raw_apps:
        raise HTTPException(status_code=400, detail="No applications provided")

    smtp_dict = payload.smtpConfig.model_dump()
    if not smtp_dict.get("smtpHost") or not smtp_dict.get("smtpUser") or not smtp_dict.get("smtpPassword"):
        raise HTTPException(status_code=400, detail="Missing required SMTP credentials (Host, User, Password)")

    logger.info(f"Received batch of {len(raw_apps)} applications with SMTP host {smtp_dict.get('smtpHost')}.")
    
    # Store all rows in DB with status "Pending"
    inserted_count = await db.insert_applications(raw_apps)
    
    # Process resume from POST payload or local storage backup
    resume_path = None
    if payload.resume and payload.resume.fileData:
        try:
            file_data_str = payload.resume.fileData
            if "," in file_data_str:
                file_data_str = file_data_str.split(",", 1)[1]
            pdf_bytes = base64.b64decode(file_data_str)
            target_file = os.path.join(UPLOAD_DIR, "resume.pdf")
            with open(target_file, "wb") as f:
                f.write(pdf_bytes)
            resume_path = target_file
            logger.info("Saved resume PDF sent in POST request payload to disk.")
        except Exception as e:
            logger.error(f"Failed to decode base64 resume from payload: {e}")

    if not resume_path and os.path.exists(os.path.join(UPLOAD_DIR, "resume.pdf")):
        resume_path = os.path.join(UPLOAD_DIR, "resume.pdf")
    
    # Start background processing queue with batch SMTP config
    all_apps = await db.get_all_applications()
    pending_apps = [app for app in all_apps if app.get("status") in ["Pending", "Failed"]]
    
    await queue_worker.add_to_queue(
        pending_apps,
        smtp_config=smtp_dict,
        resume_path=resume_path
    )

    
    return {
        "message": "Job Started",
        "count": inserted_count,
        "status": "Processing Started"
    }

@router.get("", response_model=List[ApplicationResponse])
async def get_applications(status: Optional[str] = None, search: Optional[str] = None):
    apps = await db.get_all_applications()
    
    if status and status != "All":
        apps = [a for a in apps if a.get("status") == status]
        
    if search:
        s = search.lower()
        apps = [
            a for a in apps
            if s in a.get("companyName", "").lower()
            or s in a.get("jobTitle", "").lower()
            or s in a.get("contactEmail", "").lower()
            or s in a.get("skills", "").lower()
        ]
        
    return apps

@router.get("/{id}")
async def get_application(id: int):
    app = await db.get_application_by_id(id)
    if not app:
        raise HTTPException(status_code=404, detail=f"Application {id} not found")
    return app

@router.delete("")
async def clear_applications():
    await db.clear_applications()
    return {"message": "Application history cleared successfully"}

@router.delete("/{id}")
async def delete_application(id: int):
    app = await db.get_application_by_id(id)
    if not app:
        raise HTTPException(status_code=404, detail=f"Application {id} not found")
    
    if db.is_connected and db.db is not None:
        await db.db.applications.delete_one({"applicationId": id})
    if id in db._memory_applications:
        del db._memory_applications[id]
        
    return {"message": f"Application {id} deleted successfully"}

@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resumes are supported.")
        
    target_path = os.path.join(UPLOAD_DIR, "resume.pdf")
    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"message": "Resume uploaded successfully", "filename": file.filename}
