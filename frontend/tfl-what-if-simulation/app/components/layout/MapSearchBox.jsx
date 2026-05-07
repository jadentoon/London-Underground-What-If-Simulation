/**
 * Searchbox that was made by Saf. 
 * 
 */

import { useState } from "react";

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
}) {
    const [isOpen, setIsOpen] = useState(false);
    const isMobilePortrait = layout?.isMobilePortrait ?? false;
    const anchorTop = hypotheticalSettingsEnabled ? 150 : 170;
    const shouldSlideOffscreen = isMobilePortrait && isSidebarOpen;

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
                        onChange={(e) => onStationQueryChange(e.target.value)}
                        placeholder="Search for a station"
                        style={{
                            flex: 1,
                            border: "none",
                            background: "transparent",
                            color: COLORS.text,
                            outline: "none",
                            fontSize: 14,
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && stationMatches.length > 0) {
                                onEnterFirstMatch();
                            }
                        }}
                    />
                    {stationQuery.trim().length > 0 && (
                        <button
                            onClick={() => onStationQueryChange("")}
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
                        {stationMatches.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => onSelectStation(s)}
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
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: "fixed",
                    top: anchorTop,
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

            <div
                style={{
                    position: "fixed",
                    top: anchorTop,
                    right: isOpen ? 64 : -320,
                    width: 280,
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
                <input
                    value={stationQuery}
                    onChange={(e) => onStationQueryChange(e.target.value)}
                    placeholder="Search station..."
                    style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: `1px solid ${COLORS.border}`,
                        background: "rgba(0, 0, 0, 0.3)",
                        color: COLORS.text,
                        outline: "none",
                        fontSize: 13,
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && stationMatches.length > 0) {
                            onEnterFirstMatch();
                        }
                    }}
                />

                {stationMatches.length > 0 && (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                        {stationMatches.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => onSelectStation(s)}
                                style={{
                                    textAlign: "left",
                                    padding: "8px 10px",
                                    borderRadius: 6,
                                    border: `1px solid ${COLORS.border}`,
                                    background: "rgba(0, 0, 0, 0.25)",
                                    color: COLORS.text,
                                    cursor: "pointer",
                                    fontSize: 12,
                                }}
                            >
                                <span style={{ color: accentColour }}>{s.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
