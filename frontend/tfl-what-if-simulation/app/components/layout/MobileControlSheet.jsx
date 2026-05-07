import { MapControlPanelContent } from "./MapControlPanelContent";

export function MobileControlSheet({
    isOpen,
    onClose,
    COLORS,
    hypotheticalSettingsEnabled,
    accentColor: accentColour,
    onToggleWhatIfMode,
    onResetClosures,
    effectiveLines,
    closedLines,
    partialLines,
    onLineToggle,
    lineStatusLabel,
    lineStatusColor: lineStatusColour,
    lineStatusBg,
    isLiveLines,
    linesUpdatedAt,
    lineDelays,
    trainFeedSource,
    trainFeedUpdatedAt,
    trainFeedReason,
    trainFeedCount,
    showTrains,
    trainFilterMode,
    visibleTrainLines,
    onToggleShowTrains,
    onTrainFilterModeChange,
    onToggleVisibleTrainLine,
    interactionMode,
    onInteractionModeChange,
}) {
    return (
        <>
            <button
                type="button"
                aria-label="Close controls"
                onClick={onClose}
                style={{
                    position: "fixed",
                    inset: 0,
                    border: "none",
                    background: "rgba(2, 6, 23, 0.5)",
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? "auto" : "none",
                    transition: "opacity 0.22s ease",
                    zIndex: 1098,
                }}
            />

            <div
                style={{
                    position: "fixed",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    maxHeight: "78vh",
                    padding: "14px 16px calc(18px + env(safe-area-inset-bottom, 0px))",
                    background: "rgba(15, 23, 42, 0.94)",
                    backdropFilter: "blur(14px)",
                    borderTop: `1px solid ${COLORS.border}`,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    boxShadow: "0 -18px 45px rgba(0, 0, 0, 0.45)",
                    transform: isOpen ? "translateY(0)" : "translateY(calc(100% + 12px))",
                    transition: "transform 0.24s ease",
                    pointerEvents: isOpen ? "auto" : "none",
                    zIndex: 1099,
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                }}
            >
                <div style={{ alignSelf: "center", width: 44, height: 4, borderRadius: 999, background: "rgba(148, 163, 184, 0.45)" }} />

                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 12,
                    }}
                >
                    <div>
                        <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.textMuted }}>
                            Map Controls
                        </div>
                        <div style={{ marginTop: 4, fontSize: 18, fontWeight: 800, color: "#e2e8f0" }}>
                            {hypotheticalSettingsEnabled ? "What-if controls" : "Live network status"}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            minWidth: 42,
                            height: 42,
                            borderRadius: 14,
                            border: `1px solid ${COLORS.border}`,
                            background: "rgba(0, 0, 0, 0.22)",
                            color: COLORS.text,
                            cursor: "pointer",
                            fontSize: 20,
                        }}
                    >
                        x
                    </button>
                </div>

                <div style={{ overflowY: "auto", paddingRight: 4 }}>
                    <MapControlPanelContent
                        COLORS={COLORS}
                        hypotheticalSettingsEnabled={hypotheticalSettingsEnabled}
                        accentColor={accentColour}
                        onToggleWhatIfMode={onToggleWhatIfMode}
                        onResetClosures={onResetClosures}
                        effectiveLines={effectiveLines}
                        closedLines={closedLines}
                        partialLines={partialLines}
                        onLineToggle={onLineToggle}
                        lineStatusLabel={lineStatusLabel}
                        lineStatusColor={lineStatusColour}
                        lineStatusBg={lineStatusBg}
                        isLiveLines={isLiveLines}
                        linesUpdatedAt={linesUpdatedAt}
                        lineDelays={lineDelays}
                        trainFeedSource={trainFeedSource}
                        trainFeedUpdatedAt={trainFeedUpdatedAt}
                        trainFeedReason={trainFeedReason}
                        trainFeedCount={trainFeedCount}
                        showTrains={showTrains}
                        trainFilterMode={trainFilterMode}
                        visibleTrainLines={visibleTrainLines}
                        onToggleShowTrains={onToggleShowTrains}
                        onTrainFilterModeChange={onTrainFilterModeChange}
                        onToggleVisibleTrainLine={onToggleVisibleTrainLine}
                        showHeading={false}
                        isTouchLayout
                        showInteractionModeToggle
                        interactionMode={interactionMode}
                        onInteractionModeChange={onInteractionModeChange}
                    />
                </div>
            </div>
        </>
    );
}
