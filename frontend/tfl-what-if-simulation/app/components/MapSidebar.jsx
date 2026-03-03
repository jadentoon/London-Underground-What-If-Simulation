
/**
 * sidebar component for the map view, showing settings and line status information
 */


export function MapSidebar({
    isSidebarOpen,
    COLORS,
    hypotheticalSettingsEnabled,
    accentColor,
    onToggleWhatIfMode,
    onResetClosures,
    effectiveLines,
    closedLines,
    partialLines,
    onLineToggle,
    lineStatusLabel,
    lineStatusColor,
    lineStatusBg,
    isLiveLines,
    linesUpdatedAt,
    trainFeedSource,
    trainFeedUpdatedAt,
    trainFeedReason,
    trainFeedCount,
}) {
    const partlyClosedLines = partialLines || new Set();
    const isLiveTrainFeed = trainFeedSource === "live";
    const trainFeedColor = isLiveTrainFeed ? "#22c55e" : "#f59e0b";
    const trainFeedBg = isLiveTrainFeed ? "rgba(34, 197, 94, 0.12)" : "rgba(245, 158, 11, 0.12)";
    const trainFeedLabel = isLiveTrainFeed ? "Live TfL arrivals" : "Schedule fallback";

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: isSidebarOpen ? 0 : -280,
                width: 280,
                height: "100vh",
                background: COLORS.card,
                backdropFilter: "blur(8px)",
                borderRight: `1px solid ${COLORS.border}`,
                transition: "left 0.3s ease",
                zIndex: 1000,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 20,
                overflowY: "auto",
            }}
        >
            <div>
                <h2 style={{ color: COLORS.text }}>Settings</h2>
                <div
                    style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "rgba(0, 0, 0, 0.3)",
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        color: COLORS.text,
                        fontSize: 14,
                        fontWeight: 500,
                    }}
                >
                    <span>What-If Mode</span>
                    <button
                        onClick={onToggleWhatIfMode}
                        style={{
                            position: "relative",
                            width: 51,
                            height: 31,
                            background: hypotheticalSettingsEnabled ? accentColor : "rgba(120, 120, 128, 0.32)",
                            borderRadius: 15.5,
                            border: "none",
                            cursor: "pointer",
                            transition: "background-color 0.3s ease",
                            outline: "none",
                            padding: 0,
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                top: 2,
                                left: hypotheticalSettingsEnabled ? 22 : 2,
                                width: 27,
                                height: 27,
                                background: "#fff",
                                borderRadius: "50%",
                                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1)",
                                transition: "left 0.3s ease",
                            }}
                        />
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
                {hypotheticalSettingsEnabled && (
                    <button
                        onClick={onResetClosures}
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            marginBottom: 12,
                            background: "#ef4444",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontWeight: 700,
                            boxShadow: "0 0 10px rgba(239,68,68,0.4)",
                            transition: "background-color 0.2s ease, box-shadow 0.2s ease",
                        }}
                    >
                        Reset all closures
                    </button>
                )}
                <h3 style={{ margin: "0 0 4px", color: COLORS.text }}>Lines</h3>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 8px",
                        marginBottom: 8,
                        borderRadius: 8,
                        background: lineStatusBg,
                        color: lineStatusColor,
                        fontSize: 12,
                    }}
                >
                    <span
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: 999,
                            background: lineStatusColor,
                            boxShadow: `0 0 8px ${lineStatusColor}80`,
                        }}
                    />
                    <span>
                        {lineStatusLabel}
                        {isLiveLines && linesUpdatedAt ? ` · ${linesUpdatedAt.toLocaleTimeString()}` : ""}
                    </span>
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 8px",
                        marginBottom: 8,
                        borderRadius: 8,
                        background: trainFeedBg,
                        color: trainFeedColor,
                        fontSize: 12,
                    }}
                >
                    <span
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: 999,
                            background: trainFeedColor,
                            boxShadow: `0 0 8px ${trainFeedColor}80`,
                        }}
                    />
                    <span>
                        {`Train feed: ${trainFeedLabel}`}
                        {trainFeedCount > 0 ? ` · ${trainFeedCount} trains visible right now` : ""}
                        {trainFeedUpdatedAt ? ` · ${new Date(trainFeedUpdatedAt).toLocaleTimeString()}` : ""}
                    </span>
                </div>
                {!isLiveTrainFeed && trainFeedReason && (
                    <div
                        style={{
                            marginTop: -2,
                            marginBottom: 8,
                            padding: "6px 8px",
                            borderRadius: 8,
                            border: `1px solid ${COLORS.border}`,
                            color: COLORS.textMuted,
                            fontSize: 11,
                            lineHeight: 1.35,
                            background: "rgba(0, 0, 0, 0.2)",
                        }}
                    >
                        {trainFeedReason}
                    </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {effectiveLines.map((line) => {
                        const isClosed = closedLines.has(line.id);
                        const isPartlyClosed = !isClosed && partlyClosedLines.has(line.id);
                        const disabled = !hypotheticalSettingsEnabled;
                        const statusLabel = isClosed ? "Closed" : (isPartlyClosed ? "Partly Closed" : "Open");
                        const statusColor = isClosed ? "#f87171" : (isPartlyClosed ? "#f59e0b" : "#22c55e");
                        const buttonBackground = disabled
                            ? (
                                isClosed
                                    ? "rgba(239, 68, 68, 0.18)"
                                    : (isPartlyClosed ? "rgba(245, 158, 11, 0.18)" : "rgba(100, 116, 139, 0.2)")
                            )
                            : "rgba(0,0,0,0.3)";
                        return (
                            <button
                                key={line.id}
                                onClick={() => onLineToggle(line.id)}
                                disabled={disabled}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    width: "100%",
                                    padding: "10px 12px",
                                    background: buttonBackground,
                                    border: `1px solid ${COLORS.border}`,
                                    borderRadius: 8,
                                    color: COLORS.text,
                                    cursor: disabled ? "not-allowed" : "pointer",
                                    opacity: isClosed ? 0.6 : (isPartlyClosed ? 0.9 : 1),
                                    transition: "background-color 0.2s ease, opacity 0.2s ease",
                                }}
                            >
                                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span
                                        style={{
                                            width: 14,
                                            height: 14,
                                            borderRadius: 999,
                                            backgroundColor: line.color,
                                            border: "1px solid #fff",
                                            boxShadow: isClosed ? "none" : (isPartlyClosed ? "0 0 8px #f59e0b80" : `0 0 8px ${line.color}80`),
                                        }}
                                    />
                                    {line.label}
                                </span>
                                <span style={{ fontSize: 12, color: statusColor }}>
                                    {statusLabel}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
