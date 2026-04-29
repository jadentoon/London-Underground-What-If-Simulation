/**
 * SidebarToggleButton.jsx
 * A button to toggle the sidebar open and closed.  
 * uses the same style as the rest of the app
 * using the standard button element 
 * simple colour change on hover
 */

export function SidebarToggleButton({
    isSidebarOpen,
    layout,
    COLORS,
    accentColor,
    hypotheticalSettingsEnabled,
    onToggle,
}) {
    const isMobilePortrait = layout?.isMobilePortrait ?? false;
    const sidebarWidth = layout?.sidebarWidth ?? 280;
    const leftOffset = isMobilePortrait
        ? (isSidebarOpen ? "calc(100vw - 44px)" : 0)
        : (isSidebarOpen ? sidebarWidth : 0);

    return (
        <button
            onClick={onToggle}
            style={{
                position: "fixed",
                top: isMobilePortrait ? (hypotheticalSettingsEnabled ? 110 : 90) : "50%",
                left: leftOffset,
                transform: isMobilePortrait ? "translateY(0)" : "translateY(-50%)",
                width: isMobilePortrait ? 44 : 32,
                height: isMobilePortrait ? 44 : 64,
                background: COLORS.card,
                backdropFilter: "blur(8px)",
                border: `1px solid ${COLORS.border}`,
                borderLeft: isSidebarOpen ? `1px solid ${COLORS.border}` : "none",
                borderRadius: isMobilePortrait ? 10 : "0 8px 8px 0",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: accentColor,
                fontSize: isMobilePortrait ? 18 : 16,
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
