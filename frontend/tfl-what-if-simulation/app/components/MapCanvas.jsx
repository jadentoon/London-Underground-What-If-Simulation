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

const LINE_COLOR_MAP = {
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
};

const FALLBACK_LINES = [
    { id: "bakerloo", label: "Bakerloo", color: LINE_COLOR_MAP["bakerloo"] },
    { id: "central", label: "Central", color: LINE_COLOR_MAP["central"] },
    { id: "circle", label: "Circle", color: LINE_COLOR_MAP["circle"] },
    { id: "district", label: "District", color: LINE_COLOR_MAP["district"] },
    { id: "hammersmith-city", label: "Hammersmith & City", color: LINE_COLOR_MAP["hammersmith-city"] },
    { id: "jubilee", label: "Jubilee", color: LINE_COLOR_MAP["jubilee"] },
    { id: "metropolitan", label: "Metropolitan", color: LINE_COLOR_MAP["metropolitan"] },
    { id: "northern", label: "Northern", color: LINE_COLOR_MAP["northern"] },
    { id: "piccadilly", label: "Piccadilly", color: LINE_COLOR_MAP["piccadilly"] },
    { id: "victoria", label: "Victoria", color: LINE_COLOR_MAP["victoria"] },
    { id: "waterloo-city", label: "Waterloo & City", color: LINE_COLOR_MAP["waterloo-city"] },
];

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

    // State to track closed lines (set of line ids)
    const [closedLines, setClosedLines] = useState(new Set());
    // Live line metadata (default to fallback)
    const [lineOptions, setLineOptions] = useState(FALLBACK_LINES);
    const [linesSource, setLinesSource] = useState("fallback");
    const [linesUpdatedAt, setLinesUpdatedAt] = useState(null);

    // Dynamic accent color based on hypothetical mode
    const accentColor = hypotheticalSettingsEnabled ? "#fbbf24" : COLORS.accent;
    const titleShadow = "0 0 4px #000, 0 0 8px #000, 0 0 12px #000, 0 0 18px #000, 0 0 24px #000";

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
    const toggleClosedStation = useCallback((stationId) => {
        if (!hypotheticalSettingsEnabled) return;
        
        setClosedStations(prev => {
            const newSet = new Set(prev);
            const id = String(stationId);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    }, [hypotheticalSettingsEnabled]);

    const handleStationsLoaded = useCallback((nodes) => {
        setStationsForSearch(nodes || []);
    }, []);

    /**
     * Toggle a line's closed state (only in what-if mode)
     */
    const handleLineToggle = useCallback((lineId) => {
        if (!hypotheticalSettingsEnabled) return;

        setClosedLines(prev => {
            const next = new Set(prev);
            if (next.has(lineId)) {
                next.delete(lineId);
            } else {
                next.add(lineId);
            }
            return next;
        });
    }, [hypotheticalSettingsEnabled]);

    /**
     * Reset all closures (stations and lines) in what-if mode
     */
    const handleResetClosures = useCallback(() => {
        if (!hypotheticalSettingsEnabled) return;
        setClosedStations(new Set());
        setClosedLines(new Set());
    }, [hypotheticalSettingsEnabled]);

    // Fetch live line metadata from TfL Unified API (client-side)
    useEffect(() => {
        let cancelled = false;
        async function fetchLines() {
            try {
                const res = await fetch("https://api.tfl.gov.uk/Line/Mode/tube");
                if (!res.ok) throw new Error(`TfL API ${res.status}`);
                const data = await res.json();
                const mapped = data
                    .map((line) => {
                        const color = LINE_COLOR_MAP[line.id];
                        if (!color) return null;
                        return {
                            id: line.id,
                            label: line.name || line.id,
                            color,
                        };
                    })
                    .filter(Boolean);
                if (!cancelled && mapped.length) {
                    setLineOptions(mapped);
                    setLinesSource("live");
                    setLinesUpdatedAt(new Date());
                }
            } catch (err) {
                if (!cancelled) {
                    setLineOptions(FALLBACK_LINES);
                    setLinesSource("fallback");
                    setLinesUpdatedAt(null);
                }
            }
        }
        fetchLines();
        return () => { cancelled = true; };
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

    const effectiveLines = hypotheticalSettingsEnabled ? FALLBACK_LINES : lineOptions;
    const isLiveLines = !hypotheticalSettingsEnabled && linesSource === "live";
    const lineStatusLabel = hypotheticalSettingsEnabled
        ? "Fallback (What-If mode)"
        : (isLiveLines ? "Live TfL data" : "Fallback (TfL API unavailable)");
    const lineStatusColor = isLiveLines ? "#22c55e" : "#f97316";
    const lineStatusBg = isLiveLines ? "rgba(34, 197, 94, 0.12)" : "rgba(249, 115, 22, 0.12)";

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
                onToggleStationClosed={toggleClosedStation}
                closedLines={closedLines}
                onLineToggle={handleLineToggle}
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
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: COLORS.text, textShadow: titleShadow }}>
                    London Underground <span style={{ color: accentColor }}>What If Simulator</span>
                </h1>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.textMuted, textShadow: titleShadow }}>
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
                    overflowY: "auto",
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
                                setClosedLines(new Set());
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
                <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
                    {hypotheticalSettingsEnabled && (
                        <button
                            onClick={handleResetClosures}
                            style={{
                                width: "100%",
                                padding: "10px 12px",
                                marginBottom: 12,
                                background: "#ef4444",
                                color: "#fff",
                                border: "none",
                                borderRadius: 8,
                                cursor: "pointer",
                                fontWeight: 700,
                                boxShadow: "0 0 10px rgba(239,68,68,0.4)",
                                transition: "background-color 0.2s ease, box-shadow 0.2s ease",
                            }}
                        >
                            Reset all closures
                        </button>
                    )}
                    <h3 style={{ margin: "0 0 4px", color: COLORS.text }}>Lines</h3>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 8px",
                            marginBottom: 8,
                            borderRadius: 8,
                            background: lineStatusBg,
                            color: lineStatusColor,
                            fontSize: 12,
                        }}
                    >
                        <span style={{
                            width: 10,
                            height: 10,
                            borderRadius: 999,
                            background: lineStatusColor,
                            boxShadow: `0 0 8px ${lineStatusColor}80`,
                        }} />
                        <span>
                            {lineStatusLabel}
                            {isLiveLines && linesUpdatedAt ? ` · ${linesUpdatedAt.toLocaleTimeString()}` : ""}
                        </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {effectiveLines.map(line => {
                            const isClosed = closedLines.has(line.id);
                            const disabled = !hypotheticalSettingsEnabled;
                            return (
                                <button
                                    key={line.id}
                                    onClick={() => handleLineToggle(line.id)}
                                    disabled={disabled}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        width: "100%",
                                        padding: "10px 12px",
                                        background: disabled ? "rgba(100, 116, 139, 0.2)" : "rgba(0,0,0,0.3)",
                                        border: `1px solid ${COLORS.border}`,
                                        borderRadius: 8,
                                        color: COLORS.text,
                                        cursor: disabled ? "not-allowed" : "pointer",
                                        opacity: isClosed ? 0.6 : 1,
                                        transition: "background-color 0.2s ease, opacity 0.2s ease",
                                    }}
                                >
                                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span style={{
                                            width: 14,
                                            height: 14,
                                            borderRadius: 999,
                                            backgroundColor: line.color,
                                            border: "1px solid #fff",
                                            boxShadow: isClosed ? "none" : `0 0 8px ${line.color}80`,
                                        }} />
                                        {line.label}
                                    </span>
                                    <span style={{ fontSize: 12, color: isClosed ? "#f87171" : "#22c55e" }}>
                                        {isClosed ? "Closed" : "Open"}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
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
