import Link from "next/link";

import { fetchCommunityStats, fetchLeaderboard, modelGlbUrl } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { RankBadge } from "@/components/rank-badge";
import { StatTile } from "@/components/stat-tile";
import { cn } from "@/lib/utils";

// Required for the nonce-based CSP set in proxy.ts to work — nonces are per-request, so
// this page can never be statically generated/cached. That's the correct behavior for a
// leaderboard anyway (scores change as players sync).
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

function formatDuration(totalSeconds: number): string {
	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	if (days > 0) return `${days}d ${String(hours).padStart(2, "0")}h`;
	if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
	return `${minutes}m`;
}

export default async function LeaderboardPage({
	searchParams,
}: {
	searchParams: Promise<{ q?: string; page?: string }>;
}) {
	const params = await searchParams;
	const query = params.q?.trim() ?? "";
	const page = Math.max(1, Number(params.page ?? "1") || 1);

	const [stats, leaderboard] = await Promise.all([
		fetchCommunityStats(),
		fetchLeaderboard(page, PAGE_SIZE, query || undefined),
	]);

	const rows = leaderboard.players.map((player) => ({
		rank: player.rank,
		displayName: player.displayName,
		auraPoints: player.auraPoints,
		eligibleSeconds: player.eligibleSecondsTotal,
		modelSrc: player.hasModel ? modelGlbUrl(player.displayName) : null,
	}));

	const offset = (page - 1) * PAGE_SIZE;
	const hasPrev = !query && page > 1;
	const hasNext = !query && offset + PAGE_SIZE < leaderboard.totalPlayers;

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-3 sm:flex-row">
				<StatTile label="Players" value={stats.totalPlayers.toLocaleString("en-US")} />
				<StatTile label="Community Aura" value={stats.totalAuraPoints.toLocaleString("en-US")} />
				<StatTile label="Total eligible time" value={formatDuration(stats.totalEligibleSeconds)} />
			</div>

			<form className="flex gap-2" action="/">
				<Input name="q" placeholder="Search for a player..." defaultValue={query} maxLength={12} className="max-w-xs" />
				<Button type="submit">Search</Button>
				{query && (
					<Link href="/" className={buttonVariants({ variant: "ghost" })}>
						clear
					</Link>
				)}
			</form>

			{rows.length === 0 ? (
				<p className="text-center text-muted-foreground py-16 rounded-xl border border-dashed border-border/60">
					No player found.
				</p>
			) : (
				<ol className="flex flex-col gap-2">
					{rows.map((row) => (
						<li key={row.displayName}>
							<Link
								href={`/player/${encodeURIComponent(row.displayName)}`}
								className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/40 px-4 py-3 transition-colors hover:border-primary/50 hover:bg-card"
							>
								<RankBadge rank={row.rank} modelSrc={row.modelSrc} displayName={row.displayName} />
								<span className="flex-1 truncate font-medium">{row.displayName}</span>
								<div className="text-right">
									<div className="font-heading text-lg font-bold text-primary leading-tight">
										{row.auraPoints.toLocaleString("en-US")}
									</div>
									<div className="text-xs text-muted-foreground">{formatDuration(row.eligibleSeconds)}</div>
								</div>
							</Link>
						</li>
					))}
				</ol>
			)}

			{(hasPrev || hasNext) && (
				<div className="flex justify-between">
					{hasPrev ? (
						<Link href={`/?page=${page - 1}`} className={buttonVariants({ variant: "outline" })}>
							&larr; previous
						</Link>
					) : (
						<span className={cn(buttonVariants({ variant: "outline" }), "pointer-events-none opacity-50")}>
							&larr; previous
						</span>
					)}
					{hasNext ? (
						<Link href={`/?page=${page + 1}`} className={buttonVariants({ variant: "outline" })}>
							next &rarr;
						</Link>
					) : (
						<span className={cn(buttonVariants({ variant: "outline" }), "pointer-events-none opacity-50")}>
							next &rarr;
						</span>
					)}
				</div>
			)}
		</div>
	);
}
