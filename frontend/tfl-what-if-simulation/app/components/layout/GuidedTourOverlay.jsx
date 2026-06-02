import { GuidedTourOverlayMain } from "./guidedTour/GuidedTourOverlayMain";

/**
 * Thin public wrapper for the guided tour overlay implementation.
 *
 * Keeping this wrapper preserves the existing import path while the detailed
 * tour logic lives in the modular `guidedTour` folder.
 *
 * @param {Object} props - Guided tour overlay props.
 * @returns {JSX.Element} Guided tour overlay.
 */
export function GuidedTourOverlay(props) {
    return <GuidedTourOverlayMain {...props} />;
}
