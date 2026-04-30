import {
    MIN_EDGE_TRAVEL_TIME_SECONDS,
    PUNCTUALITY_THRESHOLD_SECONDS,
} from "./trainMovementConstants.js";

export function hashString(input) {
    let hash = 0;
    const text = String(input);
    for (let i = 0; i < text.length; i++) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

export function interpolatePosition(fromNode, toNode, progress) {
    const p = Math.max(0, Math.min(1, progress));
    return {
        lat: fromNode.lat + (toNode.lat - fromNode.lat) * p,
        lon: fromNode.lon + (toNode.lon - fromNode.lon) * p,
    };
}

export function formatEtaShort(seconds) {
    const s = Math.max(0, Math.round(Number(seconds) || 0));
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return rem === 0 ? `${m}m` : `${m}m ${rem}s`;
}

export function estimateRemainingSeconds(snapshot, nowMs) {
    if (!snapshot) return 0;

    if (Number.isFinite(snapshot.expectedArrivalMs)) {
        return Math.max(0, (snapshot.expectedArrivalMs - nowMs) / 1000);
    }

    const elapsedSeconds = Math.max(0, (nowMs - Number(snapshot.capturedAtMs || 0)) / 1000);
    return Math.max(0, Number(snapshot.eta || 0) - elapsedSeconds);
}

export function estimateStopRemainingSeconds(stop, nowMs, capturedAtMs) {
    if (!stop) return 0;

    if (Number.isFinite(stop.expectedArrivalMs)) {
        return Math.max(0, (stop.expectedArrivalMs - nowMs) / 1000);
    }

    const elapsedSeconds = Math.max(0, (nowMs - Number(capturedAtMs || 0)) / 1000);
    return Math.max(0, Number(stop.eta || 0) - elapsedSeconds);
}

export function estimateActiveStopRemainingSeconds(snapshot, nowMs) {
    const stops = Array.isArray(snapshot?.stops) ? snapshot.stops : [];
    for (const stop of stops) {
        const remaining = estimateStopRemainingSeconds(stop, nowMs, snapshot.capturedAtMs);
        if (remaining > 0) return remaining;
    }
    return estimateRemainingSeconds(snapshot, nowMs);
}

export function getEdgeTravelTime({
    lineId,
    fromId,
    toId,
    fallbackSeconds,
    directedTravelTimeByLine,
}) {
    const travelTime = directedTravelTimeByLine.get(`${lineId}|${fromId}|${toId}`);
    return Math.max(
        MIN_EDGE_TRAVEL_TIME_SECONDS,
        Number.isFinite(travelTime) ? travelTime : fallbackSeconds
    );
}

export function getPunctuality(deltaSeconds) {
    const delta = Number(deltaSeconds) || 0;
    if (delta > PUNCTUALITY_THRESHOLD_SECONDS) {
        return {
            state: "late",
            label: `Late by ${formatEtaShort(delta)}`,
        };
    }
    if (delta < -PUNCTUALITY_THRESHOLD_SECONDS) {
        return {
            state: "early",
            label: `Early by ${formatEtaShort(Math.abs(delta))}`,
        };
    }
    return {
        state: "on-time",
        label: "On time",
    };
}
