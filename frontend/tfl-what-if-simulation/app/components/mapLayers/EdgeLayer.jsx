import { Fragment } from "react";
import React from "react";
import { Polyline, Tooltip } from "react-leaflet";
import { offsetSegment, buildUndirectedLineEdgeKey } from "../mapShared/utils.js";
import { LINE_COLOURS, LINE_LABELS, LINE_STYLE } from "../mapShared/constants.js";

const DISRUPTED_LINE_OUTLINE_COLOUR = "#f59e0b";
const DISRUPTED_LINE_CORE_COLOUR = "#000000";
const DISRUPTED_LINE_DASH_ARRAY = "8 8";

/**
 * Renders station-to-station Underground line edges.
 *
 * Edges are grouped by station pair so multiple lines can be offset from each
 * other and remain visible. In What-If closure mode, clicking or double-clicking
 * a line edge toggles that line's simulated closure state.
 *
 * @param {Object} props - Edge layer props.
 * @param {Object<string, Array<Object>>} props.groupedEdges - Edge groups keyed by station pair.
 * @param {Map<string, Object>} props.nodeById - Station lookup keyed by station id.
 * @param {boolean} props.dimmed - Whether edges should be faded behind an active route.
 * @param {Set<string>} props.closedLines - Closed line ids.
 * @param {Set<string>} [props.partialEdgeKeys] - Partially disrupted edge keys.
 * @param {(lineId: string) => void} props.onLineToggle - Toggles a line closure.
 * @param {boolean} props.hypotheticalSettingsEnabled - Whether What-If mode is active.
 * @param {"route" | "closures"} [props.interactionMode] - Active map interaction mode.
 * @returns {JSX.Element} Rendered line edge layer.
 */
function EdgeLayerComponent({
    groupedEdges,
    nodeById,
    dimmed,
    closedLines,
    partialEdgeKeys = new Set(),
    onLineToggle,
    hypotheticalSettingsEnabled,
    interactionMode = "route",
}) {
    const edgeCoreOpacity = dimmed ? 0.18 : LINE_STYLE.OPACITY;
    const edgeOutlineOpacity = dimmed ? 0.12 : LINE_STYLE.OPACITY;

    return (
        <>
            {Object.entries(groupedEdges).map(([pairKey, group]) => {
                const from = nodeById.get(String(group[0].from));
                const to = nodeById.get(String(group[0].to));
                if (!from || !to) return null;

                const base = [
                    [from.lat, from.lon],
                    [to.lat, to.lon],
                ];

                const mid = (group.length - 1) / 2;

                return group.map((edge, index) => {
                    const offset = (index - mid) * LINE_STYLE.OFFSET_STEP;
                    const positions = offsetSegment(base[0], base[1], offset);

                    const line = edge.line;
                    const edgeKey = buildUndirectedLineEdgeKey(edge.from, edge.to, line);
                    const isClosedLine = closedLines.has(line);
                    const isPartlyClosedLine = !isClosedLine && partialEdgeKeys.has(edgeKey);
                    const useDisruptedStyle = isClosedLine || isPartlyClosedLine;

                    const lineColour = useDisruptedStyle
                        ? DISRUPTED_LINE_CORE_COLOUR
                        : (LINE_COLOURS[line] || "#3b82f6");

                    const label = LINE_LABELS[line] || line;
                    const tooltipText = isClosedLine
                        ? `${label} (closed)`
                        : (isPartlyClosedLine ? `${label} (partly closed)` : label);

                    return (
                        <Fragment key={`${pairKey}-${line}-${index}`}>
                            {/* Outline for visibility - not interactive for better performance */}
                            <Polyline
                                positions={positions}
                                pathOptions={{
                                    color: useDisruptedStyle
                                        ? DISRUPTED_LINE_OUTLINE_COLOUR
                                        : LINE_STYLE.OUTLINE_COLOR,
                                    weight: useDisruptedStyle ? LINE_STYLE.OUTLINE_WEIGHT + 1 : LINE_STYLE.OUTLINE_WEIGHT,
                                    opacity: edgeOutlineOpacity,
                                    lineCap: "round",
                                    lineJoin: "round",
                                    smoothFactor: Math.max(LINE_STYLE.SMOOTH_FACTOR, 10),
                                    interactive: false,
                                    className: "edge-outline",
                                }}
                            />

                            {/* Core line with tooltip */}
                            <Polyline
                                positions={positions}
                                pathOptions={{
                                    color: lineColour,
                                    weight: LINE_STYLE.STROKE_WEIGHT,
                                    opacity: edgeCoreOpacity,
                                    lineCap: "round",
                                    lineJoin: "round",
                                    smoothFactor: Math.max(LINE_STYLE.SMOOTH_FACTOR, 10),
                                    dashArray: useDisruptedStyle ? DISRUPTED_LINE_DASH_ARRAY : undefined,
                                    interactive: true,
                                    className: "edge-core",
                                }}
                                eventHandlers={{
                                    click: (e) => {
                                        e.originalEvent?.preventDefault();
                                        e.originalEvent?.stopPropagation();
                                        if (hypotheticalSettingsEnabled && interactionMode === "closures" && onLineToggle) {
                                            onLineToggle(line);
                                        }
                                    },
                                    dblclick: (e) => {
                                        e.originalEvent?.preventDefault();
                                        e.originalEvent?.stopPropagation();
                                        if (hypotheticalSettingsEnabled && interactionMode !== "closures" && onLineToggle) {
                                            onLineToggle(line);
                                        }
                                    }
                                }}
                            >
                                {!dimmed && <Tooltip sticky>{tooltipText}</Tooltip>}
                            </Polyline>
                        </Fragment>
                    );
                });
            })}
        </>
    );
}

/**
 * Memoised edge layer.
 *
 * The custom comparison avoids rerendering hundreds of polylines unless the
 * graph, disruption state or interaction handlers actually change.
 */
const EdgeLayer = React.memo(EdgeLayerComponent, (prev, next) => {
    // Return true if props are equal (don't re-render)
    // Return false if props differ (do re-render)
    return (
        prev.groupedEdges === next.groupedEdges &&
        prev.nodeById === next.nodeById &&
        prev.dimmed === next.dimmed &&
        prev.closedLines === next.closedLines &&
        prev.partialEdgeKeys === next.partialEdgeKeys &&
        prev.onLineToggle === next.onLineToggle &&
        prev.hypotheticalSettingsEnabled === next.hypotheticalSettingsEnabled &&
        prev.interactionMode === next.interactionMode
    );
});

export default EdgeLayer;
