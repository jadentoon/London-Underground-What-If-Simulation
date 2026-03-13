import { Fragment } from "react";
import { Polyline, Tooltip } from "react-leaflet";
import { offsetSegment, buildUndirectedLineEdgeKey } from "./utils.js";
import { LINE_COLOURS, LINE_LABELS, LINE_STYLE } from "./constants.js";

const DISRUPTED_LINE_OUTLINE_COLOUR = "#f59e0b";
const DISRUPTED_LINE_CORE_COLOUR = "#000000";
const DISRUPTED_LINE_DASH_ARRAY = "8 8";

export default function EdgeLayer({
    groupedEdges,
    nodeById,
    dimmed,
    closedLines,
    partialEdgeKeys = new Set(),
    onLineToggle,
    hypotheticalSettingsEnabled
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

                    const color = useDisruptedStyle
                        ? DISRUPTED_LINE_CORE_COLOUR
                        : (LINE_COLOURS[line] || "#3b82f6");

                    const label = LINE_LABELS[line] || line;
                    const tooltipText = isClosedLine
                        ? `${label} (closed)`
                        : (isPartlyClosedLine ? `${label} (partly closed)` : label);

                    return (
                        <Fragment key={`${pairKey}-${line}-${index}`}>
                            {/* Outline for visibility */}
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
                                    smoothFactor: LINE_STYLE.SMOOTH_FACTOR,
                                    interactive: false,
                                }}
                            />

                            {/* Core line with tooltip */}
                            <Polyline
                                positions={positions}
                                pathOptions={{
                                    color,
                                    weight: LINE_STYLE.STROKE_WEIGHT,
                                    opacity: edgeCoreOpacity,
                                    lineCap: "round",
                                    lineJoin: "round",
                                    smoothFactor: LINE_STYLE.SMOOTH_FACTOR,
                                    dashArray: useDisruptedStyle ? DISRUPTED_LINE_DASH_ARRAY : undefined,
                                    interactive: true,
                                    className: "",
                                }}
                                eventHandlers={{
                                    dblclick: (e) => {
                                        e.originalEvent?.preventDefault();
                                        e.originalEvent?.stopPropagation();
                                        if (hypotheticalSettingsEnabled && onLineToggle) {
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
