import React, { Fragment } from "react";
import { CircleMarker, Tooltip, Marker } from "react-leaflet";
import {
    getStationMarkerRadius,
    getStationMarkerStrokeWeight,
} from "../mapShared/stationMarkerSizing.js";

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
                                color: isClosed
                                    ? "#ef4444"
                                    : isHighlighted
                                    ? "#3b82f6"
                                    : isStart || isOnPath
                                    ? "#22c55e"
                                    : "#ffffff",
                                weight: strokeWeight,
                                fillColor: isClosed
                                    ? "#7f1d1d"
                                    : isHighlighted
                                    ? "#1d4ed8"
                                    : isOnPath
                                    ? "#052e16"
                                    : "#000000",
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

// Memoize to prevent unnecessary re-renders when parent updates
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
        prev.paneName === next.paneName
    );
});

export default StationLayer;
