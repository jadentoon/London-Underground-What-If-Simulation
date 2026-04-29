/**
 * Info box with the current zoom level and center coordinates, as well as a reset view button
 */
export function MapHud({
    hypotheticalSettingsEnabled,
    isSidebarOpen,
    layout,
    COLORS,
    accentColor,
    hudState,
    onResetView,
}) {
    const isMobilePortrait = layout?.isMobilePortrait ?? false;
    const sidebarOffset = layout?.sidebarOffset ?? null;
    const leftOffset = hypotheticalSettingsEnabled ? 85 : 16;

    if (isMobilePortrait) return null;

    return (
        <div
            style={{
                position: "fixed",
                bottom: hypotheticalSettingsEnabled ? 85 : 16,
                left: sidebarOffset ?? (isSidebarOpen ? 365 : leftOffset),
                background: COLORS.card,
                backdropFilter: "blur(8px)",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                padding: 12,
                fontFamily: "monospace",
                fontSize: 13,
                color: COLORS.text,
                transition: "bottom 0.3s ease, left 0.3s ease",
                zIndex: 1000,
            }}
        >
            <div>
                <span style={{ color: accentColor }}>Zoom:</span>{" "}
                {hudState.zoom}
            </div>
            <div>
                <span style={{ color: accentColor }}>Center:</span>{" "}
                {hudState.center.lat.toFixed(4)},{" "}
                {hudState.center.lng.toFixed(4)}
            </div>
            <button
                onClick={onResetView}
                style={{
                    marginTop: 10,
                    width: "100%",
                    padding: "8px 10px",
                    background: accentColor,
                    color: "#0a0f1a",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 700,
                    fontFamily: "monospace",
                }}
            >
                Reset View
            </button>
        </div>
    );
}
