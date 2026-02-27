'use client';

export function RouteInfoPanel({
    isOpen,
    onToggle,
    routeInfo,
    COLORS,
    accentColour,
    hypotheticalSettingsEnabled = false,
}) {
    const hasPath = !!routeInfo?.hasPath;
    const stops = routeInfo?.stops ?? [];

    const rightOffset = hypotheticalSettingsEnabled ? 70 : 16;
    const bottomOffset = hypotheticalSettingsEnabled ? 70 : 16;

    return (
        <div
            style={{
                position: "absolute",
                right: rightOffset,
                bottom: bottomOffset,
                zIndex: 1200,
                width: 340,
                maxWidth: "calc(100vw - 32px)",
                pointerEvents: "auto",
            }}
        >
            {/* Collapsed Pill */}
            {!isOpen && (
                <button
                    onClick={onToggle}
                    style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "10px 12px",
                        borderRadius: 14,
                        border: `1px solid ${COLORS.border}`,
                        background: COLORS.card,
                        color: COLORS.text,
                        backdropFilter: "blur(10px)",
                        cursor: "pointer",
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <div style={{ fontWeight: 700, color: "#e2e8f0" }}>Route</div>
                        <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                            {hasPath
                                ? `${stops.length - 1} stops: ${routeInfo?.startName ?? "Start"} -> ${routeInfo?.endName ?? "End"}`
                                : "No route selected"
                            }
                        </div>
                    </div>

                    <div
                        style={{
                            padding: "6px 10px",
                            borderRadius: 999,
                            border: `1px solid ${COLORS.border}`,
                            color: accentColour,
                            fontWeight: 700,
                            fontSize: 12,
                        }}
                    >
                        Open
                    </div>
                </button>
            )}

            {/* Expanded Panel */}
            {isOpen && (
                <div
                    style={{
                        borderRadius: 16,
                        border: `1px solid ${COLORS.border}`,
                        background: COLORS.card,
                        color: COLORS.text,
                        backdropFilter: "blur(10px)",
                        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
                        overflow: "hidden",
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 12px",
                            borderBottom: `1px solid ${COLORS.border}`,
                        }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <div style={{ fontWeight: 800, color: "#e2e8f0" }}>Route Details</div>
                            <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                                {hasPath
                                    ? `${routeInfo?.startName ?? "Start"} -> ${routeInfo?.endName ?? "End"}: ${stops.length - 1} stops`
                                    : "Select two stations to generate a route"
                                }
                            </div>
                        </div>

                        <button
                            onClick={onToggle}
                            style={{
                                borderRadius: 12,
                                border: `1px solid ${COLORS.border}`,
                                background: "rgba(0,0,0,0.15)",
                                color: COLORS.text,
                                padding: "6px 10px",
                                cursor: "pointer", 
                            }}
                        >
                            Close
                        </button>
                    </div>

                    {/* Body */}
                    <div style={{ padding: 12, maxHeight: 340, overflow: "auto" }}>
                        {!hasPath ? (
                            <div style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.4 }}>
                                Click a station to set a start, then click another station to create a route.
                            </div>
                        ) : (
                            <>
                                {/* Stops List */}
                                <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8 }}>
                                    Stops (in order)
                                </div>

                                <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6}}>
                                    {stops.map((s) => (
                                        <li key={s.id} style={{ fontSize: 13, lineHeight: 1.3 }}>
                                            <span style={{ color: "#e2e8f0, fonWeight: 650" }}>{s.name}</span>
                                        </li>
                                    ))}
                                </ol>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}