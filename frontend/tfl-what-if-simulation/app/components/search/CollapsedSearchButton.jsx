/**
 * Floating button used to open the desktop station search panel.
 * 
 * Displays a compact search prompt when the full desktop search panel is
 * closed. The component is presentational: the parent controls whether it is 
 * shown and handles opening the search panel.
 * 
 * @param {Object} props
 * @param {Object} props.COLORS - Theme colour tokens for the search surface.
 * @param {string} props.accentColour - Colour used for the search icon.
 * @param {number} props.top - Fixed top offset for the button.`
 * @param {() => void} props.onOpen - Called when the button is clicked. 
 * @returns {JSX.Element}
 */
export function CollapsedSearchButton({
    COLORS,
    accentColour,
    top,
    right,
    onOpen,
}) {
    return (
        <button
            type="button"
            onClick={onOpen}
            style={{
                position: "fixed",
                top: top,
                right: right,
                minWidth: 220,
                padding: "12px 14px",
                background: COLORS.card,
                backdropFilter: "blur(10px)",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
                zIndex: 1001,
                color: COLORS.text,
                boxShadow: COLORS.shadow,
            }}
            title="Open station search"
        >
            <span
                style={{
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: COLORS.hover,
                    color: accentColour,
                    fontSize: 16,
                    flex: "0 0 auto",
                }}
            >
                ⌕
            </span>
            <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: COLORS.textStrong }}>Search stations</span>
                <span style={{ fontSize: 12, color: COLORS.textMuted }}>Jump straight to a station on the map</span>
            </span>
        </button>
    );
}