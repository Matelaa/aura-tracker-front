"use client";

import { useEffect, useState } from "react";

/**
 * Renders the player's exported 3D model (see the plugin's `com.aurafarming.modelexporter`,
 * adapted from RuneProfile — credited in the plugin's THIRD_PARTY_NOTICES.md) via
 * `<model-viewer>`, Google's glTF web component. Chosen over hand-rolled Three.js: this
 * is a "drop in a model, get orbit controls and lighting for free" feature, not
 * something that needs a custom render pipeline.
 * <p>
 * `@google/model-viewer` is imported dynamically inside `useEffect`, not as a top-level
 * `import` — found by actually loading the page, not by review. A static top-level
 * import still gets evaluated during Next.js's server-side module graph pass even for a
 * `"use client"` file, and model-viewer's package references the browser/worker global
 * `self` at module scope, which doesn't exist in that server pass: `ReferenceError:
 * self is not defined`, crashing the whole page. `useEffect` only ever runs in the
 * browser, so the import — and model-viewer's own custom-element registration — never
 * happens anywhere `self` could be undefined.
 * <p>
 * `loading="eager"` is required, not cosmetic — found by actually loading this in a
 * browser, not by review. model-viewer's default (`loading="auto"`) only starts
 * fetching once an internal `IntersectionObserver` reports the element is in the
 * viewport, and for a small (80px) avatar it never fired in time: every render logged
 * model-viewer's own internal `$updateSource ... BAILING OUT EARLY` and no request for
 * the model ever left the browser. `eager` skips that check entirely, which is also
 * just the correct choice for an always-visible profile avatar.
 */
export function PlayerModelViewer({ src, alt }: { src: string; alt: string }) {
	const [ready, setReady] = useState(false);
	const [failed, setFailed] = useState(false);

	useEffect(() => {
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
	}, []);

	if (failed || !ready) {
		return null;
	}

	return (
		<model-viewer
			src={src}
			alt={alt}
			loading="eager"
			camera-controls
			auto-rotate
			auto-rotate-delay={0}
			rotation-per-second="18deg"
			interaction-prompt="none"
			shadow-intensity="0"
			disable-zoom
			exposure="1.2"
			style={{ width: "100%", height: "100%" }}
			onError={() => setFailed(true)}
		/>
	);
}
