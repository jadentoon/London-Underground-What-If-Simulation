/**
 * Station search result list.
 * 
 * Renders matching stations for either the compact mobile search surface or
 * the desktop popover. Selection state is owned by the parent component.
 * 
 * @param {Object} props
 * @param {Object} props.COLORS - Theme colour tokens for the search surface.
 * @param {string} props.accentColour - Colour used for station names and selected borders.
 * @param {Array<{id: string, name: string}>} props.stationMatches - Stations matching the current query.
 * @param {number} props.setSelectedIndex - Index currently selected by keyboard navigation.
 * @param {(station: Object) => void} props.onSelectStation - Called when a station is selected.
 * @param {(index: number) => void} props.onSelectIndex - Called when a result is hovered.
 * @param {boolean} [props.compact=false] - Whether to render the mobile compact layout.
 * @returns {JSX.Element | null}
 */
export function SearchResultsList({
    COLORS,
    accentColour,
    stationMatches,
    selectedIndex,
    onSelectStation,
    onSelectIndex,
    compact = false,
}) {
    if (stationMatches.length === 0) return null;

    const containerStyle = compact
        ? {
            marginTop: 10,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            maxHeight: "36vh",
            overflowY: "auto",
            padding: 8,
            borderRadius: 18,
            background: COLORS.strong,
            backdropFilter: "blur(12px)",
            border: `1px solid ${COLORS.border}`,
            boxShadow: COLORS.shadow,
        }
        : {
            marginTop: 10,
            display: "flex",
            flexDirection: "column",
            gap: 6,
        };

    return (
        <div style={containerStyle}>
            {stationMatches.map((station, index) => {
                const isSelected = !compact && index === selectedIndex;

                return (
                    <button
                        type="button"
                        key={station.id}
                        onClick={() => onSelectStation(station)}
                        onMouseEnter={() => onSelectIndex(index)}
                        style={{
                            textAlign: "left",
                            padding: "10px 12px",
                            borderRadius: 12,
                            border: `1px solid ${isSelected ? accentColour : COLORS.border}`,
                            background: isSelected ? COLORS.hover : COLORS.subtle,
                            color: COLORS.text,
                            cursor: "pointer",
                            fontSize: 13,
                            transition: compact
                                ? undefined
                                : "background-color 0.15s ease, border-color 0.15s ease",
                        }}
                    >
                        <span style={{ color: accentColour, fontWeight: 700 }}>
                            {station.name}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}