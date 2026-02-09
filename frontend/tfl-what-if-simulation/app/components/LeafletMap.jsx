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

import { useEffect, useState } from "react";
import { 
    MapContainer, 
    TileLayer, 
    CircleMarker, 
    Popup, 
    Polyline,
    useMapEvents,
    useMap
} from "react-leaflet";
import L from "leaflet";

const LONDON_CENTER = [51.5074, -0.1278]; // Default center (London Coordinates)

/**
 * ZoomControlTopRight
 */
function ZoomControlTopRight() {
    const map = useMap();
    
    useEffect(() => {
        if (map) {
            const zoomControl = L.control.zoom({ position: 'topright' });
            try {
                zoomControl.addTo(map);
            } catch (error) {
                console.error('Failed to add zoom control:', error);
            }
            
            return () => {
                try {
                    map.removeControl(zoomControl);
                } catch (error) {
                    // Control might already be removed
                }
            };
        }
    }, [map]);
    
    return null;
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

            {/* Render stations as circle markers */}
            {nodes.map((s) => (
                <CircleMarker
                    key={s.id}
                    center={[s.lat, s.lon]}
                    radius={3}
                    pathOptions={{
                        color: "#3b82f6",
                        fillColor: "#3b82f6",
                        fillOpacity: 0.9,
                    }}
                >
                    <Popup>
                        <strong>{s.name}</strong>
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
                            weight: 1,
                            opacity: 0.5,
                        }}
                    />
                );
            })}
        </MapContainer>
    )
}

export default LeafletMap;