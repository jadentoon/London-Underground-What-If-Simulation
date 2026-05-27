/**
 * Searchbox that was made by Saf. 
 * Updated with:
 * - keyboard navigation (↑ ↓ Enter)
 * - selected station highlighting support
 * - clear search button
 */

import { useState, useEffect, useRef } from "react";
import { SearchInput } from "./SearchInput";
import { SearchResultsList } from "./SearchResultsList";
import { FocusedStationPanel } from "./FocusedStationPanel";
import { CollapsedSearchButton } from "./CollapsedSearchButton";

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

    useEffect(() => {
        setSelectedIndex(0);
    }, [stationQuery, stationMatches.length]);

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
        onStationQueryChange(nextQuery);

        if (focusedStation && nextQuery !== focusedStation.name) {
            onClearFocusedStation?.();
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
            {!isOpen && (
                <CollapsedSearchButton 
                    COLORS={COLORS}
                    accentColour={accentColour}
                    top={desktopTop}
                    right={desktopRight}
                    onOpen={handleOpenSearch}
                />
            )}

            {isOpen && (
                <div
                    style={{
                        position: "fixed",
                        top: desktopTop,
                        right: desktopRight,
                        width: 320,
                        background: COLORS.card,
                        backdropFilter: "blur(10px)",
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 18,
                        padding: 14,
                        zIndex: 1000,
                        boxShadow: COLORS.shadow,
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
        </>
    );
}
