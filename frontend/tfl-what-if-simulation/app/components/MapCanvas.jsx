'use client';
/**
 * MapCanvas.jsx
 * 
 * Client-side container component for the London Underground
 * "What-If" Simulator map. Wraps the LeafletMap component and
 * provides a HUD overlay for displaying current zoom level and map
 * center coordinates in real-time.
 * 
 * This component must be a Client Component in Next.js because it
 * depends on browser APIs (window, DOM) used by Leaflet.
 */

import { useRef, useState, useCallback, useEffect } from "react"
import dynamic from "next/dynamic";

// Dynamically import LeafletMap to prevent SSR issues.
const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

// Theme colours used throughout the component.
const COLORS = {
    bg: "#0a0f1a",                  // Background colour for map container.
    card: "rgba(15, 23, 42, 0.8)",  // HUD and control backgrounds.
    border: "#1e3a5f",              // Border for HUD / UI panels.
    accent: "#3b82f6",              // Highlight colour for HUD labels.
    text: "#94a3b8",                // Primary text colour.
    textMuted: "#64748b",           // Secondary / muted text.
}

/**
 * MapCanvas
 * 
 * Container component for the interactive map.
 * Handles:
 * - Displaying the Leaflet map.
 * - Tracking map state (zoom and center).
 * - Rendering a HUD overlay with live map information.
 * - Rendering title and description overlays.
 * 
 * @returns {JSX.Element} Full-screen interactive map with HUD.
 */
export function MapCanvas() {
    // Ref to store the current map state (center & zoom) without triggering React renders.
    const mapStateRef = useRef({
        center: null,
        zoom: null
    });

    // React state for HUD display - updated periodically from ref.
    const [hudState, setHudState] = useState({
        zoom: 14,
        center: { lat: 51.5074, lng: -0.1278 },     // Default London Center.
    })

    /**
     * Callback passed to LeafletMap to receive camera changes.
     * Updates the mapStateRef with the latest center and zoom.
     */
    const handleMapChange = useCallback((state) => {
        mapStateRef.current = state;
    }, []);

    /**
     * Periodically update the HUD state from the ref every 100ms.
     * This decouples HUD updates from React rendering triggered by map movement,
     * preventing flicker or excessive re-renders during pan/zoom.
     */
    useEffect(() => {
        const id = setInterval(() => {
            if(!mapStateRef.current.center) return;

            setHudState({
                zoom: mapStateRef.current.zoom,
                center: mapStateRef.current.center,
            });
        }, 100);

        return () => clearInterval(id);
    }, []);

    return (
        <div
            style={{
                position: "relative",
                width: "100%",
                height: "100vh",
                backgroundColor: COLORS.bg,
            }}
        >
            {/* Leaflet map component */}
            <LeafletMap onMapChange={handleMapChange} />

            {/* HUD overlay */}
            <div
                style={{
                    position: "absolute",
                    bottom: 16,
                    left: 16,
                    background: COLORS.card,
                    backdropFilter: "blur(8px)",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 8,
                    padding: 12,
                    fontFamily: "monospace",
                    fontSize: 13,
                    color: COLORS.text,
                }}
            >
                <div>
                    <span style={{ color: COLORS.accent }}>Zoom:</span> {" "}
                    {hudState.zoom}
                </div>
                <div>
                    <span style={{ color: COLORS.accent }}>Center:</span> {" "}
                    {hudState.center.lat.toFixed(4)},{" "}
                    {hudState.center.lng.toFixed(4)}
                </div>
            </div>

            {/* Title and description overlay */}
            <div style={{ position: "absolute", top: 16, left: 16 }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: COLORS.text }}>
                    London Underground <span style={{ color: COLORS.accent }}>What If Simulator</span>
                </h1>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.textMuted }}>
                    Interactive Map
                </p>
            </div>
        </div>
    )
}
