export function getStationMarkerColours({
    isClosed = false,
    isHighlighted = false,
    isStart = false,
    isOnPath = false,
    isLightTheme = false,
} = {}) {
    const strokeColour = isClosed
        ? "#ef4444"
        : isHighlighted
        ? "#3b82f6"
        : isStart || isOnPath
        ? "#22c55e"
        : "#ffffff";

    const fillColour = isClosed
        ? "#7f1d1d"
        : isHighlighted
        ? "#1d4ed8"
        : isOnPath
        ? "#052e16"
        : "#000000";

    if (!isLightTheme) {
        return { strokeColour, fillColour };
    }

    return {
        strokeColour: fillColour,
        fillColour: strokeColour,
    };
}
