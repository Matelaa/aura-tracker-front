import { config } from "./config";

/**
 * Everything the frontend needs from `aura-back`, all over plain HTTP — the frontend
 * has no database access of its own since the 2026-08-07 split. `cache: "no-store"` on
 * every call: this is a leaderboard, data changes as players sync, and every page here
 * is already `force-dynamic` (see each page's own comment) for the same reason.
 */

export interface LeaderboardRow {
	rank: number;
	displayName: string;
	auraPoints: number;
	eligibleSecondsTotal: number;
	hasModel: boolean;
}

export interface LeaderboardResponse {
	page: number;
	pageSize: number;
	totalPlayers: number;
	players: LeaderboardRow[];
}

export interface PlayerProfile {
	displayName: string;
	rank: number;
	auraPoints: number;
	eligibleSecondsTotal: number;
	lastSyncedAt: string;
	hasModel: boolean;
}

export interface CommunityStats {
	totalPlayers: number;
	totalEligibleSeconds: number;
	totalAuraPoints: number;
}

export async function fetchLeaderboard(page: number, pageSize: number, query?: string): Promise<LeaderboardResponse> {
	const url = new URL("/api/leaderboard", config.backendUrl);
	url.searchParams.set("page", String(page));
	url.searchParams.set("pageSize", String(pageSize));
	if (query) {
		url.searchParams.set("q", query);
	}
	const res = await fetch(url, { cache: "no-store" });
	if (!res.ok) {
		throw new Error(`GET ${url} failed: ${res.status}`);
	}
	return res.json();
}

export async function fetchCommunityStats(): Promise<CommunityStats> {
	const url = new URL("/api/community-stats", config.backendUrl);
	const res = await fetch(url, { cache: "no-store" });
	if (!res.ok) {
		throw new Error(`GET ${url} failed: ${res.status}`);
	}
	return res.json();
}

/** Null on a genuine 404 (unknown player) — throws for anything else unexpected. */
export async function fetchPlayer(displayName: string): Promise<PlayerProfile | null> {
	const url = new URL(`/api/players/${encodeURIComponent(displayName)}`, config.backendUrl);
	const res = await fetch(url, { cache: "no-store" });
	if (res.status === 404) {
		return null;
	}
	if (!res.ok) {
		throw new Error(`GET ${url} failed: ${res.status}`);
	}
	return res.json();
}

/**
 * Not fetched by this file at all — this URL is handed to `<model-viewer src>`, which
 * makes the browser fetch it directly from `aura-back` (a real cross-origin request;
 * see proxy.ts's connect-src and aura-back's CORS header on that route).
 */
export function modelGlbUrl(displayName: string): string {
	return new URL(`/api/players/${encodeURIComponent(displayName)}/model.glb`, config.backendUrl).toString();
}
