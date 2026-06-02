'use client';
/**
 * Top-level client container for the London Underground What-If map.
 *
 * `MapCanvas` coordinates map-wide UI state, live disruption hooks, search,
 * routing panels, train controls, What-If scenario controls and mobile/desktop
 * overlays. The Leaflet-specific rendering is delegated to `LeafletMap`.
 */

import { useRef, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { LONDON_CENTER, LINE_COLOURS, LINE_LABELS } from "../mapShared/constants";
import { useLineStatus } from "../../hooks/useLineStatus";
import { MapLeafletChrome } from "../layout/MapLeafletChrome";
import { MapTitleOverlay } from "../layout/MapTitleOverlay";
import { MapSearchBox } from "../search/MapSearchBox";
import { MapHud } from "../layout/MapHud";
import { MapSidebar } from "../layout/MapSidebar";
import { SidebarToggleButton } from "../layout/SidebarToggleButton";
import { MapWhatIfOverlay } from "../layout/MapWhatIfOverlay";
import { GuidedTourPrompt } from "../layout/GuidedTourPrompt";
import { GuidedTourOverlay } from "../layout/GuidedTourOverlay";
import { RoutingErrorBox } from "../route/RoutingErrorBox";
import { RouteInfoPanel } from "../route/RouteInfoPanel";
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
    bg: "var(--map-bg)",
    card: "var(--panel-bg)",
    border: "var(--panel-border)",
    accent: "var(--accent)",
    text: "var(--panel-text)",
    textStrong: "var(--panel-text-strong)",
    textMuted: "var(--panel-text-muted)",
    soft: "var(--panel-bg-soft)",
    subtle: "var(--panel-bg-subtle)",
    strong: "var(--panel-bg-strong)",
    control: "var(--panel-control-bg)",
    selectedControl: "var(--panel-control-bg-selected)",
    hover: "var(--panel-hover-bg)",
    shadow: "var(--panel-shadow)",
    shadowStrong: "var(--panel-shadow-strong)",
    textOnAccent: "var(--text-on-accent)",
    overlay: "var(--overlay-bg)",
    titleShadow: "var(--title-shadow)",
    whatIfAccent: "var(--what-if-accent)",
};

const DEFAULT_CENTER = { lat: LONDON_CENTER[0], lng: LONDON_CENTER[1] };
const LIVE_CLOSURE_POLL_MS = 60_000;

/**
 * Floating desktop toggle for enabling and disabling What-If mode.
 *
 * The toggle is rendered outside the sidebar on desktop so the primary scenario
 * mode can be changed without opening the full control panel.
 *
 * @param {Object} props - Toggle props.
 * @param {Object} props.COLORS - Theme tokens used for styling.
 * @param {boolean} props.hypotheticalSettingsEnabled - Whether What-If mode is active.
 * @param {string} props.accentColor - Accent colour for the toggle.
 * @param {() => void} props.onToggleWhatIfMode - Toggles What-If mode.
 * @param {Object} props.layout - Fixed-position layout offsets.
 * @returns {JSX.Element} Floating What-If mode toggle.
 */
function MainScreenWhatIfToggle({
    COLORS,
    hypotheticalSettingsEnabled,
    accentColor: accentColour,
    onToggleWhatIfMode,
    layout,
}) {
    const top = layout?.top ?? 20;
    const right = layout?.right ?? 70;
    return (
        <div
            data-tour="what-if-toggle-container"
            style={{
                position: "fixed",
                top,
                right,
                minWidth: 220,
                padding: "12px 16px",
                background: COLORS.card,
                backdropFilter: "blur(10px)",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                color: COLORS.text,
                fontSize: 14,
                fontWeight: 500,
                boxShadow: "0 12px 36px rgba(0, 0, 0, 0.28)",
                zIndex: 1001,
            }}
        >
            <span>What-If Mode</span>
            <button
                onClick={onToggleWhatIfMode}
                style={{
                    position: "relative",
                    width: 51,
                    height: 31,
                    background: hypotheticalSettingsEnabled ? accentColour : "rgba(120, 120, 128, 0.32)",
                    borderRadius: 15.5,
                    border: "none",
                    cursor: "pointer",
                    transition: "background-color 0.3s ease",
                    outline: "none",
                    padding: 0,
                    flex: "0 0 auto",
                }}
                aria-label="Toggle What-If Mode"
                aria-pressed={hypotheticalSettingsEnabled}
            >
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
    );
}

