import { useCallback, useMemo, useState } from "react";
import { dijkstra } from "../../lib/pathfinding.js";
import { splitStateKey } from "../../components/mapShared/utils.js";

const EMPTY_ROUTE_META = {
    totalSeconds: 0,
    changeCount: 0,
    statePath: [],
};

/**
 * Manages route selection and pathfinding state for the map.
 *
 * This hook owns the selected start/end stations, the calculated path, route
 * metadata, and derived route display data. Keeping this logic outside
 * `LeafletMap` lets the map component focus on rendering Leaflet layers and
 * handling user interaction.
 *
 * @param {Object} params - Route dependencies.
 * @param {Object|null} params.graph - Graph built from station nodes and edges.
 * @param {Map<string, Object>} params.nodeById - Station lookup map keyed by station id.
 * @param {Array<Object>} params.edges - Raw station connection edges.
 * @param {boolean} params.hypotheticalSettingsEnabled - Whether What-If mode is active.
 * @param {Set<string>} params.closedSet - Station ids closed in What-If mode.
 * @param {Set<string>} params.closedLineSet - Line ids unavailable for routing.
 * @param {Set<string>} params.partialEdgeKeys - Edge keys blocked by partial live disruptions.
 * @param {(error: Object|null) => void} [params.onRoutingError] - Receives route error state.
 *
 * @returns {Object} Route state, derived route data, and route actions.
 */
