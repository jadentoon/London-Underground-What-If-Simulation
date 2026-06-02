/**
 * Displays an error message when routing cannot find a usable path.
 *
 * The message adapts to the current map layout and explains whether closures
 * are likely blocking the requested route. Returning null when there is no
 * error keeps the overlay out of the DOM during normal route planning.
 *
 * @param {Object} props - Routing error props.
 * @param {{ from: string, to: string, reason?: string } | null} props.error - Current routing error.
 * @param {Object} props.layout - Responsive map layout state.
 * @param {boolean} props.layout.isMobilePortrait - Whether the app is in mobile portrait layout.
 * @param {boolean} props.layout.hasMobileModeBar - Whether the mobile interaction mode bar is visible.
 * @param {() => void} props.onClose - Called when the user dismisses the error.
 * @returns {JSX.Element | null} Routing error overlay or null.
 */
export function RoutingErrorBox({ error, layout, onClose }) {
    if (!error) return null;

    const isMobilePortrait = layout?.isMobilePortrait ?? false;
    const hasMobileModeBar = layout?.hasMobileModeBar ?? false;

    return (
        <div
            style={{
                position: "fixed",
                bottom: isMobilePortrait ? (hasMobileModeBar ? 176 : 108) : 20,
                left: isMobilePortrait ? 12 : "50%",
                right: isMobilePortrait ? 12 : "auto",
                transform: isMobilePortrait ? "none" : "translateX(-50%)",
                maxWidth: isMobilePortrait ? "none" : 400,
                background: "rgba(239, 68, 68, 0.95)",
                backdropFilter: "blur(8px)",
                border: "1px solid #dc2626",
                borderRadius: 8,
                padding: "16px 20px",
                zIndex: 1002,
                fontFamily: "monospace",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
                animation: isMobilePortrait ? "none" : "slideUp 0.3s ease",
            }}
        >
            <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "flex-start",
                gap: 12
            }}>
                <div style={{ flex: 1 }}>
                    <div style={{ 
                        color: "#fff", 
                        fontWeight: 700, 
                        fontSize: 14,
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 8
                    }}>
                        <span style={{ fontSize: 18 }}>⚠️</span>
                        <span>Route Not Possible</span>
                    </div>
                    <div style={{ 
                        color: "#fee2e2", 
                        fontSize: 12,
                        lineHeight: 1.5
                    }}>
                        Cannot find a route from <strong>{error.from}</strong> to <strong>{error.to}</strong>.
                        {error.reason === 'closed-stations' && (
                            <div style={{ marginTop: 6 }}>
                                Closed stations may be blocking all available paths.
                            </div>
                        )}
                        {error.reason === 'closed-lines' && (
                            <div style={{ marginTop: 6 }}>
                                Line closures or partial closures may be blocking all available paths.
                            </div>
                        )}
                    </div>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        background: "none",
                        border: "none",
                        color: "#fff",
                        fontSize: 20,
                        cursor: "pointer",
                        padding: 0,
                        lineHeight: 1,
                        opacity: 0.8,
                        transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0.8}
                >
                    ×
                </button>
            </div>
            <style jsx>{`
                @keyframes slideUp {
                    from {
                        transform: translateX(-50%) translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
