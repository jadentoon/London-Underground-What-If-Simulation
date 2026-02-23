/**
 * SidebarToggleButton.jsx
 * A button to toggle the sidebar open and closed.  
 * uses the same style as the rest of the app
 * using the standard button element 
 * simple colour change on hover
 */

export function SidebarToggleButton({
    isSidebarOpen,
    COLORS,
    accentColor,
    hypotheticalSettingsEnabled,
    onToggle,
}) {
    return (
        <button
            onClick={onToggle}
            style={{
                position: "fixed",
                top: "50%",
                left: isSidebarOpen ? 280 : 0,
                transform: "translateY(-50%)",
                width: 32,
                height: 64,
                background: COLORS.card,
                backdropFilter: "blur(8px)",
                border: `1px solid ${COLORS.border}`,
                borderLeft: isSidebarOpen ? `1px solid ${COLORS.border}` : "none",
                borderRadius: "0 8px 8px 0",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: accentColor,
                fontSize: 16,
                zIndex: 1001,
                transition: "left 0.3s ease",
                outline: "none",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = hypotheticalSettingsEnabled
                    ? "rgba(251, 191, 36, 0.2)"
                    : "rgba(59, 130, 246, 0.2)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = COLORS.card;
            }}
        >
            {isSidebarOpen ? "◀" : "▶"}
        </button>
    );
}
