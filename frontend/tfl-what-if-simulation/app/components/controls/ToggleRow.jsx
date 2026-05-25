/**
 * Reusable labelled switch row used in the map control panel.
 * 
 * Renders a compact setting row with a text label and an iOS-style toggle.
 * This component is presentational: parent components own the state and pass
 * in the click handler.
 * 
 * @param {Object} props
 * @param {string} props.label - Text displayed beside the toggle.
 * @param {boolean} props.enabled - Whether the toggle is currently active.
 * @param {() => void} props.onToggle - Called when the toggle is clicked
 * @param {Object} props.COLORS - Theme colour tokens for the control panel.
 * @param {string} props.accentColor - Colour used for the enabled state.
 * @param {string} [props.ariaLabel] - Optional accessible label for the toggle button. 
 * @returns {JSX.Element}
 */
export function ToggleRow({
    label,
    enabled,
    onToggle,
    COLORS,
    accentColor: accentColour,
    ariaLabel,
}) {
    return (
        <div
            style={{
                width: "100%",
                padding: "12px 16px",
                background: COLORS.soft,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                color: COLORS.text,
                fontSize: 14,
                fontWeight: 500,
            }}
        >
            <span>{label}</span>
            <button
                onClick={onToggle}
                aria-label={ariaLabel ?? label}
                aria-pressed={enabled}
                style={{
                    position: "relative",
                    width: 51,
                    height: 31,
                    background: enabled ? accentColour : "rgba(120, 120, 128, 0.32)",
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
                        left: enabled ? 22 : 2,
                        width: 27,
                        height: 27,
                        background: "#fff",
                        borderRadius: "50%",
                        boxShadow:
                            "0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1)",
                        transition: "left 0.3s ease",
                    }}
                />
            </button>
        </div>
    );
}