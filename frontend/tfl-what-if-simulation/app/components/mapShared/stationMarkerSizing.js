import { ZOOM_LEVELS } from "./constants.js";

function clampStationZoom(zoomLevel) {
    return Math.min(16, Math.max(12, Number.isFinite(zoomLevel) ? zoomLevel : 14));
}

function getBaseRadiusForZoom(zoomLevel) {
    const clampedZoom = clampStationZoom(zoomLevel);
    const lowerZoom = Math.floor(clampedZoom);
    const upperZoom = Math.ceil(clampedZoom);
    const lowerRadius = ZOOM_LEVELS[lowerZoom] ?? 9;
    const upperRadius = ZOOM_LEVELS[upperZoom] ?? lowerRadius;
    const progress = clampedZoom - lowerZoom;

    return lowerRadius + ((upperRadius - lowerRadius) * progress);
}

export function getStationMarkerRadius({
    zoomLevel,
    isHighlighted = false,
    isStart = false,
    isOnPath = false,
}) {
    const baseRadius = getBaseRadiusForZoom(zoomLevel);

    if (isHighlighted) return baseRadius + 4;
    if (isStart) return baseRadius + 2;
    if (isOnPath) return baseRadius + 1;

    return baseRadius;
}

export function getStationMarkerStrokeWeight({
    isHighlighted = false,
    isStart = false,
    isOnPath = false,
    isClosed = false,
    isLightTheme = false,
}) {
    let strokeWeight = 2;

    if (isHighlighted) {
        strokeWeight = 5;
    } else if (isStart || isOnPath || isClosed) {
        strokeWeight = 3;
    }

    if (isLightTheme && !isHighlighted && !isClosed && !isOnPath) {
        return strokeWeight + 1;
    }

    return strokeWeight;
}

export function getStationOcclusionRadius(options) {
    return getStationMarkerRadius(options) + (getStationMarkerStrokeWeight(options) / 2);
}
