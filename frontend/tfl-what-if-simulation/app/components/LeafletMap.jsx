'use client';
/**
 * LeafletMap.jsx
 * 
 * Client-side Leaflet map implementation for the London Underground 
 * "What-If" simulator. 
 * 
 * Responsbilities:
 * - Render stations as CircleMarkers with popups.
 * - Render connections as multi-line Polylines with color coding per line.
 * - Offset overlapping lines to improve visibility.
 * - Smooth pan/zoom interactions.
 * 
 * NOTE: This component must be a Client Component in Next.js because
 * Leaflet relies on browser APIs (window, DOM) that are unavailable
 * during server-side rendering (SSR).
 */

import { Fragment, useEffect, useState } from "react";
import { 
    MapContainer, 
    TileLayer, 
    CircleMarker, 
    Polyline,
    useMapEvents,
    useMap
} from "react-leaflet";
import L from "leaflet";

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

/* -------------------- Main Component -------------------- */

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
        }
        loadData();
    }, []);

    // Deduplicate edges to remove bidirectional duplicates.
    const uniqueEdges = dedupeEdges(edges);

    // Group edges connecting the same station pair for offset rendering.
    const groupedEdges = groupEdges(uniqueEdges);

    return (
        <MapContainer
            center={LONDON_CENTER}
            zoom={14}
            minZoom={12}                // Prevent zooming out too far.
            maxZoom={16}                // Prevent zooming in too far.
            scrollWheelZoom
            dragging
            doubleClickZoom
            zoomControl={true}          // Enable default zoom control.
            attributionControl={false}  // Hide default attribtion for cleaner UI.
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

            {/* Render connections as polylines (white outline + coloured core) */}
            {Object.entries(groupedEdges).map(([pairKey, group]) => {
                const from = nodes.find(n => n.id === String(group[0].from));
                const to = nodes.find(n => n.id === String(group[0].to));
                if (!from || !to) return null;

                const base = [
                    [from.lat, from.lon],
                    [to.lat, to.lon],
                ];

                const mid = (group.length - 1) / 2;

                return group.map((edge, index) => {
                    const offset = (index - mid) * OFFSET_STEP;
                    const positions = offsetSegment(base[0], base[1], offset);
                    
                    const line = edge.line;
                    const color = LINE_COLORS[line] || "#3b82f6";
                    const label = LINE_LABELS[line] || line;

                    return (
                        <Fragment key={`${pairKey}-${line}-${index}`}>
                            {/* Outline for visibility */}
                            <Polyline
                                positions={positions}
                                pathOptions={{
                                    color: LINE_OUTLINE_COLOR,
                                    weight: LINE_OUTLINE_WEIGHT,
                                    opacity: LINE_OPACITY,
                                    lineCap: "round",
                                    lineJoin: "round",
                                    smoothFactor: LINE_SMOOTH_FACTOR,
                                    interactive: false,
                                }}
                            />

                            {/* Core line with tooltip */}
                            <Polyline
                                positions={positions}
                                pathOptions={{
                                    color,
                                    weight: LINE_STROKE_WEIGHT,
                                    opacity: LINE_OPACITY,
                                    lineCap: "round",
                                    lineJoin: "round",
                                    smoothFactor: LINE_SMOOTH_FACTOR,
                                    interactive: true,
                                }}
                            >
                                <Tooltip sticky>{label}</Tooltip>
                            </Polyline>
                        </Fragment>
                    );
                });
            })}

            {/* Render stations as circle markers */}
            {nodes.map((s) => (
                <CircleMarker
                    key={s.id}
                    center={[s.lat, s.lon]}
                    radius={10}
                    pathOptions={{
                        color: "#ffffff",
                        weight: 2,
                        fillColor: "#000000",
                        fillOpacity: 1,
                    }}
                >
                    <Tooltip sticky>{s.name}</Tooltip>
                </CircleMarker>
            ))}
        </MapContainer>
    )
}

export default LeafletMap;