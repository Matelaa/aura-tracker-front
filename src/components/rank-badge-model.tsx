"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Small, non-interactive model thumbnail for a leaderboard row's circle — a scaled-down
 * sibling of {@link PlayerModelViewer} on the player page, not a reuse of it: that one
 * is a full interactive viewer (camera controls) meant for one avatar on a page. This
 * one intentionally is not interactive (a leaderboard row is a link to the player page
 * — camera-drag gestures on the thumbnail would fight with click-to-navigate).
 * <p>
 * Lazy-loading is done with our own {@link IntersectionObserver}, not model-viewer's
 * built-in `loading="lazy"` — found by actually testing, not by review. model-viewer's
 * own viewport check (the same one that made `loading="auto"` silently never fire on
 * the profile page's avatar) turned out just as unreliable here: a row scrolled fully
 * into view and given several seconds still reported `loaded: false`. Driving
 * visibility ourselves and only then mounting the element with `loading="eager"` sets a
 * real request in motion as soon as it's confirmed to actually be needed, without
 * depending on model-viewer's own internal trigger at all.
 */
export function RankBadgeModel({ src, alt }: { src: string; alt: string }) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);
	const [ready, setReady] = useState(false);
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) {
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					setVisible(true);
					observer.disconnect();
				}
			},
			{ rootMargin: "200px" }
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		if (!visible) {
			return;
		}
		let cancelled = false;
		import("@google/model-viewer")
			.then(() => {
				if (!cancelled) {
					setReady(true);
				}
			})
			.catch(() => {
				if (!cancelled) {
					setFailed(true);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [visible]);

	return (
		<div ref={containerRef} className="size-full">
			{ready && !failed && (
				<model-viewer
					src={src}
					alt={alt}
					loading="eager"
					disable-zoom
					interaction-prompt="none"
					camera-controls={false}
					auto-rotate={false}
					shadow-intensity="0"
					exposure="1.2"
					style={{ width: "100%", height: "100%", pointerEvents: "none" }}
					onError={() => setFailed(true)}
				/>
			)}
		</div>
	);
}
