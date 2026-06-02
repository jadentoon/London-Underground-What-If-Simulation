/**
 * Renders the mobile segmented control for route planning versus closure editing.
 *
 * The bar is only shown in mobile What-If mode and slides away while the mobile
 * control sheet is open.
 *
 * @param {Object} props - Mobile interaction mode props.
 * @param {boolean} props.isVisible - Whether the bar should be rendered.
 * @param {boolean} props.isSidebarOpen - Whether the mobile control sheet is open.
 * @param {Object} props.COLORS - Theme tokens used for styling.
 * @param {string} props.accentColor - Accent colour for the selected mode.
 * @param {"route" | "closures"} props.interactionMode - Current mobile interaction mode.
 * @param {(mode: "route" | "closures") => void} props.onInteractionModeChange - Updates the active mode.
 * @returns {JSX.Element | null} Mobile mode bar or null.
 */
export function MobileInteractionModeBar({
    isVisible,
    isSidebarOpen,
    COLORS,
    accentColor: accentColour,
    interactionMode,
    onInteractionModeChange,
}) {
    if (!isVisible) return null;

    const shouldSlideOffscreen = isSidebarOpen;

    return (
        <div
            style={{
                position: "fixed",
                left: 16,
                right: 16,
                bottom: 18,
                zIndex: 1201,
                transform: shouldSlideOffscreen ? "translateY(calc(100% + 24px))" : "translateY(0)",
                opacity: shouldSlideOffscreen ? 0 : 1,
                pointerEvents: shouldSlideOffscreen ? "none" : "auto",
                transition: "transform 220ms ease, opacity 180ms ease",
            }}
        >
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    padding: 8,
                    borderRadius: 18,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.strong,
                    backdropFilter: "blur(12px)",
                    boxShadow: COLORS.shadow,
                }}
            >
                {[
                    { id: "route", label: "Plan Routes" },
                    { id: "closures", label: "Edit Closures" },
                ].map((option) => {
                    const active = interactionMode === option.id;

                    return (
                        <button
                            key={option.id}
                            onClick={() => onInteractionModeChange(option.id)}
                            style={{
                                padding: "10px 12px",
                                borderRadius: 12,
                                border: `1px solid ${active ? accentColour : COLORS.border}`,
                                background: active ? accentColour : COLORS.subtle,
                                color: active ? COLORS.textOnAccent : COLORS.text,
                                fontWeight: 800,
                                fontSize: 13,
                                cursor: "pointer",
                            }}
                        >
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
