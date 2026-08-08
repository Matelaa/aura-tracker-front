import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

/**
 * The actual Old School RuneScape interface font, extracted from the game client (the
 * same files RuneLite itself bundles at
 * runelite-client/src/main/resources/net/runelite/client/ui/runescape*.ttf). Used the
 * same way runeprofile.com uses it: for the wordmark and big stat numbers, while body
 * text stays on a normal sans-serif for readability.
 *
 * Provenance/licensing note (deliberate, discussed with the project owner): these files
 * come from github.com/RuneStar/fonts, a fan extraction released under CC0. That CC0
 * declaration covers the extractor's own rights, not Jagex's underlying copyright in the
 * font design — it does not cleanly clear usage. This is the same font RuneLite (a
 * Jagex-approved client) ships and is widely used across the OSRS fan-tool ecosystem
 * without enforcement action; the project owner accepted this low-but-nonzero risk
 * explicitly rather than it being assumed silently.
 */
const runescape = localFont({
	src: [
		{ path: "../fonts/runescape.ttf", weight: "400", style: "normal" },
		{ path: "../fonts/runescape_bold.ttf", weight: "700", style: "normal" },
	],
	variable: "--font-runescape",
	display: "swap",
});

export const metadata: Metadata = {
	title: "Aura Leaderboard",
	description: "Prove who farms Aura the hardest at the Grand Exchange. Unofficial, self-reported bragging rights for Aura Tracker.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html
			lang="en"
			className={`dark ${geistSans.variable} ${geistMono.variable} ${runescape.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col bg-background text-foreground relative">
				{/* Ambient glow behind the header, same spirit as Live On's purple/gold
				    background glows — pure decoration, pointer-events-none so it never
				    intercepts clicks. */}
				<div
					aria-hidden
					className="pointer-events-none fixed inset-x-0 top-0 h-[420px] -z-10"
					style={{
						background:
							"radial-gradient(60% 60% at 50% 0%, color-mix(in oklch, var(--primary) 18%, transparent) 0%, transparent 70%)",
					}}
				/>
				<header className="border-b border-border/60">
					<div className="mx-auto max-w-3xl px-4 py-8">
						<Link
							href="/"
							className="font-heading text-3xl font-bold tracking-wide bg-gradient-to-r from-amber-300 via-amber-400 to-fuchsia-400 bg-clip-text text-transparent"
						>
							Aura Leaderboard
						</Link>
						<p className="mt-2 text-sm text-muted-foreground max-w-lg">
							Think you can out-farm everyone at the Grand Exchange?
							Prove it — bragging rights only, no official ranking.
						</p>
					</div>
				</header>
				<main className="flex-1 mx-auto w-full max-w-3xl px-4 py-8">{children}</main>
			</body>
		</html>
	);
}
