# Paul Wambugu — Portfolio

**Live (static, GitHub Pages):** https://jaguar999paw-droid.github.io
**Live (full site + API, Cloudflare Pages):** https://jaguar999paw-portfolio.pages.dev

Software Developer · Systems Engineer · AI Integration Specialist  
Based in Chuka, Tharaka-Nithi, Kenya. 4th-year undergraduate. Open to Industrial Attachment.

## What's here

A single-page portfolio built from scratch — no frameworks, no templates — featuring:

- **Real projects**: ssh-shell-mcp (57-tool Python MCP server), Headscale VPN stack, CTF lab
- **2026 Blueprint**: PesaFlow (M-Pesa fintech), EdgeCache (LLM caching deep-dive), daraja-sdk (open-source)
- **SOLID principles** applied concretely — not as bullet points, as code decisions
- **Kenyan market edge**: Daraja API, Africa's Talking, offline-first, low-latency infra

## Stack

Pure HTML · CSS · Vanilla JS · Google Fonts (Syne + JetBrains Mono + DM Sans)

|---|---|
| `[jaguar999paw@gmail.com]` |
| `[Chuka University]` |

## Deployments

This repo publishes to two places simultaneously, on purpose:

| | URL | What works |
|---|---|---|
| GitHub Pages | https://jaguar999paw-droid.github.io | Static site only. `/api/*` routes 404 — GitHub Pages has no server-side runtime. The nav status dot degrades to "offline" here automatically. |
| Cloudflare Pages | https://jaguar999paw-portfolio.pages.dev | Full site **and** `/api/*` Pages Functions. This is the canonical deployment — link this one when applying anywhere. |

GitHub Pages updates automatically on every push to `main` (repo settings → Pages). Cloudflare Pages is deployed manually via Wrangler (not git-connected), so it does **not** auto-update on push — redeploy explicitly after merging changes you want live:

```bash
git push origin main                # updates GitHub Pages automatically
npx wrangler pages deploy .         # updates Cloudflare Pages (manual, on purpose)
```

### Local development

```bash
npm install
npx wrangler pages dev .            # serves the site + functions/api/* locally, matches prod runtime
curl http://localhost:8788/api/hello
```

### Adding a new API route

Drop a new file under `functions/api/`, e.g. `functions/api/stats.js` exporting `onRequest(context)` — Cloudflare Pages Functions uses file-based routing, so it's live at `/api/stats` on next deploy with no other config.

### Secrets

Never commit API keys or tokens. Set them with:

```bash
npx wrangler pages secret put SECRET_NAME
```

They're then available as `context.env.SECRET_NAME` inside any function.

### Verifying a deploy

```bash
curl -s https://jaguar999paw-portfolio.pages.dev/api/hello
# -> {"message":"Hello from Cloudflare Pages Functions","method":"GET"}
```

See `ARCHITECTURE.md` for the fuller design (data layer, planned API surface, security baseline, and the Workers-with-static-assets migration path if this ever outgrows Pages).

---

*Built with intention. Updated continuously.*
