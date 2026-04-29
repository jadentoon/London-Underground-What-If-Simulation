export function MapTitleOverlay({ hypotheticalSettingsEnabled, isSidebarOpen, layout, COLORS, accentColor, titleShadow }) {
    const isMobilePortrait = layout?.isMobilePortrait ?? false;
    const sidebarOffset = layout?.sidebarOffset ?? null;
    const topOffset = hypotheticalSettingsEnabled ? 85 : 16;
    const leftOffset = hypotheticalSettingsEnabled ? 85 : 16;
    const titleStyle = isMobilePortrait
        ? {
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 24px)",
            textAlign: "center",
        }
        : {
            left: sidebarOffset ?? (isSidebarOpen ? 365 : leftOffset),
            transform: "none",
        };

    return (
        <div
            style={{
                position: "fixed",
                top: isMobilePortrait ? 12 : topOffset,
                transition: "top 0.3s ease, left 0.3s ease, transform 0.3s ease",
                zIndex: 1000,
                ...titleStyle,
            }}
        >
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: COLORS.text, textShadow: titleShadow }}>
                London Underground <span style={{ color: accentColor }}>What If Simulator</span>
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.textMuted, textShadow: titleShadow }}>
                Interactive Map
            </p>
        </div>
    );
}
