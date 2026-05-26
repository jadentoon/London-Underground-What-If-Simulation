/**
 * Summary panel for live line status and train feed health.
 * 
 * Shows the current line status source/update time, What-If guidance
 * and live train feed status. This component is presentational: the 
 * parent supplies already-derived labels, colours, timestamps and feed
 * metadata.
 * 
 * @param {Object} props
 * @param {Object} props.COLORS - Theme colour tokens for the control panel.
 * @param {boolean} props.hypotheticalSettingsEnabled - Whether What-If mode is currently active.
 * @param {string} props.lineStatusLabel - Text describing the current line status source.
 * @param {string} props.lineStatusColour - Colour used for the line status indicator.
 * @param {string} props.lineStatusBg - Background colour used for the line status block.
 * @param {boolean} props.isLiveLines - Whether live line status data is available.
 * @param {Date | null} props.linesUpdatedAt - Last time line status data was updated.
 * @param {"live" | string} props.trainFeedSource - Source currently used for train movement data.
 * @param {Date | string | number | null} props.trainFeedUpdatedAt - Last time train feed data was updated.
 * @param {string | null} props.trainFeedReason - Explanation shown when live train data is unavailable.
 * @param {number} props.trainFeedCount - Number of train markers currently visible. 
 * @returns {JSX.Element} 
 */
export function NetworkStatusSummary({
    COLORS,
    hypotheticalSettingsEnabled,
    lineStatusLabel,
    lineStatusColour,
    lineStatusBg,
    isLiveLines,
    linesUpdatedAt,
    trainFeedSource,
    trainFeedUpdatedAt,
    trainFeedReason,
    trainFeedCount,
}) {
    const isLiveTrainFeed = trainFeedSource === "live";
    const trainFeedColour = isLiveTrainFeed ? "#22c55e" : "#f59e0b";
    const trainFeedBg = isLiveTrainFeed ? "rgba(34, 197, 94, 0.12)" : "rgba(245, 158, 11, 0.12)";
    const trainFeedLabel = isLiveTrainFeed ? "Live TfL arrivals" : "Schedule fallback";
    const showFeedStatusBlocks = !hypotheticalSettingsEnabled;

    return (
        <>
            <h3 style={{ margin: "0 0 4px", color: COLORS.text }}>Lines</h3>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 8px",
                    borderRadius: 8,
                    background: lineStatusBg,
                    color: lineStatusColour,
                    fontSize: 12,
                }}
            >
                <span
                    style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: lineStatusColour,
                        boxShadow: `0 0 8px ${lineStatusColour}80`,
                    }}
                />
                <span>
                    {lineStatusLabel}
                    {isLiveLines && linesUpdatedAt ? ` · ${linesUpdatedAt.toLocaleTimeString()}` : ""}
                </span>
            </div>

            {hypotheticalSettingsEnabled && (
                <div
                    style={{
                        marginTop: -2,
                        fontSize: 12,
                        lineHeight: 1.45,
                        color: COLORS.textMuted,
                    }}
                >
                    Use the line list below to close or reopen lines from the sidebar.
                </div>
            )}

            {showFeedStatusBlocks && (
                <>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 8px",
                            borderRadius: 8,
                            background: trainFeedBg,
                            color: trainFeedColour,
                            fontSize: 12,
                        }}
                    >
                        <span
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: 999,
                                background: trainFeedColour,
                                boxShadow: `0 0 8px ${trainFeedColour}80`,
                            }}
                        />
                        <span>
                            {`Train feed: ${trainFeedLabel}`}
                            {trainFeedCount > 0 ? ` · ${trainFeedCount} trains visible right now` : ""}
                            {trainFeedUpdatedAt ? ` · ${new Date(trainFeedUpdatedAt).toLocaleTimeString()}` : ""}
                        </span>
                    </div>

                    {!isLiveTrainFeed && trainFeedReason && (
                        <div
                            style={{
                                marginTop: -2,
                                padding: "6px 8px",
                                borderRadius: 8,
                                border: `1px solid ${COLORS.border}`,
                                color: COLORS.textMuted,
                                fontSize: 11,
                                lineHeight: 1.35,
                                background: COLORS.subtle,
                            }}
                        >
                            {trainFeedReason}
                        </div>
                    )}
                </>
            )}
        </>
    );
}