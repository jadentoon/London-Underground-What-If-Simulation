import { MapControlPanelContent } from "../controls/MapControlPanelContent";

/**
 * Renders the desktop side panel for map settings and network status.
 *
 * The sidebar delegates its actual controls to `MapControlPanelContent` and is
 * responsible only for desktop positioning, slide-in animation and scrollable
 * panel layout.
 *
 * @param {Object} props - Sidebar props.
 * @param {boolean} props.isSidebarOpen - Whether the sidebar is visible.
 * @param {Object} props.layout - Sidebar layout values.
 * @param {Object} props.COLORS - Theme tokens used for styling.
 * @returns {JSX.Element} Desktop map sidebar.
 */
export function MapSidebar({
    isSidebarOpen,
    layout,
    COLORS,
    hypotheticalSettingsEnabled,
    accentColor,
    onToggleWhatIfMode,
    onResetClosures,
    savedScenarios,
    onSaveScenario,
    onLoadScenario,
    onDeleteScenario,
    effectiveLines,
    closedLines,
    partialLines,
    onLineToggle,
    lineStatusLabel,
    lineStatusColor,
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
}) {
    const sidebarWidth = layout?.sidebarWidth ?? 280;

    return (
        <div
            data-tour="sidebar"
            style={{
                position: "fixed",
                top: 0,
                left: isSidebarOpen ? 0 : -sidebarWidth,
                width: sidebarWidth,
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
            <MapControlPanelContent
                COLORS={COLORS}
                hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                accentColor={accentColor}
                onToggleWhatIfMode={onToggleWhatIfMode}
                onResetClosures={onResetClosures}
                savedScenarios={savedScenarios}
                onSaveScenario={onSaveScenario}
                onLoadScenario={onLoadScenario}
                onDeleteScenario={onDeleteScenario}
                effectiveLines={effectiveLines}
                closedLines={closedLines}
                partialLines={partialLines}
                onLineToggle={onLineToggle}
                lineStatusLabel={lineStatusLabel}
                lineStatusColor={lineStatusColor}
                lineStatusBg={lineStatusBg}
                isLiveLines={isLiveLines}
                linesUpdatedAt={linesUpdatedAt}
                lineDelays={lineDelays}
                trainFeedSource={trainFeedSource}
                trainFeedUpdatedAt={trainFeedUpdatedAt}
                trainFeedReason={trainFeedReason}
                trainFeedCount={trainFeedCount}
                showTrains={showTrains}
                trainFilterMode={trainFilterMode}
                visibleTrainLines={visibleTrainLines}
                onToggleShowTrains={onToggleShowTrains}
                onTrainFilterModeChange={onTrainFilterModeChange}
                onToggleVisibleTrainLine={onToggleVisibleTrainLine}
                showWhatIfToggle={false}
            />
        </div>
    );
}
