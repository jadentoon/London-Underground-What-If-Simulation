import {
    MIN_EDGE_TRAVEL_TIME_SECONDS,
    PUNCTUALITY_THRESHOLD_SECONDS,
} from "./trainMovementConstants.js";

/**
 * Creates a stable numeric hash from a string.
 * 
 * Used to give fallback train animations deterministic phase offsets.
 * 
 * @param {string | number} input - Value to hash. 
 * @returns {number} - Positive integer hash.
 */
export function hashString(input) {
    let hash = 0;
    const text = String(input);
    for (let i = 0; i < text.length; i++) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

/**
 * Interpolates a latiude/longitude position between two station nodes.
 * 
 * @param {{ lat: number, lon: number }} fromNode - Starting station node.
 * @param {{ lat: number, lon: number }} toNode - Destination station node.
 * @param {number} progress - Movement progress to 0 to 1.
 * @returns {{ lat: number, lon: number }} - Interpolated map position.
 */
export function interpolatePosition(fromNode, toNode, progress) {
    const p = Math.max(0, Math.min(1, progress));
    return {
        lat: fromNode.lat + (toNode.lat - fromNode.lat) * p,
        lon: fromNode.lon + (toNode.lon - fromNode.lon) * p,
    };
}

/**
 * Formats an ETA in seconds into a compact display label.
 * 
 * @param {number} seconds - ETA in seconds. 
 * @returns {string} - Short ETA label, for example "45s" or "3m 20s".
 */
export function formatEtaShort(seconds) {
    const s = Math.max(0, Math.round(Number(seconds) || 0));
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return rem === 0 ? `${m}m` : `${m}m ${rem}s`;
}

/**
 * Estimates the remaining time for a train snapshot.
 * 
 * Uses the expected arrival timestamp when available, otherwise calculates
 * elapsed time from the snapshot capture time and original ETA.
 * 
 * @param {Object} snapshot - Live train snapshot.
 * @param {number} nowMs - Current time in epoch milliseconds.
 * @returns {number} - Remaining time in seconds.
 */
export function estimateRemainingSeconds(snapshot, nowMs) {
    if (!snapshot) return 0;

    if (Number.isFinite(snapshot.expectedArrivalMs)) {
        return Math.max(0, (snapshot.expectedArrivalMs - nowMs) / 1000);
    }

    const elapsedSeconds = Math.max(0, (nowMs - Number(snapshot.capturedAtMs || 0)) / 1000);
    return Math.max(0, Number(snapshot.eta || 0) - elapsedSeconds);
}

/**
 * Estimates remaining time for a specific stop in a train's stop queue.
 * 
 * @param {Object} stop - Stop prediction data. 
 * @param {number} nowMs - Current time in epoch milliseconds.
 * @param {number} capturedAtMs - Time the prediction was captured.
 * @returns {number} - Remaining time in seconds.
 */
export function estimateStopRemainingSeconds(stop, nowMs, capturedAtMs) {
    if (!stop) return 0;

    if (Number.isFinite(stop.expectedArrivalMs)) {
        return Math.max(0, (stop.expectedArrivalMs - nowMs) / 1000);
    }

    const elapsedSeconds = Math.max(0, (nowMs - Number(capturedAtMs || 0)) / 1000);
    return Math.max(0, Number(stop.eta || 0) - elapsedSeconds);
}

/**
 * Finds the first future stop in a snapshot and estimates its remaining time.
 * 
 * Falls back to the snapshot-level ETA if no active stop is found.
 * 
 * @param {Object} snapshot - Live train snapshot.
 * @param {number} nowMs - Current time in epoch milliseconds.
 * @returns {number} - Remaining time in seconds.
 */
export function estimateActiveStopRemainingSeconds(snapshot, nowMs) {
    const stops = Array.isArray(snapshot?.stops) ? snapshot.stops : [];
    for (const stop of stops) {
        const remaining = estimateStopRemainingSeconds(stop, nowMs, snapshot.capturedAtMs);
        if (remaining > 0) return remaining;
    }
    return estimateRemainingSeconds(snapshot, nowMs);
}

/**
 * Looks up the travel time for an edge, falling back to a minimum safe value.
 * 
 * @param {Object} params
 * @param {string} params.lineId - TfL line ID.
 * @param {string} params.fromId - Starting station ID.
 * @param {string} params.toId - Destination station ID.
 * @param {number} params.fallbackSeconds - Fallback travel time.
 * @param {Map<String, number>} params.directedTravelTimeByLine - Edge travel time lookup.
 * @returns {number} - Travel time in seconds.
 */
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

/**
 * Converts an ETA delta into a punctuality state and display label.
 * 
 * @param {number} deltaSeconds - Difference from the previous ETA in seconds. 
 * @returns {{ state: string, label: string }} - Punctuality state and label.
 */
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
