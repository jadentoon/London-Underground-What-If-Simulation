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
import { MobileControlSheet } from "../layout/MobileControlSheet";
import { MobileInteractionModeBar } from "../layout/MobileInteractionModeBar";
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
    const [mobileInteractionMode, setMobileInteractionMode] = useState("route");

    const [trainFeedStatus, setTrainFeedStatus] = useState({
        source: "fallback",
        updatedAt: null,
        reason: "Waiting for live feed",
        trainCount: 0,
    });

    const [selectedTrainId, setSelectedTrainId] = useState(null);
    const isTrainPanelOpen = Boolean(selectedTrainId);
    const [resetRouteSequence, setResetRouteSequence] = useState(0);
    const [stationActionRequest, setStationActionRequest] = useState(null);
    const [routeSelection, setRouteSelection] = useState({
        startId: null,
        startName: null,
        endId: null,
        endName: null,
        hasPath: false,
    });
    const stationActionSequenceRef = useRef(0);

    // Dynamic accent colour based on hypothetical mode
    const accentColour = hypotheticalSettingsEnabled ? "#fbbf24" : COLORS.accent;
    const titleShadow = "0 0 4px #000, 0 0 8px #000, 0 0 12px #000, 0 0 18px #000, 0 0 24px #000";

    const {
        hudState,
        handleMapChange,
    } = useHudState(DEFAULT_CENTER);

    const viewport = useViewport();
    const isMobilePortrait = viewport.isMobile && viewport.isPortrait;
    const sidebarWidth = isMobilePortrait ? Math.min(360, viewport.width || 360) : (viewport.isLargeDesktop ? 320 : 280);
    const sidebarOffset = isSidebarOpen && !isMobilePortrait ? sidebarWidth + 85 : null;
    const showMobileModeBar = isMobilePortrait && hypotheticalSettingsEnabled;
    const interactionMode = showMobileModeBar ? mobileInteractionMode : "route";

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
        focusedStation,
        focusedStationSource,
        clearFocusedStation,
        setCurrentStation,
        highlightedStationId,
    } = useStationSearch(leafletMapRef);

    const {
        closedStations,
        closedLines,
        savedScenarios,
        toggleClosedStation,
        handleLineToggle,
        handleResetClosures,
        clearClosedStations,
        clearClosedLines,
        saveCurrentScenario,
        loadScenario,
        deleteScenario,
    } = useWhatIfClosures(hypotheticalSettingsEnabled);

    const {
        routingError,
        setRoutingError,
        routeInfo,
        isRoutePanelOpen,
        handleRouteChange,
        toggleRoutePanel,
        collapseRoutePanel,
        clearRoutePanel,
    } = useRoutePanel();

    const {
        effectiveLines,
        effectiveClosedLines,
        effectivePartialLines,
        effectivePartialStationIdsByLine,
        isLiveLines,
        linesUpdatedAt,
        lineStatusLabel,
        lineStatusColor: lineStatusColour,
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
        if (leafletMapRef.current) {
            leafletMapRef.current.setView(LONDON_CENTER, 14);
        }

        clearClosedStations();
        clearRoutePanel();
        clearFocusedStation();
        setIsSidebarOpen(false);
        setStationQuery("");
        setMobileInteractionMode("route");
        setResetRouteSequence((value) => value + 1);
    }, [clearClosedStations, clearFocusedStation, clearRoutePanel, setStationQuery]);
    
    const handleToggleWhatIfMode = useCallback(() => {
        setHypotheticalSettingsEnabled((prev) => !prev);
        setMobileInteractionMode("route");
        clearClosedLines();
        setIsSidebarOpen(false);
    }, [clearClosedLines]);

    const handleOpenWhatIfMode = useCallback(() => {
        setHypotheticalSettingsEnabled(true);
        setMobileInteractionMode("closures");
        setIsSidebarOpen(true);
        clearRoutePanel();
        setSelectedTrainId(null);
    }, [clearRoutePanel]);

    const handleLoadScenario = useCallback((scenarioId) => {
        const loadedScenario = loadScenario(scenarioId);
        if (!loadedScenario) return;

        setHypotheticalSettingsEnabled(true);
        setMobileInteractionMode("closures");
        clearRoutePanel();
        setResetRouteSequence((value) => value + 1);
    }, [clearRoutePanel, loadScenario]);

    const handleRouteSelectionChange = useCallback((selection) => {
        const hasSelection = Boolean(selection?.startId || selection?.endId || selection?.hasPath);

        if (!hasSelection && focusedStationSource === "map") {
            clearFocusedStation();
        }

        setRouteSelection((prev) => {
            const sameStartId = prev.startId === selection?.startId;
            const sameStartName = prev.startName === selection?.startName;
            const sameEndId = prev.endId === selection?.endId;
            const sameEndName = prev.endName === selection?.endName;
            const sameHasPath = prev.hasPath === selection?.hasPath;

            if (sameStartId && sameStartName && sameEndId && sameEndName && sameHasPath) {
                return prev;
            }

            return selection;
        });
    }, [clearFocusedStation, focusedStationSource]);

    const handleStationAction = useCallback((action, station) => {
        if (!station?.id) return;

        if (action === "set-start" || action === "set-destination") {
            setSelectedTrainId(null);
        }

        stationActionSequenceRef.current += 1;

        setStationActionRequest({
            sequence: stationActionSequenceRef.current,
            action,
            stationId: String(station.id),
        });
    }, []);

    const handleSearchStationSelection = useCallback((station) => {
        if (routeSelection.hasPath) {
            clearRoutePanel();
            setRouteSelection({
                startId: null,
                startName: null,
                endId: null,
                endName: null,
                hasPath: false,
            });
            setResetRouteSequence((value) => value + 1);
        }

        goToStation(station);
    }, [clearRoutePanel, goToStation, routeSelection.hasPath]);

    const focusedStationId = focusedStation?.id ? String(focusedStation.id) : null;
    const isFocusedStationHypotheticallyClosed = hypotheticalSettingsEnabled
        && focusedStationId !== null
        && closedStations.has(focusedStationId);
    const isFocusedStationUnavailableForRouting = focusedStationId !== null
        && (
            liveClosedStations.has(focusedStationId)
            || (hypotheticalSettingsEnabled && closedStations.has(focusedStationId))
        );

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
                accentColor={accentColour}
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
                selectedTrainId={selectedTrainId}
                onSelectedTrainIdChange={setSelectedTrainId}
                trainFilterMode={trainFilterMode}
                visibleTrainLines={visibleTrainLines}
                isMobilePortrait={isMobilePortrait}
                interactionMode={interactionMode}
                resetRouteSequence={resetRouteSequence}
                highlightedStationId={highlightedStationId}
                stationActionRequest={stationActionRequest}
                onRouteSelectionChange={handleRouteSelectionChange}
                onFocusedStationChange={(station) => setCurrentStation(station, "map")}
            />

            <MapTitleOverlay
                hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                isSidebarOpen={isSidebarOpen}
                layout={{ isMobilePortrait, sidebarOffset }}
                COLORS={COLORS}
                accentColor={accentColour}
                titleShadow={titleShadow}
            />

            {!hypotheticalSettingsEnabled && !isMobilePortrait && (
                <button
                    onClick={handleOpenWhatIfMode}
                    type="button"
                    style={{
                        position: "fixed",
                        top: 96,
                        right: 70,
                        width: 320,
                        padding: "14px 16px",
                        background: "rgba(251, 191, 36, 0.16)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(251, 191, 36, 0.65)",
                        borderRadius: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        cursor: "pointer",
                        zIndex: 999,
                        color: "#fef3c7",
                        boxShadow: "0 16px 42px rgba(0, 0, 0, 0.32)",
                    }}
                    title="Open the What-If Simulator"
                >
                    <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
                        <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fbbf24", fontWeight: 900 }}>
                            What-If Simulator
                        </span>
                        <span style={{ fontSize: 15, fontWeight: 900, color: "#fff7ed" }}>
                            Try What-If Mode
                        </span>
                        <span style={{ fontSize: 12, color: "rgba(254, 243, 199, 0.78)", textAlign: "left" }}>
                            Simulate station or line closures.
                        </span>
                    </span>
                    <span
                        aria-hidden="true"
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 999,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(251, 191, 36, 0.22)",
                            color: "#fbbf24",
                            fontSize: 18,
                            fontWeight: 900,
                            flex: "0 0 auto",
                        }}
                    >
                        ⚡
                    </span>
                </button>
            )}

            <MapSearchBox
                hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                isSidebarOpen={isSidebarOpen}
                layout={{ isMobilePortrait }}
                COLORS={COLORS}
                accentColor={accentColour}
                stationQuery={stationQuery}
                onStationQueryChange={setStationQuery}
                stationMatches={stationMatches}
                onSelectStation={handleSearchStationSelection}
                onEnterFirstMatch={selectFirstStationMatch}
                focusedStation={focusedStation}
                focusedStationSource={focusedStationSource}
                onClearFocusedStation={clearFocusedStation}
                currentRouteStartId={routeSelection.startId}
                currentRouteStartName={routeSelection.startName}
                currentRouteEndId={routeSelection.endId}
                currentRouteEndName={routeSelection.endName}
                currentRouteHasPath={routeSelection.hasPath}
                isFocusedStationUnavailableForRouting={isFocusedStationUnavailableForRouting}
                isFocusedStationHypotheticallyClosed={isFocusedStationHypotheticallyClosed}
                onSetFocusedStationAsStart={() => handleStationAction("set-start", focusedStation)}
                onSetFocusedStationAsDestination={() => handleStationAction("set-destination", focusedStation)}
                onToggleFocusedStationClosure={() => handleStationAction("toggle-closure", focusedStation)}
                onDesktopSearchOpen={collapseRoutePanel}
                onSearchInputFocus={() => setSelectedTrainId(null)}
            />

            <MapHud
                hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                isSidebarOpen={isSidebarOpen}
                layout={{ isMobilePortrait, sidebarOffset }}
                COLORS={COLORS}
                accentColor={accentColour}
                hudState={hudState}
                onResetView={handleResetView}
            />

            {!isMobilePortrait && (
                <MapSidebar
                    isSidebarOpen={isSidebarOpen}
                    layout={{ sidebarWidth }}
                    COLORS={COLORS}
                    hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                    accentColor={accentColour}
                    onToggleWhatIfMode={handleToggleWhatIfMode}
                    onResetClosures={handleResetClosures}
                    savedScenarios={savedScenarios}
                    onSaveScenario={saveCurrentScenario}
                    onLoadScenario={handleLoadScenario}
                    onDeleteScenario={deleteScenario}
                    effectiveLines={effectiveLines}
                    closedLines={effectiveClosedLines}
                    partialLines={effectivePartialLines}
                    onLineToggle={handleLineToggle}
                    lineStatusLabel={lineStatusLabel}
                    lineStatusColor={lineStatusColour}
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
            )}

            {isMobilePortrait && (
                <MobileControlSheet
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    COLORS={COLORS}
                    hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                    accentColor={accentColour}
                    onToggleWhatIfMode={handleToggleWhatIfMode}
                    onResetClosures={handleResetClosures}
                    savedScenarios={savedScenarios}
                    onSaveScenario={saveCurrentScenario}
                    onLoadScenario={handleLoadScenario}
                    onDeleteScenario={deleteScenario}
                    effectiveLines={effectiveLines}
                    closedLines={effectiveClosedLines}
                    partialLines={effectivePartialLines}
                    onLineToggle={handleLineToggle}
                    lineStatusLabel={lineStatusLabel}
                    lineStatusColor={lineStatusColour}
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
                    interactionMode={mobileInteractionMode}
                    onInteractionModeChange={setMobileInteractionMode}
                />
            )}

            <MobileInteractionModeBar
                isVisible={showMobileModeBar}
                isSidebarOpen={isSidebarOpen}
                COLORS={COLORS}
                accentColor={accentColour}
                interactionMode={mobileInteractionMode}
                onInteractionModeChange={setMobileInteractionMode}
            />

            <SidebarToggleButton
                isSidebarOpen={isSidebarOpen}
                layout={{ isMobilePortrait, sidebarWidth }}
                COLORS={COLORS}
                accentColor={accentColour}
                hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                onToggle={() => setIsSidebarOpen((prev) => !prev)}
            />

            {hypotheticalSettingsEnabled && !isMobilePortrait && (
                <MapWhatIfOverlay
                    isSidebarOpen={isSidebarOpen}
                    accentColor={accentColour}
                />
            )}

            {!isTrainPanelOpen && (
                <RouteInfoPanel
                    isOpen={isRoutePanelOpen}
                    onToggle={toggleRoutePanel}
                    routeInfo={routeInfo}
                    isSidebarOpen={isSidebarOpen}
                    layout={{ isMobilePortrait, hasMobileModeBar: showMobileModeBar }}
                    COLORS={COLORS}
                    accentColor={accentColour}
                    hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                    lineColours={LINE_COLOURS}
                    lineLabels={LINE_LABELS}
                    onResetView={handleResetView}
                mobileInteractionMode={mobileInteractionMode}
            />
            )}

            <RoutingErrorBox
                error={routingError}
                COLORS={COLORS}
                layout={{ isMobilePortrait, hasMobileModeBar: showMobileModeBar }}
                onClose={() => setRoutingError(null)}
            />
        </div>
    )
}
