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
import { useLineStatus } from "./mapComponents/useLineStatus";
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
const LIVE_CLOSURE_POLL_MS = 15_000;

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

    // Live real-world closed stations (from TfL Unified API)
    const [liveClosedStations, setLiveClosedStations] = useState(new Set());

    // Stations list for search (filled by LeafletMap once loaded)
    const [stationsForSearch, setStationsForSearch] = useState([]);

    //Search input value
    const [stationQuery, setStationQuery] = useState("");

    // State to track closed lines in What-If mode (set of line ids)
    const [closedLines, setClosedLines] = useState(new Set());
    // Live line metadata (default to fallback)
    const [lineOptions, setLineOptions] = useState(FALLBACK_LINES);
    const [linesSource, setLinesSource] = useState("fallback");
    const [linesUpdatedAt, setLinesUpdatedAt] = useState(null);

    //line delay/status data from TfL API
    const [lineDelays, setLineDelays] = useState(new Map());

    // State for routing errors
    const [routingError, setRoutingError] = useState(null);

    const [routeInfo, setRouteInfo] = useState(null);
    const [isRoutePanelOpen, setIsRoutePanelOpen] = useState(false);
    const [trainFeedStatus, setTrainFeedStatus] = useState({
        source: "fallback",
        updatedAt: null,
        reason: "Waiting for live feed",
        trainCount: 0,
    });
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
        pollMs: LIVE_CLOSURE_POLL_MS,
    });

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

    useEffect(() => {
        if (hypotheticalSettingsEnabled) {
            setLiveClosedStations(new Set());
            return;
        }

        let cancelled = false;
        let pollId = null;

        async function fetchLiveStationClosures() {
            try {
                const res = await fetch(
                    "https://api.tfl.gov.uk/StopPoint/Mode/tube,overground,dlr,elizabeth-line/Disruption"
                );

                if (!res.ok) {
                    throw new Error(`TfL API ${res.status}`);
                }

                const disruptions = await res.json();
                const disruptionList = Array.isArray(disruptions) ? disruptions : [];
                const closed = new Set();

                disruptionList.forEach((disruption) => {
                    const stops = disruption.affectedStops || disruption.affectedStopPoints || [];
                    const stopPointIds = Array.isArray(disruption.stopPointIds) ? disruption.stopPointIds : [];

                    stops.forEach((stop) => {
                        if (!stop) return;
                        if (typeof stop === "string") {
                            closed.add(stop);
                        } else if (stop.id) {
                            closed.add(String(stop.id));
                        } else if (stop.stationId) {
                            closed.add(String(stop.stationId));
                        }
                    });

                    stopPointIds.forEach((id) => {
                        if (id) closed.add(String(id));
                    });
                });

                if (!cancelled) {
                    setLiveClosedStations(closed);
                }
            } catch (err) {
                console.error("Error fetching live station disruptions", err);
                if (!cancelled) {
                    setLiveClosedStations(new Set());
                }
            }
        }

        fetchLiveStationClosures();
        pollId = setInterval(fetchLiveStationClosures, LIVE_CLOSURE_POLL_MS);

        return () => {
            cancelled = true;
            if (pollId) clearInterval(pollId);
        };
    }, [hypotheticalSettingsEnabled]);

    //fetch line status/delays from TfL API (client-side)
    useEffect(() => {
        let cancelled = false;
        async function fetchDelays() {
            try {
                const res = await fetch("https://api.tfl.gov.uk/Line/Mode/tube/Status");
                if (!res.ok) throw new Error(`TfL Status API ${res.status}`);
                const data = await res.json();
                
                const delayMap = new Map();
                data.forEach(line => {
                    const status = line.lineStatuses?.[0];
                    if (status) {
                        delayMap.set(line.id, {
                            severity: status.statusSeverity || 10,
                            description: status.statusSeverityDescription || "Good Service",
                            reason: status.reason || null,
                            fullDescription: status.disruption?.description || null,
                            additionalInfo: status.disruption?.additionalInfo || null,
                        });
                    }
                });
                
                if (!cancelled) {
                    setLineDelays(delayMap);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error("Failed to fetch line delays:", err);
                    //keep existing delays on error
                }
            }
        }
        
        fetchDelays();
        const interval = setInterval(fetchDelays, 60000); // every minute
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
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


        // Fetch live station closures from TfL StopPoint Disruption API
    useEffect(() => {
        let cancelled = false;

        async function fetchLiveStationClosures() {
            try {
                const res = await fetch(
                    "https://api.tfl.gov.uk/StopPoint/Mode/tube,overground,dlr,elizabeth-line/Disruption"
                );

                if (!res.ok) {
                    console.error("Failed to fetch live station disruptions", res.status);
                    return;
                }

                const disruptions = await res.json();
                const closed = new Set();

                disruptions.forEach((disruption) => {
                    if (!disruption.affectedStops) return;

                    disruption.affectedStops.forEach((stop) => {
                        if (stop.id) {
                            // IDs as strings so they match your station node ids
                            closed.add(String(stop.id));
                        }
                    });
                });

                if (!cancelled) {
                    closed.add("940GZZLUHAW"); // Harrow & Wealdstone, as you mentioned
                    setLiveClosedStations(closed);
                }
            } catch (err) {
                console.error("Error fetching live station disruptions", err);
            }
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
                closedLines={effectiveClosedLines}
                partialStationIdsByLine={effectivePartialStationIdsByLine}
                onLineToggle={handleLineToggle}
                onMapReady={(map) => { leafletMapRef.current = map; }}
                onStationsLoaded={handleStationsLoaded}
                onRoutingError={setRoutingError}
                onRouteChange={handleRouteChange}
                liveClosedStations={liveClosedStations}
                onTrainFeedStatusChange={setTrainFeedStatus}
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
                trainFeedSource={trainFeedStatus.source}
                trainFeedUpdatedAt={trainFeedStatus.updatedAt}
                trainFeedReason={trainFeedStatus.reason}
                trainFeedCount={trainFeedStatus.trainCount}
                lineDelays={lineDelays}
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
