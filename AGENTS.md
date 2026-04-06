# AGENTS.md

## Purpose
Public API converting numbers to words for Russian and English currency formats.

## Repository Role
- Category: `*.api.airat.top` (public API project).
- Deployment platform: Cloudflare Workers.
- Main files: `worker.js`, `wrangler.toml`.

## API Summary
- Live endpoint: `https://num2words.api.airat.top`.
- Status page: `https://status.airat.top`.
- Supports `GET` and `POST`.
- Main params: `number` (required), `lang`, `currency`, `caps`.
- Health route: `/health`.

## AI Working Notes
- Keep language/currency compatibility (`ru/rub`, `en/usd|eur`).
- Keep error contracts for missing `number` and unsupported values.
- Preserve handling for decimals and negative numbers.
