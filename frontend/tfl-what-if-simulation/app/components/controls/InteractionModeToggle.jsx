const INTERACTION_MODE_OPTIONS = [
    {
        id: "route",
        label: "Plan Routes",
        help: "Choose a start point and destination on the map.",
    },
    {
        id: "closures",
        label: "Edit Closures",
        help: "Open or close stations and lines on the map.",
    },
];

/**
 * Segmented control for choosing how map taps should behave on mobile layouts.
 * 
 * In route mode, map selections are used for journey planning. In closure mode,
 * map selections are used to open or close parts of the network. This is most
 * useful on touch devices, where the same map tap can be ambiguous.
 * The component is presentational: parent components own the selected mode.
 * 
 * @param {Object} props 
 * @param {Object} props.COLORS - Theme colour tokens for the control panel.
 * @param {string} props.accentColor - Colour used for the active option.
 * @param {"route" | "closures"} props.interactionMode - Currently selected map interaction mode.
 * @param {(mode: "route" | "closures") => void} props.onInteractionModeChange - Called when on mobile.
 * @returns {JSX.Element}
 */
export function InteractionModeToggle({
    COLORS,
    accentColor: accentColour,
    interactionMode,
    onInteractionModeChange,
}) {
    return (
        <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 8px", color: COLORS.text }}>Map Mode</h3>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    padding: 8,
                    background: COLORS.soft,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12,
                }}
            >
                {INTERACTION_MODE_OPTIONS.map((option) => {
                    const active = interactionMode === option.id;

                    return (
                        <button
                            type="button"
                            key={option.id}
                            onClick={() => onInteractionModeChange?.(option.id)}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                gap: 4,
                                padding: "10px 12px",
                                background: active ? accentColour : COLORS.control,
                                border: `1px solid ${active ? accentColour : COLORS.border}`,
                                borderRadius: 10,
                                color: active ? COLORS.textOnAccent : COLORS.text,
                                cursor: "pointer",
                                textAlign: "left",
                            }}
                        >
                            <span style={{ fontWeight: 800 }}>{option.label}</span>
                            <span
                                style={{
                                    fontSize: 11,
                                    lineHeight: 1.35,
                                    color: active ? COLORS.textOnAccent : COLORS.textMuted,
                                }}
                            >
                                {option.help}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
