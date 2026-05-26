/**
 * GuidedTourPrompt.jsx
 * 
 * A modal prompt that appears at the botttom center of the screen asking if the user
 * would like a guided tour. With a yes button and a no buttom which has a countdown timer
 * that auto-dismisses after 30 seconds.
 */

import { useState, useEffect } from "react";

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

    //handle animation completion and removal
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
            {/*overlay and backdrop  */}
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

            {/*prompt box */}
            <div
                style={{
                    position: "fixed",
                    bottom: 40,
                    left: "50%",
                    transform: isAnimatingOut
                        ? "translateX(-50%) translateY(150%)"
                        : "translateX(-50%) translateY(0)",
                    transition: "transform 0.4s ease-in-out",
                    backgroundColor: COLORS?.card || "rgba(15, 23, 42, 0.95)",
                    border: `1px solid ${COLORS?.border || "#1e3a5f"}`,
                    borderRadius: 12,
                    padding: "16px 20px",
                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
                    zIndex: 1100,
                    minWidth: 320,
                    maxWidth: "85vw",
                    pointerEvents: "auto",
                }}
            >
                {/*Question*/}
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

                {/*container */}
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        justifyContent: "center",
                    }}
                >
                    {/*yes button */}
                    <button
                        onClick={handleYes}
                        style={{
                            padding: "8px 18px",
                            backgroundColor: COLORS?.accent || "#60a5fa",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
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

                    {/*no button with countdown */}
                    <button
                        onClick={handleNo}
                        style={{
                            padding: "8px 18px",
                            backgroundColor: "transparent",
                            color: COLORS?.text || "#94a3ba",
                            border: `1.5px solid ${COLORS?.border || "#1e3a5f"}`,
                            borderRadius: 6,
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
