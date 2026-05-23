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
    isSidebarOpen = false,
    COLORS,
    accentColor: accentColour,
    layout,
    hypotheticalSettingsEnabled = false,
    lineColours,
    lineLabels,
    onResetView,
    mobileInteractionMode = "route",
}) {
    const isMobilePortrait = layout?.isMobilePortrait ?? false;
    const hasMobileModeBar = layout?.hasMobileModeBar ?? false;
    const hasPath = !!routeInfo?.hasPath;
    const stops = routeInfo?.stops ?? [];
    const shouldSlideOffscreen = isMobilePortrait && isSidebarOpen;
    const groupedLegs = routeInfo?.groupedLegs ?? [];
    const changes = routeInfo?.changeCount ?? 0;
    const totalTravelSeconds = routeInfo?.totalTravelSeconds ?? 0;
    const stopCount = Math.max(0, stops.length - 1);
    const bottomOffset = isMobilePortrait ? (hasMobileModeBar ? 86 : 18) : (hypotheticalSettingsEnabled ? 70 : 25);
    const actionColour = accentColour ?? "#3b82f6";
    const mobileInstruction = hypotheticalSettingsEnabled && mobileInteractionMode === "closures"
        ? "Select stations or lines on the map to close or reopen them."
        : "Select a start station, then select your destination.";

    return (
        <div
            style={{
                position: "absolute",
                left: isMobilePortrait ? 16 : "auto",
                right: isMobilePortrait ? 16 : 70,
                bottom: bottomOffset,
                zIndex: 1200,
                width: isMobilePortrait ? "auto" : 340,
                maxWidth: "calc(100vw - 32px)",
                transform: shouldSlideOffscreen ? "translateY(calc(100% + 24px))" : "translateY(0)",
                transition: isMobilePortrait ? "transform 220ms ease" : undefined,
                pointerEvents: shouldSlideOffscreen ? "none" : "auto",
            }}
        >
            {!isOpen && (
                <div
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
                        boxShadow: isMobilePortrait ? COLORS.shadow : "none",
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <div style={{ fontWeight: 700, color: COLORS.textStrong }}>
                            {isMobilePortrait ? "Route Planner" : "Route"}
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                            {hasPath
                                ? `${routeInfo?.startName ?? "Start"} -> ${routeInfo?.endName ?? "End"}`
                                : (isMobilePortrait ? mobileInstruction : "No route selected")
                            }
                        </div>
                        {isMobilePortrait && hasPath && (
                            <div style={{ marginTop: 6, fontSize: 12, color: COLORS.textMuted }}>
                                {`${formatDuration(totalTravelSeconds)} · ${changes} change${changes === 1 ? "" : "s"} · ${stopCount} stops`}
                            </div>
                        )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {isMobilePortrait && onResetView && (
                            <button
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onResetView();
                                }}
                                style={{
                                    padding: "8px 10px",
                                    borderRadius: 999,
                                    border: `1px solid ${COLORS.border}`,
                                    background: COLORS.subtle,
                                    color: COLORS.text,
                                    fontWeight: 700,
                                    fontSize: 12,
                                    cursor: "pointer",
                                }}
                            >
                                Reset
                            </button>
                        )}
                        <button
                            onClick={onToggle}
                            style={{
                                padding: "6px 10px",
                                borderRadius: 999,
                                border: `1px solid ${COLORS.border}`,
                                background: "transparent",
                                color: actionColour,
                                fontWeight: 700,
                                fontSize: 12,
                                cursor: "pointer",
                            }}
                        >
                            View Route
                        </button>
                    </div>
                </div>
            )}

            {isOpen && (
                <div
                    style={{
                        border: `1px solid ${COLORS.border}`,
                        background: COLORS.card,
                        color: COLORS.text,
                        backdropFilter: "blur(10px)",
                        boxShadow: COLORS.shadowStrong,
                        overflow: "hidden",
                        borderRadius: isMobilePortrait ? 22 : 16,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 12px",
                            borderBottom: `1px solid ${COLORS.border}`,
                        }}>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <div style={{ fontWeight: 800, color: COLORS.textStrong }}>
                                Route Details
                            </div>
                            <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                                {hasPath
                                    ? `${routeInfo?.startName ?? "Start"} -> ${routeInfo?.endName ?? "End"}: ${stops.length - 1} stops`
                                    : mobileInstruction
                                }
                            </div>
                        </div>

                        <button
                            onClick={onToggle}
                            style={{
                                borderRadius: 12,
                                border: `1px solid ${COLORS.border}`,
                                background: COLORS.subtle,
                                color: COLORS.text,
                                padding: "6px 10px",
                                cursor: "pointer",
                            }}
                        >
                            Close
                        </button>
                    </div>

                    <div style={{ padding: 12, maxHeight: isMobilePortrait ? "52vh" : 340, overflow: "auto" }}>
                        {isMobilePortrait && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: hasPath ? "repeat(3, minmax(0, 1fr))" : "1fr",
                                        gap: 8,
                                    }}
                                >
                                    {hasPath ? (
                                        <>
                                            <div
                                                style={{
                                                    padding: "10px 12px",
                                                    borderRadius: 14,
                                                    border: `1px solid ${COLORS.border}`,
                                                    background: COLORS.subtle,
                                                }}
                                            >
                                                <div style={{ fontSize: 11, color: COLORS.textMuted }}>Duration</div>
                                                <div style={{ marginTop: 4, fontWeight: 800, color: COLORS.textStrong }}>
                                                    {formatDuration(totalTravelSeconds)}
                                                </div>
                                            </div>
                                            <div
                                                style={{
                                                    padding: "10px 12px",
                                                    borderRadius: 14,
                                                    border: `1px solid ${COLORS.border}`,
                                                    background: COLORS.subtle,
                                                }}
                                            >
                                                <div style={{ fontSize: 11, color: COLORS.textMuted }}>Changes</div>
                                                <div style={{ marginTop: 4, fontWeight: 800, color: COLORS.textStrong }}>
                                                    {changes}
                                                </div>
                                            </div>
                                            <div
                                                style={{
                                                    padding: "10px 12px",
                                                    borderRadius: 14,
                                                    border: `1px solid ${COLORS.border}`,
                                                    background: COLORS.subtle,
                                                }}
                                            >
                                                <div style={{ fontSize: 11, color: COLORS.textMuted }}>Stops</div>
                                                <div style={{ marginTop: 4, fontWeight: 800, color: COLORS.textStrong }}>
                                                    {stopCount}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div
                                            style={{
                                                padding: "12px 14px",
                                                borderRadius: 14,
                                                border: `1px solid ${COLORS.border}`,
                                                background: COLORS.subtle,
                                                color: COLORS.textMuted,
                                                fontSize: 13,
                                                lineHeight: 1.45,
                                            }}
                                        >
                                            {mobileInstruction}
                                        </div>
                                    )}
                                </div>

                                {onResetView && (
                                    <button
                                        onClick={onResetView}
                                        style={{
                                            width: "100%",
                                            padding: "10px 12px",
                                            borderRadius: 12,
                                            border: `1px solid ${actionColour}`,
                                            background: "transparent",
                                            color: actionColour,
                                            fontWeight: 700,
                                            cursor: "pointer",
                                        }}
                                    >
                                        Reset map view
                                    </button>
                                )}
                            </div>
                        )}

                        {!hasPath ? (
                            <div style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.4 }}>
                                {isMobilePortrait
                                    ? mobileInstruction
                                    : "Click a station to set a start, then click another station to create a route."
                                }
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
                                                    background: COLORS.subtle,
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
                                                            boxShadow: `0 0 0 2px ${COLORS.border}`,
                                                            flex: "0 0 auto",
                                                        }}
                                                        title={label}
                                                    />

                                                    {/* text */}
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ fontWeight: 750, color: COLORS.textStrong, fontSize: 13 }}>
                                                            {label}
                                                        </div>
                                                        <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                                                            {g.fromName} {"->"} {g.toName} • {g.stops} stop{g.stops === 1 ? "" : "s"}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* time */}
                                                <div style={{ whiteSpace: "nowrap", fontWeight: 800, color: COLORS.textStrong }}>
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
