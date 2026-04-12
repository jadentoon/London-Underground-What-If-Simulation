/**
 * Searchbox that was made by Saf. 
 * 
 */

import { useState } from "react";

export function MapSearchBox({
    hypotheticalSettingsEnabled,
    COLORS,
    accentColor,
    stationQuery,
    onStationQueryChange,
    stationMatches,
    onSelectStation,
    onEnterFirstMatch,
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Search Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: "fixed",
                    top: hypotheticalSettingsEnabled ? 150 : 170,
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
                    top: hypotheticalSettingsEnabled ? 150 : 170,
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
                            <span style={{ color: accentColor }}>{s.name}</span>
                        </button>
                    ))}
                </div>
            )}
            </div>
        </>
    );
}
