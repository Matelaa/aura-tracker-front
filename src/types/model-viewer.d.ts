// @google/model-viewer ships web-component (Lit) types, not React JSX ones — this
// augmentation is what lets <model-viewer> be used as TSX. Attributes listed are only
// the ones player-model-viewer.tsx actually uses; the element accepts many more.
import type { DetailedHTMLProps, HTMLAttributes } from "react";

type ModelViewerAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
	src: string;
	alt?: string;
	loading?: "auto" | "lazy" | "eager";
	"camera-controls"?: boolean;
	"auto-rotate"?: boolean;
	"auto-rotate-delay"?: number;
	"rotation-per-second"?: string;
	"interaction-prompt"?: string;
	"shadow-intensity"?: string | number;
	"disable-zoom"?: boolean;
	exposure?: string | number;
};

declare global {
	namespace JSX {
		interface IntrinsicElements {
			"model-viewer": ModelViewerAttributes;
		}
	}
}

// React 19 resolves JSX through the React.JSX namespace rather than the old global
// JSX one — both are augmented so this works regardless of which one this project's
// TS/React version actually consults.
declare module "react" {
	namespace JSX {
		interface IntrinsicElements {
			"model-viewer": ModelViewerAttributes;
		}
	}
}

export {};
