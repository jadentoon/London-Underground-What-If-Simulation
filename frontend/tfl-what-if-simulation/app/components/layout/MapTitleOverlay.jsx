export function MapTitleOverlay({ hypotheticalSettingsEnabled, isSidebarOpen, COLORS, accentColor, titleShadow }) {
    return (
        <div
            style={{
                position: "fixed",
                top: hypotheticalSettingsEnabled ? 85 : 16,
                left: isSidebarOpen ? 365 : (hypotheticalSettingsEnabled ? 85 : 16),
                transition: "top 0.3s ease, left 0.3s ease",
                zIndex: 1000,
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
