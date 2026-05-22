export function MapTitleOverlay({ hypotheticalSettingsEnabled, isSidebarOpen, layout, COLORS, accentColor: accentColour, titleShadow }) {
    const isMobilePortrait = layout?.isMobilePortrait ?? false;
    const sidebarOffset = layout?.sidebarOffset ?? null;
    const topOffset = hypotheticalSettingsEnabled ? 85 : 16;
    const leftOffset = hypotheticalSettingsEnabled ? 85 : 16;

    if (isMobilePortrait) {
        return (
            <div
                style={{
                    position: "fixed",
                    top: 12,
                    left: 64,
                    right: 16,
                    zIndex: 1000,
                    pointerEvents: "none",
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        gap: 2,
                        maxWidth: "100%",
                        padding: "10px 14px",
                        borderRadius: 18,
                        border: `1px solid ${COLORS.border}`,
                        background: COLORS.card,
                        backdropFilter: "blur(10px)",
                        boxShadow: COLORS.shadow,
                    }}
                >
                    <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.textMuted }}>
                        London Underground
                    </span>
                    <span
                        style={{
                            fontSize: 15,
                            fontWeight: 800,
                            color: COLORS.textStrong,
                            textShadow: titleShadow,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        What If <span style={{ color: accentColour }}>Simulator</span>
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                position: "fixed",
                top: topOffset,
                transition: "top 0.3s ease, left 0.3s ease, transform 0.3s ease",
                zIndex: 1000,
                left: sidebarOffset ?? (isSidebarOpen ? 365 : leftOffset),
                transform: "none",
            }}
        >
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: COLORS.text, textShadow: titleShadow }}>
                London Underground <span style={{ color: accentColour }}>What If Simulator</span>
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: COLORS.textMuted, textShadow: titleShadow }}>
                Interactive Map
            </p>
        </div>
    );
}
