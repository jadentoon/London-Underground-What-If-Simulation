/**
 * Renders the guided-tour instruction card.
 *
 * The card is positioned by the tour controller and displays the current step
 * title, description and navigation controls. A success flash is shown when a
 * step is completed automatically.
 *
 * @param {Object} props - Instruction box props.
 * @param {number} props.boxTop - Fixed top position in pixels.
 * @param {number} props.boxLeft - Fixed left position in pixels.
 * @param {number} props.boxWidth - Fixed width in pixels.
 * @param {string} props.title - Current tour step title.
 * @param {string} props.description - Current tour step description.
 * @param {boolean} props.isSuccessFlashing - Whether the completion flash is active.
 * @param {number} props.flashMs - Flash animation duration in milliseconds.
 * @param {Object} props.COLORS - Theme tokens used for styling.
 * @param {number} props.currentStepIndex - Current zero-based step index.
 * @param {number} props.totalSteps - Total guided tour steps.
 * @param {() => void} props.onSkip - Skips or completes the tour.
 * @param {() => void} props.onNext - Moves to the next step.
 * @returns {JSX.Element} Guided-tour instruction card.
 */
export function TourInstructionBox({
    boxTop,
    boxLeft,
    boxWidth,
    title,
    description,
    isSuccessFlashing,
    flashMs,
    COLORS,
    currentStepIndex,
    totalSteps,
    onSkip,
    onNext,
}) {
    return (
        <>
            <div
                style={{
                    position: "fixed",
                    top: boxTop,
                    left: boxLeft,
                    width: boxWidth,
                    backgroundColor: COLORS?.card || "rgba(15, 23, 42, 0.95)",
                    backdropFilter: "blur(10px)",
                    border: `1px solid ${isSuccessFlashing ? "#22c55e" : (COLORS?.border || "#1e3a5f")}`,
                    borderRadius: 12,
                    padding: "16px",
                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
                    zIndex: 1202,
                    pointerEvents: "auto",
                    animation: isSuccessFlashing ? `tourSuccessFlash ${flashMs}ms ease` : undefined,
                }}
            >
                <div
                    style={{
                        marginBottom: 8,
                        fontSize: 14,
                        fontWeight: 700,
                        color: COLORS?.textStrong || "#e2e8f0",
                    }}
                >
                    {title}
                </div>

                <div
                    style={{
                        marginBottom: 12,
                        fontSize: 12,
                        color: COLORS?.text || "#94a3ba",
                        lineHeight: 1.5,
                    }}
                >
                    {description}
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "flex-end",
                    }}
                >
                    <button
                        onClick={onSkip}
                        style={{
                            padding: "6px 12px",
                            backgroundColor: currentStepIndex === totalSteps - 1 ? (COLORS?.accent || "#60a5fa") : "transparent",
                            color: currentStepIndex === totalSteps - 1 ? (COLORS?.textOnAccent || "#fff") : (COLORS?.text || "#94a3ba"),
                            border: currentStepIndex === totalSteps - 1 ? "none" : `1px solid ${COLORS?.border || "#1e3a5f"}`,
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            outline: "none",
                        }}
                    >
                        {currentStepIndex === totalSteps - 1 ? "Done" : "Skip"}
                    </button>
                    {currentStepIndex < totalSteps - 1 && (
                        <button
                            onClick={onNext}
                            style={{
                                padding: "6px 12px",
                                backgroundColor: COLORS?.accent || "#60a5fa",
                                color: COLORS?.textOnAccent || "#fff",
                                border: "none",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                outline: "none",
                            }}
                        >
                            Next
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
