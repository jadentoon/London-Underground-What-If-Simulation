import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

import { ToggleRow } from "./ToggleRow";
import { InteractionModeToggle } from "./InteractionModeToggle";
import { SavedScenariosPanel } from "./SavedScenariosPanel";
import { TrainDisplayControls } from "./TrainDisplayControls";
import { LineStatusList } from "./LineStatusList";

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
                                    background: COLORS.subtle,
                                }}
                            >
                                {trainFeedReason}
                            </div>
                        )}
                    </>
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

                <LineStatusList
                    COLORS={COLORS}
                    hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                    effectiveLines={effectiveLines}
                    closedLines={closedLines}
                    partialLines={partlyClosedLines}
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
