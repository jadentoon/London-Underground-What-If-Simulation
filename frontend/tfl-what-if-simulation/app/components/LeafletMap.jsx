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
    Tooltip,
    useMapEvents, 
    ZoomControl
} from "react-leaflet";

/* -------------------- Constants -------------------- */

// Default center of the map (London Coordinates).
const LONDON_CENTER = [51.5074, -0.1278]; 

// Line colours for each London Underground line.
const LINE_COLORS = {
    bakerloo: "#B36305",
    central: "#E32017",
    circle: "#FFD300",
    district: "#00782A",
    elizabeth: "#6950A1",
    "hammersmith-city": "#F3A9BB",
    jubilee: "#A0A5A9",
    metropolitan: "#9B0056",
    northern: "#000000",
    piccadilly: "#003688",
    victoria: "#0098D4",
    "waterloo-city": "#95CDBA",
};

// Human-readable labels for tooltips.
const LINE_LABELS = {
    bakerloo: "Bakerloo Line",
    central: "Central Line",
    circle: "Circle Line",
    district: "District Line",
    elizabeth: "Elizabeth Line",
    "hammersmith-city": "Hammersmith & City Line",
    jubilee: "Jubilee Line",
    metropolitan: "Metropolitan Line",
    northern: "Northern Line",
    piccadilly: "Piccadilly Line",
    victoria: "Victoria Line",
    "waterloo-city": "Waterloo & City Line",
};

// Polyline rendering constants
const LINE_OUTLINE_COLOR = "#ffffff47"; // Outline colour for better visibility.
const LINE_OUTLINE_WEIGHT = 8;          // Outline thickness.
const LINE_STROKE_WEIGHT = 4;           // Core line thickness.
const LINE_OPACITY = 0.8;
const LINE_SMOOTH_FACTOR = 5;           // Smooths polylines.
const OFFSET_STEP = 0.0001;             // Offset for overlapping lines.

/* -------------------- Helpers -------------------- */

/**
 * groupEdges
 * 
 * Group edges connecting the same pair of stations.
 * 
 * @param {Array} edges - List of edges from API.
 * @returns {Object} - Keys are station pairs, values are arrays of edges connecting them.
 */
function groupEdges(edges) {
    const groups = {};

    for (const edge of edges) {
        const a = String(edge.from);
        const b = String(edge.to);
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        
        if(!groups[key])groups[key] = [];
        groups[key].push(edge);
    }

    return groups;
}

/**
 * dedupeEdges
 * 
 * Remove duplicate edges between the same stations for the same line.
 * 
 * @param {Array} edges - List of edges from API.
 * @returns {Array} - Deduplicated edges.
 */
function dedupeEdges(edges) {
    const seen = new Set();
    const result = [];

    for (const edge of edges) {
        const a = String(edge.from);
        const b = String(edge.to);

        const key =
            a < b 
                ? `${a}-${b}-${edge.line}`
                : `${b}-${a}-${edge.line}`;
        
        if(seen.has(key)) continue;

        seen.add(key);
        result.push(edge);
    }

    return result;
}

/**
 * offsetSegment
 * 
 * Compute offset coordinates for overlapping lines to display them side
 * by side.
 * 
 * @param {Array} start - [lat, lon] of starting station. 
 * @param {Array} end - [lat, lon] of ending station. 
 * @param {number} offset - Distance offset in degrees.
 * @returns {Array} - Two coordinates for the offset line.
 */
function offsetSegment([lat1, lon1], [lat2, lon2], offset) {
    const dx = lon2 - lon1;
    const dy = lat2 - lat1;
    const length = Math.sqrt(dx * dx + dy * dy) || 1;

    const ox = (-dy / length) * offset;
    const oy = (dx / length) *offset;

    return [
        [lat1 + oy, lon1 + ox],
        [lat2 + oy, lon2 + ox],
    ];
}

/* -------------------- Leaflet Event Wrapper -------------------- */

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