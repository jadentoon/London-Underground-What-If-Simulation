'use client'
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

import { Fragment, useEffect, useState } from "react";
import { 
    MapContainer, 
    TileLayer, 
    CircleMarker, 
    Popup, 
    Polyline,
    Tooltip,
    useMapEvents, 
    ZoomControl
} from "react-leaflet";

const LONDON_CENTER = [51.5074, -0.1278]; // Default center (London Coordinates)
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
const LINE_OUTLINE_COLOR = "#ffffff47";
const LINE_OUTLINE_WEIGHT = 8;
const LINE_STROKE_WEIGHT = 6;
const LINE_OPACITY = 0.8;
const LINE_SMOOTH_FACTOR = 5;

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

    return (
        <MapContainer
            center={LONDON_CENTER}
            zoom={14}
            minZoom={12} // Prevent zooming out too far.
            maxZoom={16} // Prevent zooming in too far.
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
            {edges.map((edge, i) => {
                const from = nodes.find(n => n.id === edge.from);
                const to = nodes.find(n => n.id === edge.to);
                const line = edge.line;

                if (!from || !to) return null;

                const color = LINE_COLORS[line] || "#1e40af";
                const label = LINE_LABELS[line] || line;

                return (
                    <Fragment key={i}>
                        <Polyline
                            positions={[
                                [from.lat, from.lon],
                                [to.lat, to.lon],
                            ]}
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
                        <Polyline
                            positions={[
                                [from.lat, from.lon],
                                [to.lat, to.lon],
                            ]}
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
                            <Tooltip direction="top" offset={[0, 0]} className="line-tooltip">
                                {label}
                            </Tooltip>
                        </Polyline>
                    </Fragment>
                );
            })}

            {/* Render stations as circle markers */}
            {nodes.map((s) => (
                <CircleMarker
                    key={s.id}
                    center={[s.lat, s.lon]}
                    radius={4}
                    pathOptions={{
                        color: "#ffffff",
                        weight: 2,
                        fillColor: "#000000",
                        fillOpacity: 1,
                    }}
                >
                    <Popup>
                        <strong>{s.name}</strong>
                    </Popup>
                </CircleMarker>
            ))}
        </MapContainer>
    )
}

export default LeafletMap;
