export function StatTile({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-border/60 bg-card/60 px-4 py-4 text-center">
			<span className="font-heading text-2xl font-bold text-primary">{value}</span>
			<span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
		</div>
	);
}