/**
 * Composes the complete map experience.
 *
 * This component owns the high-level interaction state shared across the map:
 * sidebar visibility, What-If mode, mobile interaction mode, selected trains,
 * route undo state, search focus, live status feeds and guided tour state. It
 * passes the relevant state and callbacks into presentation components and the
 * Leaflet map renderer.
 *
 * @returns {JSX.Element} Full-screen interactive map application.
 */
export function MapCanvas() {

    // Leaflet map instance used for imperative actions such as reset view and search navigation.
    const leafletMapRef = useRef(null);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);


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
    const [routeCompletionSequence, setRouteCompletionSequence] = useState(0);
    const [searchPanelMetrics, setSearchPanelMetrics] = useState({ reserveSpace: false, bottom: 0 });
    const [stationActionRequest, setStationActionRequest] = useState(null);
    const [showGuidedTourPrompt, setShowGuidedTourPrompt] = useState(true);
    const [isGuidedTourActive, setIsGuidedTourActive] = useState(false);
    const [lastClearedRoute, setLastClearedRoute] = useState(null);
    const [routeSelection, setRouteSelection] = useState({
        startId: null,
        startName: null,
        endId: null,
        endName: null,
        hasPath: false,
    });
    const stationActionSequenceRef = useRef(0);
    const lastCompletedRouteKeyRef = useRef("");
    const lastActiveRouteSnapshotRef = useRef(null);
    const hadActiveRouteRef = useRef(false);

    const accentColour = hypotheticalSettingsEnabled ? COLORS.whatIfAccent : COLORS.accent;
    const titleShadow = COLORS.titleShadow;

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
    const desktopFloatingRight = hypotheticalSettingsEnabled ? 40 : 70;
    const whatIfToggleTop = hypotheticalSettingsEnabled ? 150 : 20;
    const stationSearchTop = hypotheticalSettingsEnabled ? 222 : 92;

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
     * Resets the map view and clears transient route/search state.
     *
     * What-If station closures are cleared, route panels are reset and mobile
     * interaction mode returns to route selection. Line closures remain managed
     * separately by the What-If controls.
     *
     * @returns {void}
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
    
    /**
     * Toggles What-If mode and resets mode-specific UI state.
     *
     * Closing the sidebar and clearing line closures prevents stale scenario
     * state from carrying between live mode and simulated closure mode.
     *
     * @returns {void}
     */
    const handleToggleWhatIfMode = useCallback(() => {
        setHypotheticalSettingsEnabled((prev) => !prev);
        setMobileInteractionMode("route");
        clearClosedLines();
        setIsSidebarOpen(false);
    }, [clearClosedLines]);

    const hasActiveRoute = Boolean(routeInfo?.hasPath || routeSelection.hasPath);

    /**
     * Clears the active route in both the panel state and Leaflet route state.
     *
     * The sequence value is passed to `LeafletMap`, where it is observed by the
     * route hook and used to clear selected start/end stations.
     *
     * @returns {void}
     */
    const clearActiveRoute = useCallback(() => {
        if (!hasActiveRoute) return;

        clearRoutePanel();
        setRouteSelection({
            startId: null,
            startName: null,
            endId: null,
            endName: null,
            hasPath: false,
        });
        setResetRouteSequence((value) => value + 1);
    }, [clearRoutePanel, hasActiveRoute]);

    /**
     * Loads a saved What-If scenario and switches the UI into closure mode.
     *
     * @param {string} scenarioId - Saved scenario id.
     * @returns {void}
     */
    const handleLoadScenario = useCallback((scenarioId) => {
        const loadedScenario = loadScenario(scenarioId);
        if (!loadedScenario) return;

        setHypotheticalSettingsEnabled(true);
        setMobileInteractionMode("closures");
        clearRoutePanel();
        setResetRouteSequence((value) => value + 1);
    }, [clearRoutePanel, loadScenario]);

    /**
     * Synchronises route selection state from `LeafletMap` into the outer UI.
     *
     * Search panels and undo controls use this state to know whether a start,
     * destination or completed route is currently active.
     *
     * @param {Object} selection - Current route selection state.
     * @returns {void}
     */
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

    /**
     * Sends an imperative station action request to `LeafletMap`.
     *
     * Search controls use this bridge to set route starts/destinations or toggle
     * station closures without directly mutating Leaflet route state.
     *
     * @param {"set-start" | "set-destination" | "toggle-closure"} action - Requested station action.
     * @param {Object | null} station - Station receiving the action.
     * @returns {void}
     */
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

    /**
     * Handles selecting a station from search.
     *
     * Any active route is cleared before panning to the selected station so the
     * search result becomes the user's next focus.
     *
     * @param {Object} station - Station selected from search results.
     * @returns {void}
     */
    const handleSearchStationSelection = useCallback((station) => {
        clearActiveRoute();
        goToStation(station);
    }, [clearActiveRoute, goToStation]);

    const handleSearchQueryStart = useCallback(() => {
        clearActiveRoute();
    }, [clearActiveRoute]);

    /**
     * Collapses competing UI when the search input receives focus.
     *
     * @returns {void}
     */
    const handleSearchInputFocus = useCallback(() => {
        setSelectedTrainId(null);
        collapseRoutePanel();
    }, [collapseRoutePanel]);

    /**
     * Stores search panel layout metrics used to avoid overlay collisions.
     *
     * @param {{ reserveSpace?: boolean, bottom?: number }} nextMetrics - Latest search panel bounds.
     * @returns {void}
     */
    const handleSearchLayoutMetricsChange = useCallback((nextMetrics) => {
        setSearchPanelMetrics((prev) => {
            const reserveSpace = Boolean(nextMetrics?.reserveSpace);
            const bottom = Number.isFinite(nextMetrics?.bottom) ? nextMetrics.bottom : 0;

            if (prev.reserveSpace === reserveSpace && prev.bottom === bottom) {
                return prev;
            }

            return { reserveSpace, bottom };
        });
    }, []);

    /**
     * Restores the most recently cleared route.
     *
     * The request is sent to `LeafletMap` through the station action sequence so
     * the route is rebuilt with the current live/What-If disruption state.
     *
     * @returns {void}
     */
    const handleUndoClearRoute = useCallback(() => {
        if (!lastClearedRoute?.startId || !lastClearedRoute?.endId) return;

        setSelectedTrainId(null);
        setStationQuery("");
        clearFocusedStation();
        setMobileInteractionMode("route");

        stationActionSequenceRef.current += 1;

        setStationActionRequest({
            sequence: stationActionSequenceRef.current,
            action: "restore-route",
            startStationId: String(lastClearedRoute.startId),
            endStationId: String(lastClearedRoute.endId),
        });
    }, [clearFocusedStation, lastClearedRoute, setStationQuery]);

    useEffect(() => {
        const hasRestorableRoute = Boolean(
            routeInfo?.hasPath
            && routeSelection.startId
            && routeSelection.endId
        );

        if (hasRestorableRoute) {
            lastActiveRouteSnapshotRef.current = {
                startId: String(routeSelection.startId),
                startName: routeSelection.startName ?? routeInfo?.startName ?? "Start",
                endId: String(routeSelection.endId),
                endName: routeSelection.endName ?? routeInfo?.endName ?? "End",
            };
        } else if (hadActiveRouteRef.current && lastActiveRouteSnapshotRef.current) {
            const nextClearedRoute = lastActiveRouteSnapshotRef.current;

            setLastClearedRoute((prev) => {
                const isSameSnapshot = prev?.startId === nextClearedRoute.startId
                    && prev?.endId === nextClearedRoute.endId
                    && prev?.startName === nextClearedRoute.startName
                    && prev?.endName === nextClearedRoute.endName;

                return isSameSnapshot ? prev : nextClearedRoute;
            });
        }

        hadActiveRouteRef.current = hasRestorableRoute;
    }, [routeInfo, routeSelection]);

    useEffect(() => {
        const hasPath = Boolean(routeInfo?.hasPath);

        if (!hasPath) {
            lastCompletedRouteKeyRef.current = "";
            return;
        }

        const stopKey = routeInfo?.stops?.map((stop) => String(stop.id)).join("->") ?? "";
        const routeKey = stopKey || [
            routeInfo?.startName ?? "",
            routeInfo?.endName ?? "",
            routeInfo?.totalTravelSeconds ?? 0,
            routeInfo?.changeCount ?? 0,
        ].join("|");

        if (!routeKey || routeKey === lastCompletedRouteKeyRef.current) return;

        lastCompletedRouteKeyRef.current = routeKey;
        setRouteCompletionSequence((value) => value + 1);
    }, [routeInfo]);

    const focusedStationId = focusedStation?.id ? String(focusedStation.id) : null;
    const isFocusedStationHypotheticallyClosed = hypotheticalSettingsEnabled
        && focusedStationId !== null
        && closedStations.has(focusedStationId);
    const isFocusedStationUnavailableForRouting = focusedStationId !== null
        && (
            liveClosedStations.has(focusedStationId)
            || (hypotheticalSettingsEnabled && closedStations.has(focusedStationId))
        );
    const canUndoClearedRoute = Boolean(
        lastClearedRoute
        && !routeInfo?.hasPath
        && !routeSelection.startId
        && !routeSelection.endId
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
                COLORS={COLORS}
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

            {!isMobilePortrait && (
                <MainScreenWhatIfToggle
                    COLORS={COLORS}
                    hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                    accentColor={accentColour}
                    onToggleWhatIfMode={handleToggleWhatIfMode}
                    layout={{ top: whatIfToggleTop, right: desktopFloatingRight }}
                />
            )}

            <MapSearchBox
                hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                isSidebarOpen={isSidebarOpen}
                layout={{ isMobilePortrait, desktopTop: stationSearchTop, desktopRight: desktopFloatingRight }}
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
                onSearchQueryStart={handleSearchQueryStart}
                routeCompletionSequence={routeCompletionSequence}
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
                onSearchInputFocus={handleSearchInputFocus}
                onLayoutMetricsChange={handleSearchLayoutMetricsChange}
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
                    COLORS={COLORS}
                    accentColor={accentColour}
                />
            )}

            {!isTrainPanelOpen && (
                <RouteInfoPanel
                    isOpen={isRoutePanelOpen}
                    onToggle={toggleRoutePanel}
                    routeInfo={routeInfo}
                    onClearRoute={clearActiveRoute}
                    lastClearedRoute={lastClearedRoute}
                    onUndoClearRoute={canUndoClearedRoute ? handleUndoClearRoute : null}
                    isSidebarOpen={isSidebarOpen}
                    layout={{
                        isMobilePortrait,
                        hasMobileModeBar: showMobileModeBar,
                        searchReservedBottom: searchPanelMetrics.reserveSpace ? searchPanelMetrics.bottom : null,
                    }}
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
            {/* Guided Tour Prompt */}
            {showGuidedTourPrompt && (
                <GuidedTourPrompt
                    onStartTour={() => {
                        setShowGuidedTourPrompt(false);
                        setIsGuidedTourActive(true);
                    }}
                    onDismiss={() => setShowGuidedTourPrompt(false)}
                    COLORS={COLORS}
                />
            )}

            {isGuidedTourActive && (
                <GuidedTourOverlay
                    onSkipTour={() => {
                        setIsGuidedTourActive(false);
                        // Return to the standard route-planning mode after the tour completes.
                        setHypotheticalSettingsEnabled(false);
                        setMobileInteractionMode("route");
                    }}
                    COLORS={COLORS}
                />
            )}
        </div>
    )
}
