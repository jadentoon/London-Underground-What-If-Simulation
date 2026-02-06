'use client';
/**
 * LeafletMap.jsx
 * 
 * Client-side Leaflet map implementation for the London Underground
 * "What-If" simulator. Uses React-Leaflet to render stations and connections
 * with smooth pan/zoom interaction.
 * 
 * NOTE: This component must be a Client Component in Next.js because
 * Leaflet relies on browser APIs (window, DOM) that are unavailable
 * during server-side rendering (SSR).
 */

import { useEffect, useState } from "react";
import { 
    MapContainer, 
    TileLayer, 
    CircleMarker, 
    Popup, 
    Polyline,
    useMapEvents, 
    ZoomControl
} from "react-leaflet";

import { buildGraph } from "../lib/graph.js";
import { dijkstra } from "../lib/pathfinding.js";

const LONDON_CENTER = [51.5074, -0.1278]; // Default center (London Coordinates)

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
    useMapEvents({
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
 * @param {function} onMapChange - Callback invoked on pan/zoom. 
 * @returns {JSX.Element} Leaflet Map container.
 */
const LeafletMap = ({ onMapChange }) => {
    // Local state for station nodes.
    const [nodes, setNodes] = useState([]);

    // Local state for connection edges.
    const [edges, setEdges] = useState([]);

    const [graph, setGraph] = useState(null);

    const [start, setStart] = useState(null);
    const [end, setEnd] = useState(null);
    const [path, setPath] = useState([]);
    const [totalDistance, setTotalDistance] = useState(0);

    /**
     * Load station and connection data from the API on the mount.
     * This effect runs once.
     */
    useEffect(() => {
        async function loadData() {
            const res = await fetch("/api/stations");
            const data = await res.json();

            setNodes(data.nodes);
            setEdges(data.edges);
            setGraph(buildGraph(data.nodes, data.edges));
        }
        loadData();
    }, []);

    useEffect(() => {
        if (!graph || !start || !end) return;

        const result = dijkstra(graph, start, end);
        setPath(result);

        let distance = 0;
        for (let i = 0; i < result.length - 1; i++) {
            const from = String(result[i]);
            const to = String(result[i+1]);
            const edge = graph[from].find(e => e.to === to);
            if (edge) distance += edge.weight;
        }

        setTotalDistance(distance);
        console.log(result);
    }, [graph, start, end]);

    const handleStationClick = (id) => {
        const sid = String(id);

        if (!start) setStart(sid);
        else if (!end) setEnd(sid);
        else {
            setStart(sid);
            setEnd(null);
            setPath([]);
            setTotalDistance(0);
        }
    };

    const pathPositions = path
        .map(id => nodes.find(n => String(n.id) === id))
        .filter(Boolean)
        .map(n => [n.lat, n.lon]);

    return (
        <MapContainer
            center={LONDON_CENTER}
            zoom={14}
            minZoom={12}                // Prevent zooming out too far.
            maxZoom={16}                // Prevent zooming in too far.
            scrollWheelZoom
            dragging
            doubleClickZoom
            zoomControl={false}         // Custom ZoomControl used.
            attributionControl={false}  // Hide default attribtion for cleaner UI.
            style={{
                position: "absolute",
                inset: 0,
                zIndex: 0,
            }}
        >
            {/* Native Leaflet zoom control, positioned top-right */}
            <ZoomControl position="topright" />

            {/* Dark CartoDB basemap for reduced visual noise */}
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* Camera Change Listener */}
            <MapEvents onChange={onMapChange} />

            {/* Render stations as circle markers */}
            {nodes.map((s) => (
                <CircleMarker
                    key={s.id}
                    center={[s.lat, s.lon]}
                    radius={4}
                    pathOptions={{
                        color: 
                            s.id === start
                                ? "#22c55e"
                                : s.id === end
                                ? "#ef4444"
                                : "#3b82f6",
                        fillOpacity: 0.9,
                    }}
                    eventHandlers={{
                        click: () => handleStationClick(s.id),
                    }}
                >
                    <Popup>
                        <strong>{s.name}</strong>
                        {s.id === start && <div>Start</div>}
                        {s.id === end && <div>Destination</div>}
                        {path.length > 1 && (
                            <div>
                                Route Distance: {totalDistance.toFixed(2)} km
                            </div>
                        )}
                    </Popup>
                </CircleMarker>
            ))}

            {/* Render connections as polylines */}
            {edges.map((edge, i) => {
                const from = nodes.find(n => n.id === edge.from);
                const to = nodes.find(n => n.id === edge.to);

                if (!from || !to) return null;

                return (
                    <Polyline
                        key={i}
                        positions={[
                            [from.lat, from.lon],
                            [to.lat, to.lon],
                        ]}
                        pathOptions={{
                            color: "#1e40af",
                            weight: 2,
                            opacity: 0.5,
                        }}
                    />
                );
            })}

            {pathPositions.length > 1 && (
                <Polyline
                    positions={pathPositions}
                    pathOptions={{
                        color: "#22c55e",
                        weight: 7,
                        opacity: 0.9,
                    }}
                />
            )}
        </MapContainer>
    )
}

export default LeafletMap;