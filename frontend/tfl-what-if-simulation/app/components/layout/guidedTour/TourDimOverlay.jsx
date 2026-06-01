/*
 * TourDimOverlay.jsx
 * Renders the full-screen dimming overlay used by the guided tour.
 * If `undimRect` is provided, the overlay leaves a transparent "hole"
 * over that rectangle so the target element remains visible/highlighted.
 */
export function TourDimOverlay({ undimRect }) {
    if (undimRect) {
        return (
            <>
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
        );
    }

    return (
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
    );
}
