import { useState } from "react";

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
    const [showControls, setShowControls] = useState(false);

    if (isMobilePortrait) return null;

    return (
        <div
            data-tour="map-controls-box"
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
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    marginBottom: showControls ? 12 : 10,
                }}
            >
                <div style={{ color: COLORS.textStrong, fontWeight: 700 }}>Map Controls</div>
                <button
                    onClick={() => setShowControls((value) => !value)}
                    data-tour="map-controls-show-button"
                    style={{
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: `1px solid ${COLORS.border}`,
                        background: COLORS.subtle,
                        color: COLORS.text,
                        cursor: "pointer",
                        fontWeight: 700,
                        fontFamily: "monospace",
                        fontSize: 12,
                    }}
                >
                    {showControls ? "Hide" : "Show"}
                </button>
            </div>

            {showControls && (
                <>
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
                        <div>
                            <span style={{ color: accentColor }}>Click station:</span>{" "}
                            selects station for route planning,
                            <br /> 
                            sets start or destination depending on click order
                        </div>
                        <div>
                            <span style={{ color: accentColor }}>Click the same station again:</span>{" "}
                            clear the selected station
                        </div>
                        <div>
                            <span style={{ color: accentColor }}>Click empty map space:</span>{" "}
                            clear the current selected route
                        </div>
                        {hypotheticalSettingsEnabled && (
                            <>
                                <div>
                                    <span style={{ color: accentColor }}>Double-click station:</span>{" "}
                                    close or reopen station
                                </div>
                                <div>
                                    <span style={{ color: accentColor }}>Double-click line:</span>{" "}
                                    close or reopen line
                                </div>
                                <div>
                                    <span style={{ color: accentColor }}>Sidebar:</span>{" "}
                                    close or reopen lines from the line list
                                </div>
                            </>
                        )}

                        <div>
                            <div>
                                <span style={{ color: accentColor }}>Zoom map:</span>{" "}
                                use the + and - keyboard keys, on screen +/- buttons,
                                <br />
                                mouse scroll wheel or trackpad pinch to zoom
                            </div>
                        </div>
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
                </>
            )}

            <button
                onClick={onResetView}
                style={{
                    marginTop: showControls ? 10 : 0,
                    width: "100%",
                    padding: "8px 10px",
                    background: accentColor,
                    color: COLORS.textOnAccent,
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
