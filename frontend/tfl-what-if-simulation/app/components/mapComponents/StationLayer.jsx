import { Fragment } from "react";
import { CircleMarker, Tooltip, Marker } from "react-leaflet";

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
}) {
    return (
        <>
            {nodes.map((s) => {
                const id = String(s.id);

                const isStart = id === String(startId);
                const isOnPath = pathSet.has(id);
                const isClosed = hypotheticalSettingsEnabled && closedSet.has(id);
                const dim = hasPath && !isOnPath && !isStart;

                return (
                    <Fragment key={id}>
                        <CircleMarker
                            center={[s.lat, s.lon]}
                            radius={isStart ? 11 : isOnPath ? 10 : 9}
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