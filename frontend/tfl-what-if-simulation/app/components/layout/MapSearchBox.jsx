/**
 * Searchbox that was made by Saf. 
 * Updated with:
 * - keyboard navigation (↑ ↓ Enter)
 * - selected station highlighting support
 * - clear search button
 */

import { useState, useEffect } from "react";

export function MapSearchBox({
    hypotheticalSettingsEnabled,
    layout,
    COLORS,
    accentColor,
    stationQuery,
    onStationQueryChange,
    stationMatches,
    onSelectStation,
    onEnterFirstMatch,
}) {
    const [isOpen, setIsOpen] = useState(false);

    // NEW: keyboard selection index
    const [selectedIndex, setSelectedIndex] = useState(0);

    const isMobilePortrait = layout?.isMobilePortrait ?? false;
    const anchorTop = hypotheticalSettingsEnabled ? 150 : 170;
    const buttonTop = isMobilePortrait ? "auto" : anchorTop;
    const buttonBottom = isMobilePortrait ? 90 : "auto";
    const panelWidth = isMobilePortrait
        ? "min(320px, calc(100vw - 32px))"
        : 280;

    /**
     * Reset selected keyboard index when results change
     */
    useEffect(() => {
        setSelectedIndex(0);
    }, [stationQuery]);

    return (
        <>
            {/* Search Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: "fixed",
                    top: buttonTop,
                    bottom: buttonBottom,
                    right: 16,
                    width: 40,
                    height: 40,
                    background: COLORS.card,
                    backdropFilter: "blur(8px)",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 1001,
                    color: COLORS.text,
                    fontSize: 18,
                }}
                title={isOpen ? "Close search" : "Open search"}
            >
                {isOpen ? "✕" : "🔍"}
            </button>

            {/* Search Box */}
            <div
                style={{
                    position: "fixed",
                    top: isMobilePortrait ? "auto" : anchorTop,
                    bottom: isMobilePortrait ? 140 : "auto",
                    right: isMobilePortrait
                        ? (isOpen ? 16 : "-400px")
                        : (isOpen ? 64 : -320),
                    width: panelWidth,
                    background: COLORS.card,
                    backdropFilter: "blur(8px)",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 8,
                    padding: 10,
                    zIndex: 1000,
                    fontFamily: "monospace",
                    transition: "right 0.3s ease-in-out",
                }}
            >
                {/* Search Input Wrapper */}
                <div style={{ position: "relative" }}>
                    <input
                        value={stationQuery}
                        onChange={(e) => onStationQueryChange(e.target.value)}
                        placeholder="Search station..."
                        style={{
                            width: "100%",
                            padding: stationQuery
                                ? "8px 34px 8px 10px"
                                : "8px 10px",
                            borderRadius: 6,
                            border: `1px solid ${COLORS.border}`,
                            background: "rgba(0, 0, 0, 0.3)",
                            color: COLORS.text,
                            outline: "none",
                            fontSize: 13,
                        }}
                        onKeyDown={(e) => {
                            // DOWN arrow
                            if (e.key === "ArrowDown") {
                                e.preventDefault();

                                setSelectedIndex((prev) =>
                                    Math.min(prev + 1, stationMatches.length - 1)
                                );
                            }

                            // UP arrow
                            else if (e.key === "ArrowUp") {
                                e.preventDefault();

                                setSelectedIndex((prev) =>
                                    Math.max(prev - 1, 0)
                                );
                            }

                            // ENTER key
                            else if (
                                e.key === "Enter" &&
                                stationMatches.length > 0
                            ) {
                                e.preventDefault();

                                const selectedStation =
                                    stationMatches[selectedIndex];

                                if (selectedStation) {
                                    onSelectStation(selectedStation);
                                } else {
                                    onEnterFirstMatch();
                                }
                            }
                        }}
                    />

                    {/* Clear Search Button */}
                    {stationQuery && (
                        <button
                            onClick={() => onStationQueryChange("")}
                            title="Clear search"
                            style={{
                                position: "absolute",
                                top: "50%",
                                right: 8,
                                transform: "translateY(-50%)",
                                width: 22,
                                height: 22,
                                border: "none",
                                borderRadius: "50%",
                                background: "rgba(255, 255, 255, 0.12)",
                                color: COLORS.text,
                                cursor: "pointer",
                                fontSize: 12,
                                lineHeight: "22px",
                                padding: 0,
                            }}
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Search Results */}
                {stationMatches.length > 0 && (
                    <div
                        style={{
                            marginTop: 8,
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                        }}
                    >
                        {stationMatches.map((s, index) => {
                            const isSelected = index === selectedIndex;

                            return (
                                <button
                                    key={s.id}
                                    onClick={() => onSelectStation(s)}
                                    style={{
                                        textAlign: "left",
                                        padding: "8px 10px",
                                        borderRadius: 6,
                                        border: isSelected
                                            ? `1px solid ${accentColor}`
                                            : `1px solid ${COLORS.border}`,

                                        // NEW: highlight selected item
                                        background: isSelected
                                            ? "rgba(59, 130, 246, 0.25)"
                                            : "rgba(0, 0, 0, 0.25)",

                                        color: COLORS.text,
                                        cursor: "pointer",
                                        fontSize: 12,

                                        // subtle glow
                                        boxShadow: isSelected
                                            ? `0 0 10px ${accentColor}55`
                                            : "none",

                                        transition: "all 0.15s ease",
                                    }}
                                >
                                    <span style={{ color: accentColor }}>
                                        {s.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}