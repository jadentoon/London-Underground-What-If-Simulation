import { useRef, useState } from "react";
import { getDelaySeverityColor as getDelaySeverityColour } from "../mapComponents/delayUtils";

function InteractionModeToggle({
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
                    background: "rgba(0, 0, 0, 0.3)",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 12,
                }}
            >
                {[
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
                ].map((option) => {
                    const active = interactionMode === option.id;

                    return (
                        <button
                            key={option.id}
                            onClick={() => onInteractionModeChange?.(option.id)}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                gap: 4,
                                padding: "10px 12px",
                                background: active ? accentColour : "rgba(15, 23, 42, 0.72)",
                                border: `1px solid ${active ? accentColour : COLORS.border}`,
                                borderRadius: 10,
                                color: active ? "#0f172a" : COLORS.text,
                                cursor: "pointer",
                                textAlign: "left",
                            }}
                        >
                            <span style={{ fontWeight: 800 }}>{option.label}</span>
                            <span
                                style={{
                                    fontSize: 11,
                                    lineHeight: 1.35,
                                    color: active ? "rgba(15, 23, 42, 0.78)" : COLORS.textMuted,
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

export function MapControlPanelContent({
    COLORS,
    hypotheticalSettingsEnabled,
    accentColor: accentColour,
    onToggleWhatIfMode,
    onResetClosures,
    savedScenarios = [],
    onSaveScenario,
    onLoadScenario,
    onDeleteScenario,
    effectiveLines,
    closedLines,
    partialLines,
    onLineToggle,
    lineStatusLabel,
    lineStatusColor: lineStatusColour,
    lineStatusBg,
    isLiveLines,
    linesUpdatedAt,
    lineDelays,
    trainFeedSource,
    trainFeedUpdatedAt,
    trainFeedReason,
    trainFeedCount,
    showTrains,
    trainFilterMode,
    visibleTrainLines,
    onToggleShowTrains,
    onTrainFilterModeChange,
    onToggleVisibleTrainLine,
    showHeading = true,
    isTouchLayout = false,
    showInteractionModeToggle = false,
    showWhatIfToggle = true,
    interactionMode = "route",
    onInteractionModeChange,
}) {
    const partlyClosedLines = partialLines || new Set();
    const isLiveTrainFeed = trainFeedSource === "live";
    const trainFeedColour = isLiveTrainFeed ? "#22c55e" : "#f59e0b";
    const trainFeedBg = isLiveTrainFeed ? "rgba(34, 197, 94, 0.12)" : "rgba(245, 158, 11, 0.12)";
    const trainFeedLabel = isLiveTrainFeed ? "Live TfL arrivals" : "Schedule fallback";
    const showFeedStatusBlocks = !hypotheticalSettingsEnabled;

    const [expandedLineId, setExpandedLineId] = useState(null);
    const [selectedScenarioId, setSelectedScenarioId] = useState("");
    const [scenarioName, setScenarioName] = useState("");
    const hoverTimeoutRef = useRef(null);

    const handleMouseEnter = (lineId, hasDelay) => {
        if (isTouchLayout || !hasDelay) return;

        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }

        hoverTimeoutRef.current = setTimeout(() => {
            setExpandedLineId(lineId);
        }, 750);
    };

    const handleMouseLeave = () => {
        if (isTouchLayout) return;

        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }

        setExpandedLineId(null);
    };

    const handleLineAction = (lineId, showDelay) => {
        if (hypotheticalSettingsEnabled) {
            onLineToggle?.(lineId);
            return;
        }

        if (isTouchLayout && showDelay) {
            setExpandedLineId((current) => (current === lineId ? null : lineId));
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {showHeading && <h2 style={{ margin: 0, color: COLORS.text }}>Settings</h2>}

            {showWhatIfToggle && (
                <div
                    style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "rgba(0, 0, 0, 0.3)",
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 12,
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
                            background: hypotheticalSettingsEnabled ? accentColour : "rgba(120, 120, 128, 0.32)",
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
            )}

            {showInteractionModeToggle && hypotheticalSettingsEnabled && (
                <InteractionModeToggle
                    COLORS={COLORS}
                    accentColor={accentColour}
                    interactionMode={interactionMode}
                    onInteractionModeChange={onInteractionModeChange}
                />
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {hypotheticalSettingsEnabled && (
                    <button
                        onClick={onResetClosures}
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            background: "#ef4444",
                            color: "#fff",
                            border: "none",
                            borderRadius: 10,
                            cursor: "pointer",
                            fontWeight: 700,
                            boxShadow: "0 0 10px rgba(239, 68, 68, 0.4)",
                            transition: "background-color 0.2s ease, box-shadow 0.2s ease",
                        }}
                    >
                        Reset all closures
                    </button>
                )}

                {hypotheticalSettingsEnabled && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                            padding: "12px",
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 12,
                            background: "rgba(0, 0, 0, 0.3)",
                        }}
                    >
                        <div>
                            <h3 style={{ margin: "0 0 4px", color: COLORS.text }}>Saved Scenarios</h3>
                            <div style={{ fontSize: 12, lineHeight: 1.4, color: COLORS.textMuted }}>
                                Save the current closed stations and lines, then load them again later from this browser.
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 8 }}>
                            <input
                                type="text"
                                value={scenarioName}
                                onChange={(event) => setScenarioName(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key !== "Enter") return;

                                    const savedScenario = onSaveScenario?.(scenarioName);
                                    if (savedScenario?.id) {
                                        setSelectedScenarioId(savedScenario.id);
                                        setScenarioName("");
                                    }
                                }}
                                placeholder="Scenario name"
                                style={{
                                    minWidth: 0,
                                    padding: "10px 12px",
                                    background: "rgba(15, 23, 42, 0.85)",
                                    color: COLORS.text,
                                    border: `1px solid ${COLORS.border}`,
                                    borderRadius: 10,
                                    outline: "none",
                                }}
                            />
                            <button
                                onClick={() => {
                                    const savedScenario = onSaveScenario?.(scenarioName);
                                    if (savedScenario?.id) {
                                        setSelectedScenarioId(savedScenario.id);
                                        setScenarioName("");
                                    }
                                }}
                                style={{
                                    padding: "10px 12px",
                                    background: accentColour,
                                    color: "#0f172a",
                                    border: "none",
                                    borderRadius: 10,
                                    cursor: "pointer",
                                    fontWeight: 800,
                                }}
                            >
                                Save
                            </button>
                        </div>

                        <select
                            value={selectedScenarioId}
                            onChange={(event) => setSelectedScenarioId(event.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px 12px",
                                background: "rgba(15, 23, 42, 0.85)",
                                color: COLORS.text,
                                border: `1px solid ${COLORS.border}`,
                                borderRadius: 10,
                                outline: "none",
                            }}
                        >
                            <option value="">{savedScenarios.length ? "Choose saved scenario" : "No saved scenarios yet"}</option>
                            {savedScenarios.map((scenario) => (
                                <option key={scenario.id} value={scenario.id}>
                                    {scenario.name} ({scenario.closedStations.length} stations, {scenario.closedLines.length} lines)
                                </option>
                            ))}
                        </select>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <button
                                onClick={() => selectedScenarioId && onLoadScenario?.(selectedScenarioId)}
                                disabled={!selectedScenarioId}
                                style={{
                                    padding: "9px 10px",
                                    background: selectedScenarioId ? "rgba(34, 197, 94, 0.18)" : "rgba(148, 163, 184, 0.12)",
                                    color: selectedScenarioId ? "#86efac" : COLORS.textMuted,
                                    border: `1px solid ${selectedScenarioId ? "#22c55e" : COLORS.border}`,
                                    borderRadius: 10,
                                    cursor: selectedScenarioId ? "pointer" : "not-allowed",
                                    fontWeight: 700,
                                }}
                            >
                                Load
                            </button>
                            <button
                                onClick={() => {
                                    if (!selectedScenarioId) return;
                                    onDeleteScenario?.(selectedScenarioId);
                                    setSelectedScenarioId("");
                                }}
                                disabled={!selectedScenarioId}
                                style={{
                                    padding: "9px 10px",
                                    background: selectedScenarioId ? "rgba(239, 68, 68, 0.16)" : "rgba(148, 163, 184, 0.12)",
                                    color: selectedScenarioId ? "#fca5a5" : COLORS.textMuted,
                                    border: `1px solid ${selectedScenarioId ? "#ef4444" : COLORS.border}`,
                                    borderRadius: 10,
                                    cursor: selectedScenarioId ? "pointer" : "not-allowed",
                                    fontWeight: 700,
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                )}

                <h3 style={{ margin: "0 0 4px", color: COLORS.text }}>Lines</h3>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 8px",
                        borderRadius: 8,
                        background: lineStatusBg,
                        color: lineStatusColour,
                        fontSize: 12,
                    }}
                >
                    <span
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: 999,
                            background: lineStatusColour,
                            boxShadow: `0 0 8px ${lineStatusColour}80`,
                        }}
                    />
                    <span>
                        {lineStatusLabel}
                        {isLiveLines && linesUpdatedAt ? ` · ${linesUpdatedAt.toLocaleTimeString()}` : ""}
                    </span>
                </div>

                {hypotheticalSettingsEnabled && (
                    <div
                        style={{
                            marginTop: -2,
                            fontSize: 12,
                            lineHeight: 1.45,
                            color: COLORS.textMuted,
                        }}
                    >
                        Use the line list below to close or reopen lines from the sidebar.
                    </div>
                )}

                {showFeedStatusBlocks && (
                    <>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "6px 8px",
                                borderRadius: 8,
                                background: trainFeedBg,
                                color: trainFeedColour,
                                fontSize: 12,
                            }}
                        >
                            <span
                                style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: 999,
                                    background: trainFeedColour,
                                    boxShadow: `0 0 8px ${trainFeedColour}80`,
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
                    </>
                )}

                {!hypotheticalSettingsEnabled && (
                    <div style={{ marginTop: 4, marginBottom: 4 }}>
                        <h3 style={{ margin: "0 0 8px", color: COLORS.text }}>Train Display</h3>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                                padding: "10px 12px",
                                background: "rgba(0, 0, 0, 0.3)",
                                border: `1px solid ${COLORS.border}`,
                                borderRadius: 10,
                            }}
                        >
                            <button
                                onClick={onToggleShowTrains}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    width: "100%",
                                    padding: "8px 10px",
                                    background: "rgba(15, 23, 42, 0.65)",
                                    border: `1px solid ${COLORS.border}`,
                                    borderRadius: 8,
                                    color: COLORS.text,
                                    cursor: "pointer",
                                }}
                            >
                                <span>Show trains</span>
                                <span style={{ color: showTrains ? "#22c55e" : COLORS.textMuted }}>
                                    {showTrains ? "On" : "Off"}
                                </span>
                            </button>

                            {showTrains && (
                                <>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        {[
                                            { id: "all", label: "All lines" },
                                            { id: "selected", label: "Selected lines" },
                                        ].map((option) => {
                                            const active = trainFilterMode === option.id;

                                            return (
                                                <button
                                                    key={option.id}
                                                    onClick={() => onTrainFilterModeChange(option.id)}
                                                    style={{
                                                        flex: 1,
                                                        padding: "8px 10px",
                                                        background: active ? accentColour : "rgba(15, 23, 42, 0.65)",
                                                        border: `1px solid ${active ? accentColour : COLORS.border}`,
                                                        borderRadius: 8,
                                                        color: active ? "#0f172a" : COLORS.text,
                                                        cursor: "pointer",
                                                        fontWeight: active ? 700 : 500,
                                                    }}
                                                >
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {trainFilterMode === "selected" && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                            {effectiveLines.map((line) => {
                                                const selected = visibleTrainLines.has(line.id);

                                                return (
                                                    <button
                                                        key={`train-line-${line.id}`}
                                                        onClick={() => onToggleVisibleTrainLine(line.id)}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            width: "100%",
                                                            padding: "8px 10px",
                                                            background: selected ? "rgba(34, 197, 94, 0.14)" : "rgba(15, 23, 42, 0.65)",
                                                            border: `1px solid ${selected ? "#22c55e" : COLORS.border}`,
                                                            borderRadius: 8,
                                                            color: COLORS.text,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                            <span
                                                                style={{
                                                                    width: 12,
                                                                    height: 12,
                                                                    borderRadius: 999,
                                                                    backgroundColor: line.color,
                                                                    border: "1px solid #fff",
                                                                }}
                                                            />
                                                            {line.label}
                                                        </span>
                                                        <span style={{ color: selected ? "#22c55e" : COLORS.textMuted }}>
                                                            {selected ? "Shown" : "Hidden"}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                <h3 style={{ margin: "0 0 8px", color: COLORS.text }}>Line Status</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {effectiveLines.map((line) => {
                        const isClosed = closedLines.has(line.id);
                        const isPartlyClosed = !isClosed && partlyClosedLines.has(line.id);
                        const delay = lineDelays.get(line.id);
                        const showDelay = !hypotheticalSettingsEnabled && isLiveLines && delay;
                        const canToggleLine = hypotheticalSettingsEnabled;
                        const canInspectDelay = isTouchLayout && showDelay;
                        const statusLabel = showDelay
                            ? (delay.description === "Good Service" ? "Open" : delay.description)
                            : (isClosed ? "Closed" : (isPartlyClosed ? "Partly Closed" : "Open"));
                        const statusColour = showDelay
                            ? getDelaySeverityColour(delay.severity)
                            : (isClosed ? "#f87171" : (isPartlyClosed ? "#f59e0b" : "#22c55e"));
                        const buttonBackground = !canToggleLine
                            ? (
                                isClosed
                                    ? "rgba(239, 68, 68, 0.18)"
                                    : (isPartlyClosed ? "rgba(245, 158, 11, 0.18)" : "rgba(100, 116, 139, 0.2)")
                            )
                            : "rgba(0,0,0,0.3)";
                        const isExpanded = expandedLineId === line.id;

                        return (
                            <div
                                key={line.id}
                                onMouseEnter={() => handleMouseEnter(line.id, showDelay)}
                                onMouseLeave={handleMouseLeave}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    width: "100%",
                                    background: buttonBackground,
                                    border: `1px solid ${COLORS.border}`,
                                    borderRadius: 8,
                                    color: COLORS.text,
                                    opacity: isClosed ? 0.6 : (isPartlyClosed ? 0.9 : 1),
                                    transition: "all 0.3s ease",
                                    overflow: "hidden",
                                }}
                            >
                                <button
                                    onClick={() => handleLineAction(line.id, showDelay)}
                                    disabled={!canToggleLine && !canInspectDelay}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        width: "100%",
                                        padding: "10px 12px",
                                        background: "transparent",
                                        border: "none",
                                        color: COLORS.text,
                                        cursor: canToggleLine || canInspectDelay ? "pointer" : (showDelay ? "help" : "default"),
                                        transition: "background-color 0.2s ease",
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
                                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        {showDelay && (
                                            <span
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: "50%",
                                                    backgroundColor: getDelaySeverityColour(delay.severity),
                                                    boxShadow: `0 0 6px ${getDelaySeverityColour(delay.severity)}`,
                                                }}
                                            />
                                        )}
                                        <span style={{ fontSize: 12, color: statusColour }}>
                                            {statusLabel}
                                        </span>
                                    </span>
                                </button>

                                {isExpanded && showDelay && (
                                    <div
                                        style={{
                                            padding: "0 12px 12px 12px",
                                            fontSize: 12,
                                            borderTop: `1px solid ${COLORS.border}`,
                                            animation: "expandDown 0.3s ease",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                                marginTop: 8,
                                                marginBottom: 8,
                                                paddingBottom: 8,
                                                borderBottom: `1px solid ${COLORS.border}`,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: "50%",
                                                    backgroundColor: getDelaySeverityColour(delay.severity),
                                                }}
                                            />
                                            <span style={{ fontWeight: 700, color: getDelaySeverityColour(delay.severity) }}>
                                                {delay.description}
                                            </span>
                                        </div>

                                        {delay.reason && (
                                            <div style={{ marginBottom: 8 }}>
                                                <strong style={{ color: "#94a3b8" }}>Reason:</strong>
                                                <div style={{ marginTop: 4, color: "#cbd5e1" }}>{delay.reason}</div>
                                            </div>
                                        )}

                                        {delay.additionalInfo && (
                                            <div>
                                                <strong style={{ color: "#94a3b8" }}>Additional Info:</strong>
                                                <div style={{ marginTop: 4, color: "#cbd5e1" }}>{delay.additionalInfo}</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
