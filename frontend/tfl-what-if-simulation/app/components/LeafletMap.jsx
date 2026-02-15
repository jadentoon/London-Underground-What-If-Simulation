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

import { Fragment, useEffect, useState, useRef, useMemo } from "react";
import { 
    MapContainer, 
    TileLayer, 
    CircleMarker, 
    Polyline,
    Tooltip,
    useMapEvents,
    useMap,
    Marker
} from "react-leaflet";
import L from "leaflet";

// import Leaflet CSS
import "leaflet/dist/leaflet.css";

// fix Leaflet's default icon issue with Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LONDON_CENTER = [51.5074, -0.1278]; // default center (London coordinates)

// Line styling constants
const LINE_OUTLINE_COLOR = "#ffffff";
const LINE_OUTLINE_WEIGHT = 6;
const LINE_STROKE_WEIGHT = 4;
const LINE_OPACITY = 0.8;
const LINE_SMOOTH_FACTOR = 1.0;
const OFFSET_STEP = 0.00015; // Offset step for parallel lines in degrees

// TfL Line colors (official Transport for London colors)
const LINE_COLORS = {
    "bakerloo": "#B36305",
    "central": "#E32017",
    "circle": "#FFD300",
    "district": "#00782A",
    "hammersmith-city": "#F3A9BB",
    "jubilee": "#A0A5A9",
    "metropolitan": "#9B0056",
    "northern": "#000000",
    "piccadilly": "#003688",
    "victoria": "#0098D4",
    "waterloo-city": "#95CDBA",
    "dlr": "#00A4A7",
    "elizabeth": "#7156A5",
    "london-overground": "#EE7C0E",
};

// Line display labels
const LINE_LABELS = {
    "bakerloo": "Bakerloo",
    "central": "Central",
    "circle": "Circle",
    "district": "District",
    "hammersmith-city": "Hammersmith & City",
    "jubilee": "Jubilee",
    "metropolitan": "Metropolitan",
    "northern": "Northern",
    "piccadilly": "Piccadilly",
    "victoria": "Victoria",
    "waterloo-city": "Waterloo & City",
    "dlr": "DLR",
    "elizabeth": "Elizabeth",
    "london-overground": "London Overground",
};

/**
 * Deduplicate bidirectional edges
 * Removes duplicate edges where from-to and to-from connections exist
 * 
 * @param {Array} edges - Array of edge objects with from, to, and line properties
 * @returns {Array} Deduplicated array of edges
 */
