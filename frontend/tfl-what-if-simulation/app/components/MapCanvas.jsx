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
import { LONDON_CENTER } from "./mapComponents/constants";
import { useLineStatus } from "./mapComponents/useLineStatus";
import { MapLeafletChrome } from "./MapLeafletChrome";
import { MapTitleOverlay } from "./MapTitleOverlay";
import { MapSearchBox } from "./MapSearchBox";
import { MapHud } from "./MapHud";
import { MapSidebar } from "./MapSidebar";
import { SidebarToggleButton } from "./SidebarToggleButton";
import { MapWhatIfOverlay } from "./MapWhatIfOverlay";
import { RoutingErrorBox } from "./RoutingErrorBox";

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

    // State to track user-simulated closed lines in What-If mode.
    const [closedLines, setClosedLines] = useState(new Set());

    // State to track live closed stations from the TfL API (by station id)
    const [liveClosedStations, setLiveClosedStations] = useState(new Set());

    // State to track live closed stations from the TfL API (by station id)
    const [liveClosedStations, setLiveClosedStations] = useState(new Set());

    // State for routing errors
    const [routingError, setRoutingError] = useState(null);

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

<<<<<<< Updated upstream
=======
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




    useEffect(() => {
    let cancelled = false;

    async function fetchLiveStationClosures() {
        try {
            // TfL StopPoint disruption data by mode
            const res = await fetch(
                "https://api.tfl.gov.uk/StopPoint/Mode/tube,overground,dlr,elizabeth-line/Disruption"
            );

            if (!res.ok) {
                console.error("Failed to fetch live station disruptions", res.status);
                return;
            }

            const disruptions = await res.json();

            const closed = new Set();

            // Each disruption normally lists affectedStops with StopPoint ids
            disruptions.forEach((disruption) => {
                if (!disruption.affectedStops) return;

                disruption.affectedStops.forEach((stop) => {
                    if (stop.id) {
                        closed.add(String(stop.id));
                    }
                });
            });

            if (!cancelled) {
                setLiveClosedStations(closed);
            }
        } catch (err) {
            console.error("Error fetching live station disruptions", err);
        }


        const disruptions = await res.json();

console.log("Disruptions from TfL:", disruptions);

const closed = new Set();

disruptions.forEach((disruption) => {
    if (!disruption.affectedStops) return;

    disruption.affectedStops.forEach((stop) => {
        if (stop.id) {
            closed.add(String(stop.id));
        }
    });
});

console.log("Closed station IDs from disruptions:", Array.from(closed));


    }

    // Initial fetch
    fetchLiveStationClosures();

    // Refresh every 60 seconds
    const intervalId = setInterval(fetchLiveStationClosures, 60_000);

    return () => {
        cancelled = true;
        clearInterval(intervalId);
    };
}, []);

<<<<<<< Updated upstream
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
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

    const {
        effectiveLines,
        effectiveClosedLines,
        effectivePartialLines,
        effectivePartialStationIdsByLine,
        isLiveLines,
        linesUpdatedAt,
        lineStatusLabel,
        lineStatusColor,
        lineStatusBg,
    } = useLineStatus({
        hypotheticalSettingsEnabled,
        simulatedClosedLines: closedLines,
    });

    const handleToggleWhatIfMode = useCallback(() => {
        setHypotheticalSettingsEnabled((prev) => !prev);
        setClosedLines(new Set());
        setTimeout(() => {
            setIsSidebarOpen(false);
        }, 1500);
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
                closedLines={effectiveClosedLines}
                partialStationIdsByLine={effectivePartialStationIdsByLine}
                onLineToggle={handleLineToggle}
                onMapReady={(map) => { leafletMapRef.current = map; }}
                onStationsLoaded={handleStationsLoaded}
                onRoutingError={setRoutingError}
                liveClosedStations={liveClosedStations}
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
                closedLines={effectiveClosedLines}
                partialLines={effectivePartialLines}
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

            <RoutingErrorBox
                error={routingError}
                COLORS={COLORS}
                onClose={() => setRoutingError(null)}
            />
        </div>
    )
}
