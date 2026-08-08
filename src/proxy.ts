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
	const cspHeader = `
		default-src 'self';
		script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
		style-src 'self' 'unsafe-inline';
		img-src 'self' blob: data:;
		connect-src 'self' ${appConfig.backendUrl};
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
