
/**
 * sidebar component for the map view, showing settings and line status information
 */

import { useState, useRef } from "react";
import { getDelaySeverityColor } from "./mapComponents/delayUtils";

export function MapSidebar({
    isSidebarOpen,
    COLORS,
    hypotheticalSettingsEnabled,
    accentColor,
    onToggleWhatIfMode,
    onResetClosures,
    effectiveLines,
    closedLines,
    onLineToggle,
    lineStatusLabel,
    lineStatusColor,
    lineStatusBg,
    isLiveLines,
    linesUpdatedAt,
    lineDelays,
}) {
    //track which line is expanded to show delay info
    const [expandedLineId, setExpandedLineId] = useState(null);
    const hoverTimeoutRef = useRef(null);

    const handleMouseEnter = (lineId, hasDelay) => {
        if (!hasDelay) return;
        
        //clear any existing timeout
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        
        //set timeout to expand after 1 second of hover
        hoverTimeoutRef.current = setTimeout(() => {
            setExpandedLineId(lineId);
        }, 750);
    };

    const handleMouseLeave = () => {
        // Clear the timeout if user leaves before 2 seconds
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        
        //collapse the expanded line
        setExpandedLineId(null);
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: isSidebarOpen ? 0 : -280,
                width: 280,
                height: "100vh",
                background: COLORS.card,
                backdropFilter: "blur(8px)",
                borderRight: `1px solid ${COLORS.border}`,
                transition: "left 0.3s ease",
                zIndex: 1000,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 20,
                overflowY: "auto",
            }}
        >
            <div>
                <h2 style={{ color: COLORS.text }}>Settings</h2>
                <div
                    style={{
                        width: "100%",
                        padding: "12px 16px",
                        background: "rgba(0, 0, 0, 0.3)",
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        color: COLORS.text,
                        fontSize: 14,
                        fontWeight: 500,
                    }}
                >
                    <span>What-If Mode</span>
                    <button
                        onClick={onToggleWhatIfMode}
                        style={{
                            position: "relative",
                            width: 51,
                            height: 31,
                            background: hypotheticalSettingsEnabled ? accentColor : "rgba(120, 120, 128, 0.32)",
                            borderRadius: 15.5,
                            border: "none",
                            cursor: "pointer",
                            transition: "background-color 0.3s ease",
                            outline: "none",
                            padding: 0,
                        }}
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
            </div>

            <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
                {hypotheticalSettingsEnabled && (
                    <button
                        onClick={onResetClosures}
                        style={{
                            width: "100%",
                            padding: "10px 12px",
                            marginBottom: 12,
                            background: "#ef4444",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            cursor: "pointer",
                            fontWeight: 700,
                            boxShadow: "0 0 10px rgba(239,68,68,0.4)",
                            transition: "background-color 0.2s ease, box-shadow 0.2s ease",
                        }}
                    >
                        Reset all closures
                    </button>
                )}
                <h3 style={{ margin: "0 0 4px", color: COLORS.text }}>Lines</h3>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 8px",
                        marginBottom: 8,
                        borderRadius: 8,
                        background: lineStatusBg,
                        color: lineStatusColor,
                        fontSize: 12,
                    }}
                >
                    <span
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: 999,
                            background: lineStatusColor,
                            boxShadow: `0 0 8px ${lineStatusColor}80`,
                        }}
                    />
                    <span>
                        {lineStatusLabel}
                        {isLiveLines && linesUpdatedAt ? ` · ${linesUpdatedAt.toLocaleTimeString()}` : ""}
                    </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {effectiveLines.map((line) => {
                        const isClosed = closedLines.has(line.id);
                        const disabled = !hypotheticalSettingsEnabled;
                        const delay = lineDelays.get(line.id);
                        const showDelay = !hypotheticalSettingsEnabled && isLiveLines && delay;
                        const isExpanded = expandedLineId === line.id;
                        
                        return (
                            <div
                                key={line.id}
                                onMouseEnter={() => handleMouseEnter(line.id, showDelay)}
                                onMouseLeave={handleMouseLeave}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    width: "100%",
                                    background: disabled ? "rgba(100, 116, 139, 0.2)" : "rgba(0,0,0,0.3)",
                                    border: `1px solid ${COLORS.border}`,
                                    borderRadius: 8,
                                    color: COLORS.text,
                                    opacity: isClosed ? 0.6 : 1,
                                    transition: "all 0.3s ease",
                                    overflow: "hidden",
                                }}
                            >
                                <button
                                    onClick={() => onLineToggle(line.id)}
                                    disabled={disabled}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        width: "100%",
                                        padding: "10px 12px",
                                        background: "transparent",
                                        border: "none",
                                        color: COLORS.text,
                                        cursor: disabled ? "not-allowed" : "pointer",
                                        transition: "background-color 0.2s ease",
                                    }}
                                >
                                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span
                                            style={{
                                                width: 14,
                                                height: 14,
                                                borderRadius: 999,
                                                backgroundColor: line.color,
                                                border: "1px solid #fff",
                                                boxShadow: isClosed ? "none" : `0 0 8px ${line.color}80`,
                                            }}
                                        />
                                        {line.label}
                                    </span>
                                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        {/* Show delay indicator ONLY in live mode */}
                                        {showDelay && (
                                            <span
                                                style={{
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: "50%",
                                                    backgroundColor: getDelaySeverityColor(delay.severity),
                                                    boxShadow: `0 0 6px ${getDelaySeverityColor(delay.severity)}`,
                                                }}
                                            />
                                        )}
                                        <span style={{ fontSize: 12, color: isClosed ? "#f87171" : "#22c55e" }}>
                                            {isClosed ? "Closed" : "Open"}
                                        </span>
                                    </span>
                                </button>

                                {/* expanded delay details */}
                                {isExpanded && showDelay && (
                                    <div
                                        style={{
                                            padding: "0 12px 12px 12px",
                                            fontSize: 12,
                                            borderTop: `1px solid ${COLORS.border}`,
                                            animation: "expandDown 0.3s ease",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 8,
                                                marginTop: 8,
                                                marginBottom: 8,
                                                paddingBottom: 8,
                                                borderBottom: `1px solid ${COLORS.border}`,
                                            }}
                                        >
                                            <span
                                                style={{
                                                    width: 8,
                                                    height: 8,
                                                    borderRadius: "50%",
                                                    backgroundColor: getDelaySeverityColor(delay.severity),
                                                }}
                                            />
                                            <span style={{ fontWeight: 700, color: getDelaySeverityColor(delay.severity) }}>
                                                {delay.description}
                                            </span>
                                        </div>
                                        
                                        {delay.reason && (
                                            <div style={{ marginBottom: 8 }}>
                                                <strong style={{ color: "#94a3b8" }}>Reason:</strong>
                                                <div style={{ marginTop: 4, color: "#cbd5e1" }}>{delay.reason}</div>
                                            </div>
                                        )}
                                        
                                        {/* {delay.fullDescription && (
                                            <div style={{ marginBottom: 8 }}>
                                                <strong style={{ color: "#94a3b8" }}>Details:</strong>
                                                <div style={{ marginTop: 4, color: "#cbd5e1" }}>{delay.fullDescription}</div>
                                            </div>
                                        )} */}
                                        
                                        {delay.additionalInfo && (
                                            <div>
                                                <strong style={{ color: "#94a3b8" }}>Additional Info:</strong>
                                                <div style={{ marginTop: 4, color: "#cbd5e1" }}>{delay.additionalInfo}</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
