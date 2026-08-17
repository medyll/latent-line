# Render worker (local, free)

Runs an open-weight video model on your own GPU and exposes a small HTTP
contract to `server/src/render-worker-client.ts`. No ComfyUI, no per-second
billing — this is the local-first, free-first path decided in
[docs/RENDER_BACKEND_OPTIONS_2026.md](../../docs/RENDER_BACKEND_OPTIONS_2026.md).

Default model: **Wan 2.2 TI2V-5B** (~8 GB VRAM, handles both text-to-video
and image-to-video in one pipeline). See `MODEL_REPOS` in `wan_worker.py` to
add other locally installed models (LTX-Video, HunyuanVideo, etc.) — each
just needs a Hugging Face repo id and a matching `*.manifest.json` in
`../models/`.

## Setup

```bash
cd server/render-worker
python3 -m venv .venv
source .venv/bin/activate   # .venv\Scripts\activate on Windows
pip install -r requirements.txt
```

Requires an NVIDIA GPU with CUDA and at least 8 GB VRAM for the default
model. Weights download automatically from Hugging Face on first use
(`Wan-AI/Wan2.2-TI2V-5B-Diffusers`, ~10 GB) — make sure there's disk space
and, if the repo is gated, that `huggingface-cli login` has been run.

## Run

```bash
uvicorn main:app --host 127.0.0.1 --port 8288
```

Then point the Node gateway at it:

```bash
export RENDER_WORKER_URL=http://127.0.0.1:8288
```

## Contract

| Route | Purpose |
| --- | --- |
| `GET /health` | CUDA availability and device name |
| `POST /jobs` | `{ model, jobId, inputs }` → `202 { jobId }`, queues the render |
| `GET /jobs/{id}` | `{ state, progress, artifacts, error }` |
| `POST /jobs/{id}/cancel` | Best-effort cancel (queued jobs cancel immediately; running jobs stop at the next sampling step) |
| `POST /uploads` | Multipart image upload for I2V, returns `{ name }` |
| `GET /artifacts/{filename}` | Serves a finished clip |

One job renders at a time — a single local GPU can't usefully do more.
Everything else sits in the FIFO queue.

## Status

Written against the documented Diffusers `WanPipeline` API but **not yet run
against a real GPU in this repo**. Before wiring the "Generate video" button
in the app, run one real local job end-to-end and confirm the `image=`
kwarg name for I2V matches the installed `diffusers` version (see the
comment in `wan_worker.py`).
