/*
 * GuidedTourOverlay.jsx
 * Thin wrapper that delegates to the modular guided-tour implementation
 * located in `app/components/layout/guidedTour/GuidedTourOverlayMain.jsx`.
 */
import { GuidedTourOverlayMain } from "./guidedTour/GuidedTourOverlayMain";

export function GuidedTourOverlay(props) {
    return <GuidedTourOverlayMain {...props} />;
}