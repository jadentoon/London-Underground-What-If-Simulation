import { useState, useEffect, useRef } from "react";
import { SearchInput } from "./SearchInput";
import { SearchResultsList } from "./SearchResultsList";
import { FocusedStationPanel } from "./FocusedStationPanel";
import { CollapsedSearchButton } from "./CollapsedSearchButton";

const DESKTOP_SEARCH_TRANSITION_MS = 240;

/**
 * Station search controller for the map interface.
 *
 * Manages the search panel open state, keyboard navigation through station
 * matches, station selection, and the focused-station route actions. The
 * visual search controls are delegated to smaller components so this component
 * can focus on state and interaction flow.
 *
 * On mobile, the search input is always rendered as a compact floating control.
 * On desktop, a collapsed search button opens the full search panel.
 *
 * @param {Object} props
 * @param {boolean} props.hypotheticalSettingsEnabled - Whether What-If mode is currently active.
 * @param {boolean} [props.isSidebarOpen=false] - Whether the sidebar is open and should push mobile search offscreen.
 * @param {Object} props.layout - Responsive layout values for positioning and mobile detection.
 * @param {boolean} props.layout.isMobilePortrait - Whether the current layout is mobile portrait.
 * @param {number} props.layout.desktopTop - Fixed top offset for desktop search.
 * @param {number} props.layout.desktopRight - Fixed right offset for desktop search.
 * @param {Object} props.COLORS - Theme colour tokens used by the search UI.
 * @param {string} props.accentColor - Accent colour used for search highlights.
 * @param {string} props.stationQuery - Current station search query.
 * @param {(query: string) => void} props.onStationQueryChange - Updates the station search query.
 * @param {Array<{id: string, name: string}>} props.stationMatches - Stations matching the current query.
 * @param {(station: Object) => void} props.onSelectStation - Selects a station from the search results.
 * @param {() => void} props.onEnterFirstMatch - Fallback callback for selecting the first result with Enter.
 * @param {() => void} props.onSearchQueryStart - Called when a new station search begins.
 * @param {Object | null} props.focusedStation - Station currently focused by search or map interaction.
 * @param {string | null} props.focusedStationSource - Source that last focused the station.
 * @param {() => void} props.onClearFocusedStation - Clears the focused station.
 * @param {number} [props.routeCompletionSequence=0] - Incremented by the parent after a route is completed.
 * @param {string | null} props.currentRouteStartId - Current route start station id.
 * @param {string | null} props.currentRouteStartName - Current route start station name.
 * @param {string | null} props.currentRouteEndId - Current route destination station id.
 * @param {string | null} props.currentRouteEndName - Current route destination station name.
 * @param {boolean} [props.currentRouteHasPath=false] - Whether the selected route currently has a valid path.
 * @param {boolean} [props.isFocusedStationUnavailableForRouting=false] - Whether the focused station can be used for routing.
 * @param {boolean} [props.isFocusedStationHypotheticallyClosed=false] - Whether the focused station is closed in What-If mode.
 * @param {() => void} props.onSetFocusedStationAsStart - Sets the focused station as the route start.
 * @param {() => void} props.onSetFocusedStationAsDestination - Sets the focused station as the route destination.
 * @param {() => void} props.onToggleFocusedStationClosure - Toggles the focused station closure in What-If mode.
 * @param {() => void} props.onDesktopSearchOpen - Called when the desktop search panel is opened.
 * @param {() => void} props.onSearchInputFocus - Called when the search input receives focus.
 * @param {(metrics: { reserveSpace: boolean, bottom: number }) => void} props.onLayoutMetricsChange - Reports search panel layout for nearby panels.
 * @returns {JSX.Element}
 */
