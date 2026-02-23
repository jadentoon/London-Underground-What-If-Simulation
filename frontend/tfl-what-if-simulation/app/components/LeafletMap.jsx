'use client';

import { useEffect, useState, useMemo } from "react";
import {
    MapContainer,
    TileLayer,
    useMapEvents,
    useMap,
} from "react-leaflet";

import { dijkstra } from "../lib/pathfinding.js";
import { buildGraph } from "../lib/graph.js";

import { LONDON_CENTER } from "./mapComponents/constants.js";
import { groupEdges, dedupeEdges, buildNodeById, normaliseIdSet } from "./mapComponents/utils.js";
import { setupLeafletDefaultIcons, createRedXIcon } from "./mapComponents/icons.js";

import RouteLayer from "./mapComponents/RouteLayer.jsx";
import EdgeLayer from "./mapComponents/EdgeLayer.jsx";
import StationLayer from "./mapComponents/StationLayer.jsx";

setupLeafletDefaultIcons();

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
    const map = useMapEvents({
        // Trigger when map stops moving after pan.
        moveend(e) {
            const map = e.target;
            onChange({
                center: map.getCenter(),
                zoom: map.getZoom(),
            });
        },
        // Trigger when zoom level changes.
        zoomend(e) {
            const map = e.target;
            onChange({
                center: map.getCenter(),
                zoom: map.getZoom(),
            });
        },
    });

    // Hard disable double-click zoom (guards against Leaflet defaults)
    useEffect(() => {
        map.doubleClickZoom.disable();
    }, [map]);

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
        click(e) {
            if (!enabled) return;
            onClear?.();
        }
    });
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
 * @param {function} onLineToggle - callback when a line is toggled on map
 * @returns {JSX.Element} Leaflet Map container.
 */
const LeafletMap = ({
    onMapChange,
    hypotheticalSettingsEnabled = false,
    closedStations = new Set(),
    closedLines = new Set(),
    onToggleStationClosed,
    onLineToggle,
    onMapReady,
    onStationsLoaded,
    onRoutingError
}) => {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);

    const [start, setStart] = useState(null);
    const [path, setPath] = useState([]);

    const redXIcon = useMemo(() => createRedXIcon(), []);
    const closedSet = useMemo(() => normaliseIdSet(closedStations), [closedStations]);

    const clearRoute = () => {
        setPath([]);
        setStart(null);
    }

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

    const groupedEdges = useMemo(() => {
        const unique = dedupeEdges(edges);
        return groupEdges(unique);
    }, [edges]);

    function handleSingleClickStation(stationId) {
        const id = String(stationId);

        if (!start) {
            setStart(id);
            setPath([]);
            return;
        }

        if (!graph) return;

        // pass all the closed stationsd to dijkstra's algorithm so it can avoid them when calculating the path
        const stationsToAvoid = hypotheticalSettingsEnabled ? closedSet : new Set();
        const newPath = dijkstra(graph, String(start), id, stationsToAvoid);
        
        //check if path is found 
        if (newPath.length === 0 && start !== id) {
            // if not possible then show the routing error box 
            if (onRoutingError) {
                const startStation = nodeById.get(String(start));
                const endStation = nodeById.get(id);
                onRoutingError({
                    from: startStation?.name || start,
                    to: endStation?.name || id,
                    reason: hypotheticalSettingsEnabled ? 'closed-stations' : 'no-connection'
                });
            }
            setPath([]);
        } else {
            if (onRoutingError) {
                onRoutingError(null);
            }
            setPath(newPath);
        }
        
        setStart(id);
    }

    const pathSet = useMemo(() => new Set(path.map(String)), [path]);

    const pathPositions = useMemo(() => {
        if (!path.length) return [];
        return path
            .map(id => nodeById.get(String(id)))
            .filter(Boolean)
            .map(n => [n.lat, n.lon]);
    }, [path, nodeById]);

    const hasPath = pathPositions.length > 1;

    return (
        <MapContainer
            center={LONDON_CENTER}
            zoom={14}
            minZoom={12}
            maxZoom={16}
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
            {/* Dark CartoDB basemap for reduced visual noise */}
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* Camera Change Listener */}
            <MapEvents onChange={onMapChange} />
            <MapInstance onReady={onMapReady} />
            <ClearOnMapClick enabled={hasPath} onClear={clearRoute} />

            <RouteLayer pathPositions={pathPositions} />

            <EdgeLayer 
                groupedEdges={groupedEdges} 
                nodeById={nodeById} 
                dimmed={hasPath} 
                closedLines={closedLines} 
                onLineToggle={onLineToggle}
                hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
            />

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
                onDoubleClickStation={(id) => onToggleStationClosed?.(id)}
            />
        </MapContainer>
    )
}

export default LeafletMap;