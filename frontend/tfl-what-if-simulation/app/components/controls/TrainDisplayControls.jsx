/**
 * Train visibility and line filtering controls for the map sidebar.
 * 
 * Lets users show or hide live train markers and optionally restrict visible
 * trains to selected Underground lines. This component is presentational:
 * parent components own the selected filter mode and visible line set.
 * @param {Object} props
 * @param {Object} props.COLORS - Theme colour tokens for the control panel.
 * @param {string} props.accentColor - Colour used for the active filter option.
 * @param {Array<Object>} props.effectiveLines - Lines available in the current map state.
 * @param {boolean} props.showTrains - Whether train markers are currently visible.
 * @param {"all" | "selected"} props.trainFilterMode - Current train line filtering mode.
 * @param {Set<string>} props.visibleTrainLines - Line ids currently selected for train visibility.
 * @param {() => void} props.onToggleShowTrains - Called when train visibility is toggled.
 * @param {(mode: "all" | "selected") => void} props.onTrainFilterModeChange - Called when the filter mode changes.
 * @param {(lineId: string) => void} props.onToggleVisibleTrainLine - Called when a line is shown or hidden.
 */
export function TrainDisplayControls({
    COLORS,
    accentColor: accentColour,
    effectiveLines,
    showTrains,
    trainFilterMode,
    visibleTrainLines,
    onToggleShowTrains,
    onTrainFilterModeChange,
    onToggleVisibleTrainLine,
}) {
    return (
        <div style={{ marginTop: 4, marginBottom: 4 }}>
            <h3 style={{ margin: "0 0 8px", color: COLORS.text }}>Train Display</h3>
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    padding: "10px 12px",
                    background: COLORS.soft,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 10,
                }}
            >
                <button
                    type="button"
                    onClick={onToggleShowTrains}
                    data-tour="show-trains-toggle"
                    aria-label="Toggle show trains"
                    aria-pressed={showTrains}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "8px 10px",
                        background: COLORS.control,
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
                                        type="button"
                                        key={option.id}
                                        onClick={() => onTrainFilterModeChange(option.id)}
                                        style={{
                                            flex: 1,
                                            padding: "8px 10px",
                                            background: active ? accentColour : COLORS.control,
                                            border: `1px solid ${active ? accentColour : COLORS.border}`,
                                            borderRadius: 8,
                                            color: active ? COLORS.textOnAccent : COLORS.text,
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
                                            type="button"
                                            key={`train-line-${line.id}`}
                                            onClick={() => onToggleVisibleTrainLine(line.id)}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                width: "100%",
                                                padding: "8px 10px",
                                                background: selected ? COLORS.selectedControl : COLORS.control,
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
    );
}