export function MapSearchBox({
    hypotheticalSettingsEnabled,
    isSidebarOpen = false,
    layout,
    COLORS,
    accentColor: accentColour,
    stationQuery,
    onStationQueryChange,
    stationMatches,
    onSelectStation,
    onEnterFirstMatch,
    focusedStation,
    focusedStationSource,
    onClearFocusedStation,
    currentRouteStartId,
    currentRouteStartName,
    currentRouteEndId,
    currentRouteEndName,
    currentRouteHasPath = false,
    isFocusedStationUnavailableForRouting = false,
    isFocusedStationHypotheticallyClosed = false,
    onSetFocusedStationAsStart,
    onSetFocusedStationAsDestination,
    onToggleFocusedStationClosure,
    onDesktopSearchOpen,
    onSearchInputFocus,
    routeCompletionSequence = 0,
    onSearchQueryStart,
    onLayoutMetricsChange,
}) {
    const isMobilePortrait = layout?.isMobilePortrait ?? false;
    const desktopTop = layout?.desktopTop ?? 92;
    const desktopRight = layout?.desktopRight ?? 70;
    const shouldSlideOffscreen = isMobilePortrait && isSidebarOpen;
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const autoCollapseRouteKeyRef = useRef("");
    const focusedStationId = focusedStation?.id ? String(focusedStation.id) : null;
    const isFocusedStationCurrentStart = focusedStationId !== null
        && currentRouteStartId !== null
        && String(currentRouteStartId) === focusedStationId;
    const isFocusedStationCurrentDestination = focusedStationId !== null
        && currentRouteEndId !== null
        && String(currentRouteEndId) === focusedStationId;
    const canSetFocusedStationAsDestination = Boolean(
        focusedStationId
        && currentRouteStartId
        && !isFocusedStationCurrentStart
        && !isFocusedStationUnavailableForRouting
    );
    const isStartActionDisabled = isFocusedStationUnavailableForRouting && !isFocusedStationCurrentStart;
    const isDestinationActionDisabled = (!canSetFocusedStationAsDestination && !isFocusedStationCurrentDestination)
        || (isFocusedStationUnavailableForRouting && !isFocusedStationCurrentDestination);

    const [isDesktopCardMounted, setIsDesktopCardMounted] = useState(false);
    const [isDesktopCardVisible, setIsDesktopCardVisible] = useState(false);
    const routeResetSequenceRef = useRef(routeCompletionSequence);
    const overlayRef = useRef(null);
    const desktopCardAnimationFrameRef = useRef(null);
    const desktopCardTimeoutRef = useRef(null);
    
    useEffect(() => {
        setSelectedIndex(0);
    }, [stationQuery, stationMatches.length]);

    useEffect(() => {
        if (desktopCardAnimationFrameRef.current) {
            window.cancelAnimationFrame(desktopCardAnimationFrameRef.current);
            desktopCardAnimationFrameRef.current = null;
        }

        if (desktopCardTimeoutRef.current) {
            window.clearTimeout(desktopCardTimeoutRef.current);
            desktopCardTimeoutRef.current = null;
        }

        if (isMobilePortrait) {
            setIsDesktopCardMounted(false);
            setIsDesktopCardVisible(false);
            return undefined;
        }

        if (isOpen) {
            setIsDesktopCardMounted(true);
            desktopCardAnimationFrameRef.current = window.requestAnimationFrame(() => {
                setIsDesktopCardVisible(true);
            });

            return () => {
                if (desktopCardAnimationFrameRef.current) {
                    window.cancelAnimationFrame(desktopCardAnimationFrameRef.current);
                    desktopCardAnimationFrameRef.current = null;
                }
            };
        }

        setIsDesktopCardVisible(false);
        desktopCardTimeoutRef.current = window.setTimeout(() => {
            setIsDesktopCardMounted(false);
            desktopCardTimeoutRef.current = null;
        }, DESKTOP_SEARCH_TRANSITION_MS);

        return () => {
            if (desktopCardTimeoutRef.current) {
                window.clearTimeout(desktopCardTimeoutRef.current);
                desktopCardTimeoutRef.current = null;
            }
        };
    }, [isMobilePortrait, isOpen]);

    useEffect(() => {
        if (isMobilePortrait) return;

        if (!routeCompletionSequence || routeCompletionSequence === routeResetSequenceRef.current) {
            return;
        }

        routeResetSequenceRef.current = routeCompletionSequence;
        onStationQueryChange("");
        onClearFocusedStation?.();
        setSelectedIndex(0);
    }, [
        isMobilePortrait,
        onStationQueryChange,
        onClearFocusedStation,
        routeCompletionSequence,
    ]);

    useEffect(() => {
        if (!onLayoutMetricsChange) return;

        const shouldReserveSpace = isMobilePortrait ? !shouldSlideOffscreen : isDesktopCardMounted;
        const element = overlayRef.current;

        if (!shouldReserveSpace || !element) {
            onLayoutMetricsChange({ reserveSpace: false, bottom: 0 });
            return;
        }

        const updateLayoutMetrics = () => {
            if (!overlayRef.current) return;

            const bounds = overlayRef.current.getBoundingClientRect();
            onLayoutMetricsChange({
                reserveSpace: true,
                bottom: Math.ceil(bounds.bottom),
            });
        };

        updateLayoutMetrics();

        if (typeof ResizeObserver === "undefined") {
            window.addEventListener("resize", updateLayoutMetrics);

            return () => {
                window.removeEventListener("resize", updateLayoutMetrics);
                onLayoutMetricsChange({ reserveSpace: false, bottom: 0 });
            };
        }

        const resizeObserver = new ResizeObserver(() => {
            updateLayoutMetrics();
        });

        resizeObserver.observe(element);
        window.addEventListener("resize", updateLayoutMetrics);

        return () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", updateLayoutMetrics);
            onLayoutMetricsChange({ reserveSpace: false, bottom: 0 });
        };
    }, [
        focusedStationId,
        isDesktopCardMounted,
        isDesktopCardVisible,
        isMobilePortrait,
        onLayoutMetricsChange,
        shouldSlideOffscreen,
        stationMatches.length,
    ]);

    useEffect(() => {
        if (isMobilePortrait) return;

        if (!focusedStation || focusedStationSource !== "search") {
            autoCollapseRouteKeyRef.current = "";
            return;
        }

        if (!currentRouteHasPath && !currentRouteEndId) {
            autoCollapseRouteKeyRef.current = "";
            return;
        }

        if (!currentRouteHasPath) return;

        const routeKey = `${currentRouteStartId ?? ""}|${currentRouteEndId ?? ""}`;

        if (!routeKey || routeKey === autoCollapseRouteKeyRef.current) return;

        autoCollapseRouteKeyRef.current = routeKey;
        setIsOpen(false);
        onClearFocusedStation?.();
        setSelectedIndex(0);
    }, [
        focusedStation,
        focusedStationSource,
        currentRouteEndId,
        currentRouteHasPath,
        currentRouteStartId,
        isMobilePortrait,
        onClearFocusedStation,
    ]);

    const handleOpenSearch = () => {
        setIsOpen(true);
        onDesktopSearchOpen?.();
    };

    const handleClearSearch = () => {
        onStationQueryChange("");
        onClearFocusedStation?.();
        setSelectedIndex(0);
    };

    const handleQueryChange = (nextQuery) => {
        const isStartingNewSearch = stationQuery.trim().length === 0 && nextQuery.trim().length > 0;

        onStationQueryChange(nextQuery);

        if (focusedStation && nextQuery !== focusedStation.name) {
            onClearFocusedStation?.();
        }

        if (isStartingNewSearch) {
            onSearchQueryStart?.();
        }
    };

    const handleSelectStation = (station) => {
        onSelectStation(station);
        setSelectedIndex(0);
    };

    const handleKeyDown = (event) => {
        if (event.key === "ArrowDown" && stationMatches.length > 0) {
            event.preventDefault();
            setSelectedIndex((current) => Math.min(current + 1, stationMatches.length - 1));
            return;
        }

        if (event.key === "ArrowUp" && stationMatches.length > 0) {
            event.preventDefault();
            setSelectedIndex((current) => Math.max(current - 1, 0));
            return;
        }

        if (event.key === "Enter" && stationMatches.length > 0) {
            event.preventDefault();
            const selectedStation = stationMatches[selectedIndex] ?? stationMatches[0];

            if (selectedStation) {
                handleSelectStation(selectedStation);
            } else {
                onEnterFirstMatch?.();
            }
            return;
        }

        if (event.key === "Escape" && !isMobilePortrait) {
            event.preventDefault();
            setIsOpen(false);
        }
    };

    if (isMobilePortrait) {
        return (
            <div
                ref={overlayRef}
                style={{
                    position: "fixed",
                    top: 84,
                    left: 12,
                    right: 12,
                    zIndex: 1001,
                    opacity: shouldSlideOffscreen ? 0 : 1,
                    transform: shouldSlideOffscreen ? "translateY(-12px)" : "translateY(0)",
                    pointerEvents: shouldSlideOffscreen ? "none" : "auto",
                    transition: "opacity 180ms ease, transform 180ms ease",
                }}
            >
                <SearchInput
                    COLORS={COLORS}
                    accentColour={accentColour}
                    value={stationQuery}
                    onChange={handleQueryChange}
                    onClear={handleClearSearch}
                    onFocus={onSearchInputFocus}
                    onKeyDown={handleKeyDown}
                    compact
                />

                <SearchResultsList
                    COLORS={COLORS}
                    accentColour={accentColour}
                    stationMatches={stationMatches}
                    selectedIndex={selectedIndex}
                    onSelectStation={handleSelectStation}
                    onSelectIndex={setSelectedIndex}
                    compact
                />
            </div>
        );
    }

    return (
        <>
            <div
                data-tour="station-search-container"
                style={{
                    position: "fixed",
                    top: desktopTop,
                    right: desktopRight,
                    zIndex: isOpen ? 1000 : 1001,
                }}
            >
                {!isOpen && (
                    <CollapsedSearchButton
                        COLORS={COLORS}
                        accentColour={accentColour}
                        onOpen={handleOpenSearch}
                    />
                )}

                {isDesktopCardMounted && (
                    <div
                        ref={overlayRef}
                        data-tour="station-search-box"
                        style={{
                            position: "relative",
                            width: 320,
                            background: COLORS.card,
                            backdropFilter: "blur(10px)",
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: 18,
                            padding: 14,
                            boxShadow: COLORS.shadow,
                            maxHeight: `calc(100vh - ${desktopTop + 24}px)`,
                            overflowY: "auto",
                            opacity: isDesktopCardVisible ? 1 : 0,
                            transform: isDesktopCardVisible ? "translateY(0) scale(1)" : "translateY(-10px) scale(0.985)",
                            pointerEvents: isDesktopCardVisible ? "auto" : "none",
                            transition: `opacity ${DESKTOP_SEARCH_TRANSITION_MS}ms ease, transform ${DESKTOP_SEARCH_TRANSITION_MS}ms ease`,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                gap: 12,
                                marginBottom: 12,
                            }}
                        >
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.textMuted }}>
                                    Search
                                </span>
                                <span style={{ fontSize: 18, fontWeight: 800, color: COLORS.textStrong }}>
                                    Search stations
                                </span>
                                <span style={{ fontSize: 12, lineHeight: 1.4, color: COLORS.textMuted }}>
                                    Type a station name to find it on the map.
                                </span>
                            </div>

                            <button
                                onClick={() => setIsOpen(false)}
                                type="button"
                                data-tour="station-search-hide"
                                style={{
                                    padding: "7px 10px",
                                    borderRadius: 999,
                                    border: `1px solid ${COLORS.border}`,
                                    background: COLORS.subtle,
                                    color: COLORS.text,
                                    cursor: "pointer",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    flex: "0 0 auto",
                                }}
                                title="Hide station search"
                                aria-label="Hide station search"
                            >
                                Hide
                            </button>
                        </div>

                        <SearchInput
                            COLORS={COLORS}
                            accentColour={accentColour}
                            value={stationQuery}
                            onChange={handleQueryChange}
                            onClear={handleClearSearch}
                            onFocus={onSearchInputFocus}
                            onKeyDown={handleKeyDown}
                            inputTourId="station-search-input"
                        />

                        {stationMatches.length > 0 ? (
                            <SearchResultsList
                                COLORS={COLORS}
                                accentColour={accentColour}
                                stationMatches={stationMatches}
                                selectedIndex={selectedIndex}
                                onSelectStation={handleSelectStation}
                                onSelectIndex={setSelectedIndex}
                            />
                        ) : !focusedStation ? (
                            <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.45, color: COLORS.textMuted }}>
                                Use the search box to jump straight to a station on the map.
                            </div>
                        ) : null}

                        {focusedStation && (
                            <FocusedStationPanel
                                COLORS={COLORS}
                                accentColour={accentColour}
                                focusedStation={focusedStation}
                                hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                                currentRouteStartName={currentRouteStartName}
                                currentRouteEndName={currentRouteEndName}
                                isFocusedStationCurrentStart={isFocusedStationCurrentStart}
                                isFocusedStationCurrentDestination={isFocusedStationCurrentDestination}
                                isStartActionDisabled={isStartActionDisabled}
                                isDestinationActionDisabled={isDestinationActionDisabled}
                                isFocusedStationUnavailableForRouting={isFocusedStationUnavailableForRouting}
                                isFocusedStationHypotheticallyClosed={isFocusedStationHypotheticallyClosed}
                                onSetFocusedStationAsStart={onSetFocusedStationAsStart}
                                onSetFocusedStationAsDestination={onSetFocusedStationAsDestination}
                                onToggleFocusedStationClosure={onToggleFocusedStationClosure}
                            />
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
