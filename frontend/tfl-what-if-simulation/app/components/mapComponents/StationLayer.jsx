import { Fragment } from "react";
import { CircleMarker, Tooltip, Marker } from "react-leaflet";
import { ZOOM_LEVELS } from "./constants";

/**
 * zoom level 12 - radius 5
 * zoom level 13 - radius 7
 * zoom level 14 - radius 9
 * zoom level 15 - radius 11
 * zoom level 16 - radius 13
 */

function getRadiusForZoom(zoom) {
    const z = Math.min(16, Math.max(12, Math.round(zoom ?? 14)));
    return ZOOM_LEVELS[z] ?? 9;
}

export default function StationLayer({
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
}) {

    return (
        <>
            {nodes.map((s) => {
                const id = String(s.id);

                const isStart = id === String(startId);
                const isOnPath = pathSet.has(id);
                const isClosed = hypotheticalSettingsEnabled && closedSet.has(id);
                const dim = hasPath && !isOnPath && !isStart;

                const baseRadius = getRadiusForZoom(zoomLevel);

                const radius =
                    isStart ? baseRadius + 2 :
                        isOnPath ? baseRadius + 1 :
                            baseRadius;

                return (
                    <Fragment key={id}>
                        <CircleMarker
                            center={[s.lat, s.lon]}
                            radius={radius}
                            eventHandlers={{
                                click: (e) => {
                                    if (isStart || isClosed) return;
                                    e?.originalEvent?.stopPropagation?.();
                                    onSingleClickStation(id);
                                },
                                dblclick: (e) => {
                                    e?.originalEvent?.preventDefault?.();
                                    e?.originalEvent?.stopPropagation?.();

                                    if (hypotheticalSettingsEnabled) {
                                        onDoubleClickStation?.(id);
                                        setStartId(null);
                                    }
                                },
                            }}
                            pathOptions={{
                                color: isClosed
                                    ? "#ef4444"
                                    : isStart || isOnPath
                                        ? "#22c55e"
                                        : "#ffffff",
                                weight: isStart || isOnPath || isClosed ? 3 : 2,
                                fillColor: isClosed
                                    ? "#7f1d1d"
                                    : isOnPath
                                        ? "#052e16"
                                        : "#000000",
                                fillOpacity: dim ? 0.6 : 1,
                                opacity: dim ? 0.35 : 1,
                            }}
                        >
                            {!hasPath && <Tooltip sticky>{s.name}</Tooltip>}
                        </CircleMarker>

                        {hypotheticalSettingsEnabled && redXIcon && isClosed && (
                            <Marker
                                position={[s.lat, s.lon]}
                                icon={redXIcon}
                                interactive={false}
                            />
                        )}
                    </Fragment>
                );
            })}
        </>
    );
}