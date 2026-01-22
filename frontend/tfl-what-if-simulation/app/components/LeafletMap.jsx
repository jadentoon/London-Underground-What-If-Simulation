'use client'

import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet"; 

function SyncMap({ center, zoom }) {
    const map = useMap();

    useEffect(() => {
        map.setView(center, zoom, { animate: false })
    }, [center, zoom, map])

    return null
}

const LeafletMap = ({ center, zoom }) => {
  return (
    <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={true}
        scrollWheelZoom={true}
        tou
        attributionControl={false}
        style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
        }}
    >
        <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <SyncMap center={center} zoom={zoom} />
    </MapContainer>
  )
}

export default LeafletMap;