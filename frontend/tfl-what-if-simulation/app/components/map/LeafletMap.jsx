'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { MapContainer, TileLayer, useMapEvents, useMap, Pane } from "react-leaflet";
import { useTheme } from "next-themes";
import L from "leaflet";

// Debounce utility for map events
function useDebounce(callback, delay) {
    const timeoutRef = useRef(null);
    
    return useCallback((...args) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
}

import { dijkstra } from "../../lib/pathfinding.js";
import { buildGraph } from "../../lib/graph.js";

import { LONDON_CENTER } from "../mapShared/constants.js";
import { groupEdges, dedupeEdges, buildNodeById, normaliseIdSet, splitStateKey, buildUndirectedLineEdgeKey } from "../mapShared/utils.js";
import { setupLeafletDefaultIcons, createRedXIcon } from "../mapShared/icons.js";
import { useTrainMovements } from "../../hooks/useTrainMovements.js";

import RouteLayer from "../mapLayers/RouteLayer.jsx";
import EdgeLayer from "../mapLayers/EdgeLayer.jsx";
import StationLayer from "../mapLayers/StationLayer.jsx";
import CanvasTrainLayer from "../mapLayers/CanvasTrainLayer.jsx";
import { SelectedTrainPanel } from "../trains/SelectedTrainPanel.jsx";

setupLeafletDefaultIcons();

const TRAIN_PANE_NAME = "train-pane";
const STATION_PANE_NAME = "station-pane";

/**
 * MapEvents
 * 
 * Attaches event listener to the Leaflet map instance.
 * Reports map camera changes (pan/zoom) to the parent component
 * via the `onChange` callback.
 * 
 * @param {function} onChange - Callback to report {center, zoom}. 
 * @returns {null} This component does not render any UI.
 */
function MapEvents({ onChange }) {
    //debonce map events to reduce re-render frequency 
    const debouncedOnChange = useDebounce(onChange, 300);
    
    const map = useMapEvents({
        //tigger when map stops moving after pan
        moveend() {
            debouncedOnChange({ center: map.getCenter(), zoom: map.getZoom() });
        },
        //trigger when zoom level changes
        zoomend() {
            debouncedOnChange({ center: map.getCenter(), zoom: map.getZoom() });
        },
    });

    //hard disable double-click zoom (guards against Leaflet defaults)
    useEffect(() => {
        map.doubleClickZoom.disable();
        //initial call not debounced
        onChange({ center: map.getCenter(), zoom: map.getZoom() });
    }, [map, onChange]);

    return null;
}

/**
 * MapInstance
 * 
 * Captures the Leaflet map instance and provides it to the parent
 * via the onReady callback.
 * 
 * @param {function} onReady - callback that receives the Leaflet map instance
 * @returns {null}
 */
function MapInstance({ onReady }) {
    const map = useMap();

    useEffect(() => {
        if (onReady) onReady(map);
    }, [map, onReady]);
    return null;
}

function ClearOnMapClick({ enabled, onClear }) {
    useMapEvents({
        click() {
            if (!enabled) return;
            onClear?.();
        }
    });
    return null;
}

function RouteFitController({ pathPositions, hasPath }) {
    const map = useMap();
    const lastFitKeyRef = useRef("");

    useEffect(() => {
        if (!map || !hasPath || !Array.isArray(pathPositions) || pathPositions.length < 2) {
            lastFitKeyRef.current = "";
            return;
        }

        const boundsPositions = pathPositions.filter(([lat, lon]) => (
            Number.isFinite(Number(lat)) && Number.isFinite(Number(lon))
        ));

        if (boundsPositions.length < 2) return;

        const fitKey = boundsPositions.map(([lat, lon]) => `${lat},${lon}`).join("|");
        if (fitKey === lastFitKeyRef.current) return;
        lastFitKeyRef.current = fitKey;

        const bounds = L.latLngBounds(boundsPositions);
        map.fitBounds(bounds, {
            paddingTopLeft: [90, 120],
            paddingBottomRight: [90, 90],
            maxZoom: 14,
            animate: true,
        });
    }, [map, pathPositions, hasPath]);

    return null;
}

/**
 * LeafletMap
 * 
 * Renders a controlled Leaflet map container with:
 * - Dark themed CartoDB basemap for reduced visual noise.
 * - Stations rendered as Circlemarkers with popups.
 * - Connections rendered as Polylines.
 * - Native Leaflet zoom & pan interactions.
 * 
 * Uses React state to load and render nodes (stations) and edges (connections).
 * Map camera chanes are communicated to the parent component via
 * the `onMapChange` callback.
 * 
 * @param {function} onMapChange - callback invoked on pan/zoom
 * @param {boolean} hypotheticalSettingsEnabled - what-if mode
 * @param {Set} closedStations - set of stations IDs that are marked as closed (will need for djikstra's algo)
 * @param {function} onStationClick - callback when a station is double-clicked (close/open)
 * @param {function} onStationSelect - callback when a station is single-clicked (route planning)
 * @param {Set} closedLines - set of line ids that are marked as closed
 * @param {Map<string, Set<string>>} partialStationIdsByLine - live partial disruption station ids by line
 * @param {function} onLineToggle - callback when a line is toggled on map
 * @returns {JSX.Element} Leaflet Map container.
 */
const LeafletMap = ({
    onMapChange,
    COLORS,
    hypotheticalSettingsEnabled = false,
    closedStations = new Set(),
    closedLines = new Set(),
    partialStationIdsByLine = new Map(),
    onToggleStationClosed,
    onLineToggle,
    onMapReady,
    onStationsLoaded,
    onRoutingError,
    onRouteChange,
    liveClosedStations = new Set(),
    onTrainFeedStatusChange,
    showTrains = true,
    selectedTrainId = null,
    onSelectedTrainIdChange,
    trainFilterMode = "all",
    visibleTrainLines = new Set(),
    interactionMode = "route",
    isMobilePortrait = false,
    resetRouteSequence = 0,
    highlightedStationId = null,
    stationActionRequest = null,
    onRouteSelectionChange,
    onFocusedStationChange,
}) => {
    //keep panning constrained to the Greater London area.
    const LONDON_MAX_BOUNDS = useMemo(() => ([
        [51.28, -0.75],
        [51.72, 0.35],
    ]), []);

    const { resolvedTheme } = useTheme();
    const isLightTheme = resolvedTheme === "light";

    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);

    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);

    const [path, setPath] = useState([]);

    const [routeMeta, setRouteMeta] = useState({
        totalSeconds: 0,
        changeCount: 0,
        statePath: [],
    });

    const [zoomLevel, setZoomLevel] = useState(14);

    //expand vector render bounds so paths stay visible while dragging at viewport edges.
    const vectorRenderer = useMemo(() => L.svg({ padding: 0.8 }), []);

    const redXIcon = useMemo(() => createRedXIcon(zoomLevel), [zoomLevel]);
    const closedSet = useMemo(() => normaliseIdSet(closedStations), [closedStations]);
    const closedLineSet = useMemo(() => normaliseIdSet(closedLines), [closedLines]);
    const liveClosedSet = useMemo(
        () => new Set(Array.from(liveClosedStations ?? []).map((id) => String(id))), [liveClosedStations]);
    const isStationUnavailableForRouting = useCallback((stationId) => {
        const id = String(stationId);

        return liveClosedSet.has(id) || (hypotheticalSettingsEnabled && closedSet.has(id));
    }, [closedSet, hypotheticalSettingsEnabled, liveClosedSet]);

    const clearRoute = useCallback(() => {
        setPath([]);
        setRouteMeta({ totalSeconds: 0, changeCount: 0, statePath: [] });
        setStart(null);
        setEnd(null);
        onRoutingError?.(null);
    }, [onRoutingError]);

    const setRouteStartSelection = useCallback((stationId) => {
        const id = String(stationId);

        setStart(id);
        setEnd(null);
        setPath([]);
        setRouteMeta({ totalSeconds: 0, changeCount: 0, statePath: [] });
        onRoutingError?.(null);
    }, [onRoutingError]);

    useEffect(() => {
        let alive = true;
        (async () => {
            const res = await fetch("/api/stations");
            const data = await res.json();
            if (!alive) return;

            setNodes(data.nodes || []);
            setEdges(data.edges || []);
            onStationsLoaded?.(data.nodes || []);
        })();

        return () => {
            alive = false;
        };
    }, [onStationsLoaded]);

    const nodeById = useMemo(() => buildNodeById(nodes), [nodes]);

    const graph = useMemo(() => {
        if (!nodes.length || !edges.length) return null;
        return buildGraph(nodes, edges);
    }, [nodes, edges]);
    const trainVisualsEnabled = !hypotheticalSettingsEnabled;
    const { trains, feedStatus } = useTrainMovements({
        nodes,
        edges,
        enabled: trainVisualsEnabled,
    });
    const filteredTrains = useMemo(() => {
        if (!showTrains) return [];
        if (trainFilterMode === "all") return trains;
        return trains.filter((train) => visibleTrainLines.has(String(train.lineId)));
    }, [trains, showTrains, trainFilterMode, visibleTrainLines]);
    const selectedTrain = useMemo(() => {
        if (!selectedTrainId) return null;
        return filteredTrains.find((train) => String(train.id) === String(selectedTrainId)) ?? null;
    }, [filteredTrains, selectedTrainId]);

    const handleTrainSelect = useCallback((trainId) => {
        onSelectedTrainIdChange?.(trainId ? String(trainId) : null);
    }, []);

    const focusStationById = useCallback((stationId) => {
        const station = nodeById.get(String(stationId)) ?? null;
        onFocusedStationChange?.(station);
    }, [nodeById, onFocusedStationChange]);

    const groupedEdges = useMemo(() => {
        const unique = dedupeEdges(edges);
        return groupEdges(unique);
    }, [edges]);

    const partialEdgeKeys = useMemo(() => {
        if (hypotheticalSettingsEnabled) return new Set();
        if (!partialStationIdsByLine || partialStationIdsByLine.size === 0) return new Set();

        const out = new Set();
        const uniqueEdges = dedupeEdges(edges);

        for (const edge of uniqueEdges) {
            const line = String(edge.line);
            const affectedStops = partialStationIdsByLine.get(line);
            if (!affectedStops || affectedStops.size < 2) continue;

            const from = String(edge.from);
            const to = String(edge.to);
            if (affectedStops.has(from) && affectedStops.has(to)) {
                out.add(buildUndirectedLineEdgeKey(from, to, line));
            }
        }

        return out;
    }, [edges, hypotheticalSettingsEnabled, partialStationIdsByLine]);

    const selectRouteDestination = useCallback((destinationId) => {
        const id = String(destinationId);

        if (!start || !graph) return;

        // pass all the closed stations to dijkstra's algorithm so it can avoid them when calculating the path
        const stationsToAvoid = hypotheticalSettingsEnabled ? closedSet : new Set();
        const linesToAvoid = closedLineSet;
        const blockedEdges = partialEdgeKeys;

        const result = dijkstra(graph, String(start), id, stationsToAvoid, linesToAvoid, blockedEdges);

        const newPath = Array.isArray(result) ? result : (result?.path ?? []);
        const totalSeconds = Array.isArray(result) ? null : result?.totalSeconds;
        const changeCount = Array.isArray(result) ? null : result?.changeCount;
        const statePath = Array.isArray(result) ? [] : (result?.statePath ?? []);

        if (newPath.length === 0 && String(start) !== id) {
            const startStation = nodeById.get(String(start));
            const endStation = nodeById.get(id);
            const hasClosedStations = hypotheticalSettingsEnabled && closedSet.size > 0;
            const hasLineDisruptions = closedLineSet.size > 0 || partialEdgeKeys.size > 0;

            onRoutingError?.({
                from: startStation?.name || start,
                to: endStation?.name || id,
                reason: hasClosedStations
                    ? "closed-stations"
                    : (hasLineDisruptions ? "closed-lines" : "no-connection")
            });
            setPath([]);
            setRouteMeta({ totalSeconds: 0, changeCount: 0, statePath: [] });
        } else {
            onRoutingError?.(null);

            setPath(newPath);
            setRouteMeta({
                totalSeconds: Number.isFinite(totalSeconds) ? Number(totalSeconds) : 0,
                changeCount: Number.isFinite(changeCount) ? Number(changeCount) : 0,
                statePath,
            });
        }

        setEnd(id);
    }, [
        start,
        graph,
        nodeById,
        hypotheticalSettingsEnabled,
        closedSet,
        closedLineSet,
        partialEdgeKeys,
        onRoutingError,
    ]);

    const handleSingleClickStation = useCallback((stationId) => {
        const id = String(stationId);

        focusStationById(id);

        if (!start) {
            setRouteStartSelection(id);
            return;
        }

        selectRouteDestination(id);
    }, [focusStationById, selectRouteDestination, setRouteStartSelection, start]);

    const handleToggleStationClosure = useCallback((id) => {
        clearRoute();
        onToggleStationClosed?.(id);
    }, [clearRoute, onToggleStationClosed]);

    const handleToggleLineClosure = useCallback((lineId) => {
        clearRoute();
        onLineToggle?.(lineId);
    }, [clearRoute, onLineToggle]);

    const pathSet = useMemo(() => new Set(path.map(String)), [path]);
    const stationOcclusionTargets = useMemo(() => {
        return nodes.map((station) => {
            const id = String(station.id);
            const isLiveClosed = liveClosedSet.has(id);
            const isHypotheticalClosed = hypotheticalSettingsEnabled && closedSet.has(id);

            return {
                id,
                lat: station.lat,
                lon: station.lon,
                isHighlighted: id === String(highlightedStationId),
                isStart: id === String(start),
                isOnPath: pathSet.has(id),
                isClosed: isLiveClosed || isHypotheticalClosed,
            };
        });
    }, [
        closedSet,
        highlightedStationId,
        hypotheticalSettingsEnabled,
        liveClosedSet,
        nodes,
        pathSet,
        start,
    ]);

    const pathPositions = useMemo(() => {
        if (!path.length) return [];
        return path
            .map(id => nodeById.get(String(id)))
            .filter(Boolean)
            .map(n => [n.lat, n.lon]);
    }, [path, nodeById]);

    const hasPath = pathPositions.length > 1;

    const edgeByPair = useMemo(() => {
        const m = new Map();
        for (const e of edges) {
            const a = String(e.from);
            const b = String(e.to);
            const line = String(e.line ?? "unknown");
            m.set(`${a}|${b}|${line}`, e);
            m.set(`${b}|${a}|${line}`, e);
        }
        return m;
    }, [edges]);

    const pathStops = useMemo(() => {
        return path
            .map((id, idx) => {
                const n = nodeById.get(String(id));
                if (!n) return null;
                return {
                    id: String(id),
                    index: idx,
                    name: n.name,
                    lat: n.lat,
                    lon: n.lon,
                }
            })
            .filter(Boolean);
    }, [path, nodeById]);

    const pathLegs = useMemo(() => {
        const sp = routeMeta.statePath ?? [];
        if (sp.length < 2) return [];

        const legs = [];

        for (let i = 1; i < sp.length; i++) {
            const prev = splitStateKey(sp[i - 1]);
            const curr = splitStateKey(sp[i]);

            if (prev.stationId === curr.stationId) continue;

            const fromNode = nodeById.get(String(prev.stationId));
            const toNode = nodeById.get(String(curr.stationId));

            const edge = edgeByPair.get(`${prev.stationId}|${curr.stationId}|${curr.line ?? "unknown"}`);

            legs.push({
                fromId: prev.stationId,
                toId: curr.stationId,
                fromName: fromNode?.name ?? prev.stationId,
                toName: toNode?.name ?? curr.stationId,
                line: curr?.line ?? "unknown",
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
        let current = null;

        for (const leg of pathLegs) {
            const line = leg.line ?? "unknown";

            if (!current || current.line !== line) {
                current = {
                    line,
                    fromName: leg.fromName,
                    toName: leg.toName,
                    stops: 1,
                    travelTimeSeconds: leg.travelTimeSeconds ?? 0,
                };
                groups.push(current);
            } else {
                current.toName = leg.toName;
                current.stops += 1;
                current.travelTimeSeconds += leg.travelTimeSeconds ?? 0;
            }
        }

        return groups;
    }, [pathLegs]);

    const totalTravelSeconds = useMemo(() => {
        return routeMeta.totalSeconds ?? 0;
    }, [routeMeta.totalSeconds]);

    const changeCount = useMemo(() => {
        return routeMeta.changeCount ?? Math.max(0, groupedLegs.length - 1);
    }, [routeMeta.changeCount, groupedLegs.length]);

    const lastRouteKeyRef = useRef("");
    const lastRouteSelectionKeyRef = useRef("");
    const lastFeedStatusKeyRef = useRef("");
    const lastResetRouteSequenceRef = useRef(resetRouteSequence);
    const lastStationActionSequenceRef = useRef(stationActionRequest?.sequence ?? 0);

    useEffect(() => {
        if (resetRouteSequence === lastResetRouteSequenceRef.current) return;

        lastResetRouteSequenceRef.current = resetRouteSequence;
        clearRoute();
    }, [resetRouteSequence, clearRoute]);

    useEffect(() => {
        const actionSequence = stationActionRequest?.sequence ?? 0;

        if (!actionSequence || actionSequence === lastStationActionSequenceRef.current) {
            return;
        }

        lastStationActionSequenceRef.current = actionSequence;

        const stationId = String(stationActionRequest?.stationId ?? "");

        if (!stationId) return;

        if (stationActionRequest?.action === "set-start") {
            if (isStationUnavailableForRouting(stationId)) return;

            setRouteStartSelection(stationId);
            return;
        }

        if (stationActionRequest?.action === "set-destination") {
            if (isStationUnavailableForRouting(stationId)) return;
            if (!start || String(start) === stationId) return;

            selectRouteDestination(stationId);
            return;
        }

        if (stationActionRequest?.action === "toggle-closure") {
            handleToggleStationClosure(stationId);
        }
    }, [
        handleToggleStationClosure,
        isStationUnavailableForRouting,
        selectRouteDestination,
        setRouteStartSelection,
        start,
        stationActionRequest,
    ]);

    useEffect(() => {
        if (!onRouteSelectionChange) return;

        const payload = {
            startId: start ? String(start) : null,
            startName: start ? (nodeById.get(String(start))?.name ?? String(start)) : null,
            endId: end ? String(end) : null,
            endName: end ? (nodeById.get(String(end))?.name ?? String(end)) : null,
            hasPath,
        };

        const key = JSON.stringify(payload);

        if (key === lastRouteSelectionKeyRef.current) return;
        lastRouteSelectionKeyRef.current = key;

        onRouteSelectionChange(payload);
    }, [end, hasPath, nodeById, onRouteSelectionChange, start]);

    useEffect(() => {
        if (!onRouteChange) return;

        const hasPathNow = pathStops.length > 1;

        const payload = {
            hasPath: hasPathNow,
            startName: pathStops[0]?.name ?? null,
            endName: pathStops[pathStops.length - 1]?.name ?? null,
            stops: pathStops,
            groupedLegs,
            totalTravelSeconds,
            changeCount,
        };

        const key = JSON.stringify({
            hasPath: payload.hasPath,
            stopIds: payload.stops.map(s => s.id),
            grouped: payload.groupedLegs.map(g => `${g.line}|${g.fromName}|${g.toName}|${g.stops}|${g.travelTimeSeconds}`),
            total: payload.totalTravelSeconds,
            changes: payload.changeCount,
        });

        if (key === lastRouteKeyRef.current) return;
        lastRouteKeyRef.current = key;

        onRouteChange(payload);
    }, [onRouteChange, pathStops, groupedLegs, totalTravelSeconds, changeCount]);

    const handleMapChange = useCallback((state) => {
        setZoomLevel((prevZoom) => (prevZoom === state.zoom ? prevZoom : state.zoom));
        onMapChange?.(state);}
        ,[onMapChange]);

    useEffect(() => {
        if (!onTrainFeedStatusChange) return;

        // Prevent a child -> parent -> child update loop when the feed values
        // are semantically unchanged but the object identity is new.
        const key = JSON.stringify({
            source: feedStatus?.source ?? "",
            updatedAt: feedStatus?.updatedAt
                ? new Date(feedStatus.updatedAt).toISOString()
                : "",
            reason: feedStatus?.reason ?? "",
            trainCount: feedStatus?.trainCount ?? 0,
        });

        if (key === lastFeedStatusKeyRef.current) return;
        lastFeedStatusKeyRef.current = key;

        onTrainFeedStatusChange(feedStatus);
    }, [feedStatus, onTrainFeedStatusChange]);

    return (
        <>
            <MapContainer
                center={LONDON_CENTER}
                zoom={zoomLevel}
                minZoom={12}
                maxZoom={16}
                wheelPxPerZoomLevel={90}
                zoomAnimation
                fadeAnimation
                markerZoomAnimation
                maxBounds={LONDON_MAX_BOUNDS}
                maxBoundsViscosity={1.0}
                renderer={vectorRenderer}
                scrollWheelZoom
                dragging
                doubleClickZoom={false}
                zoomControl={true}
                attributionControl={false}
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 0,
                }}
            >
                <TileLayer 
                    url={`https://{s}.basemaps.cartocdn.com/${isLightTheme ? "light_all" : "dark_all"}/{z}/{x}/{y}{r}.png`}
                    bounds={LONDON_MAX_BOUNDS}
                    noWrap
                    keepBuffer={7}
                    updateWhenIdle={false}
                    updateWhenZooming={true}
                    updateInterval={100}
                />

            {/* Camera Change Listener */}
            <MapEvents onChange={handleMapChange} />
            <MapInstance onReady={onMapReady} />
            <ClearOnMapClick enabled={hasPath && interactionMode !== "closures"} onClear={clearRoute} />
            <RouteFitController pathPositions={pathPositions} hasPath={hasPath} />

                <RouteLayer pathPositions={pathPositions} />

                <EdgeLayer 
                    groupedEdges={groupedEdges} 
                    nodeById={nodeById} 
                    dimmed={hasPath} 
                    closedLines={closedLines} 
                    partialEdgeKeys={partialEdgeKeys}
                    onLineToggle={handleToggleLineClosure}
                    hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                    interactionMode={interactionMode}
                />
                <Pane name={TRAIN_PANE_NAME} style={{ zIndex: 450 }}>
                    {trainVisualsEnabled && showTrains && (
                        <CanvasTrainLayer
                            trains={filteredTrains}
                            selectedTrainId={selectedTrainId}
                            onTrainSelect={handleTrainSelect}
                            stations={stationOcclusionTargets}
                            paneName={TRAIN_PANE_NAME}
                        />
                    )}
                </Pane>

                <Pane name={STATION_PANE_NAME} style={{ zIndex: 460 }}>
                    <StationLayer
                        nodes={nodes}
                        startId={start}
                        setStartId={setStart}
                        pathSet={pathSet}
                        closedSet={closedSet}
                        hasPath={hasPath}
                        hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                        redXIcon={redXIcon}
                        onSingleClickStation={handleSingleClickStation}
                        onDoubleClickStation={handleToggleStationClosure}
                        zoomLevel={zoomLevel}
                        liveClosedSet={liveClosedSet}
                        interactionMode={interactionMode}
                        highlightedStationId={highlightedStationId}
                        paneName={STATION_PANE_NAME}
                    />
                </Pane>
            </MapContainer>

            <SelectedTrainPanel
                train={selectedTrain}
                layout={{ isMobilePortrait }}
                COLORS={COLORS}
                onClose={() => onSelectedTrainIdChange?.(null)}
            />
        </>
    )
}

export default LeafletMap;
