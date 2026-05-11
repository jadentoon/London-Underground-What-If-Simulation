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
            <div
                style={{
                    marginBottom: 12,
                    paddingBottom: 10,
                    borderBottom: `1px solid ${COLORS.border}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                    fontSize: 11,
                    lineHeight: 1.4,
                }}
            >
                <div style={{ color: "#e2e8f0", fontWeight: 700 }}>Map Controls</div>
                <div>
                    <span style={{ color: accentColor }}>Click station:</span>{" "}
                    {hypotheticalSettingsEnabled ? "plan a route" : "set a start or choose a destination"}
                </div>
                <div>
                    <span style={{ color: accentColor }}>Click the same station again:</span>{" "}
                    clear the selected start point
                </div>
                <div>
                    <span style={{ color: accentColor }}>Click empty map space:</span>{" "}
                    clear the current route
                </div>

                {hypotheticalSettingsEnabled && (
                    <>
                        <div>
                            <span style={{ color: accentColor }}>Double-click station:</span>{" "}
                            close or reopen it
                        </div>
                        <div>
                            <span style={{ color: accentColor }}>Double-click line:</span>{" "}
                            close or reopen it
                        </div>
                        <div>
                            <span style={{ color: accentColor }}>Sidebar:</span>{" "}
                            close or reopen lines from the line list
                        </div>
                    </>
                )}
            </div>

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
