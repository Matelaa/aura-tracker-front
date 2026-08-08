# Threat Model — Aura Leaderboard Frontend (Next.js)

Since the frontend/backend split on 2026-08-07, this project has **zero database access** — it's pages and components only, fetching everything from [`aura-back`](../aura-back) over HTTP. Backend concerns (rate limiting, Prisma, sync validation, anti-cheat, anomaly detection) live in [`aura-back/SECURITY.md`](../aura-back/SECURITY.md) now, not here. What follows is what's actually specific to this project.

## Trust boundary: this app has no data of its own

Every page here is a Server Component that calls `src/lib/api-client.ts`, which does plain `fetch()` calls to `aura-back`'s public JSON endpoints (`GET /api/leaderboard`, `GET /api/players/[displayName]`, `GET /api/community-stats`). None of that requires CORS — those fetches run server-side (in Node, during SSR), and CORS is a browser-only restriction that doesn't apply to server-to-server requests at all.

The one exception is the player's 3D model: `<model-viewer src>` (in both `PlayerModelViewer` and `RankBadgeModel`) is set to `aura-back`'s URL directly, so the **browser** fetches `GET /api/players/[displayName]/model.glb` itself, cross-origin. That's a real browser-enforced boundary, covered by two things: `aura-back` sets `Access-Control-Allow-Origin: *` on that specific route (see its `SECURITY.md`), and this project's CSP (`proxy.ts`) allows it via `connect-src 'self' <backend origin>` — without that second piece, the request would be blocked by CSP even with CORS correctly configured on the backend side (found by reasoning through the split, not by a browser error — added proactively, then confirmed working end-to-end with a real cross-origin model fetch in the browser).

## Stack-specific security notes

| Concern | How it's handled |
|---|---|
| XSS | React JSX escapes all interpolated text by default — this is a language/framework-level guarantee, not a template setting that can be silently disabled the way `autoescape=False` could be. Display names come back from `aura-back` already validated at its API boundary, but React's default escaping means this page never trusted that validation alone anyway |
| CSP | **Nonce-based**, not `'unsafe-inline'` — see "CSP incident" below for why this took an extra round to get right. `connect-src` now also allow-lists the backend's origin (see above) |
| Runtime split | `proxy.ts` (Next.js 16's replacement for the deprecated `middleware.ts`) runs in the Node.js runtime — this actually simplified things versus the old Edge-Runtime-based middleware, which couldn't import Node's `crypto` module at all |
| Secrets | None — this app has no `DATABASE_URL`, no API keys, nothing sensitive. Its only config is `NEXT_PUBLIC_BACKEND_URL` (deliberately public — it has to be, `<model-viewer>` needs it in the browser bundle) and `BEHIND_TLS_PROXY` |

## CSP incident (found by actually running the app in a browser, not by review)

The first CSP implementation used `script-src 'self'` with no `'unsafe-inline'` and no nonce. This silently broke React hydration — Next.js delivers its RSC payload via inline `<script>` tags, and a CSP without a matching allowance blocks them outright. The visible symptom was a cryptic `InvariantError: Expected a request ID to be defined... via self.__next_r` in the browser console, which looked like an internal Next.js bug until the actual blocked-script console messages were found alongside it.

**Fix**: adopted Next.js's documented nonce-based CSP pattern (`src/proxy.ts`) — a fresh nonce is generated per request, included in the `Content-Security-Policy` header, and Next.js automatically applies it to its own internal scripts. This requires all pages to render dynamically (`export const dynamic = "force-dynamic"`), which is the correct behavior for a leaderboard anyway — scores change as players sync, so static caching would show stale data regardless.

This is exactly the kind of bug that only running the app in a real browser catches — the server-rendered HTML looked completely correct (`curl` and text-extraction tools showed the right data), and only the browser console revealed that client-side hydration was actually broken.

## `@google/model-viewer` + Next.js server rendering (2026-08-07, found by actually loading the page)

A static top-level `import "@google/model-viewer"` gets evaluated during Next.js's server-side module graph pass even inside a `"use client"` file, and that package references the browser/worker global `self` at module scope — which doesn't exist server-side, crashing the whole page with `ReferenceError: self is not defined`.

**Fix**: both `PlayerModelViewer` and `RankBadgeModel` import it dynamically inside `useEffect` (`import("@google/model-viewer")`) instead of as a top-level import — `useEffect` only ever runs in the browser, so the package (and its `self` reference) never gets evaluated anywhere it could fail.

## `loading="eager"` on the profile page's avatar (found by actually testing, not by review)

`<model-viewer>`'s default (`loading="auto"`) only starts fetching once its own internal `IntersectionObserver` reports the element is in the viewport — and for the profile page's 80px avatar, that check never reliably fired, even though the element was genuinely on-screen. Every render logged model-viewer's own internal `$updateSource ... BAILING OUT EARLY` and no request for the model ever left the browser. `loading="eager"` skips that check entirely, which is also just the correct choice for an always-visible profile avatar (a single element, not a list).

For the leaderboard's per-row thumbnails (`RankBadgeModel`, up to 50 on one page), the same unreliability applied to model-viewer's `loading="lazy"` — so that component drives its own visibility with a plain `IntersectionObserver` instead, only mounting `<model-viewer loading="eager">` once that fires. `<model-viewer>` shares one WebGL renderer across every instance on a page internally, which is what makes having many of these mounted at once tractable at all.
