import { getDelaySeverityColor as getDelaySeverityColour } from "../mapShared/delayUtils";

/**
 * Single Underground line status row.
 * 
 * Displays closure or live delay status for one line. When live delay details
 * are available, the row can expand to show reason and additional information.
 * 
 * @param {Object} props
 * @param {Object} props.COLORS - Theme colour tokens for the control panel.
 * @param {{id: string, label: string, color: string}} props.line - Line displayed by this row.
 * @param {boolean} props.isClosed - Whether the line is fully closed.
 * @param {boolean} props.isPartlyClosed - Whether the line has partial closures.
 * @param {Object | undefined} props.delay - Live delay information for the line.
 * @param {boolean} props.showDelay - Whether live delay infromation should be displayed.
 * @param {string} props.statusLabel - Text shown on the right side of the row.
 * @param {string} props.statusColour - Colour used for the status label and indicator.
 * @param {string} props.buttonBackground - Background colour for the row container.
 * @param {boolean} props.isExpanded - Whether delay details are expanded.
 * @param {boolean} props.isLineButtonDisabled - Whether the row action is disabled.
 * @param {boolean} props.canToggleLine - Whether clicking toggles line closure state.
 * @param {boolean} props.canInspectDelay - Whether clicking inspects delay details.
 * @param {() => void} props.onMouseEnter - Called when the pointer enters the row.
 * @param {() => void} props.onMouseLeave - Called when the pointer leaves the row.
 * @param {() => void} props.onAction - Called when the row is clicked. 
 * @returns {JSX.Element}
 */
export function LineStatusItem({
    COLORS,
    line,
    isClosed,
    isPartlyClosed,
    delay,
    showDelay,
    statusLabel,
    statusColour,
    buttonBackground,
    isExpanded,
    isLineButtonDisabled,
    canToggleLine,
    canInspectDelay,
    onMouseEnter,
    onMouseLeave,
    onAction,
}) {
    return (
        <div
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                background: buttonBackground,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                color: COLORS.text,
                opacity: isClosed ? 0.6 : (isPartlyClosed ? 0.9 : 1),
                transition: "all 0.3s ease",
                overflow: "hidden",
            }}
        >
            <button
                onClick={onAction}
                disabled={isLineButtonDisabled}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "10px 12px",
                    background: "transparent",
                    border: "none",
                    color: COLORS.text,
                    cursor: isLineButtonDisabled
                        ? "default"
                        : canToggleLine || canInspectDelay 
                            ? "pointer" 
                            : "help",
                    transition: "background-color 0.2s ease",
                }}
            >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                        style={{
                            width: 14,
                            height: 14,
                            borderRadius: 999,
                            backgroundColor: line.color,
                            border: "1px solid #fff",
                            boxShadow: isClosed 
                                ? "none" 
                                : isPartlyClosed 
                                    ? "0 0 8px #f59e0b80" 
                                    : `0 0 8px ${line.color}80`,
                        }}
                    />
                    {line.label}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {showDelay && (
                        <span
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                backgroundColor: getDelaySeverityColour(delay.severity),
                                boxShadow: `0 0 6px ${getDelaySeverityColour(delay.severity)}`,
                            }}
                        />
                    )}
                    <span style={{ fontSize: 12, color: statusColour }}>
                        {statusLabel}
                    </span>
                </span>
            </button>

            {isExpanded && showDelay && (
                <div
                    style={{
                        padding: "0 12px 12px 12px",
                        fontSize: 12,
                        borderTop: `1px solid ${COLORS.border}`,
                        animation: "expandDown 0.3s ease",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginTop: 8,
                            marginBottom: 8,
                            paddingBottom: 8,
                            borderBottom: `1px solid ${COLORS.border}`,
                        }}
                    >
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                backgroundColor: getDelaySeverityColour(delay.severity),
                            }}
                        />
                        <span style={{ fontWeight: 700, color: getDelaySeverityColour(delay.severity) }}>
                            {delay.description}
                        </span>
                    </div>

                    {delay.reason && (
                        <div style={{ marginBottom: 8 }}>
                            <strong style={{ color: COLORS.text }}>Reason:</strong>
                            <div style={{ marginTop: 4, color: COLORS.textStrong }}>{delay.reason}</div>
                        </div>
                    )}

                    {delay.additionalInfo && (
                        <div>
                            <strong style={{ color: COLORS.text }}>Additional Info:</strong>
                            <div style={{ marginTop: 4, color: COLORS.textStrong }}>{delay.additionalInfo}</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}