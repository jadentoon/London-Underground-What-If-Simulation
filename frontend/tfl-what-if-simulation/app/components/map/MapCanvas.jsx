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

import { useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { LONDON_CENTER, LINE_COLOURS, LINE_LABELS } from "../mapComponents/constants";
import { useLineStatus } from "../../hooks/useLineStatus";
import { MapLeafletChrome } from "../layout/MapLeafletChrome";
import { MapTitleOverlay } from "../layout/MapTitleOverlay";
import { MapSearchBox } from "../layout/MapSearchBox";
import { MapHud } from "../layout/MapHud";
import { MapSidebar } from "../layout/MapSidebar";
import { SidebarToggleButton } from "../layout/SidebarToggleButton";
import { MapWhatIfOverlay } from "../layout/MapWhatIfOverlay";
import { RoutingErrorBox } from "../layout/RoutingErrorBox";
import { RouteInfoPanel } from "../layout/RouteInfoPanel";
import { useLiveStationClosures } from "../../hooks/map/useLiveStationClosures";
import { useLineDelays } from "../../hooks/map/useLineDelays";
import { useHudState } from "../../hooks/map/useHudState";
import { useTrainFilters } from "../../hooks/map/useTrainFilters";
import { useStationSearch } from "../../hooks/map/useStationSearch";
import { useWhatIfClosures } from "../../hooks/map/useWhatIfClosures";
import { useRoutePanel } from "../../hooks/map/useRoutePanel";
import { useViewport } from "../../hooks/useViewport";

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
const LIVE_CLOSURE_POLL_MS = 60_000;

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

    //Ref to store the Leaflet map instance for programmatic controls (reset view + search)
    const leafletMapRef = useRef(null);

    // collapse state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // State for hypothetical settings toggle
    const [hypotheticalSettingsEnabled, setHypotheticalSettingsEnabled] = useState(false);

    const [trainFeedStatus, setTrainFeedStatus] = useState({
        source: "fallback",
        updatedAt: null,
        reason: "Waiting for live feed",
        trainCount: 0,
    });

    // Dynamic accent color based on hypothetical mode
    const accentColor = hypotheticalSettingsEnabled ? "#fbbf24" : COLORS.accent;
    const titleShadow = "0 0 4px #000, 0 0 8px #000, 0 0 12px #000, 0 0 18px #000, 0 0 24px #000";

    const {
        hudState,
        handleMapChange,
    } = useHudState(DEFAULT_CENTER);

    const viewport = useViewport();
    const isMobilePortrait = viewport.isMobile && viewport.isPortrait;
    const sidebarWidth = isMobilePortrait ? Math.min(360, viewport.width || 360) : (viewport.isLargeDesktop ? 320 : 280);
    const sidebarOffset = isSidebarOpen && !isMobilePortrait ? sidebarWidth + 85 : null;

    const liveClosedStations = useLiveStationClosures({
        enabled: !hypotheticalSettingsEnabled,
        pollMs: LIVE_CLOSURE_POLL_MS,
    });

    const lineDelays = useLineDelays();

    const {
        showTrains,
        trainFilterMode,
        visibleTrainLines,
        handleToggleShowTrains,
        handleTrainFilterModeChange,
        handleToggleVisibleTrainLine,
    } = useTrainFilters();

    const {
        stationQuery,
        setStationQuery,
        stationMatches,
        handleStationsLoaded,
        goToStation,
        selectFirstStationMatch,
    } = useStationSearch(leafletMapRef);

    const {
        closedStations,
        closedLines,
        toggleClosedStation,
        handleLineToggle,
        handleResetClosures,
        clearClosedStations,
        clearClosedLines,
    } = useWhatIfClosures(hypotheticalSettingsEnabled);

    const {
        routingError,
        setRoutingError,
        routeInfo,
        isRoutePanelOpen,
        handleRouteChange,
        toggleRoutePanel,
    } = useRoutePanel();

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
        clearClosedStations();
        setIsSidebarOpen(false);
        setStationQuery("");
    }, []);
    
    const handleToggleWhatIfMode = useCallback(() => {
        setHypotheticalSettingsEnabled((prev) => !prev);
        clearClosedLines();
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
                onRouteChange={handleRouteChange}
                liveClosedStations={liveClosedStations}
                onTrainFeedStatusChange={setTrainFeedStatus}
                showTrains={showTrains}
                trainFilterMode={trainFilterMode}
                visibleTrainLines={visibleTrainLines}
            />

            <MapTitleOverlay
                hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                isSidebarOpen={isSidebarOpen}
                layout={{ isMobilePortrait, sidebarOffset }}
                COLORS={COLORS}
                accentColor={accentColor}
                titleShadow={titleShadow}
            />

            <MapSearchBox
                hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                layout={{ isMobilePortrait }}
                COLORS={COLORS}
                accentColor={accentColor}
                stationQuery={stationQuery}
                onStationQueryChange={setStationQuery}
                stationMatches={stationMatches}
                onSelectStation={goToStation}
                onEnterFirstMatch={selectFirstStationMatch}
            />

            <MapHud
                hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                isSidebarOpen={isSidebarOpen}
                layout={{ isMobilePortrait, sidebarOffset }}
                COLORS={COLORS}
                accentColor={accentColor}
                hudState={hudState}
                onResetView={handleResetView}
            />

            <MapSidebar
                isSidebarOpen={isSidebarOpen}
                layout={{ isMobilePortrait, sidebarWidth }}
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
                showTrains={showTrains}
                trainFilterMode={trainFilterMode}
                visibleTrainLines={visibleTrainLines}
                onToggleShowTrains={handleToggleShowTrains}
                onTrainFilterModeChange={handleTrainFilterModeChange}
                onToggleVisibleTrainLine={handleToggleVisibleTrainLine}
            />

            <SidebarToggleButton
                isSidebarOpen={isSidebarOpen}
                layout={{ isMobilePortrait, sidebarWidth }}
                COLORS={COLORS}
                accentColor={accentColor}
                hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            {hypotheticalSettingsEnabled && !isMobilePortrait && (
                <MapWhatIfOverlay
                    isSidebarOpen={isSidebarOpen}
                    accentColor={accentColor}
                />
            )}

            <RouteInfoPanel 
                isOpen={isRoutePanelOpen}
                onToggle={toggleRoutePanel}
                routeInfo={routeInfo}
                layout={{ isMobilePortrait }}
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