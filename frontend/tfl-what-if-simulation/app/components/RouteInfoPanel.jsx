'use client';

function formatDuration(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return "-";
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
}

export function RouteInfoPanel({
    isOpen,
    onToggle,
    routeInfo,
    COLORS,
    accentColour,
    hypotheticalSettingsEnabled = false,
    lineColours,
    lineLabels
}) {
    const hasPath = !!routeInfo?.hasPath;
    const stops = routeInfo?.stops ?? [];

    const groupedLegs = routeInfo?.groupedLegs ?? [];
    const totalLabel = formatDuration(routeInfo?.totalTravelSeconds);
    const changes = routeInfo?.changeCount ?? 0;

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
                                ? `${routeInfo?.startName ?? "Start"} -> ${routeInfo?.endName ?? "End"}`
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
                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8 }}>
                                        Line Segments
                                    </div>
                                </div>

                                <div style={{ display: "grid", gap: 10 }}>
                                    {groupedLegs.map((g, idx) => {
                                        const colour = lineColours?.[g.line] ?? "#94a3b8";
                                        const label = g.line === "unknown"
                                            ? "Unknown line"
                                            : `${(lineLabels?.[g.line] ?? g.line)}`;

                                        return (
                                            <div
                                                key={`${g.line}-${idx}-${g.fromName}-${g.toName}`}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    justifyContent: "space-between",
                                                    gap: 12,
                                                    padding: "10px 10px",
                                                    borderRadius: 12,
                                                    border: `1px solid ${COLORS.border}`,
                                                    background: "rgba(0,0,0,0.12)",
                                                }}
                                            >
                                                <div style={{ display: "flex", gap: 10, minWidth: 0 }}>
                                                    {/* dot */}
                                                    <div
                                                        style={{
                                                            width: 10,
                                                            height: 10,
                                                            marginTop: 4,
                                                            borderRadius: 999,
                                                            background: colour,
                                                            boxShadow: "0 0 0 2px rgba(0,0,0,0.25)",
                                                            flex: "0 0 auto",
                                                        }}
                                                        title={label}
                                                    />

                                                    {/* text */}
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ fontWeight: 750, color: "#e2e8f0", fontSize: 13 }}>
                                                            {label}
                                                        </div>
                                                        <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                                                            {g.fromName} {"->"} {g.toName} • {g.stops} stop{g.stops === 1 ? "" : "s"}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* time */}
                                                <div style={{ whiteSpace: "nowrap", fontWeight: 800, color: "#e2e8f0" }}>
                                                    {formatDuration(g.travelTimeSeconds)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}