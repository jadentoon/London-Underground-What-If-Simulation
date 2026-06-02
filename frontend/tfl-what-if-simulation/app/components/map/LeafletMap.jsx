'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { MapContainer, TileLayer, useMapEvents, useMap, Pane } from "react-leaflet";
import { useTheme } from "next-themes";
import L from "leaflet";

/**
 * Debounces rapidly firing Leaflet events before updating React state.
 *
 * @param {Function} callback - Callback to run after the debounce delay.
 * @param {number} delay - Delay in milliseconds.
 * @returns {Function} Debounced callback.
 */
function useDebounce(callback, delay) {
    const timeoutRef = useRef(null);
    
    return useCallback((...args) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
}

import { LONDON_CENTER } from "../mapShared/constants.js";
import { groupEdges, dedupeEdges, normaliseIdSet, buildUndirectedLineEdgeKey } from "../mapShared/utils.js";
import { setupLeafletDefaultIcons, createRedXIcon } from "../mapShared/icons.js";

import { useTrainMovements } from "../../hooks/useTrainMovements.js";
import { useStationGraph } from "../../hooks/map/useStationGraph.js";
import { useMapRoute } from "../../hooks/map/useMapRoute.js";

import RouteLayer from "../mapLayers/RouteLayer.jsx";
import EdgeLayer from "../mapLayers/EdgeLayer.jsx";
import StationLayer from "../mapLayers/StationLayer.jsx";
import CanvasTrainLayer from "../mapLayers/CanvasTrainLayer.jsx";
import { SelectedTrainPanel } from "../trains/SelectedTrainPanel.jsx";

setupLeafletDefaultIcons();

const TRAIN_PANE_NAME = "train-pane";
const STATION_PANE_NAME = "station-pane";

/**
 * Reports Leaflet camera changes to the parent map container.
 *
 * Move and zoom events are debounced so dragging and wheel zooming do not cause
 * excessive React updates while the user is interacting with the map.
 *
 * @param {Object} props - Map event props.
 * @param {(state: { center: Object, zoom: number }) => void} props.onChange - Receives the latest map camera state.
 * @returns {null} This component attaches Leaflet listeners but renders no DOM.
 */
function MapEvents({ onChange }) {
    const debouncedOnChange = useDebounce(onChange, 300);
    
    const map = useMapEvents({
        moveend() {
            debouncedOnChange({ center: map.getCenter(), zoom: map.getZoom() });
        },
        zoomend() {
            debouncedOnChange({ center: map.getCenter(), zoom: map.getZoom() });
        },
    });

    useEffect(() => {
        map.doubleClickZoom.disable();
        onChange({ center: map.getCenter(), zoom: map.getZoom() });
    }, [map, onChange]);

    return null;
}

/**
 * Exposes the Leaflet map instance to the parent container.
 *
 * The parent uses the map instance for imperative actions such as resetting the
 * view or panning to a searched station.
 *
 * @param {Object} props - Map instance props.
 * @param {(map: Object) => void} props.onReady - Receives the Leaflet map instance.
 * @returns {null} This component renders no DOM.
 */
function MapInstance({ onReady }) {
    const map = useMap();

    useEffect(() => {
        if (onReady) onReady(map);
    }, [map, onReady]);
    return null;
}

/**
 * Clears the active route when the map background is clicked.
 *
 * @param {Object} props - Clear handler props.
 * @param {boolean} props.enabled - Whether map clicks should clear the route.
 * @param {() => void} props.onClear - Clears the current route.
 * @returns {null} This component attaches a Leaflet click listener only.
 */
function ClearOnMapClick({ enabled, onClear }) {
    useMapEvents({
        click() {
            if (!enabled) return;
            onClear?.();
        }
    });
    return null;
}

/**
 * Fits the map viewport to the active route.
 *
 * The controller remembers the last fitted path so repeated renders do not
 * constantly refit the same route bounds.
 *
 * @param {Object} props - Route fitting props.
 * @param {Array<[number, number]>} props.pathPositions - Route coordinates.
 * @param {boolean} props.hasPath - Whether a valid route is active.
 * @returns {null} This component performs a Leaflet side effect only.
 */
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
 * Renders the interactive Leaflet map and map layers.
 *
 * This component now delegates station graph loading and route calculation to
 * hooks, then composes the base map, line edges, station markers, route layer,
 * train canvas layer and selected-train panel. Parent components receive route,
 * train-feed and camera updates through callbacks.
 *
 * @param {Object} props - Leaflet map props.
 * @param {(state: { center: Object, zoom: number }) => void} props.onMapChange - Receives map camera changes.
 * @param {Object} props.COLORS - Theme tokens used by map overlays.
 * @param {boolean} [props.hypotheticalSettingsEnabled=false] - Whether What-If mode is active.
 * @param {Set<string>} [props.closedStations] - Station ids closed by the current What-If scenario.
 * @param {Set<string>} [props.closedLines] - Effective closed line ids.
 * @param {Map<string, Set<string>>} [props.partialStationIdsByLine] - Live partial disruption station ids by line.
 * @param {(stationId: string) => void} props.onToggleStationClosed - Toggles a station closure.
 * @param {(lineId: string) => void} props.onLineToggle - Toggles a line closure.
 * @param {(map: Object) => void} props.onMapReady - Receives the Leaflet map instance.
 * @param {(stations: Array<Object>) => void} props.onStationsLoaded - Receives loaded station data for search.
 * @param {(error: Object | null) => void} props.onRoutingError - Receives route error state.
 * @param {(routeInfo: Object) => void} props.onRouteChange - Receives active route summary data.
 * @param {Set<string>} [props.liveClosedStations] - Station ids closed by live TfL disruption data.
 * @param {(status: Object) => void} props.onTrainFeedStatusChange - Receives train feed status metadata.
 * @param {boolean} [props.showTrains=true] - Whether train markers are visible.
 * @param {string | null} [props.selectedTrainId] - Currently selected train id.
 * @param {(trainId: string | null) => void} props.onSelectedTrainIdChange - Updates the selected train.
 * @param {"all" | "selected"} [props.trainFilterMode] - Train line filter mode.
 * @param {Set<string>} [props.visibleTrainLines] - Visible train line ids when filtering.
 * @param {"route" | "closures"} [props.interactionMode] - Active station/line interaction mode.
 * @param {boolean} [props.isMobilePortrait=false] - Whether the map is in mobile portrait layout.
 * @param {number} [props.resetRouteSequence=0] - Sequence value used to request route resets.
 * @param {string | null} [props.highlightedStationId] - Station id highlighted by search.
 * @param {Object | null} [props.stationActionRequest] - Imperative station action request from the search panel.
 * @param {(selection: Object) => void} props.onRouteSelectionChange - Receives start/end route selection state.
 * @param {(station: Object | null) => void} props.onFocusedStationChange - Receives station focus changes from map clicks.
 * @returns {JSX.Element} Interactive Leaflet map with Underground network layers.
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

    const {
        nodes,
        edges,
        nodeById,
        graph
    } = useStationGraph({ onStationsLoaded });

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
    }, [onSelectedTrainIdChange]);

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

    const {
        start,
        end,
        pathSet,
        pathPositions,
        hasPath,
        pathStops,
        groupedLegs,
        totalTravelSeconds,
        changeCount,
        clearRoute,
        setStart,
        setRouteStartSelection,
        buildRouteBetween,
        selectRouteDestination,
    } = useMapRoute({
        graph,
        nodeById,
        edges,
        hypotheticalSettingsEnabled,
        closedSet,
        closedLineSet,
        partialEdgeKeys,
        onRoutingError,
    });

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

        if (stationActionRequest?.action === "set-start") {
            const stationId = String(stationActionRequest?.stationId ?? "");

            if (!stationId) return;
            if (isStationUnavailableForRouting(stationId)) return;

            setRouteStartSelection(stationId);
            return;
        }

        if (stationActionRequest?.action === "set-destination") {
            const stationId = String(stationActionRequest?.stationId ?? "");

            if (!stationId) return;
            if (isStationUnavailableForRouting(stationId)) return;
            if (!start || String(start) === stationId) return;

            selectRouteDestination(stationId);
            return;
        }

        if (stationActionRequest?.action === "restore-route") {
            const restoreStartId = String(stationActionRequest?.startStationId ?? "");
            const restoreEndId = String(stationActionRequest?.endStationId ?? "");

            if (!restoreStartId || !restoreEndId) return;
            if (isStationUnavailableForRouting(restoreStartId) || isStationUnavailableForRouting(restoreEndId)) {
                return;
            }

            buildRouteBetween(restoreStartId, restoreEndId);
            return;
        }

        if (stationActionRequest?.action === "toggle-closure") {
            const stationId = String(stationActionRequest?.stationId ?? "");

            if (!stationId) return;
            handleToggleStationClosure(stationId);
        }
    }, [
        buildRouteBetween,
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
                            isLightTheme={isLightTheme}
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
                        isLightTheme={isLightTheme}
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
