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
    // reference to store the current map state (center & zoom) without triggering React renders.
    const mapStateRef = useRef({
        center: null,
        zoom: null
    });

    //Ref to store the Leaflet map instance for programmatic controls (reset view + search)
    const leafletMapRef = useRef(null);

    // react state for HUD display - updated periodically from ref.
    const [hudState, setHudState] = useState({
        zoom: 14,
        center: { lat: 51.5074, lng: -0.1278 },     // Default London Center.
    })

    // collapse state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // State for hypothetical settings toggle
    const [hypotheticalSettingsEnabled, setHypotheticalSettingsEnabled] = useState(false);
    
    // State to track closed stations (set of station IDs)
    const [closedStations, setClosedStations] = useState(new Set());

    // Stations list for search (filled by LeafletMap once loaded)
    const [stationsForSearch, setStationsForSearch] = useState([]);

    //Search input value
    const [stationQuery, setStationQuery] = useState("");

    // Dynamic accent color based on hypothetical mode
    const accentColor = hypotheticalSettingsEnabled ? "#fbbf24" : COLORS.accent;

    /**
     * callback passed to LeafletMap to receive camera changes.
     * Updatting the mapStateRef with the latest center and zoom.
     */
    const handleMapChange = useCallback((state) => {
        mapStateRef.current = state;
    }, []);
    
    /**
     * Toggle a station's closed state (only in what-if mode)
     */
    const handleStationClick = useCallback((stationId) => {
        if (!hypotheticalSettingsEnabled) return;
        
        setClosedStations(prev => {
            const newSet = new Set(prev);
            if (newSet.has(stationId)) {
                newSet.delete(stationId);
            } else {
                newSet.add(stationId);
            }
            return newSet;
        });
    }, [hypotheticalSettingsEnabled]);

    const handleStationsLoaded = useCallback((nodes) => {
        setStationsForSearch(nodes || []);
    }, []);

    /**
     * Reset the map view to its original center and zoom level.
     * Also resets any filters / what-if state to the original defaults.
     */
    const handleResetView = useCallback(() => {
        // reset camera
        if (leafletMapRef.current) {
            leafletMapRef.current.setView([51.5074, -0.1278], 14);
        }

        // reset filters / UI state
        setClosedStations(new Set());
        setIsSidebarOpen(false);
        setStationQuery("");
    }, []);

    /**
     * Pan/zoom to a station.
     */
    const goToStation = useCallback((station) => {
        if (!station || !leafletMapRef.current) return;

        leafletMapRef.current.setView([station.lat, station.lon], 16);
        setStationQuery(station.name);
    }, []);

    const stationMatches = stationQuery.trim().length === 0
        ? []
        : stationsForSearch
            .filter(s => (s.name || "").toLowerCase().includes(stationQuery.trim().toLowerCase()))
            .slice(0, 8);

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
            {/* Custom styling for Leaflet zoom controls and animations */}
            <style jsx global>{`
                .leaflet-control-zoom {
                    position: fixed !important;
                    top: 50% !important;
                    right: 16px !important;
                    left: auto !important;
                    transform: translateY(-50%);
                    border: none !important;
                    box-shadow: none !important;
                }
                
                .leaflet-control-zoom a {
                    background: ${COLORS.card} !important;
                    backdrop-filter: blur(8px);
                    border: 1px solid ${COLORS.border} !important;
                    color: ${accentColor} !important;
                    width: 40px !important;
                    height: 40px !important;
                    line-height: 40px !important;
                    font-size: 20px !important;
                    transition: all 0.2s ease !important;
                }
                
                .leaflet-control-zoom a:first-child {
                    border-radius: 8px 8px 0 0 !important;
                    border-bottom: none !important;
                }
                
                .leaflet-control-zoom a:last-child {
                    border-radius: 0 0 8px 8px !important;
                }
                
                .leaflet-control-zoom a:hover {
                    background: ${hypotheticalSettingsEnabled ? 'rgba(251, 191, 36, 0.2)' : 'rgba(59, 130, 246, 0.2)'} !important;
                    color: ${accentColor} !important;
                }
                
                @keyframes flash {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.2; }
                }
            `}</style>
            
            <LeafletMap 
                onMapChange={handleMapChange} 
                hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                closedStations={closedStations}
                onStationClick={handleStationClick}

                onMapReady={(map) => { leafletMapRef.current = map; }}

                onStationsLoaded={handleStationsLoaded}
            />

            {/* title moves with panel but always visible */}
            <div 
                style={{ 
                    position: "fixed", 
                    top: hypotheticalSettingsEnabled ? 85 : 16,
                    left: isSidebarOpen ? 365 : (hypotheticalSettingsEnabled ? 85 : 16),
                    transition: "top 0.3s ease, left 0.3s ease",
                    zIndex: 1000,
                }}
            >
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: COLORS.text }}>
                    London Underground <span style={{ color: accentColor }}>What If Simulator</span>
                </h1>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.textMuted }}>
                    Interactive Map
                </p>
            </div>

            {/*Station search box */}
            <div
                style={{
                    position: "fixed",
                    top: hypotheticalSettingsEnabled ? 85 : 16,
                    right: 16,
                    width: 280,
                    background: COLORS.card,
                    backdropFilter: "blur(8px)",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 8,
                    padding: 10,
                    zIndex: 1000,
                    fontFamily: "monospace",
                }}
            >
                <input
                    value={stationQuery}
                    onChange={(e) => setStationQuery(e.target.value)}
                    placeholder="Search station..."
                    style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: `1px solid ${COLORS.border}`,
                        background: "rgba(0, 0, 0, 0.3)",
                        color: COLORS.text,
                        outline: "none",
                        fontSize: 13,
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && stationMatches.length > 0) {
                            goToStation(stationMatches[0]);
                        }
                    }}
                />

                {stationMatches.length > 0 && (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                        {stationMatches.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => goToStation(s)}
                                style={{
                                    textAlign: "left",
                                    padding: "8px 10px",
                                    borderRadius: 6,
                                    border: `1px solid ${COLORS.border}`,
                                    background: "rgba(0, 0, 0, 0.25)",
                                    color: COLORS.text,
                                    cursor: "pointer",
                                    fontSize: 12,
                                }}
                            >
                                <span style={{ color: accentColor }}>{s.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* zoom info moves with panel but always visible at bottom */}
            <div
                style={{
                    position: "fixed",
                    bottom: hypotheticalSettingsEnabled ? 85 : 16,
                    left: isSidebarOpen ? 365 : (hypotheticalSettingsEnabled ? 85 : 16),
                    background: COLORS.card,
                    backdropFilter: "blur(8px)",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 8,
                    padding: 12,
                    fontFamily: "monospace",
                    fontSize: 13,
                    color: COLORS.text,
                    transition: "bottom 0.3s ease, left 0.3s ease",
                    zIndex: 1000,
                }}
            >
                <div>
                    <span style={{ color: accentColor }}>Zoom:</span> {" "}
                    {hudState.zoom}
                </div>
                <div>
                    <span style={{ color: accentColor }}>Center:</span> {" "}
                    {hudState.center.lat.toFixed(4)},{" "}
                    {hudState.center.lng.toFixed(4)}
                </div>

                {/*Reset view button (resets camera + what-if filters) */}
                <button
                    onClick={handleResetView}
                    style={{
                        marginTop: 10,
                        width: "100%",
                        padding: "8px 10px",
                        background: accentColor,
                        color: "#0a0f1a",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontWeight: 700,
                        fontFamily: "monospace",
                    }}
                >
                    Reset View
                </button>
            </div>

            {/*collapsing left sidebar */}
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: isSidebarOpen ? 0 : -280,
                    width: 280,
                    height: "100vh",
                    background: COLORS.card,
                    backdropFilter: "blur(8px)",
                    borderRight: `1px solid ${COLORS.border}`,
                    transition: "left 0.3s ease",
                    zIndex: 1000,
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 20,
                }}
            >
                {/* Hypothetical Settings Toggle */}
                <div>
                    <h2>Settings</h2>
                    <div
                        style={{
                            width: "100%",
                            padding: "12px 16px",
                            background: "rgba(0, 0, 0, 0.3)",
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            color: COLORS.text,
                            fontSize: 14,
                            fontWeight: 500,
                        }}
                    >
                        <span>What-If Mode</span>
                        {/* switch */}
                        <button
                            onClick={() => {
                                setHypotheticalSettingsEnabled(!hypotheticalSettingsEnabled);
                                setTimeout(() => {
                                    setIsSidebarOpen(false);
                                }, 1500);
                            }}
                            style={{
                                position: "relative",
                                width: 51,
                                height: 31,
                                background: hypotheticalSettingsEnabled ? accentColor : "rgba(120, 120, 128, 0.32)",
                                borderRadius: 15.5,
                                border: "none",
                                cursor: "pointer",
                                transition: "background-color 0.3s ease",
                                outline: "none",
                                padding: 0,
                            }}
                        >
                            {/* toggle btn */}
                            <div
                                style={{
                                    position: "absolute",
                                    top: 2,
                                    left: hypotheticalSettingsEnabled ? 22 : 2,
                                    width: 27,
                                    height: 27,
                                    background: "#fff",
                                    borderRadius: "50%",
                                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1)",
                                    transition: "left 0.3s ease",
                                }}
                            />
                        </button>
                    </div>
                </div>
                {/*placeholder for additional tools*/}
                <div style={{ flex: 1 }}>
                    {/*toolbar items*/}
                </div>
            </div>

            {/*toggle button */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                style={{
                    position: "fixed",
                    top: "50%",
                    left: isSidebarOpen ? 280 : 0,
                    transform: "translateY(-50%)",
                    width: 32,
                    height: 64,
                    background: COLORS.card,
                    backdropFilter: "blur(8px)",
                    border: `1px solid ${COLORS.border}`,
                    borderLeft: isSidebarOpen ? `1px solid ${COLORS.border}` : "none",
                    borderRadius: isSidebarOpen ? "0 8px 8px 0" : "0 8px 8px 0",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: accentColor,
                    fontSize: 16,
                    zIndex: 1001,
                    transition: "left 0.3s ease",
                    outline: "none",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = hypotheticalSettingsEnabled ? "rgba(251, 191, 36, 0.2)" : "rgba(59, 130, 246, 0.2)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = COLORS.card;
                }}
            >
                {isSidebarOpen ? "◀" : "▶"}
            </button>

            {/* Recording brackets overlay - shows when hypothetical settings enabled */}
            {hypotheticalSettingsEnabled && (
                <>
                    {/* Top-left bracket */}
                    <div
                        style={{
                            position: "fixed",
                            top: 40,
                            left: isSidebarOpen ? 320 : 40,
                            width: 80,
                            height: 80,
                            borderTop: `15px solid ${accentColor}`,
                            borderLeft: `15px solid ${accentColor}`,
                            zIndex: 999,
                            opacity: 0.8,
                            animation: "fadeIn 0.3s ease",
                            transition: "left 0.3s ease",
                        }}
                    />
                    
                    {/* Top-right bracket */}
                    <div
                        style={{
                            position: "fixed",
                            top: 40,
                            right: 40,
                            width: 80,
                            height: 80,
                            borderTop: `15px solid ${accentColor}`,
                            borderRight: `15px solid ${accentColor}`,
                            zIndex: 999,
                            opacity: 0.8,
                            animation: "fadeIn 0.3s ease",
                        }}
                    />
                    
                    {/* Bottom-left bracket */}
                    <div
                        style={{
                            position: "fixed",
                            bottom: 40,
                            left: isSidebarOpen ? 320 : 40,
                            width: 80,
                            height: 80,
                            borderBottom: `15px solid ${accentColor}`,
                            borderLeft: `15px solid ${accentColor}`,
                            zIndex: 999,
                            opacity: 0.8,
                            animation: "fadeIn 0.3s ease",
                            transition: "left 0.3s ease",
                        }}
                    />
                    
                    {/* Bottom-right bracket */}
                    <div
                        style={{
                            position: "fixed",
                            bottom: 40,
                            right: 40,
                            width: 80,
                            height: 80,
                            borderBottom: `15px solid ${accentColor}`,
                            borderRight: `15px solid ${accentColor}`,
                            zIndex: 999,
                            opacity: 0.8,
                            animation: "fadeIn 0.3s ease",
                        }}
                    />
                    
                    {/* WHAT-IF indicator with flashing dot - top right corner */}
                    <div
                        style={{
                            position: "fixed",
                            top: 80,
                            right: 95,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontFamily: "monospace",
                            fontSize: 40,
                            fontWeight: 700,
                            color: "#fff",
                            zIndex: 999,
                            textShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
                        }}
                    >
                        <span>WHAT-IF</span>
                        {/* Flashing yellow dot */}
                        <div
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                backgroundColor: "#fbbf24",
                                boxShadow: "0 0 10px #fbbf24",
                                animation: "flash 1s ease-in-out infinite",
                            }}
                        />
                    </div>
                </>
            )}
        </div>
    )
}