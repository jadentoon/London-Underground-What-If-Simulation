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
    accentColor: accentColour,
    hypotheticalSettingsEnabled,
    onToggle,
}) {
    const isMobilePortrait = layout?.isMobilePortrait ?? false;
    const sidebarWidth = layout?.sidebarWidth ?? 280;

    const leftOffset = isMobilePortrait
        ? 12
        : (isSidebarOpen ? sidebarWidth : 0);

    return (
        <button
            onClick={onToggle}
            style={{
                position: "fixed",
                top: isMobilePortrait ? 12 : "50%",
                left: leftOffset,
                transform: isMobilePortrait ? "translateY(0)" : "translateY(-50%)",
                width: isMobilePortrait ? 44 : 32,
                height: isMobilePortrait ? 44 : 64,
                background: COLORS.card,
                backdropFilter: "blur(8px)",
                border: `1px solid ${COLORS.border}`,
                borderLeft: isMobilePortrait ? `1px solid ${COLORS.border}` : (isSidebarOpen ? `1px solid ${COLORS.border}` : "none"),
                borderRadius: isMobilePortrait ? 14 : "0 8px 8px 0",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: accentColour,
                fontSize: isMobilePortrait ? 18 : 16,
                zIndex: 1001,
                transition: isMobilePortrait ? "background-color 0.2s ease" : "left 0.3s ease",
                outline: "none",
                boxShadow: isMobilePortrait ? COLORS.shadow : "none",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = COLORS.hover;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = COLORS.card;
            }}
        >
            {isMobilePortrait ? (isSidebarOpen ? "✕" : "☰") : (isSidebarOpen ? "◀" : "▶")}
        </button>
    );
}
