import { useState } from "react";

/**
 * Saved scenario controls for What-If mode.
 * 
 * Lets users name the current closure setup, save it locally, and later load
 * or delete saved closure scenarios. This component owns only the temporary UI
 * state for the input field and selected scenario id and scenario persistence
 * is handled by the parent component.
 * 
 * @param {Object} props
 * @param {Object} props.COLORS - Theme colour tokens for the control panel.
 * @param {string} props.accentColor - Colour used for the primary save action.
 * @param {Array<Object>} props.savedScenarios - Saved closure scenarios available to load.
 * @param {(name: string) => Object | undefined} props.onLoadScenario - Loads a saved scenario by id.
 * @param {(scenarioId: string) => void} props.onDeleteScenario - Deletes a saved scenario by id.
 * @returns {JSX.Element}
 */
export function SavedScenariosPanel({
    COLORS,
    accentColor: accentColour,
    savedScenarios = [],
    onSaveScenario,
    onLoadScenario,
    onDeleteScenario,
}) {
    const [selectedScenarioId, setSelectedScenarioId] = useState("");
    const [scenarioName, setScenarioName] = useState("");

    const formatScenarioOptionLabel = (scenario) => {
        const maxNameLength = 24;
        const name =
            scenario.name.length > maxNameLength
                ? `${scenario.name.slice(0, maxNameLength - 1)}...`
                : scenario.name;

        return `${name} (${scenario.closedStations.length}s, ${scenario.closedLines.length}l)`;
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                padding: "10px 12px",
                background: COLORS.soft,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
            }}
        >
            <h3 style={{ margin: "0", color: COLORS.text }}>Saved Scenarios</h3>

            <div style={{ fontSize: 12, lineHeight: 1.45, color: COLORS.textMuted }}>
                Save the current closed stations and lines, then load them again later from this browser.
            </div>

            <div style={{ display: "flex", gap: 8 }}>
                <input
                    value={scenarioName}
                    onChange={(event) => setScenarioName(event.target.value)}
                    placeholder="Scenario name"
                    style={{
                        flex: 1,
                        minWidth: 0,
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: `1px solid ${COLORS.border}`,
                        background: COLORS.control,
                        color: COLORS.text,
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
                        padding: "8px 12px",
                        background: accentColour,
                        color: COLORS.textOnAccent,
                        border: `1px solid ${accentColour}`,
                        borderRadius: 8,
                        cursor: "pointer",
                        fontWeight: 700,
                    }}
                >
                    Save
                </button>
            </div>

            <div style={{ width: "100%", boxSizing: "border-box" }}>
                <select
                    value={selectedScenarioId}
                    onChange={(event) => setSelectedScenarioId(event.target.value)}
                    style={{
                        display: "block",
                        width: "calc(100% - 2px)",
                        maxWidth: "100%",
                        boxSizing: "border-box",
                        padding: "8px 10px",
                        background: COLORS.control,
                        color: COLORS.text,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 8,
                        outline: "none",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                    }}
                >
                    <option value="">
                        {savedScenarios.length ? "Choose saved scenario" : "No saved scenarios yet"}
                    </option>
                    {savedScenarios.map((scenario) => (
                        <option key={scenario.id} value={scenario.id}>
                            {formatScenarioOptionLabel(scenario)}
                        </option>
                    ))}
                </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button
                    onClick={() => selectedScenarioId && onLoadScenario?.(selectedScenarioId)}
                    disabled={!selectedScenarioId}
                    style={{
                        padding: "8px 10px",
                        background: selectedScenarioId ? COLORS.selectedControl : COLORS.subtle,
                        color: selectedScenarioId ? "#22c55e" : COLORS.textMuted,
                        border: `1px solid ${selectedScenarioId ? "#22c55e" : COLORS.border}`,
                        borderRadius: 8,
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
                        padding: "8px 10px",
                        background: selectedScenarioId ? "rgba(239, 68, 68, 0.16)" : COLORS.subtle,
                        color: selectedScenarioId ? "#ef4444" : COLORS.textMuted,
                        border: `1px solid ${selectedScenarioId ? "#ef4444" : COLORS.border}`,
                        borderRadius: 8,
                        cursor: selectedScenarioId ? "pointer" : "not-allowed",
                        fontWeight: 700,
                    }}
                >
                    Delete
                </button>
            </div>
        </div>
    );
}