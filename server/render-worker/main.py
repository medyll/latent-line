"""
FastAPI entrypoint for the local render worker.

Run with: uvicorn main:app --host 127.0.0.1 --port 8288

Talks only to the Node render gateway (server/src/render-worker-client.ts),
which is expected to run on the same trusted host or an isolated network —
this process has no auth of its own, same posture the old ComfyUI instance
had. Never expose this port publicly.
"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from wan_worker import OUTPUT_DIR, JobQueue, ModelNotInstalled, save_upload

app = FastAPI(title="latent-line-render-worker")
queue = JobQueue()


class SubmitJobRequest(BaseModel):
    model: str
    jobId: str
    inputs: dict[str, Any]


@app.on_event("startup")
async def on_startup() -> None:
    queue.start()


@app.get("/health")
def health() -> dict[str, Any]:
    try:
        import torch

        return {
            "status": "ok",
            "cudaAvailable": torch.cuda.is_available(),
            "device": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "cpu",
        }
    except Exception as error:  # noqa: BLE001
        return {"status": "degraded", "error": str(error)}


@app.post("/jobs", status_code=202)
def submit_job(body: SubmitJobRequest) -> dict[str, str]:
    if "positive_prompt" not in body.inputs:
        raise HTTPException(status_code=400, detail="inputs.positive_prompt is required")
    try:
        job = queue.submit(body.jobId, body.model, body.inputs)
    except ModelNotInstalled as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    return {"jobId": job.id}


@app.get("/jobs/{job_id}")
def job_status(job_id: str) -> dict[str, Any]:
    job = queue.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Unknown job")
    return {
        "state": job.state,
        "progress": job.progress,
        "artifacts": job.artifacts,
        "error": job.error,
    }


@app.post("/jobs/{job_id}/cancel")
def cancel_job(job_id: str) -> dict[str, bool]:
    cancelled = queue.cancel(job_id)
    if not cancelled:
        raise HTTPException(status_code=409, detail="Job cannot be cancelled")
    return {"cancelled": True}


@app.post("/uploads", status_code=201)
async def upload_image(file: UploadFile) -> dict[str, str]:
    content = await file.read()
    name = save_upload(file.filename or "upload.png", content)
    return {"name": name}


@app.get("/artifacts/{filename}")
def get_artifact(filename: str) -> FileResponse:
    if "/" in filename or "\\" in filename or filename in (".", ".."):
        raise HTTPException(status_code=400, detail="Invalid artifact name")
    path = (OUTPUT_DIR / filename).resolve()
    if not path.is_relative_to(OUTPUT_DIR.resolve()) or not path.is_file():
        raise HTTPException(status_code=404, detail="Artifact not found")
    return FileResponse(path)
