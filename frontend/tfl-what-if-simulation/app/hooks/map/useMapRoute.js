import { useCallback, useMemo, useState } from "react";
import { dijkstra } from "../../lib/pathfinding.js";
import { splitStateKey } from "../../components/mapShared/utils.js";

const EMPTY_ROUTE_META = {
    totalSeconds: 0,
    changeCount: 0,
    statePath: [],
};

export function useMapRoute({
    graph,
    nodeById,
    edges,
    hypotheticalSettingEnabled,
    closedSet,
    closedLineSet,
    partialEdgeKeys,
    onRoutingError,
}) {
    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);
    const [path, setPath] = useState([]);
    const [routeMeta, setRouteMeta] = useState(EMPTY_ROUTE_META);

    const clearRoute = useCallback(() => {
        setPath([]);
        setRouteMeta(EMPTY_ROUTE_META);
        setStart(null);
        setEnd(null);
        onRoutingError?.(null);
    }, [onRoutingError]);

    const setRouteStartSelection = useCallback((stationId) => {
        const id = String(stationId);

        setStart(id);
        setEnd(null);
        setPath([]);
        setRouteMeta(EMPTY_ROUTE_META);
        onRoutingError?.(null);
    }, [onRoutingError]);

    
}