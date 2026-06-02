import { CircleMarker, Polyline, Tooltip } from "react-leaflet";

/**
 * Renders the currently selected route as a highlighted polyline.
 *
 * The route is drawn with a glow, main stroke and dashed overlay so it remains
 * visible above the wider Underground network. A midpoint tooltip summarises
 * the number of stops on the selected path.
 *
 * @param {Object} props - Route layer props.
 * @param {Array<[number, number]>} props.pathPositions - Ordered latitude/longitude pairs for the route.
 * @returns {JSX.Element | null} Highlighted route layer or null when no route is selected.
 */
export default function RouteLayer({ pathPositions }) {
    const hasPath = pathPositions.length > 1;
    if (!hasPath) return null;

    const midPos = pathPositions[Math.floor(pathPositions.length / 2)] || null;

    return (
        <>
            {/* Halo / glow */}
            <Polyline
                positions={pathPositions}
                pathOptions={{
                    color: "#22c55e",
                    weight: 14,
                    opacity: 0.25,
                    lineCap: "round",
                    lineJoin: "round",
                    interactive: false,
                }}
            />
            {/* Main Route */}
            <Polyline
                positions={pathPositions}
                pathOptions={{
                    color: "#22c55e",
                    weight: 7,
                    opacity: 0.95,
                    lineCap: "round",
                    lineJoin: "round",
                }}
            />
            {/* Dashed overlay for "route feel" */}
            <Polyline
                positions={pathPositions}
                pathOptions={{
                    color: "#ffffff",
                    weight: 3,
                    opacity: 0.7,
                    dashArray: "8 10",
                    lineCap: "round",
                    lineJoin: "round",
                    interactive: false,
                }}
            />
            {/* Midpoint label */}
            {midPos && (
                <CircleMarker
                    center={midPos}
                    radius={1}
                    pathOptions={{ opacity: 0, fillOpacity: 0 }}
                    interactive
                >
                    <Tooltip direction="top" offset={[0, -10]} permanent>
                        {`Route: ${pathPositions.length - 1} stops`}
                    </Tooltip>
                </CircleMarker>
            )}
        </>
    )
}
