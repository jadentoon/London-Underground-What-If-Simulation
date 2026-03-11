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

import { useRef, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { LONDON_CENTER, LINE_COLOURS, LINE_LABELS } from "./mapComponents/constants";
import { MapLeafletChrome } from "./MapLeafletChrome";
import { MapTitleOverlay } from "./MapTitleOverlay";
import { MapSearchBox } from "./MapSearchBox";
import { MapHud } from "./MapHud";
import { MapSidebar } from "./MapSidebar";
import { SidebarToggleButton } from "./SidebarToggleButton";
import { MapWhatIfOverlay } from "./MapWhatIfOverlay";
import { RoutingErrorBox } from "./RoutingErrorBox";
import { RouteInfoPanel } from "./RouteInfoPanel";

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
};

const DEFAULT_CENTER = { lat: LONDON_CENTER[0], lng: LONDON_CENTER[1] };

const FALLBACK_LINES = Object.keys(LINE_COLOURS).map((id) => ({
    id,
    label: LINE_LABELS[id] || id,
    color: LINE_COLOURS[id],
}));

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
        center: DEFAULT_CENTER,
    });

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

    // State for routing errors
    const [routingError, setRoutingError] = useState(null);

    const [routeInfo, setRouteInfo] = useState(null);
    const [isRoutePanelOpen, setIsRoutePanelOpen] = useState(false);

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
                        const color = LINE_COLOURS[line.id];
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
            leafletMapRef.current.setView(LONDON_CENTER, 14);
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
            .filter((s) => (s.name || "").toLowerCase().includes(stationQuery.trim().toLowerCase()))
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
        : isLiveLines
            ? "Live TfL data"
            : "Fallback (TfL API unavailable)";
    const lineStatusColor = isLiveLines ? "#22c55e" : "#f97316";
    const lineStatusBg = isLiveLines ? "rgba(34, 197, 94, 0.12)" : "rgba(249, 115, 22, 0.12)";

    const handleToggleWhatIfMode = useCallback(() => {
        setHypotheticalSettingsEnabled((prev) => !prev);
        setClosedLines(new Set());
        setTimeout(() => {
            setIsSidebarOpen(false);
        }, 1500);
    }, []);

    const handleRouteChange = useCallback((info) => {
        setRouteInfo(info);

        setIsRoutePanelOpen((prevOpen) => {
            const nextOpen = !!info?.hasPath;
            return prevOpen === nextOpen ? prevOpen : nextOpen;
        });
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
            <MapLeafletChrome
                COLORS={COLORS}
                accentColor={accentColor}
                hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
            />
            
            <LeafletMap 
                onMapChange={handleMapChange} 
                hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                closedStations={closedStations}
                onToggleStationClosed={toggleClosedStation}
                closedLines={closedLines}
                onLineToggle={handleLineToggle}
                onMapReady={(map) => { leafletMapRef.current = map; }}
                onStationsLoaded={handleStationsLoaded}
                onRoutingError={setRoutingError}
                onRouteChange={handleRouteChange}
            />

            <MapTitleOverlay
                hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                isSidebarOpen={isSidebarOpen}
                COLORS={COLORS}
                accentColor={accentColor}
                titleShadow={titleShadow}
            />

            <MapSearchBox
                hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                COLORS={COLORS}
                accentColor={accentColor}
                stationQuery={stationQuery}
                onStationQueryChange={setStationQuery}
                stationMatches={stationMatches}
                onSelectStation={goToStation}
                onEnterFirstMatch={() => {
                    if (stationMatches.length > 0) {
                        goToStation(stationMatches[0]);
                    }
                }}
            />

            <MapHud
                hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                isSidebarOpen={isSidebarOpen}
                COLORS={COLORS}
                accentColor={accentColor}
                hudState={hudState}
                onResetView={handleResetView}
            />

            <MapSidebar
                isSidebarOpen={isSidebarOpen}
                COLORS={COLORS}
                hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                accentColor={accentColor}
                onToggleWhatIfMode={handleToggleWhatIfMode}
                onResetClosures={handleResetClosures}
                effectiveLines={effectiveLines}
                closedLines={closedLines}
                onLineToggle={handleLineToggle}
                lineStatusLabel={lineStatusLabel}
                lineStatusColor={lineStatusColor}
                lineStatusBg={lineStatusBg}
                isLiveLines={isLiveLines}
                linesUpdatedAt={linesUpdatedAt}
            />

            <SidebarToggleButton
                isSidebarOpen={isSidebarOpen}
                COLORS={COLORS}
                accentColor={accentColor}
                hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            {hypotheticalSettingsEnabled && (
                <MapWhatIfOverlay
                    isSidebarOpen={isSidebarOpen}
                    accentColor={accentColor}
                />
            )}

            <RouteInfoPanel 
                isOpen={isRoutePanelOpen}
                onToggle={() => setIsRoutePanelOpen((v) => !v)}
                routeInfo={routeInfo}
                COLORS={COLORS}
                accentColor={accentColor}
                hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                lineColours={LINE_COLOURS}
                lineLabels={LINE_LABELS}
            />

            <RoutingErrorBox
                error={routingError}
                COLORS={COLORS}
                onClose={() => setRoutingError(null)}
            />
        </div>
    )
}