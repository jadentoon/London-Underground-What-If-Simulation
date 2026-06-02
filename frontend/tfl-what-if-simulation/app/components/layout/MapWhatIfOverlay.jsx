/**
 * Renders desktop visual framing while What-If mode is active.
 *
 * Corner accents and the WHAT-IF label make simulated closure mode visually
 * distinct from the live network view.
 *
 * @param {Object} props - Overlay props.
 * @param {boolean} props.isSidebarOpen - Whether the desktop sidebar is open.
 * @param {Object} props.COLORS - Theme tokens used for text styling.
 * @param {string} props.accentColor - Accent colour used for frame corners.
 * @returns {JSX.Element} What-If mode overlay accents.
 */

export function MapWhatIfOverlay({ isSidebarOpen, COLORS, accentColor }) {
    return (
        <>
            <div
                style={{
                    position: "fixed",
                    top: 40,
                    left: isSidebarOpen ? 320 : 40,
                    width: 80,
                    height: 80,
                    borderTop: `15px solid ${accentColor}`,
                    borderLeft: `15px solid ${accentColor}`,
                    zIndex: 999,
                    opacity: 0.8,
                    animation: "fadeIn 0.3s ease",
                    transition: "left 0.3s ease",
                }}
            />

            <div
                style={{
                    position: "fixed",
                    top: 40,
                    right: 40,
                    width: 80,
                    height: 80,
                    borderTop: `15px solid ${accentColor}`,
                    borderRight: `15px solid ${accentColor}`,
                    zIndex: 999,
                    opacity: 0.8,
                    animation: "fadeIn 0.3s ease",
                }}
            />

            <div
                style={{
                    position: "fixed",
                    bottom: 40,
                    left: isSidebarOpen ? 320 : 40,
                    width: 80,
                    height: 80,
                    borderBottom: `15px solid ${accentColor}`,
                    borderLeft: `15px solid ${accentColor}`,
                    zIndex: 999,
                    opacity: 0.8,
                    animation: "fadeIn 0.3s ease",
                    transition: "left 0.3s ease",
                }}
            />

            <div
                style={{
                    position: "fixed",
                    bottom: 40,
                    right: 40,
                    width: 80,
                    height: 80,
                    borderBottom: `15px solid ${accentColor}`,
                    borderRight: `15px solid ${accentColor}`,
                    zIndex: 999,
                    opacity: 0.8,
                    animation: "fadeIn 0.3s ease",
                }}
            />

            <div
                style={{
                    position: "fixed",
                    top: 80,
                    right: 95,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: "monospace",
                    fontSize: 40,
                    fontWeight: 700,
                    color: COLORS?.textStrong ?? "#fff",
                    zIndex: 999,
                    textShadow: COLORS?.titleShadow ?? "0 0 10px rgba(255, 255, 255, 0.5)",
                }}
            >
                <span>WHAT-IF</span>
                <div
                    style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        backgroundColor: "#fbbf24",
                        boxShadow: "0 0 10px #fbbf24",
                        animation: "flash 1s ease-in-out infinite",
                    }}
                />
            </div>
        </>
    );
}
