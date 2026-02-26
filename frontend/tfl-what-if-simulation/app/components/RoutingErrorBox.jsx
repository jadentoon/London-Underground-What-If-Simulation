/**
 * RoutingErrorBox.jsx
 * 
 * Displays an error message when no route is possible between two stations.
 * Shows in what-if mode when closed stations prevent routing.
 */

export function RoutingErrorBox({ error, COLORS, onClose }) {
    if (!error) return null;

    return (
        <div
            style={{
                position: "fixed",
                bottom: 20,
                left: "50%",
                transform: "translateX(-50%)",
                maxWidth: 400,
                background: "rgba(239, 68, 68, 0.95)",
                backdropFilter: "blur(8px)",
                border: "1px solid #dc2626",
                borderRadius: 8,
                padding: "16px 20px",
                zIndex: 1002,
                fontFamily: "monospace",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
                animation: "slideUp 0.3s ease",
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
                                Line closures may be blocking all available paths.
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
