import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchPlayer, modelGlbUrl } from "@/lib/api-client";
import { PlayerModelViewer } from "@/components/player-model-viewer";
import { RankBadge } from "@/components/rank-badge";
import { StatTile } from "@/components/stat-tile";

// See app/page.tsx — required for the nonce-based CSP set in proxy.ts.
export const dynamic = "force-dynamic";

function formatDuration(totalSeconds: number): string {
	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	if (days > 0) return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
	if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
	return `${minutes}m`;
}

export default async function PlayerPage({ params }: { params: Promise<{ displayName: string }> }) {
	const { displayName } = await params;
	const player = await fetchPlayer(decodeURIComponent(displayName));

	if (!player) {
		notFound();
	}

	return (
		<div className="flex flex-col gap-6">
			<Link href="/" className="text-sm text-muted-foreground hover:underline">
				&larr; back to ranking
			</Link>

			<div className="rounded-2xl border border-border/60 bg-card/40 p-6">
				<div className="flex items-center gap-5">
					{/*
					 * Falls back to the lettered circle until the player has a model
					 * uploaded — manual-only, via the "Update 3D Model" button in the
					 * plugin panel (see AuraPlugin#updateModelAsync). Most players who
					 * never click it see the placeholder forever, and that's fine, it
					 * degrades gracefully either way.
					 */}
					{player.hasModel ? (
						<div className="size-20 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/40">
							<PlayerModelViewer
								src={modelGlbUrl(player.displayName)}
								alt={`${player.displayName}'s 3D model`}
							/>
						</div>
					) : (
						<div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/20 to-fuchsia-500/20 ring-2 ring-primary/40">
							<span className="font-heading text-3xl font-bold text-primary">
								{player.displayName.charAt(0).toUpperCase()}
							</span>
						</div>
					)}
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-3">
							<h1 className="font-heading truncate text-3xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-fuchsia-400 bg-clip-text text-transparent">
								{player.displayName}
							</h1>
							<RankBadge rank={player.rank} displayName={player.displayName} />
						</div>
						<p className="mt-1 text-sm text-muted-foreground">
							Last updated: {new Date(player.lastSyncedAt).toLocaleString("en-US")}
						</p>
					</div>
				</div>

				<div className="mt-6 text-center">
					<div className="font-heading text-6xl font-black text-primary drop-shadow-[0_0_20px_color-mix(in_oklch,var(--primary)_45%,transparent)]">
						{player.auraPoints.toLocaleString("en-US")}
					</div>
					<div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">Aura</div>
				</div>
			</div>

			<div className="flex flex-col gap-3 sm:flex-row">
				<StatTile label="Rank" value={`#${player.rank}`} />
				<StatTile label="Total eligible time" value={formatDuration(player.eligibleSecondsTotal)} />
			</div>
		</div>
	);
}
