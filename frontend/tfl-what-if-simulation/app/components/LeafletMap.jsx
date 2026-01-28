'use client'
/**
 * Client-side Leaflet map implementation for Next.js (App Router).
 * 
 * This file must be a Client Component because Leaflet depends on
 * browser-specific APIs (window, DOM) which are unavailable during SSR.
 */

import { useEffect } from "react";
import { MapContainer, TileLayer, useMap, CircleMarker, Popup } from "react-leaflet"; 

/**
 * SyncMap
 * 
 * Synchronises the Leaflet map view with external React state.
 * 
 * This component listens for changes to the provided `center` and `zoom`
 * values and imperatively updates the underlying Leaflet map instance.
 * It renders no UI and exists solely to bridge declarative React state
 * with Leaflet's imperative API.
 * 
 * @param {[number, number]} center - Latitude/Longitude tuple for the map view.
 * @param {number} zoom - Zoom level for the map 
 * @returns {null} This component does not render any DOM elements.
 */
function SyncMap({ center, zoom, stations }) {
    const map = useMap();

    useEffect(() => {
       const currCenter = map.getCenter();
       const currZoom = map.getZoom();

       const centerChanged = 
            currCenter.lat !== center[0] ||
            currCenter.lng !== center[1];
        
        if (centerChanged) {
            map.setView(center, zoom, { animate: false });
        } else if (currZoom !== zoom) {
            map.setZoom(zoom, { animate: false });
        }
    }, [center, zoom, map])

    return null
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
const LeafletMap = ({ center, zoom, stations }) => {
  return (
    <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={false}             // Custom zoom controls handled in MapCanvas
        attributionControl={false}      // Attribution hidden for custom UI layout
        scrollWheelZoom={false}
        doubleClickZoom={false}
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

        {/* Keeps the Leaflet camera in sync with React state */}
        <SyncMap center={center} zoom={zoom} />

        {stations.map((s) => (
            <CircleMarker
                key={s.name}
                center={[s.lat, s.lon]}
                radius={2}
                pathOptions={{
                    color: "#3b82f6",
                    fillColor: "#000000",
                    fillOpacity: 0.9,
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