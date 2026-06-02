import React, { Fragment } from "react";
import { CircleMarker, Tooltip, Marker } from "react-leaflet";
import {
    getStationMarkerRadius,
    getStationMarkerStrokeWeight,
} from "../mapShared/stationMarkerSizing.js";
import { getStationMarkerColours } from "../mapShared/stationMarkerColours.js";

/**
 * Renders all station markers and handles station-level map interactions.
 *
 * The layer marks route starts, route stations, search highlights, live
 * closures and What-If closures. Station clicks either select route endpoints
 * or toggle closures depending on the current interaction mode.
 *
 * @param {Object} props - Station layer props.
 * @param {Array<Object>} props.nodes - Station nodes to render.
 * @param {string | null} props.startId - Currently selected route start station id.
 * @param {(stationId: string | null) => void} props.setStartId - Updates the selected route start.
 * @param {Set<string>} props.pathSet - Station ids included in the active route path.
 * @param {Set<string>} props.closedSet - Station ids closed in What-If mode.
 * @param {boolean} props.hasPath - Whether an active route is displayed.
 * @param {boolean} props.hypotheticalSettingsEnabled - Whether What-If mode is active.
 * @param {Object | null} props.redXIcon - Leaflet icon used for closed stations.
 * @param {(stationId: string) => void} props.onSingleClickStation - Handles route station selection.
 * @param {(stationId: string) => void} props.onDoubleClickStation - Handles station closure toggles.
 * @param {number} props.zoomLevel - Current Leaflet zoom level.
 * @param {Set<string>} [props.liveClosedSet] - Live TfL closed station ids.
 * @param {"route" | "closures"} [props.interactionMode] - Active map interaction mode.
 * @param {string | null} props.highlightedStationId - Station id highlighted by search.
 * @param {string} props.paneName - Leaflet pane used for station markers.
 * @param {boolean} [props.isLightTheme] - Whether the map is using the light theme.
 * @returns {JSX.Element} Rendered station marker layer.
 */
function StationLayerComponent({
    nodes,
    startId,
    setStartId,
    pathSet,
    closedSet,
    hasPath,
    hypotheticalSettingsEnabled,
    redXIcon,
    onSingleClickStation,
    onDoubleClickStation,
    zoomLevel,
    liveClosedSet = new Set(),
    interactionMode = "route",
    highlightedStationId,
    paneName,
    isLightTheme = false,
}) {

    return (
        <>
            {nodes.map((s) => {
                const id = String(s.id);
                const isHighlighted = id === String(highlightedStationId);

                const isStart = id === String(startId);
                const isOnPath = pathSet.has(id);
                // Closed in live TfL data
                const isLiveClosed = liveClosedSet.has(id);

                // Closed in hypothetical what-if mode
                const isHypotheticalClosed = hypotheticalSettingsEnabled && closedSet.has(id);

                // A station is visually closed if either:
                // - it is closed in live data (any mode), OR
                // - it is closed in what-if mode while hypothetical settings are enabled
                const isClosed = isLiveClosed || isHypotheticalClosed;

                const dim = hasPath && !isOnPath && !isStart;
                const radius = getStationMarkerRadius({
                    zoomLevel,
                    isHighlighted,
                    isStart,
                    isOnPath,
                });
                const strokeWeight = getStationMarkerStrokeWeight({
                    isHighlighted,
                    isStart,
                    isOnPath,
                    isClosed,
                    isLightTheme,
                });
                const { strokeColour, fillColour } = getStationMarkerColours({
                    isClosed,
                    isHighlighted,
                    isStart,
                    isOnPath,
                    isLightTheme,
                });

                return (
                    <Fragment key={id}>
                        {isHighlighted && (
                            <CircleMarker
                                center={[s.lat, s.lon]}
                                radius={radius + 8}
                                interactive={false}
                                pane={paneName}
                                pathOptions={{
                                    color: "#3b82f6",
                                    weight: 3,
                                    fillColor: "#3b82f6",
                                    fillOpacity: 0.25,
                                    opacity: 0.8,
                                }}
                            />
                        )}

                        <CircleMarker
                            center={[s.lat, s.lon]}
                            radius={radius}
                            pane={paneName}
                            eventHandlers={{
                                click: (e) => {
                                    e?.originalEvent?.stopPropagation?.();

                                    if (hypotheticalSettingsEnabled && interactionMode === "closures") {
                                        onDoubleClickStation?.(id);
                                        setStartId(null);
                                        return;
                                    }

                                    if (isClosed) return;

                                    if (isStart) {
                                        setStartId(null);
                                        return;
                                    }

                                    onSingleClickStation?.(id);
                                },
                                dblclick: (e) => {
                                    e?.originalEvent?.preventDefault?.();
                                    e?.originalEvent?.stopPropagation?.();

                                    if (hypotheticalSettingsEnabled && interactionMode !== "closures") {
                                        onDoubleClickStation?.(id);
                                        setStartId(null);
                                    }
                                },
                            }}
                            pathOptions={{
                                color: strokeColour,
                                weight: strokeWeight,
                                fillColor: fillColour,
                                fillOpacity: dim ? 0.6 : 1,
                                opacity: dim ? 0.35 : 1,
                            }}
                        >
                            {!hasPath && <Tooltip sticky>{s.name}</Tooltip>}
                        </CircleMarker>

                        {redXIcon && (isLiveClosed || (hypotheticalSettingsEnabled && isHypotheticalClosed)) && (
                            <Marker
                                position={[s.lat, s.lon]}
                                icon={redXIcon}
                                interactive={false}
                                pane={paneName}
                            />
                        )}
                    </Fragment>
                );
            })}
        </>
    );
}

/**
 * Memoised station layer.
 *
 * Station markers are numerous, so the custom equality check prevents expensive
 * marker rerenders when parent state changes but station-layer inputs are stable.
 */
const StationLayer = React.memo(StationLayerComponent, (prev, next) => {
    // Return true if props are equal (don't re-render)
    return (
        prev.nodes === next.nodes &&
        prev.startId === next.startId &&
        prev.setStartId === next.setStartId &&
        prev.pathSet === next.pathSet &&
        prev.closedSet === next.closedSet &&
        prev.hasPath === next.hasPath &&
        prev.hypotheticalSettingsEnabled === next.hypotheticalSettingsEnabled &&
        prev.redXIcon === next.redXIcon &&
        prev.onSingleClickStation === next.onSingleClickStation &&
        prev.onDoubleClickStation === next.onDoubleClickStation &&
        prev.zoomLevel === next.zoomLevel &&
        prev.liveClosedSet === next.liveClosedSet &&
        prev.interactionMode === next.interactionMode &&
        prev.highlightedStationId === next.highlightedStationId &&
        prev.paneName === next.paneName &&
        prev.isLightTheme === next.isLightTheme
    );
});

export default StationLayer;
