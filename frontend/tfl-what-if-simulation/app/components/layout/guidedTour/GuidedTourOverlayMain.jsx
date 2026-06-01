/*
 * GuidedTourOverlayMain.jsx
 * Main guided-tour controller: orchestrates step progression, attaches
 * listeners to user interactions, computes target/box positions and composes
 * the presentational pieces (`TourDimOverlay`, `TourHighlight`,
 * `TourInstructionBox`). Import this from the thin wrapper `GuidedTourOverlay`.
 */
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { steps as defaultSteps } from "./tourSteps";
import { TourDimOverlay } from "./TourDimOverlay";
import { TourHighlight } from "./TourHighlight";
import { TourInstructionBox } from "./TourInstructionBox";

export function GuidedTourOverlayMain({ onSkipTour, COLORS }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState(null);
    const [undimRect, setUndimRect] = useState(null);
    const [isSuccessFlashing, setIsSuccessFlashing] = useState(false);
    const hasAutoAdvancedRef = useRef(false);
    const hasUserInteractedRef = useRef(false);
    const hasScrolledToTargetRef = useRef(false);

    const steps = useMemo(() => defaultSteps, []);
    const currentStepData = steps[currentStep];

    const handleNextStep = useCallback(() => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onSkipTour?.();
        }
    }, [currentStep, onSkipTour, steps.length]);

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
    }, [currentStepData, handleNextStep]);

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
            <TourDimOverlay undimRect={undimRect} COLORS={COLORS} />
            <TourHighlight targetRect={targetRect} COLORS={COLORS} />
            <TourInstructionBox
                boxTop={boxTop}
                boxLeft={boxLeft}
                boxWidth={boxWidth}
                boxHeight={boxHeight}
                title={currentStepData.title}
                description={currentStepData.description}
                isSuccessFlashing={isSuccessFlashing}
                flashMs={flashMs}
                COLORS={COLORS}
                currentStepIndex={currentStep}
                totalSteps={steps.length}
                onSkip={handleSkip}
                onNext={handleNextStep}
            />

            {currentStep !== steps.length - 1 && (
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
            )}

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

