import { getDelaySeverityColor as getDelaySeverityColour } from "../mapShared/delayUtils";
import { LineStatusItem } from "./LineStatusItem";

/**
 * Renders the current status of each Underground line in the control panel.
 *
 * Combines live delay data with What-If closure state, then passes the display
 * state for each line to LineStatusItem. The parent component owns interaction
 * state such as which delay row is expanded.
 *
 * @param {Object} props
 * @param {Object} props.COLORS - Theme colour tokens for the control panel.
 * @param {boolean} props.hypotheticalSettingsEnabled - Whether What-If mode is currently active.
 * @param {Array<{id: string, label: string, color: string}>} props.effectiveLines - Lines available in the current map state.
 * @param {Set<string>} props.closedLines - Line ids currently closed in What-If mode.
 * @param {Set<string>} props.partialLines - Line ids with one or more closed stations.
 * @param {Map<string, Object>} props.lineDelays - Live delay information keyed by line id.
 * @param {boolean} props.isLiveLines - Whether live line status data is available.
 * @param {boolean} props.isTouchLayout - Whether the current layout is touch-oriented.
 * @param {string | null} props.expandedLineId - Line id whose delay details are expanded.
 * @param {boolean} props.hasMounted - Whether the component has mounted on the client.
 * @param {(lineId: string, showDelay: boolean) => void} props.onLineMouseEnter - Called when a line row is hovered.
 * @param {() => void} props.onLineMouseLeave - Called when hover leaves a line row.
 * @param {(lineId: string, showDelay: boolean) => void} props.onLineAction - Called when a line row is clicked.
 * @returns {JSX.Element}
 */
export function LineStatusList({
    COLORS,
    hypotheticalSettingsEnabled,
    effectiveLines,
    closedLines,
    partialLines,
    lineDelays,
    isLiveLines,
    isTouchLayout,
    expandedLineId,
    hasMounted,
    onLineMouseEnter,
    onLineMouseLeave,
    onLineAction,
}) {
    return (
        <>
            <h3 style={{ margin: "0 0 8px", color: COLORS.text }}>Line Status</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {effectiveLines.map((line) => {
                    const isClosed = closedLines.has(line.id);
                    const isPartlyClosed = !isClosed && partialLines.has(line.id);
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
                        : COLORS.soft;
                    const canHoverInspectDelay = !isTouchLayout && showDelay;
                    const isExpanded = expandedLineId === line.id;
                    const isLineButtonDisabled = hasMounted && !canToggleLine && !canInspectDelay && !canHoverInspectDelay;

                    return (
                        <LineStatusItem
                            key={line.id}
                            COLORS={COLORS}
                            line={line}
                            isClosed={isClosed}
                            isPartlyClosed={isPartlyClosed}
                            delay={delay}
                            showDelay={showDelay}
                            statusLabel={statusLabel}
                            statusColour={statusColour}
                            buttonBackground={buttonBackground}
                            isExpanded={isExpanded}
                            isLineButtonDisabled={isLineButtonDisabled}
                            canToggleLine={canToggleLine}
                            canInspectDelay={canInspectDelay}
                            onMouseEnter={() => onLineMouseEnter(line.id, showDelay)}
                            onMouseLeave={onLineMouseLeave}
                            onAction={() => onLineAction(line.id, showDelay)}
                        />
                    );
                })}
            </div>
        </>
    );
}