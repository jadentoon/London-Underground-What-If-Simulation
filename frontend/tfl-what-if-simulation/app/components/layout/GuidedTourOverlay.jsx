/**
 * GuidedTourOverlay.jsx
 * 
 * Displays a step-by-step guided tour with boxes pointing to UI elements
 * and instructions for the user to complete tasks.
 */

import { useState, useEffect, useRef, useMemo } from "react";

export function GuidedTourOverlay({ onSkipTour, COLORS }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState(null);
    const [undimRect, setUndimRect] = useState(null);
    const [isSuccessFlashing, setIsSuccessFlashing] = useState(false);
    const hasAutoAdvancedRef = useRef(false);
    const hasUserInteractedRef = useRef(false);
    const hasScrolledToTargetRef = useRef(false);

    // tour steps configuration (memoized so it doesn't recreate every render)
    const steps = useMemo(
        () => [
            {
                id: "sidebar-toggle",
                title: "Sidebar",
                description: "Use this button to open the sidebar controls.",
                targetSelector: "button[aria-label='Toggle sidebar']",
                undimSelector: "[data-tour='sidebar']",
                completion: {
                    type: "attribute",
                    selector: "button[aria-label='Toggle sidebar']",
                    attribute: "aria-expanded",
                    equals: "true",
                    interaction: { type: "click", selector: "button[aria-label='Toggle sidebar']" },
                },
                boxNudgeX: 0,
                boxNudgeY: 0,
            },
            {
                id: "show-trains",
                title: "Train Display",
                description: "You can hide the train from the map using this button",
                targetSelector: "[data-tour='show-trains-toggle']",
                undimSelector: "[data-tour='sidebar']",
                completion: {
                    type: "attribute",
                    selector: "[data-tour='show-trains-toggle']",
                    attribute: "aria-pressed",
                    equals: "false",
                    interaction: { type: "click", selector: "[data-tour='show-trains-toggle']" },
                },
                afterComplete: {
                    type: "click",
                    selector: "[data-tour='show-trains-toggle']",
                    delayMs: 120,
                    waitFor: {
                        type: "attribute",
                        selector: "[data-tour='show-trains-toggle']",
                        attribute: "aria-pressed",
                        equals: "true",
                        timeoutMs: 1500,
                    },
                },
                advanceDelayMs: 650,
                boxNudgeX: 0,
                boxNudgeY: 0,
            },
            {
                id: "line-status",
                title: "Line Status",
                description: "Click a line to see more details.",
                targetSelector: "[data-tour='line-status-button']",
                undimSelector: "[data-tour='sidebar']",
                completion: {
                    type: "event",
                    selector: "[data-tour='line-status-button']",
                    event: "click",
                },
                afterComplete: {
                    type: "click",
                    selector: "button[aria-label='Toggle sidebar']",
                    delayMs: 650,
                    waitFor: {
                        type: "attribute",
                        selector: "button[aria-label='Toggle sidebar']",
                        attribute: "aria-expanded",
                        equals: "false",
                        timeoutMs: 2000,
                    },
                },
                scrollIntoView: true,
                boxNudgeX: 0,
                boxNudgeY: 0,
            },
            {
                id: "search-box",
                title: "Search",
                description: "Search for stations here.",
                targetSelector: "[data-tour='station-search-trigger']",
                undimSelector: "[data-tour='station-search-container']",
                completion: {
                    type: "event",
                    selector: "[data-tour='station-search-trigger']",
                    event: "click",
                },
                // once the user opens the search, collapse it again before moving on to What-If.
                //delay matches the success flash so the user sees the green confirmation.
                afterComplete: {
                    type: "click",
                    selector: "[data-tour='station-search-hide']",
                    delayMs: 650,
                },
                advanceDelayMs: 1100,
                boxNudgeX: 0,
                boxNudgeY: 0,
            },
            {
                id: "what-if-toggle",
                title: "What-If Mode",
                description: "Toggle What-If mode to start simulating closures.",
                targetSelector: "button[aria-label='Toggle What-If Mode']",
                undimSelector: "[data-tour='what-if-toggle-container']",
                completion: {
                    type: "attribute",
                    selector: "button[aria-label='Toggle What-If Mode']",
                    attribute: "aria-pressed",
                    equals: "true",
                    interaction: { type: "click", selector: "button[aria-label='Toggle What-If Mode']" },
                },
                boxNudgeX: 0,
                boxNudgeY: 0,
            },
            {
                id: "map-controls",
                title: "Map Controls",
                description: "Expand this box to see more information about how to interact with the map.",
                targetSelector: "[data-tour='map-controls-show-button']",
                undimSelector: "[data-tour='map-controls-box']",
                completion: {
                    type: "event",
                    selector: "[data-tour='map-controls-show-button']",
                    event: "click",
                },
                advanceDelayMs: 1500,
                boxNudgeX: 0,
                boxNudgeY: 0,
            },
            {
                id: "tour-complete",
                title: "Tour Complete!",
                description: "You've learned the basics. Explore the app to discover more features.",
                targetSelector: "[data-tour='map-controls-box']",
                undimSelector: "[data-tour='map-controls-box']",
                completion: {
                    type: "event",
                    selector: "body",
                    event: "keydown",
                },
                boxNudgeX: 0,
                boxNudgeY: 0,
            },
        ],
        []
    );

    const currentStepData = steps[currentStep];

    useEffect(() => {
        if (!currentStepData) return;

        setIsSuccessFlashing(false);
        hasAutoAdvancedRef.current = false;
        hasUserInteractedRef.current = false;
        hasScrolledToTargetRef.current = false;

        const updateTargetPosition = () => {
            const element = document.querySelector(currentStepData.targetSelector);
            if (element) {
                if (currentStepData.scrollIntoView && !hasScrolledToTargetRef.current) {
                    hasScrolledToTargetRef.current = true;
                    element.scrollIntoView?.({ block: "center", inline: "nearest", behavior: "smooth" });
                }
                const rect = element.getBoundingClientRect();
                setTargetRect(rect);
            }
        };

        const updateUndimRect = () => {
            if (!currentStepData.undimSelector) {
                setUndimRect(null);
                return;
            }
            const el = document.querySelector(currentStepData.undimSelector);
            if (!el) {
                setUndimRect(null);
                return;
            }
            const rect = el.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0 || rect.right <= 2) {
                setUndimRect(null);
                return;
            }
            setUndimRect(rect);
        };

        const isStepComplete = () => {
            const completion = currentStepData.completion;
            if (!completion) return false;

            //if the step defines an interaction (click/hover), require the user to do it before we consider the completion condition satisfied.
            if (completion.type !== "event" && completion.interaction && !hasUserInteractedRef.current) {
                return false;
            }

            if (completion.type === "attribute") {
                const el = document.querySelector(completion.selector);
                if (!el) return false;
                const value = el.getAttribute(completion.attribute);
                return value === completion.equals;
            }

            if (completion.type === "event") {
                return hasUserInteractedRef.current;
            }

            return false;
        };

        let pollId;
        let advanceTimeoutId;
        let flashTimeoutId;
        let afterCompleteTimeoutId;
        let afterCompletePollId;

        let interactionTarget;
        let interactionHandler;

        const maybeAdvance = () => {
            if (hasAutoAdvancedRef.current) return;
            if (!isStepComplete()) return;

            hasAutoAdvancedRef.current = true;
            setIsSuccessFlashing(true);

            const startMs = Date.now();
            const advanceDelayMs = currentStepData.advanceDelayMs ?? 650;
            const flashMs = currentStepData.flashMs ?? 650;
            const minAdvanceMs = Math.max(advanceDelayMs, flashMs);

            flashTimeoutId = window.setTimeout(() => {
                setIsSuccessFlashing(false);
            }, flashMs);

            const scheduleAdvance = () => {
                const elapsed = Date.now() - startMs;
                const remaining = Math.max(0, minAdvanceMs - elapsed);
                advanceTimeoutId = window.setTimeout(() => {
                    handleNextStep();
                }, remaining);
            };

            const afterComplete = currentStepData.afterComplete;
            if (!afterComplete) {
                scheduleAdvance();
                return;
            }

            if (afterComplete.type === "click") {
                afterCompleteTimeoutId = window.setTimeout(() => {
                    const el = document.querySelector(afterComplete.selector);
                    el?.click?.();
                }, afterComplete.delayMs ?? 0);
            }

            if (afterComplete.waitFor?.type === "attribute") {
                const waitFor = afterComplete.waitFor;
                const timeoutAt = Date.now() + (waitFor.timeoutMs ?? 1500);

                afterCompletePollId = window.setInterval(() => {
                    const el = document.querySelector(waitFor.selector);
                    const value = el?.getAttribute?.(waitFor.attribute);
                    if (value === waitFor.equals) {
                        window.clearInterval(afterCompletePollId);
                        afterCompletePollId = null;
                        scheduleAdvance();
                    } else if (Date.now() >= timeoutAt) {
                        window.clearInterval(afterCompletePollId);
                        afterCompletePollId = null;
                        scheduleAdvance();
                    }
                }, 80);

                return;
            }

            scheduleAdvance();
        };

        const attachInteractionListener = () => {
            const completion = currentStepData.completion;
            const interaction = completion?.interaction;

            const eventName = completion?.type === "event"
                ? completion.event
                : (interaction?.type === "click" ? "click" : null);
            const selector = completion?.type === "event"
                ? completion.selector
                : interaction?.selector;

            if (!eventName || !selector) return;
            interactionTarget = document.querySelector(selector);
            if (!interactionTarget) return;

            interactionHandler = () => {
                hasUserInteractedRef.current = true;
                window.setTimeout(() => {
                    updateTargetPosition();
                    updateUndimRect();
                    maybeAdvance();
                }, 50);
            };

            interactionTarget.addEventListener(eventName, interactionHandler, { passive: true });
        };

        updateTargetPosition();
        updateUndimRect();
        attachInteractionListener();
        pollId = window.setInterval(() => {
            updateTargetPosition();
            updateUndimRect();

            maybeAdvance();
        }, 150);

        window.addEventListener("resize", updateTargetPosition);
        window.addEventListener("resize", updateUndimRect);
        return () => {
            window.removeEventListener("resize", updateTargetPosition);
            window.removeEventListener("resize", updateUndimRect);
            if (pollId) window.clearInterval(pollId);
            if (advanceTimeoutId) window.clearTimeout(advanceTimeoutId);
            if (flashTimeoutId) window.clearTimeout(flashTimeoutId);
            if (afterCompleteTimeoutId) window.clearTimeout(afterCompleteTimeoutId);
            if (afterCompletePollId) window.clearInterval(afterCompletePollId);
            if (interactionTarget && interactionHandler) {
                const completion = currentStepData.completion;
                const interaction = completion?.interaction;
                const eventName = completion?.type === "event"
                    ? completion.event
                    : (interaction?.type === "click" ? "click" : null);
                if (eventName) interactionTarget.removeEventListener(eventName, interactionHandler);
            }
        };
    }, [currentStep, currentStepData]);

    const handleNextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onSkipTour?.();
        }
    };

    const handleSkip = () => {
        onSkipTour?.();
    };

    if (!currentStepData || !targetRect) {
        return null;
    }

    //box position calculations
    const boxWidth = 280;
    const boxHeight = 140;
    const boxNudgeX = currentStepData.boxNudgeX ?? 0;
    const boxNudgeY = currentStepData.boxNudgeY ?? 0;
    const flashMs = currentStepData.flashMs ?? 650;

    const rawLeft = window.innerWidth / 2 - boxWidth / 2 + boxNudgeX;
    const rawTop = window.innerHeight / 2 - boxHeight / 2 + boxNudgeY;
    const boxLeft = Math.max(20, Math.min(rawLeft, window.innerWidth - boxWidth - 20));
    const boxTop = Math.max(20, Math.min(rawTop, window.innerHeight - boxHeight - 20));

    //arrow position calculations
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    const boxCenterX = boxLeft + boxWidth / 2;
    const boxAnchorLeft = boxLeft - 8;
    const boxAnchorRight = boxLeft + boxWidth + 8;
    const arrowStartX = boxCenterX < targetCenterX ? boxAnchorRight : boxAnchorLeft;
    const arrowStartY = boxTop + 48;
    const arrowEndX = boxCenterX < targetCenterX ? (targetRect.left - 10) : (targetRect.right + 10);
    const arrowEndY = targetCenterY;
    const arrowCtrlX = (arrowStartX + arrowEndX) / 2;
    const arrowCtrlY = Math.max(12, Math.min(arrowStartY, arrowEndY) - 38);

    return (
        <>
            {/*dimming overlay */}
            {undimRect ? (
                <>
                    {/*dim left side */}
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: Math.max(0, undimRect.left),
                            bottom: 0,
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            zIndex: 1200,
                            pointerEvents: "none",
                        }}
                    />
                    {/*dim right side*/}
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: Math.max(0, undimRect.right),
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            zIndex: 1200,
                            pointerEvents: "none",
                        }}
                    />
                    {/*dim top side*/}
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: Math.max(0, undimRect.left),
                            right: Math.max(0, window.innerWidth - undimRect.right),
                            height: Math.max(0, undimRect.top),
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            zIndex: 1200,
                            pointerEvents: "none",
                        }}
                    />
                    {/*dim bottom side*/}
                    <div
                        style={{
                            position: "fixed",
                            top: Math.max(0, undimRect.bottom),
                            left: Math.max(0, undimRect.left),
                            right: Math.max(0, window.innerWidth - undimRect.right),
                            bottom: 0,
                            backgroundColor: "rgba(0, 0, 0, 0.5)",
                            zIndex: 1200,
                            pointerEvents: "none",
                        }}
                    />
                </>
            ) : (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        zIndex: 1200,
                        pointerEvents: "none",
                    }}
                />
            )}

            {/*highlight box around target element */}
            <div
                style={{
                    position: "fixed",
                    top: targetRect.top - 4,
                    left: targetRect.left - 4,
                    width: targetRect.width + 8,
                    height: targetRect.height + 8,
                    border: `2px solid ${COLORS?.accent || "#60a5fa"}`,
                    borderRadius: 8,
                    boxShadow: `0 0 0 4px ${COLORS?.accent || "#60a5fa"}40, 0 0 20px ${COLORS?.accent || "#60a5fa"}60`,
                    zIndex: 1201,
                    pointerEvents: "none",
                    animation: "pulse 2s ease-in-out infinite",
                }}
            />

            {/*instruction box */}
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
                {/*title */}
                <div
                    style={{
                        marginBottom: 8,
                        fontSize: 14,
                        fontWeight: 700,
                        color: COLORS?.textStrong || "#e2e8f0",
                    }}
                >
                    {currentStepData.title}
                </div>

                {/*description */}
                <div
                    style={{
                        marginBottom: 12,
                        fontSize: 12,
                        color: COLORS?.text || "#94a3ba",
                        lineHeight: 1.5,
                    }}
                >
                    {currentStepData.description}
                </div>

                {/*bttuons */}
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "flex-end",
                    }}
                >
                    <button
                        onClick={handleSkip}
                        style={{
                            padding: "6px 12px",
                            backgroundColor: currentStep === steps.length - 1 ? (COLORS?.accent || "#60a5fa") : "transparent",
                            color: currentStep === steps.length - 1 ? (COLORS?.textOnAccent || "#fff") : (COLORS?.text || "#94a3ba"),
                            border: currentStep === steps.length - 1 ? "none" : `1px solid ${COLORS?.border || "#1e3a5f"}`,
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            outline: "none",
                        }}
                        onMouseEnter={(e) => {
                            if (currentStep === steps.length - 1) {
                                e.target.style.opacity = "0.9";
                            } else {
                                e.target.style.color = COLORS?.textStrong || "#e2e8f0";
                                e.target.style.borderColor = COLORS?.textStrong || "#e2e8f0";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (currentStep === steps.length - 1) {
                                e.target.style.opacity = "1";
                            } else {
                                e.target.style.color = COLORS?.text || "#94a3ba";
                                e.target.style.borderColor = COLORS?.border || "#1e3a5f";
                            }
                        }}
                    >
                        {currentStep === steps.length - 1 ? "Done" : "Skip"}
                    </button>
                    {currentStep < steps.length - 1 && (
                        <button
                            onClick={handleNextStep}
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
                            onMouseEnter={(e) => {
                                e.target.style.opacity = "0.9";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.opacity = "1";
                            }}
                        >
                            Next
                        </button>
                    )}
                </div>
            </div>

            {/* Arrow from the box to the target */}
            <svg
                style={{
                    position: "fixed",
                    inset: 0,
                    width: "100vw",
                    height: "100vh",
                    zIndex: 1202,
                    pointerEvents: "none",
                }}
                viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
                preserveAspectRatio="none"
            >
                <defs>
                    <marker
                        id="guided-tour-arrowhead"
                        markerWidth="10"
                        markerHeight="10"
                        refX="8"
                        refY="5"
                        orient="auto"
                    >
                        <polygon
                            points="0 0, 10 5, 0 10"
                            fill={COLORS?.accent || "#60a5fa"}
                        />
                    </marker>
                </defs>

                <path
                    d={`M ${arrowStartX} ${arrowStartY} Q ${arrowCtrlX} ${arrowCtrlY} ${arrowEndX} ${arrowEndY}`}
                    stroke={COLORS?.accent || "#60a5fa"}
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    markerEnd="url(#guided-tour-arrowhead)"
                    opacity="0.95"
                    style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.35))" }}
                />
            </svg>

            <style jsx global>{`
                @keyframes pulse {
                    0%, 100% {
                        box-shadow: 0 0 0 4px ${COLORS?.accent || "#60a5fa"}40, 0 0 20px ${COLORS?.accent || "#60a5fa"}60;
                    }
                    50% {
                        box-shadow: 0 0 0 8px ${COLORS?.accent || "#60a5fa"}20, 0 0 30px ${COLORS?.accent || "#60a5fa"}80;
                    }
                }

                @keyframes tourSuccessFlash {
                    0% {
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    }
                    35% {
                        box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.35), 0 20px 60px rgba(0, 0, 0, 0.5);
                    }
                    100% {
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    }
                }
            `}</style>
        </>
    );
}