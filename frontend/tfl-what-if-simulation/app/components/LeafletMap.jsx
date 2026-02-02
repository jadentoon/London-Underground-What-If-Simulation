'use client'
/**
 * Client-side Leaflet map implementation for Next.js (App Router).
 * 
 * This file must be a Client Component because Leaflet depends on
 * browser-specific APIs (window, DOM) which are unavailable during SSR.
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

const LONDON_CENTER = [51.5074, -0.1278];

function MapEvents({ onChange }) {
    useMapEvents({
        moveend(e) {
            const map = e.target;
            onChange({
                center: map.getCenter(),
                zoom: map.getZoom(),
            });
        },
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
 * Leaflet map container component.
 * 
 * Provides a styled, controlled Leaflet map instance with a dark-themed
 * basemap. The map's view is controlled via props, allowing external
 * components (e.g. pathfinding results, UI interactions) to drive
 * camera movement in a predictable manner.
 * 
 * @param {[number, number]} center - Initial and controlled map center
 * @param {number} zoom - Initial and controlled map zoom level 
 * @returns {JSX.Element} Configured Leaflet map container.
 */
const LeafletMap = ({ onMapChange }) => {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);

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
            minZoom={12}
            maxZoom={16}
            scrollWheelZoom
            dragging
            doubleClickZoom
            zoomControl={false}
            attributionControl={false}
            style={{
                position: "absolute",
                inset: 0,
                zIndex: 0,
            }}
        >
            <ZoomControl position="topright" />
            {/* Dark CartoDB basemap for reduced visual noise */}
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* Camera Change Listener */}
            <MapEvents onChange={onMapChange} />

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