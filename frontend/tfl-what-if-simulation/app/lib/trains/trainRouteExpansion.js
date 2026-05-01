import { MIN_EDGE_TRAVEL_TIME_SECONDS } from "./trainMovementConstants.js";
import { getEdgeTravelTime } from "./trainMovementTiming.js";

/**
 * Finds the shortest path between two stations on a specific line.
 * 
 * Uses edge travel time as the path cost and treats line edges as bidirectional.
 * 
 * @param {string} lineId - TfL line ID.
 * @param {string} fromId - Starting station ID.
 * @param {string} toId - Destination station ID.
 * @param {Map<string, Array<Object>>} edgesByLine - Edges grouped by line.
 * @returns {Array<string>} - Ordered station IDs from start to destination.
 */
export function findLinePath(lineId, fromId, toId, edgesByLine) {
    const start = String(fromId || "");
    const target = String(toId || "");
    if (!start || !target) return [];
    if (start === target) return [start];

    const lineEdges = edgesByLine.get(String(lineId)) || [];
    const adjacency = new Map();

    for (const edge of lineEdges) {
        const from = String(edge.from);
        const to = String(edge.to);
        const travelTime = Math.max(MIN_EDGE_TRAVEL_TIME_SECONDS, Number(edge.travelTime) || MIN_EDGE_TRAVEL_TIME_SECONDS);

        if (!adjacency.has(from)) adjacency.set(from, []);
        if (!adjacency.has(to)) adjacency.set(to, []);
        adjacency.get(from).push({ to, travelTime });
        adjacency.get(to).push({ to: from, travelTime });
    }

    const distances = new Map([[start, 0]]);
    const previous = new Map();
    const queue = [{ id: start, distance: 0 }];

    while (queue.length > 0) {
        queue.sort((a, b) => a.distance - b.distance);
        const current = queue.shift();
        if (!current || current.distance !== distances.get(current.id)) continue;
        if (current.id === target) break;

        for (const neighbour of adjacency.get(current.id) || []) {
            const nextDistance = current.distance + neighbour.travelTime;
            if (nextDistance >= (distances.get(neighbour.to) ?? Infinity)) continue;

            distances.set(neighbour.to, nextDistance);
            previous.set(neighbour.to, current.id);
            queue.push({ id: neighbour.to, distance: nextDistance });
        }
    }

    if (!distances.has(target)) return [];

    const path = [];
    let cursor = target;
    while (cursor) {
        path.unshift(cursor);
        if (cursor === start) break;
        cursor = previous.get(cursor);
    }

    return path[0] === start ? path : [];
}

/**
 * Expands a train's stop queue by inserting estimated intermediate stations.
 * 
 * This makes live train movement smoother when TfL predictions skip stations
 * between the train's current location and a later predicted stop.
 * 
 * @param {Object} params
 * @param {string} params.fromId - Current or inferred starting station ID.
 * @param {Array<Object>} params.stops - Predicted upcoming stops.
 * @param {string} params.lineId - TfL line ID.
 * @param {number} params.nowMs - Current time in epoch milliseconds.
 * @param {Map<string, Array<Object>>} params.edgesByLine - Edges grouped by line.
 * @param {Map<string, number>} params.directedTravelTimeByLine - Edge travel time lookup. 
 * @returns {Array<Object>} - Stop queue including estimated stops.
 */
export function expandStopQueue({
    fromId,
    stops,
    lineId,
    nowMs,
    edgesByLine,
    directedTravelTimeByLine,
}) {
    const expanded = [];
    let currentId = String(fromId || "");
    let currentEta = 0;
    let currentArrivalMs = nowMs;

    for (const stop of stops) {
        const targetId = String(stop.toId || "");
        if (!targetId || !currentId || targetId === currentId) {
            expanded.push(stop);
            currentId = targetId || currentId;
            currentEta = Number(stop.eta) || currentEta;
            currentArrivalMs = Number.isFinite(stop.expectedArrivalMs)
                ? stop.expectedArrivalMs
                : nowMs + currentEta * 1000;
            continue;
        }

        const path = findLinePath(lineId, currentId, targetId, edgesByLine);
        if (path.length <= 2) {
            expanded.push(stop);
            currentId = targetId;
            currentEta = Number(stop.eta) || currentEta;
            currentArrivalMs = Number.isFinite(stop.expectedArrivalMs)
                ? stop.expectedArrivalMs
                : nowMs + currentEta * 1000;
            continue;
        }

        const segmentTravelTimes = [];
        for (let i = 1; i < path.length; i++) {
            segmentTravelTimes.push(getEdgeTravelTime({
                lineId,
                fromId: path[i - 1],
                toId: path[i],
                fallbackSeconds: MIN_EDGE_TRAVEL_TIME_SECONDS,
                directedTravelTimeByLine,
            }));
        }

        const totalTravelTime = segmentTravelTimes.reduce((sum, travelTime) => sum + travelTime, 0);
        const targetEta = Number(stop.eta) || currentEta;
        const targetArrivalMs = Number.isFinite(stop.expectedArrivalMs)
            ? stop.expectedArrivalMs
            : nowMs + targetEta * 1000;

        let elapsedTravelTime = 0;
        for (let i = 1; i < path.length - 1; i++) {
            elapsedTravelTime += segmentTravelTimes[i - 1];
            const ratio = totalTravelTime > 0 ? elapsedTravelTime / totalTravelTime : 1;
            const eta = currentEta + (targetEta - currentEta) * ratio;
            const expectedArrivalMs = currentArrivalMs + (targetArrivalMs - currentArrivalMs) * ratio;

            expanded.push({
                ...stop,
                toId: path[i],
                eta,
                expectedArrival: "",
                expectedArrivalMs,
                platformName: "",
                currentLocation: "",
                isEstimatedSegment: true,
            });
        }

        expanded.push(stop);
        currentId = targetId;
        currentEta = targetEta;
        currentArrivalMs = targetArrivalMs;
    }

    return expanded;
}
