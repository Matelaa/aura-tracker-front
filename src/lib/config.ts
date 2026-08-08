/**
 * Frontend-only config — the full app config (rate limits, Prisma, anti-cheat tuning)
 * lives in `aura-back` now. This is just what the frontend itself needs: where the
 * backend is, and whether it's sitting behind a TLS-terminating reverse proxy.
 */
export const config = {
	behindTlsProxy: process.env.BEHIND_TLS_PROXY === "true",
	// NEXT_PUBLIC_ because it's read client-side too (the <model-viewer> element's own
	// `src` attribute points directly at the backend — the browser fetches the .glb
	// itself, not this Next.js server). Defaults to the backend's dev port.
	backendUrl: process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000",
};
