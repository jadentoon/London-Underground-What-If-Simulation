/**
 * Draws the animated highlight around the current guided-tour target.
 *
 * @param {Object} props - Highlight props.
 * @param {DOMRect | null} props.targetRect - Target element bounds.
 * @param {Object} props.COLORS - Theme tokens used for highlight colour.
 * @returns {JSX.Element | null} Highlight overlay or null when no target exists.
 */
export function TourHighlight({ targetRect, COLORS }) {
    if (!targetRect) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: targetRect.top - 4,
                left: targetRect.left - 4,
                width: targetRect.width + 8,
                height: targetRect.height + 8,
                border: `2px solid ${COLORS?.accent || "#60a5fa"}`,
                borderRadius: 8,
                boxShadow: `0 0 0 4px ${COLORS?.accent || "#60a5fa"}40, 0 0 20px ${COLORS?.accent || "#60a5fa"}60`,
                zIndex: 1201,
                pointerEvents: "none",
                animation: "pulse 2s ease-in-out infinite",
            }}
        />
    );
}
