import { cn } from "@/lib/utils";
import { RankBadgeModel } from "@/components/rank-badge-model";

const MEDALS: Record<number, { emoji: string; ring: string; glow: string }> = {
	1: { emoji: "🥇", ring: "ring-amber-400/70", glow: "shadow-[0_0_16px_-2px_var(--color-amber-400)]" },
	2: { emoji: "🥈", ring: "ring-slate-300/60", glow: "shadow-[0_0_12px_-3px_var(--color-slate-300)]" },
	3: { emoji: "🥉", ring: "ring-orange-400/60", glow: "shadow-[0_0_12px_-3px_var(--color-orange-400)]" },
};

/**
 * Circular rank marker. Top 3 always keep their colored glow ring (borrowed from how
 * community OSRS dashboards like liveon.discloud.app style their leaderboard tops),
 * independent of what's inside the circle. What's inside is decided separately: a
 * player's 3D model if they've uploaded one (see {@link RankBadgeModel}), otherwise the
 * same medal emoji / plain "#rank" badge as before — a model, when present, always
 * takes priority over the emoji too, top 3 included.
 */
export function RankBadge({ rank, modelSrc, displayName }: { rank: number; modelSrc?: string | null; displayName: string }) {
	const medal = MEDALS[rank];

	const ringClasses = medal
		? cn("ring-2", medal.ring, medal.glow)
		: "";

	return (
		<div
			className={cn(
				"flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card",
				!modelSrc && !medal && "bg-secondary",
				ringClasses
			)}
			aria-label={`Rank ${rank}`}
		>
			{modelSrc ? (
				<RankBadgeModel src={modelSrc} alt={`${displayName}'s 3D model`} />
			) : medal ? (
				<span className="text-lg leading-none">{medal.emoji}</span>
			) : (
				<span className="text-sm font-semibold text-secondary-foreground">#{rank}</span>
			)}
		</div>
	);
}
