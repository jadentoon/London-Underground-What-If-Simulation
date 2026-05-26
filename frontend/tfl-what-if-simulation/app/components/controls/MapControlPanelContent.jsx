import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

import { ToggleRow } from "./ToggleRow";
import { InteractionModeToggle } from "./InteractionModeToggle";
import { NetworkStatusSummary } from "./NetworkStatusSummary";
import { SavedScenariosPanel } from "./SavedScenariosPanel";
import { TrainDisplayControls } from "./TrainDisplayControls";
import { LineStatusList } from "./LineStatusList";


/**
 * Composes the main map settings and status controls.
 *
 * This component wires together the control panel sections used by the sidebar
 * and mobile sheet. It owns cross-section UI state such as the active theme,
 * expanded line status row, and hover timing for live delay details. Individual
 * sections are delegated to smaller presentational components.
 *
 * @param {Object} props
 * @param {Object} props.COLORS - Theme colour tokens for the control panel.
 * @param {boolean} props.hypotheticalSettingsEnabled - Whether What-If mode is currently active.
 * @param {string} props.accentColor - Accent colour used for active controls.
 * @param {() => void} props.onToggleWhatIfMode - Called when What-If mode is toggled.
 * @param {() => void} props.onResetClosures - Called when all What-If closures should be cleared.
 * @param {Array<Object>} props.savedScenarios - Saved What-If scenarios available to load.
 * @param {(name: string) => Object | undefined} props.onSaveScenario - Saves the current What-If scenario.
 * @param {(scenarioId: string) => void} props.onLoadScenario - Loads a saved What-If scenario.
 * @param {(scenarioId: string) => void} props.onDeleteScenario - Deletes a saved What-If scenario.
 * @param {Array<{id: string, label: string, color: string}>} props.effectiveLines - Lines available in the current map state.
 * @param {Set<string>} props.closedLines - Line ids closed in What-If mode.
 * @param {Set<string>} props.partialLines - Line ids with partial station closures.
 * @param {(lineId: string) => void} props.onLineToggle - Toggles a line closure in What-If mode.
 * @param {string} props.lineStatusLabel - Label describing the current line status source.
 * @param {string} props.lineStatusColor - Colour used for the line status indicator.
 * @param {string} props.lineStatusBg - Background colour used for the line status summary.
 * @param {boolean} props.isLiveLines - Whether live line status data is available.
 * @param {Date | null} props.linesUpdatedAt - Last time live line status was updated.
 * @param {Map<string, Object>} props.lineDelays - Live delay details keyed by line id.
 * @param {"live" | string} props.trainFeedSource - Source currently used for train data.
 * @param {Date | string | number | null} props.trainFeedUpdatedAt - Last time train data was updated.
 * @param {string | null} props.trainFeedReason - Explanation shown when live train data is unavailable.
 * @param {number} props.trainFeedCount - Number of train markers currently visible.
 * @param {boolean} props.showTrains - Whether train markers are visible.
 * @param {"all" | "selected"} props.trainFilterMode - Current train line filter mode.
 * @param {Set<string>} props.visibleTrainLines - Line ids selected for train visibility.
 * @param {() => void} props.onToggleShowTrains - Toggles train marker visibility.
 * @param {(mode: "all" | "selected") => void} props.onTrainFilterModeChange - Updates the train filter mode.
 * @param {(lineId: string) => void} props.onToggleVisibleTrainLine - Toggles train visibility for a line.
 * @param {boolean} [props.showHeading=true] - Whether to show the Settings heading.
 * @param {boolean} [props.isTouchLayout=false] - Whether the current layout is touch-oriented.
 * @param {boolean} [props.showInteractionModeToggle=false] - Whether to show the mobile interaction mode selector.
 * @param {boolean} [props.showWhatIfToggle=true] - Whether to show the What-If toggle row.
 * @param {"route" | "closures"} [props.interactionMode="route"] - Current mobile map interaction mode.
 * @param {(mode: "route" | "closures") => void} props.onInteractionModeChange - Updates the mobile interaction mode.
 * @returns {JSX.Element}
 */
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
    const safePartialLines = partialLines || new Set();

    const [expandedLineId, setExpandedLineId] = useState(null);
    const hoverTimeoutRef = useRef(null);

    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const { resolvedTheme, setTheme } = useTheme();
    const isLightTheme = hasMounted && resolvedTheme === "light";

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
                <ToggleRow
                    label="What-If Mode"
                    enabled={hypotheticalSettingsEnabled}
                    onToggle={onToggleWhatIfMode}
                    COLORS={COLORS}
                    accentColor={accentColour}
                />
            )}

            <ToggleRow
                label="Light Mode"
                enabled={isLightTheme}
                onToggle={() => setTheme(isLightTheme ? "dark" : "light")}
                COLORS={COLORS}
                accentColor={accentColour}
                ariaLabel={"Toggle Light Mode"}
            />

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
                        type="button"
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
                    <SavedScenariosPanel
                        COLORS={COLORS}
                        accentColor={accentColour}
                        savedScenarios={savedScenarios}
                        onSaveScenario={onSaveScenario}
                        onLoadScenario={onLoadScenario}
                        onDeleteScenario={onDeleteScenario}
                    />
                )}

                {!hypotheticalSettingsEnabled && (
                    <TrainDisplayControls
                        COLORS={COLORS}
                        accentColor={accentColour}
                        effectiveLines={effectiveLines}
                        showTrains={showTrains}
                        trainFilterMode={trainFilterMode}
                        visibleTrainLines={visibleTrainLines}
                        onToggleShowTrains={onToggleShowTrains}
                        onTrainFilterModeChange={onTrainFilterModeChange}
                        onToggleVisibleTrainLine={onToggleVisibleTrainLine}
                    />
                )}

                <NetworkStatusSummary
                    COLORS={COLORS}
                    hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                    lineStatusLabel={lineStatusLabel}
                    lineStatusColour={lineStatusColour}
                    lineStatusBg={lineStatusBg}
                    isLiveLines={isLiveLines}
                    linesUpdatedAt={linesUpdatedAt}
                    trainFeedSource={trainFeedSource}
                    trainFeedUpdatedAt={trainFeedUpdatedAt}
                    trainFeedReason={trainFeedReason}
                    trainFeedCount={trainFeedCount}
                />

                <LineStatusList
                    COLORS={COLORS}
                    hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                    effectiveLines={effectiveLines}
                    closedLines={closedLines}
                    partialLines={safePartialLines}
                    lineDelays={lineDelays}
                    isLiveLines={isLiveLines}
                    isTouchLayout={isTouchLayout}
                    expandedLineId={expandedLineId}
                    hasMounted={hasMounted}
                    onLineMouseEnter={handleMouseEnter}
                    onLineMouseLeave={handleMouseLeave}
                    onLineAction={handleLineAction}
                />

            </div>
        </div>
    );
}
