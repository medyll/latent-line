"""
Local Diffusers-backed render worker.

Runs open-weight video models (Wan 2.2 by default) on the machine's own GPU,
with no ComfyUI process involved. One job runs at a time — a single local
GPU can't usefully do more — everything else queues.

This module owns:
- lazy pipeline loading, keyed by model entrypoint
- an in-process FIFO job queue with progress/cancel support
- writing finished clips to OUTPUT_DIR as artifacts the gateway can proxy

Not yet run against a real GPU in this repo — the wiring is written against
the documented Diffusers `WanPipeline` API (see
https://huggingface.co/Wan-AI/Wan2.2-TI2V-5B-Diffusers). Validate the first
real run against your installed `diffusers` version before trusting output.
"""

from __future__ import annotations

import asyncio
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

OUTPUT_DIR = Path("data/render-worker/artifacts")
UPLOAD_DIR = Path("data/render-worker/uploads")
JobState = str  # "queued" | "running" | "completed" | "failed" | "cancelled"


@dataclass
class Job:
    id: str
    model: str
    inputs: dict[str, Any]
    state: JobState = "queued"
    progress: int = 0
    artifacts: list[dict[str, str]] = field(default_factory=list)
    error: str | None = None
    cancel_requested: bool = False


# Maps a manifest's "entrypoint" value to a Hugging Face repo id and the
# loader used to build the Diffusers pipeline for it. Add an entry here for
# every model the gateway is allowed to submit jobs to.
MODEL_REPOS: dict[str, str] = {
    "wan2.2-ti2v-5b": "Wan-AI/Wan2.2-TI2V-5B-Diffusers",
    "wan2.2-ti2v-5b-test": "Wan-AI/Wan2.2-TI2V-5B-Diffusers",
}


class ModelNotInstalled(Exception):
    pass


class PipelineCache:
    """Keeps at most one loaded pipeline per entrypoint. GPU VRAM is scarce —
    do not try to keep multiple large video models resident at once."""

    def __init__(self) -> None:
        self._pipelines: dict[str, Any] = {}

    def get(self, entrypoint: str):
        if entrypoint in self._pipelines:
            return self._pipelines[entrypoint]

        repo_id = MODEL_REPOS.get(entrypoint)
        if not repo_id:
            raise ModelNotInstalled(f"No local pipeline configured for entrypoint: {entrypoint}")

        # Imported lazily: torch/diffusers are heavy and only needed once a
        # real job is submitted, not for --help or health checks.
        import torch
        from diffusers import WanPipeline

        pipeline = WanPipeline.from_pretrained(repo_id, torch_dtype=torch.bfloat16)
        pipeline.to("cuda" if torch.cuda.is_available() else "cpu")
        self._pipelines[entrypoint] = pipeline
        return pipeline


class JobQueue:
    def __init__(self) -> None:
        self._jobs: dict[str, Job] = {}
        self._pending: asyncio.Queue[str] = asyncio.Queue()
        self._pipelines = PipelineCache()
        self._worker_task: asyncio.Task | None = None
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    def start(self) -> None:
        if self._worker_task is None:
            self._worker_task = asyncio.create_task(self._run())

    def submit(self, job_id: str, model: str, inputs: dict[str, Any]) -> Job:
        job = Job(id=job_id, model=model, inputs=inputs)
        self._jobs[job_id] = job
        self._pending.put_nowait(job_id)
        return job

    def get(self, job_id: str) -> Job | None:
        return self._jobs.get(job_id)

    def cancel(self, job_id: str) -> bool:
        job = self._jobs.get(job_id)
        if not job:
            return False
        if job.state in ("completed", "failed", "cancelled"):
            return False
        job.cancel_requested = True
        if job.state == "queued":
            job.state = "cancelled"
        return True

    async def _run(self) -> None:
        while True:
            job_id = await self._pending.get()
            job = self._jobs.get(job_id)
            if not job or job.state == "cancelled":
                continue
            job.state = "running"
            try:
                artifact = await asyncio.to_thread(self._render, job)
                if job.cancel_requested:
                    job.state = "cancelled"
                else:
                    job.artifacts = [artifact]
                    job.progress = 100
                    job.state = "completed"
            except Exception as error:  # noqa: BLE001 — surface any failure to the job record
                job.state = "failed"
                job.error = str(error)

    def _render(self, job: Job) -> dict[str, str]:
        pipeline = self._pipelines.get(job.model)
        inputs = job.inputs

        def on_step(_pipeline, step: int, _timestep, callback_kwargs: dict) -> dict:
            total = getattr(_pipeline, "num_timesteps", None) or 1
            job.progress = min(99, int(100 * step / max(total, 1)))
            if job.cancel_requested:
                # Recent Diffusers pipelines check this flag between steps.
                _pipeline._interrupt = True
            return callback_kwargs

        pipeline_kwargs: dict[str, Any] = dict(
            prompt=inputs["positive_prompt"],
            negative_prompt=inputs.get("negative_prompt") or None,
            height=inputs.get("height", 704),
            width=inputs.get("width", 1280),
            num_frames=inputs.get("frame_count", 121),
            guidance_scale=inputs.get("guidance_scale", 5.0),
            generator=_make_generator(inputs.get("seed")),
            callback_on_step_end=on_step,
        )
        start_image = inputs.get("start_image")
        if start_image:
            # I2V mode: TI2V-5B conditions on a first frame via `image=`.
            # Confirm this kwarg name against the installed diffusers
            # version — the TI2V pipeline signature is newer than most
            # published examples at the time this worker was written.
            from PIL import Image

            pipeline_kwargs["image"] = Image.open(UPLOAD_DIR / start_image).convert("RGB")

        result = pipeline(**pipeline_kwargs)

        from diffusers.utils import export_to_video

        filename = f"{job.id}.mp4"
        output_path = OUTPUT_DIR / filename
        export_to_video(result.frames[0], str(output_path), fps=inputs.get("fps", 24))
        return {"filename": filename, "kind": "video"}


def _make_generator(seed: int | None):
    import torch

    if seed is None or seed < 0:
        seed = int(time.time() * 1000) % (2**31)
    return torch.Generator(device="cpu").manual_seed(seed)


def save_upload(filename_hint: str, content: bytes) -> str:
    suffix = Path(filename_hint).suffix or ".png"
    name = f"{uuid.uuid4().hex}{suffix}"
    (UPLOAD_DIR / name).write_bytes(content)
    return name
