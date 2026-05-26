/**
 * Route and What-If actions for the currently focused station.
 * 
 * Displays the selected station, current route endpoints, route assignment
 * actions and the optional What-If station closure action. The parent owns
 * all route and closure state.
 * 
 * @param {Object} props
 * @param {Object} props.COLORS - Theme colour tokens for the search surface.
 * @param {string} props.accentColour - Accent colour used for active route selections.
 * @param {{id: string, name: string}} props.focusedStation - Station currently focused from search or map selection.
 * @param {boolean} props.hypotheticalSettingsEnabled - Whether What-If mode is active.
 * @param {string | null} props.currentRouteStartName - Current route start station name.
 * @param {string | null} props.currentRouteEndName - Current route destination station name.
 * @param {boolean} props.isFocusedStationCurrentStart - Whether the focused station is the route start.
 * @param {boolean} props.isFocusedStationCurrentDestination - Whether the focused station is the route destination.
 * @param {boolean} props.isStartActionDisabled - Whether the start action is disabled.
 * @param {boolean} props.isDestinationActionDisabled - Whether the destination action is disabled.
 * @param {boolean} props.isFocusedStationUnavailableForRouting - Whether this station can be used for routing.
 * @param {boolean} props.isFocusedStationHypotheticallyClosed - Whether the station is closed in the What-If mode.
 * @param {() => void} props.onSetFocusedStationAsStart - Sets the station as the route start.
 * @param {() => void} props.onSetFocusedStationAsDestination - Sets the station as the route destination.
 * @param {() => void} props.onToggleFocusedStationClosure - Toggles the station closure state.
 * @returns {JSX.Element}
 */
export function FocusedStationPanel({
    COLORS,
    accentColour,
    focusedStation,
    hypotheticalSettingsEnabled,
    currentRouteStartName,
    currentRouteEndName,
    isFocusedStationCurrentStart,
    isFocusedStationCurrentDestination,
    isStartActionDisabled,
    isDestinationActionDisabled,
    isFocusedStationUnavailableForRouting,
    isFocusedStationHypotheticallyClosed,
    onSetFocusedStationAsStart,
    onSetFocusedStationAsDestination,
    onToggleFocusedStationClosure,
}) {
    const activeSelectionBg = hypotheticalSettingsEnabled
        ? "rgba(251, 191, 36, 0.16)"
        : COLORS.hover;
    
    return (
        <div
            style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 16,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.soft,
                display: "flex",
                flexDirection: "column",
                gap: 10,
            }}
        >
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span 
                    style={{ 
                        fontSize: 11, 
                        letterSpacing: "0.08em", 
                        textTransform: "uppercase", 
                        color: COLORS.textMuted 
                    }}
                >
                    Current station
                </span>
                <span style={{ fontSize: 16, fontWeight: 800, color: COLORS.textStrong }}>
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
                        background: isFocusedStationCurrentStart ? activeSelectionBg : COLORS.control,
                    }}
                >
                    <div style={{ 
                            fontSize: 10, 
                            letterSpacing: "0.06em", 
                            textTransform: "uppercase", 
                            color: COLORS.textMuted 
                        }}
                    >
                        Start
                    </div>
                    <div style={{ 
                            marginTop: 4, 
                            fontSize: 12, 
                            fontWeight: 800, 
                            color: isFocusedStationCurrentStart ? COLORS.textStrong : COLORS.text 
                        }}
                    >
                        {currentRouteStartName ?? "Not selected"}
                    </div>
                </div>

                <div
                    style={{
                        padding: "9px 10px",
                        borderRadius: 12,
                        border: `1px solid ${isFocusedStationCurrentDestination ? accentColour : COLORS.border}`,
                        background: isFocusedStationCurrentDestination ? activeSelectionBg : COLORS.control,
                    }}
                >
                    <div style={{ 
                            fontSize: 10, 
                            letterSpacing: "0.06em", 
                            textTransform: "uppercase", 
                            color: COLORS.textMuted 
                        }}
                    >
                        Destination
                    </div>
                    <div style={{ 
                            marginTop: 4, 
                            fontSize: 12, 
                            fontWeight: 800, 
                            color: isFocusedStationCurrentDestination ? COLORS.textStrong : COLORS.text 
                        }}
                    >
                        {currentRouteEndName ?? "Not selected"}
                    </div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button
                    type="button"
                    onClick={onSetFocusedStationAsStart}
                    disabled={isStartActionDisabled}
                    style={{
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: `1px solid ${isFocusedStationCurrentStart ? accentColour : COLORS.border}`,
                        background: isFocusedStationCurrentStart ? accentColour : COLORS.control,
                        color: isFocusedStationCurrentStart 
                            ? COLORS.textOnAccent 
                            : isStartActionDisabled 
                                    ? COLORS.textMuted 
                                    : COLORS.text,
                        fontWeight: 800,
                        cursor: isStartActionDisabled ? "not-allowed" : "pointer",
                        opacity: isStartActionDisabled && !isFocusedStationCurrentStart ? 0.55 : 1,
                    }}
                >
                    {isFocusedStationCurrentStart ? "Selected as start" : "Set as start"}
                </button>

                <button
                    type="button"
                    onClick={onSetFocusedStationAsDestination}
                    disabled={isDestinationActionDisabled}
                    style={{
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: `1px solid ${isFocusedStationCurrentDestination ? accentColour : COLORS.border}`,
                        background: isFocusedStationCurrentDestination ? accentColour : COLORS.control,
                        color: isFocusedStationCurrentDestination 
                            ? COLORS.textOnAccent 
                            : isDestinationActionDisabled 
                                ? COLORS.textMuted 
                                : COLORS.text,
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
                    type="button"
                    onClick={onToggleFocusedStationClosure}
                    style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: `1px solid ${
                            isFocusedStationHypotheticallyClosed ? "#22c55e" : "#ef4444"
                        }`,
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
    );
}