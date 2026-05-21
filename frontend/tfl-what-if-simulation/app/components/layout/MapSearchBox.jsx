/**
 * Searchbox that was made by Saf. 
 * Updated with:
 * - keyboard navigation (↑ ↓ Enter)
 * - selected station highlighting support
 * - clear search button
 */

import { useState, useEffect, useRef } from "react";

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
    const activeSelectionBg = hypotheticalSettingsEnabled ? "rgba(251, 191, 36, 0.16)" : "rgba(59, 130, 246, 0.16)";

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
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "12px 14px",
                        borderRadius: 18,
                        background: COLORS.card,
                        backdropFilter: "blur(10px)",
                        border: `1px solid ${COLORS.border}`,
                        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.28)",
                    }}
                >
                    <span style={{ fontSize: 16, color: accentColour }}>⌕</span>
                    <input
                        value={stationQuery}
                        onChange={(e) => handleQueryChange(e.target.value)}
                        onFocus={onSearchInputFocus}
                        placeholder="Search stations"
                        style={{
                            flex: 1,
                            border: "none",
                            background: "transparent",
                            color: COLORS.text,
                            outline: "none",
                            fontSize: 14,
                        }}
                        aria-label="Search stations"
                        onKeyDown={handleKeyDown}
                    />
                    {stationQuery.trim().length > 0 && (
                        <button
                            onClick={handleClearSearch}
                            type="button"
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: 999,
                                border: "none",
                                background: "rgba(0, 0, 0, 0.2)",
                                color: COLORS.textMuted,
                                cursor: "pointer",
                            }}
                        >
                            x
                        </button>
                    )}
                </div>

                {stationMatches.length > 0 && (
                    <div
                        style={{
                            marginTop: 10,
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            maxHeight: "36vh",
                            overflowY: "auto",
                            padding: 8,
                            borderRadius: 18,
                            background: "rgba(15, 23, 42, 0.92)",
                            backdropFilter: "blur(12px)",
                            border: `1px solid ${COLORS.border}`,
                            boxShadow: "0 14px 34px rgba(0, 0, 0, 0.34)",
                        }}
                    >
                        {stationMatches.map((s, index) => (
                            <button
                                key={s.id}
                                onClick={() => handleSelectStation(s)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                type="button"
                                style={{
                                    textAlign: "left",
                                    padding: "10px 12px",
                                    borderRadius: 12,
                                    border: `1px solid ${COLORS.border}`,
                                    background: "rgba(0, 0, 0, 0.22)",
                                    color: COLORS.text,
                                    cursor: "pointer",
                                    fontSize: 13,
                                }}
                            >
                                <span style={{ color: accentColour, fontWeight: 700 }}>{s.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <>
            {!isOpen && (
                <button
                    onClick={handleOpenSearch}
                    type="button"
                    style={{
                        position: "fixed",
                        top: desktopTop,
                        right: desktopRight,
                        minWidth: 220,
                        padding: "12px 14px",
                        background: COLORS.card,
                        backdropFilter: "blur(10px)",
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 16,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        cursor: "pointer",
                        zIndex: 1001,
                        color: COLORS.text,
                        boxShadow: "0 12px 36px rgba(0, 0, 0, 0.28)",
                    }}
                    title="Open station search"
                >
                    <span
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 999,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(59, 130, 246, 0.16)",
                            color: accentColour,
                            fontSize: 16,
                            flex: "0 0 auto",
                        }}
                    >
                        ⌕
                    </span>
                    <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#e2e8f0" }}>Search stations</span>
                        <span style={{ fontSize: 12, color: COLORS.textMuted }}>Jump straight to a station on the map</span>
                    </span>
                </button>
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
                        boxShadow: "0 16px 42px rgba(0, 0, 0, 0.3)",
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
                            <span style={{ fontSize: 18, fontWeight: 800, color: "#e2e8f0" }}>
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
                                background: "rgba(0, 0, 0, 0.18)",
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

                    <div style={{ position: "relative" }}>
                        <span
                            style={{
                                position: "absolute",
                                left: 12,
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: accentColour,
                                fontSize: 15,
                                pointerEvents: "none",
                            }}
                        >
                            ⌕
                        </span>

                        <input
                            value={stationQuery}
                            onChange={(e) => handleQueryChange(e.target.value)}
                            onFocus={onSearchInputFocus}
                            placeholder="Search stations"
                            style={{
                                width: "100%",
                                padding: "11px 40px 11px 34px",
                                borderRadius: 12,
                                border: `1px solid ${COLORS.border}`,
                                background: "rgba(0, 0, 0, 0.3)",
                                color: COLORS.text,
                                outline: "none",
                                fontSize: 14,
                            }}
                            aria-label="Search stations"
                            onKeyDown={handleKeyDown}
                        />

                        {stationQuery.trim().length > 0 && (
                            <button
                                onClick={handleClearSearch}
                                type="button"
                                style={{
                                    position: "absolute",
                                    right: 8,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    width: 28,
                                    height: 28,
                                    borderRadius: 999,
                                    border: "none",
                                    background: "rgba(0, 0, 0, 0.2)",
                                    color: COLORS.textMuted,
                                    cursor: "pointer",
                                }}
                                aria-label="Clear search"
                            >
                                x
                            </button>
                        )}
                    </div>

                    {stationMatches.length > 0 ? (
                        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                            {stationMatches.map((s, index) => {
                                const isSelected = index === selectedIndex;

                                return (
                                    <button
                                        key={s.id}
                                        onClick={() => handleSelectStation(s)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        type="button"
                                        style={{
                                            textAlign: "left",
                                            padding: "10px 12px",
                                            borderRadius: 12,
                                            border: `1px solid ${isSelected ? accentColour : COLORS.border}`,
                                            background: isSelected ? "rgba(59, 130, 246, 0.16)" : "rgba(0, 0, 0, 0.22)",
                                            color: COLORS.text,
                                            cursor: "pointer",
                                            fontSize: 13,
                                            transition: "background-color 0.15s ease, border-color 0.15s ease",
                                        }}
                                    >
                                        <span style={{ color: accentColour, fontWeight: 700 }}>{s.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : !focusedStation ? (
                        <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.45, color: COLORS.textMuted }}>
                            Use the search box to jump straight to a station on the map.
                        </div>
                    ) : null}

                    {focusedStation && (
                        <div
                            style={{
                                marginTop: 12,
                                padding: 12,
                                borderRadius: 16,
                                border: `1px solid ${COLORS.border}`,
                                background: "rgba(2, 6, 23, 0.48)",
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                            }}
                        >
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                <span style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.textMuted }}>
                                    Current station
                                </span>
                                <span style={{ fontSize: 16, fontWeight: 800, color: "#e2e8f0" }}>
                                    {focusedStation.name}
                                </span>
                                <span style={{ fontSize: 12, lineHeight: 1.45, color: COLORS.textMuted }}>
                                    {hypotheticalSettingsEnabled
                                        ? "Use this station for route planning or update its what-if closure state."
                                        : "Use this station as the start or destination for route planning."}
                                </span>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                <div
                                    style={{
                                        padding: "9px 10px",
                                        borderRadius: 12,
                                        border: `1px solid ${isFocusedStationCurrentStart ? accentColour : COLORS.border}`,
                                        background: isFocusedStationCurrentStart ? activeSelectionBg : "rgba(15, 23, 42, 0.4)",
                                    }}
                                >
                                    <div style={{ fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: COLORS.textMuted }}>
                                        Start
                                    </div>
                                    <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800, color: isFocusedStationCurrentStart ? "#e2e8f0" : COLORS.text }}>
                                        {currentRouteStartName ?? "Not selected"}
                                    </div>
                                </div>

                                <div
                                    style={{
                                        padding: "9px 10px",
                                        borderRadius: 12,
                                        border: `1px solid ${isFocusedStationCurrentDestination ? accentColour : COLORS.border}`,
                                        background: isFocusedStationCurrentDestination ? activeSelectionBg : "rgba(15, 23, 42, 0.4)",
                                    }}
                                >
                                    <div style={{ fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: COLORS.textMuted }}>
                                        Destination
                                    </div>
                                    <div style={{ marginTop: 4, fontSize: 12, fontWeight: 800, color: isFocusedStationCurrentDestination ? "#e2e8f0" : COLORS.text }}>
                                        {currentRouteEndName ?? "Not selected"}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                <button
                                    onClick={onSetFocusedStationAsStart}
                                    type="button"
                                    disabled={isStartActionDisabled}
                                    style={{
                                        padding: "10px 12px",
                                        borderRadius: 12,
                                        border: `1px solid ${isFocusedStationCurrentStart ? accentColour : COLORS.border}`,
                                        background: isFocusedStationCurrentStart ? accentColour : "rgba(15, 23, 42, 0.4)",
                                        color: isFocusedStationCurrentStart ? "#0f172a" : (isStartActionDisabled ? COLORS.textMuted : COLORS.text),
                                        fontWeight: 800,
                                        cursor: isStartActionDisabled ? "not-allowed" : "pointer",
                                        opacity: isStartActionDisabled && !isFocusedStationCurrentStart ? 0.55 : 1,
                                    }}
                                >
                                    {isFocusedStationCurrentStart ? "Selected as start" : "Set as start"}
                                </button>

                                <button
                                    onClick={onSetFocusedStationAsDestination}
                                    type="button"
                                    disabled={isDestinationActionDisabled}
                                    style={{
                                        padding: "10px 12px",
                                        borderRadius: 12,
                                        border: `1px solid ${isFocusedStationCurrentDestination ? accentColour : COLORS.border}`,
                                        background: isFocusedStationCurrentDestination ? accentColour : "rgba(15, 23, 42, 0.4)",
                                        color: isFocusedStationCurrentDestination ? "#0f172a" : (isDestinationActionDisabled ? COLORS.textMuted : COLORS.text),
                                        fontWeight: 800,
                                        cursor: isDestinationActionDisabled ? "not-allowed" : "pointer",
                                        opacity: isDestinationActionDisabled && !isFocusedStationCurrentDestination ? 0.6 : 1,
                                    }}
                                >
                                    {isFocusedStationCurrentDestination ? "Selected as destination" : "Set as destination"}
                                </button>
                            </div>

                            {hypotheticalSettingsEnabled && (
                                <button
                                    onClick={onToggleFocusedStationClosure}
                                    type="button"
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: 12,
                                        border: `1px solid ${isFocusedStationHypotheticallyClosed ? "#22c55e" : "#ef4444"}`,
                                        background: isFocusedStationHypotheticallyClosed
                                            ? "rgba(34, 197, 94, 0.16)"
                                            : "rgba(239, 68, 68, 0.16)",
                                        color: isFocusedStationHypotheticallyClosed ? "#86efac" : "#fecaca",
                                        fontWeight: 800,
                                        cursor: "pointer",
                                    }}
                                >
                                    {isFocusedStationHypotheticallyClosed ? "Reopen station" : "Close station"}
                                </button>
                            )}

                            <div style={{ fontSize: 12, lineHeight: 1.45, color: COLORS.textMuted }}>
                                {isFocusedStationUnavailableForRouting ? (
                                    hypotheticalSettingsEnabled
                                        ? "Closed stations cannot be used for route planning until they are reopened."
                                        : "This station is currently unavailable for route planning."
                                ) : isFocusedStationCurrentStart ? (
                                    "This station is already the current starting station."
                                ) : currentRouteStartName ? (
                                    `Current starting station: ${currentRouteStartName}.`
                                ) : (
                                    "Choose a starting station first, then set a destination."
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
