import { useState, useEffect } from "react";

/**
 * Prompts the user to start the guided map tour.
 *
 * The prompt auto-dismisses after a countdown or slides away when the user
 * starts/dismisses the tour manually.
 *
 * @param {Object} props - Guided tour prompt props.
 * @param {() => void} props.onStartTour - Starts the guided tour.
 * @param {() => void} props.onDismiss - Called when the prompt is dismissed.
 * @param {Object} props.COLORS - Theme tokens used for prompt styling.
 * @returns {JSX.Element | null} Guided tour prompt or null after dismissal.
 */
export function GuidedTourPrompt({ onStartTour, onDismiss, COLORS }) {
    const [isVisible, setIsVisible] = useState(true);
    const [countdown, setCountdown] = useState(30);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    useEffect(() => {
        if (!isVisible) return;

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    setIsAnimatingOut(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isVisible]);

    useEffect(() => {
        if (isAnimatingOut) {
            const timeout = setTimeout(() => {
                setIsVisible(false);
                onDismiss?.();
            }, 400); 
            return () => clearTimeout(timeout);
        }
    }, [isAnimatingOut, onDismiss]);

    if (!isVisible) {
        return null;
    }

    const handleYes = () => {
        setIsAnimatingOut(true);
        setTimeout(() => {
            onStartTour?.();
        }, 100);
    };

    const handleNo = () => {
        setIsAnimatingOut(true);
    };

    return (
        <>
            {/* Transparent backdrop reserves the tour prompt layer without blocking the map. */}
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0)",
                    zIndex: 900,
                    pointerEvents: "none",
                }}
            />

            {/* Prompt card */}
            <div
                style={{
                    position: "fixed",
                    bottom: 40,
                    left: "50%",
                    transform: isAnimatingOut
                        ? "translateX(-50%) translateY(150%)"
                        : "translateX(-50%) translateY(0)",
                    transition: "transform 0.4s ease-in-out",
                    backgroundColor: COLORS?.card || "rgba(15, 23, 42, 0.8)",
                    backdropFilter: "blur(10px)",
                    border: `1px solid ${COLORS?.border || "#1e3a5f"}`,
                    borderRadius: 16,
                    padding: "16px 20px",
                    boxShadow: COLORS?.shadow || "0 12px 36px rgba(0, 0, 0, 0.28)",
                    zIndex: 1100,
                    minWidth: 320,
                    maxWidth: "85vw",
                    pointerEvents: "auto",
                }}
            >
                {/* Prompt question */}
                <div
                    style={{
                        marginBottom: 14,
                        textAlign: "center",
                        fontSize: 14,
                        fontWeight: 500,
                        color: COLORS?.textStrong || "#e2e8f0",
                        fontFamily: "system-ui, -apple-system, sans-serif",
                    }}
                >
                    Would you like a guided tour?
                </div>

                {/* Prompt actions */}
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "center",
                    }}
                >
                    {/* Start tour */}
                    <button
                        onClick={handleYes}
                        style={{
                            padding: "8px 18px",
                            backgroundColor: COLORS?.accent || "#60a5fa",
                            color: COLORS?.textOnAccent || "#fff",
                            border: "none",
                            borderRadius: 10,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            outline: "none",
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.opacity = "0.9";
                            e.target.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.opacity = "1";
                            e.target.style.transform = "scale(1)";
                        }}
                    >
                        Yes
                    </button>

                    {/* Dismiss with countdown */}
                    <button
                        onClick={handleNo}
                        style={{
                            padding: "8px 18px",
                            backgroundColor: "transparent",
                            color: COLORS?.text || "#94a3ba",
                            border: `1px solid ${COLORS?.border || "#1e3a5f"}`,
                            borderRadius: 10,
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            outline: "none",
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.color = COLORS?.textStrong || "#e2e8f0";
                            e.target.style.borderColor = COLORS?.textStrong || "#e2e8f0";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.color = COLORS?.text || "#94a3ba";
                            e.target.style.borderColor = COLORS?.border || "#1e3a5f";
                        }}
                    >
                        No ({countdown}s)
                    </button>
                </div>
            </div>
        </>
    );
}
