import Link from "next/link";

export default function PlayerNotFound() {
	return (
		<div className="flex flex-col gap-4">
			<Link href="/" className="text-sm text-muted-foreground hover:underline">
				&larr; back to ranking
			</Link>
			<p className="text-muted-foreground py-10 text-center">No player found.</p>
		</div>
	);
}