export function useMapRoute({
    graph,
    nodeById,
    edges,
    hypotheticalSettingsEnabled,
    closedSet,
    closedLineSet,
    partialEdgeKeys,
    onRoutingError,
}) {
    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);
    const [path, setPath] = useState([]);
    const [routeMeta, setRouteMeta] = useState(EMPTY_ROUTE_META);

    /**
     * Clears the current route and resets route metadata.
     *
     * This also clears any routing error shown by the parent UI.
     *
     * @returns {void}
     */
    const clearRoute = useCallback(() => {
        setPath([]);
        setRouteMeta(EMPTY_ROUTE_META);
        setStart(null);
        setEnd(null);
        onRoutingError?.(null);
    }, [onRoutingError]);

    /**
     * Sets a station as the route start and clears any existing destination.
     * 
     * @param {string|number} stationId - Station id selected as the route origin.
     * @returns {void}
     */
    const setRouteStartSelection = useCallback((stationId) => {
        const id = String(stationId);

        setStart(id);
        setEnd(null);
        setPath([]);
        setRouteMeta(EMPTY_ROUTE_META);
        onRoutingError?.(null);
    }, [onRoutingError]);

    /**
     * Calculates a route between two stations using the current disruption state.
     *
     * What-If station closures are only passed to pathfinding when What-If mode
     * is active. Closed lines and partial-disruption edge blocks are always
     * included because they already represent the effective map state.
     *
     * @param {string|number} originId - Start station id.
     * @param {string|number} destinationId - Destination station id.
     * @returns {void}
     */
    const buildRouteBetween = useCallback((originId, destinationId) => {
        const startId = String(originId);
        const endId = String(destinationId);

        if (!startId || !endId || !graph) return;

        const stationsToAvoid = hypotheticalSettingsEnabled ? closedSet : new Set();
        const result = dijkstra(
            graph,
            startId,
            endId,
            stationsToAvoid,
            closedLineSet,
            partialEdgeKeys,
        );
        const newPath = Array.isArray(result) ? result : (result?.path ?? []);
        const totalSeconds = Array.isArray(result) ? null : result?.totalSeconds;
        const changeCount = Array.isArray(result) ? null : result?.changeCount;
        const statePath = Array.isArray(result) ? [] : (result?.statePath ?? []);

        if (newPath.length === 0 && startId !== endId) {
            const startStation = nodeById.get(startId);
            const endStation = nodeById.get(endId);
            const hasClosedStations = hypotheticalSettingsEnabled && closedSet.size > 0;
            const hasLineDisruptions = closedLineSet.size > 0 || partialEdgeKeys.size > 0;

            onRoutingError?.({
                from: startStation?.name || startId,
                to: endStation?.name || endId,
                reason: hasClosedStations
                    ? "closed-stations"
                    : (hasLineDisruptions ? "closed-lines" : "no-connection"),
            });

            setPath([]);
            setRouteMeta(EMPTY_ROUTE_META);
        } else {
            onRoutingError?.(null);

            setPath(newPath);
            setRouteMeta({
                totalSeconds: Number.isFinite(totalSeconds) ? Number(totalSeconds) : 0,
                changeCount: Number.isFinite(changeCount) ? Number(changeCount) : 0,
                statePath,
            });
        }

        setStart(startId);
        setEnd(endId);
    }, [
        graph,
        nodeById,
        hypotheticalSettingsEnabled,
        closedSet,
        closedLineSet,
        partialEdgeKeys,
        onRoutingError,
    ]);

    /**
     * Calculates a route from the current start station to the destination.
     *
     * @param {string|number} destinationId - Destination station id.
     * @returns {void}
     */
    const selectRouteDestination = useCallback((destinationId) => {
        const id = String(destinationId);

        if (!start || !graph) return;

        buildRouteBetween(start, id);
    }, [buildRouteBetween, graph, start]);

    /**
     * Set of station ids included in the current route path.
     *
     * Used by station rendering to highlight the selected route.
     *
     * @type {Set<string>}
     */
    const pathSet = useMemo(() => new Set(path.map(String)), [path]);

    /**
     * Coordinate list for the current route path.
     *
     * Used by the route layer and by the map-fit controller.
     *
     * @type {Array<[number, number]>}
     */
    const pathPositions = useMemo(() => {
        if (!path.length) return [];

        return path
            .map((id) => nodeById.get(String(id)))
            .filter(Boolean)
            .map((station) => [station.lat, station.lon]);
    }, [path, nodeById]);

    const hasPath = pathPositions.length > 1;

    /**
     * Edge lookup keyed by directed station pair and line id.
     *
     * This is used to recover per-leg travel times from the state path returned
     * by Dijkstra.
     *
     * @type {Map<string, Object>}
     */
    const edgeByPair = useMemo(() => {
        const edgeMap = new Map();

        for (const edge of edges) {
            const from = String(edge.from);
            const to = String(edge.to);
            const line = String(edge.line ?? "unknown");

            edgeMap.set(`${from}|${to}|${line}`, edge);
            edgeMap.set(`${to}|${from}|${line}`, edge);
        }

        return edgeMap;
    }, [edges]);

    const pathStops = useMemo(() => {
        return path
            .map((id, index) => {
                const station = nodeById.get(String(id));
                if (!station) return null;

                return {
                    id: String(id),
                    index,
                    name: station.name,
                    lat: station.lat,
                    lon: station.lon,
                };
            })
            .filter(Boolean);
    }, [path, nodeById]);

    const pathLegs = useMemo(() => {
        const statePath = routeMeta.statePath ?? [];
        if (statePath.length < 2) return [];

        const legs = [];

        for (let index = 1; index < statePath.length; index++) {
            const previous = splitStateKey(statePath[index - 1]);
            const current = splitStateKey(statePath[index]);

            if (previous.stationId === current.stationId) continue;

            const fromNode = nodeById.get(String(previous.stationId));
            const toNode = nodeById.get(String(current.stationId));
            const edge = edgeByPair.get(
                `${previous.stationId}|${current.stationId}|${current.line ?? "unknown"}`,
            );

            legs.push({
                fromId: previous.stationId,
                toId: current.stationId,
                fromName: fromNode?.name ?? previous.stationId,
                toName: toNode?.name ?? current.stationId,
                line: current?.line ?? "unknown",
                travelTimeSeconds: Number.isFinite(edge?.travel_time)
                    ? Number(edge.travel_time)
                    : 0,
            });
        }

        return legs;
    }, [routeMeta.statePath, nodeById, edgeByPair]);

    const groupedLegs = useMemo(() => {
        if (!pathLegs.length) return [];

        const groups = [];
        let currentGroup = null;

        for (const leg of pathLegs) {
            const line = leg.line ?? "unknown";

            if (!currentGroup || currentGroup.line !== line) {
                currentGroup = {
                    line,
                    fromName: leg.fromName,
                    toName: leg.toName,
                    stops: 1,
                    travelTimeSeconds: leg.travelTimeSeconds ?? 0,
                };
                groups.push(currentGroup);
            } else {
                currentGroup.toName = leg.toName;
                currentGroup.stops += 1;
                currentGroup.travelTimeSeconds += leg.travelTimeSeconds ?? 0;
            }
        }

        return groups;
    }, [pathLegs]);

    const totalTravelSeconds = routeMeta.totalSeconds ?? 0;
    const changeCount = routeMeta.changeCount ?? Math.max(0, groupedLegs.length - 1);

    return {
        start,
        end,
        path,
        routeMeta,
        pathSet,
        pathPositions,
        hasPath,
        pathStops,
        pathLegs,
        groupedLegs,
        totalTravelSeconds,
        changeCount,
        clearRoute,
        setStart,
        setEnd,
        setRouteStartSelection,
        buildRouteBetween,
        selectRouteDestination,
    };
}