function dedupeEdges(edges) {
    const seen = new Set();
    return edges.filter(edge => {
        const key = [edge.from, edge.to].sort().join('-') + '-' + edge.line;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/**
 * Group edges by station pair
 * Groups all edges connecting the same two stations together
 * 
 * @param {Array} edges - Array of edge objects
 * @returns {Object} Object with station pair keys and arrays of edges as values
 */
function groupEdges(edges) {
    const groups = {};
    edges.forEach(edge => {
        const pairKey = [edge.from, edge.to].sort().join('-');
        if (!groups[pairKey]) {
            groups[pairKey] = [];
        }
        groups[pairKey].push(edge);
    });
    return groups;
}

/**
 * Calculate offset positions for parallel lines
 * Offsets a line segment perpendicular to its direction
 * 
 * @param {Array} from - [lat, lng] starting point
 * @param {Array} to - [lat, lng] ending point
 * @param {number} offset - Offset distance in degrees
 * @returns {Array} Array of two [lat, lng] positions for the offset line
 */
function offsetSegment(from, to, offset) {
    const [lat1, lng1] = from;
    const [lat2, lng2] = to;
    
    // Calculate perpendicular offset
    const dx = lng2 - lng1;
    const dy = lat2 - lat1;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len === 0) return [from, to];
    
    // Perpendicular unit vector
    const perpX = -dy / len;
    const perpY = dx / len;
    
    // Apply offset
    return [
        [lat1 + perpY * offset, lng1 + perpX * offset],
        [lat2 + perpY * offset, lng2 + perpX * offset]
    ];
}

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
 * @param {function} onMapChange - callback invoked on pan/zoom
 * @param {boolean} hypotheticalSettingsEnabled - what-if mode
 * @param {Set} closedStations - set of stations IDs that are marked as closed (will need for djikstra's algo)
 * @param {function} onStationClick - callback when a station is clicked
 * @returns {JSX.Element} Leaflet Map container.
 */
const LeafletMap = ({ onMapChange, hypotheticalSettingsEnabled = false, closedStations = new Set(), onStationClick, onMapReady, onStationsLoaded }) => {    
    // Local state for station nodes.
    const [nodes, setNodes] = useState([]);

    // Local state for connection edges.
    const [edges, setEdges] = useState([]);
    
    // state to track if component is mounted (client-side only)
    const [isMounted, setIsMounted] = useState(false);
    
    const containerIdRef = useRef(`map-container-${Math.random().toString(36).substr(2, 9)}`);

    //create a custom icon for the red X mark to indicate closed stations
    const redXIcon = useMemo(() => {
        if (typeof window === 'undefined') return null;
        
        return L.divIcon({
            className: 'custom-red-x-icon',
            html: `
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 40px;
                    font-weight: bold;
                    color: #ef4444;
                    text-shadow: 0 0 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(239, 68, 68, 0.5);
                    pointer-events: none;
                    z-index: 1000;
                ">✕</div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
        });
    }, []);

    /**
     * ensure the component only renders on the client side.
     */
    useEffect(() => {
        setIsMounted(true);
        
        return () => {
            const container = document.getElementById(containerIdRef.current);
            if (container && container._leaflet_id) {
                container._leaflet_id = null;
            }
        };
    }, []);

    /**
     * load station and connection data from the API on the mount.
     */
    useEffect(() => {
    async function loadData() {
        const res = await fetch("/api/stations");
        const data = await res.json();

        setNodes(data.nodes);
        setEdges(data.edges);

        //provide stations to parent for search
        if (onStationsLoaded && data.nodes) {
            onStationsLoaded(data.nodes);
        }
    }
    loadData();
}, [onStationsLoaded]);

    if (!isMounted) {
        return <div style={{ position: "absolute", inset: 0, backgroundColor: "#0a0f1a" }} />;
    }

    // Deduplicate edges to remove bidirectional duplicates.
    const uniqueEdges = dedupeEdges(edges);

    // Group edges connecting the same station pair for offset rendering.
    const groupedEdges = groupEdges(uniqueEdges);

    return (
        <div 
            id={containerIdRef.current}
            style={{ position: "absolute", inset: 0 }}
        >
            <MapContainer
                center={LONDON_CENTER}
                zoom={14}
                minZoom={12}                
                maxZoom={16}                
                scrollWheelZoom
                dragging
                doubleClickZoom
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

            {/* rendering stations as circle markers */}
            {nodes.map((s) => {
                const isClosed = hypotheticalSettingsEnabled && closedStations.has(s.id);
                
                return (
                    <CircleMarker
                        key={s.id}
                        center={[s.lat, s.lon]}
                        radius={10}
                        pathOptions={{
                            color: isClosed ? "#ef4444" : "#ffffff", // change colour to red if station is closed
                            weight: 2,
                            fillColor: isClosed ? "#7f1d1d" : "#000000",
                            fillOpacity: 1,
                        }}
                        eventHandlers={{
                            click: () => {
                                if (hypotheticalSettingsEnabled && onStationClick) {
                                    onStationClick(s.id);
                                }
                            },
                        }}
                    >
                        <Tooltip sticky>{s.name}</Tooltip>
                    </CircleMarker>
                );
            })}
            
            {/* render red X marks over closed stations */}
            {hypotheticalSettingsEnabled && redXIcon && nodes.map((s) => {
                if (!closedStations.has(s.id)) return null;
                
                return (
                    <Marker
                        key={`closed-${s.id}`}
                        position={[s.lat, s.lon]}
                        icon={redXIcon}
                        interactive={false}
                    />
                );
            })}
        </MapContainer>
        </div>
    )
}

export default LeafletMap;