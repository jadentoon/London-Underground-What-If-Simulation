import { Fragment } from "react";
import { Polyline, Tooltip } from "react-leaflet";
import { offsetSegment } from "./utils.js";
import { LINE_COLOURS, LINE_LABELS, LINE_STYLE } from "./constants.js";

export default function EdgeLayer({ groupedEdges, nodeById, dimmed }) {
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
                    const color = LINE_COLOURS[line] || "#3b82f6";
                    const label = LINE_LABELS[line] || line;

                    return (
                        <Fragment key={`${pairKey}-${line}-${index}`}>
                            {/* Outline for visibility */}
                            <Polyline
                                positions={positions}
                                pathOptions={{
                                    color: LINE_STYLE.OUTLINE_COLOR,
                                    weight: LINE_STYLE.OUTLINE_WEIGHT,
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
                                    interactive: true,
                                }}
                            >
                                {!dimmed && <Tooltip sticky>{label}</Tooltip>}
                            </Polyline>
                        </Fragment>
                    );
                });
            })}
        </>
    );
}