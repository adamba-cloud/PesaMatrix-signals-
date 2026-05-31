---
name: Replit workflow networking
description: How to properly configure multi-service apps in Replit so Vite proxy can reach the backend.
---

## Rule
Run frontend (Vite) and backend (Express) in the SAME workflow using `concurrently`. Separate workflows live in different network namespaces — Vite's proxy cannot reach `localhost:3001` in another workflow.

**Why:** Replit sandboxes each workflow in its own network namespace. `curl` from the bash tool also runs in a separate namespace from any workflow. Only processes in the same workflow can talk to each other via localhost.

**How to apply:**
- Use `concurrently "npm run dev:backend" "npm run dev:frontend"` as the single workflow command.
- Explicitly bind the Express server to `0.0.0.0`: `app.listen(Number(PORT), '0.0.0.0', callback)` — without this, Node may bind to `::` (IPv6 only) and IPv4 proxy calls get ECONNREFUSED.
- Vite config: `allowedHosts: true` (boolean, not the string `'all'`).
- Any `async` launch call (e.g. `bot.launch()`) must have `.catch()` attached — unhandled rejections cause ts-node-dev to crash and restart the backend, creating intermittent ECONNREFUSED on the proxy.
- Shell `curl` tests to `127.0.0.1:3001` will always fail from the bash tool — this is expected and does NOT mean the proxy is broken. Trust the workflow's `openPorts` list instead.
