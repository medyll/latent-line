# latent-line
LatentLine is a JSON-native orchestration framework for Stable Diffusion that enables structured cinematic sequencing. It replaces traditional prompting with a programmable timeline to control characters, camera vectors, and environmental states with surgical precision. It serves as a headless bridge to compile complex narrative manifests into executable generative workflows.

## Frontend scaffold

This repository now includes a minimal Svelte 5 + Vite + TypeScript + Tailwind scaffold and a small `shadcn-svelte`-style UI sample.

Quick start:

1. Install dependencies:

```bash
pnpm install
```

2. Start dev server:

```bash
pnpm dev
```

To scaffold or add more `shadcn-svelte` components, run the library's generator/CLI if available, for example:

```bash
pnpm dlx shadcn-svelte init
```

Tailwind is configured via `tailwind.config.cjs` and `postcss.config.cjs`.
