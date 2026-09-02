import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { config as appConfig } from "@/lib/config";

// Next.js 16 renamed `middleware.ts`/`middleware()` to `proxy.ts`/`proxy()` — the old
// name is deprecated (and can be silently ignored at build time), so this project uses
// the current convention. Unlike the deprecated middleware, proxy always runs in the
// Node.js runtime, not Edge, which is also why this file can safely build a
// nonce-based CSP per request without any Edge-runtime restrictions.
//
// A nonce is required here (rather than 'unsafe-inline') because Next.js's own RSC
// hydration payload is delivered via inline <script> tags — a CSP without a matching
// nonce silently breaks client-side hydration (this was caught by actually loading the
// pages in a browser and inspecting the console, not by reading the code).
export function proxy(request: NextRequest) {
	const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
	const isDev = process.env.NODE_ENV === "development";

	// connect-src needs the backend's own origin now that it's a separate service
	// (aura-back) — the <model-viewer> element on the player page and in leaderboard
	// rows fetches its .glb directly from there, a real cross-origin browser request
	// since the frontend/backend split (2026-08-07), not same-origin like every other
	// data fetch on this site (those all happen server-side, in Server Components,
	// which CSP doesn't apply to at all).
	//
	// connect-src also needs `blob:` — found by actually loading a real player page
	// with an embedded texture and inspecting the console, not by review. Three.js's
	// GLTFLoader (inside <model-viewer>) extracts an embedded PNG from the .glb by
	// wrapping its bytes in a Blob and fetching that blob: URL to decode it as an
	// image; without this, the fetch is silently blocked and the browser falls back to
	// the material's flat white base color, i.e. a textured item (a cape, in the case
	// that surfaced this) renders solid white instead of its real texture. img-src
	// already allowed blob: for a different reason (see the CSP incident this project's
	// own SECURITY.md documents) — that alone wasn't enough, since this is a fetch, not
	// an <img> load.
	//
	// script-src needs 'wasm-unsafe-eval' — found the same way, by loading the
	// leaderboard/player page and seeing every rank badge silently fail to render its
	// 3D model. <model-viewer> compiles a WebAssembly module (its glTF/geometry
	// decoder) via WebAssembly.instantiate, which CSP gates independently of
	// 'strict-dynamic': without this token the compile throws a CSP CompileError and
	// the badge falls back to nothing rendering at all, not even the flat-white
	// fallback the missing-texture case above hits. This token only permits compiling
	// WebAssembly, not JS eval()/Function() — unlike 'unsafe-eval', which dev already
	// carries, this is safe to also ship in production.
	const cspHeader = `
		default-src 'self';
		script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""};
		style-src 'self' 'unsafe-inline';
		img-src 'self' blob: data:;
		connect-src 'self' ${appConfig.backendUrl} blob:;
		font-src 'self';
		object-src 'none';
		base-uri 'self';
		form-action 'self';
		frame-ancestors 'none';
	`
		.replace(/\s{2,}/g, " ")
		.trim();

	const requestHeaders = new Headers(request.headers);
	requestHeaders.set("x-nonce", nonce);
	requestHeaders.set("Content-Security-Policy", cspHeader);

	const response = NextResponse.next({ request: { headers: requestHeaders } });

	response.headers.set("Content-Security-Policy", cspHeader);
	response.headers.set("X-Content-Type-Options", "nosniff");
	response.headers.set("X-Frame-Options", "DENY");
	response.headers.set("Referrer-Policy", "no-referrer");
	if (appConfig.behindTlsProxy) {
		response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
	}

	return response;
}

export const config = {
	matcher: [
		{
			source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
			missing: [
				{ type: "header", key: "next-router-prefetch" },
				{ type: "header", key: "purpose", value: "prefetch" },
			],
		},
	],
};
