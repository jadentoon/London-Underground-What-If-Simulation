import { LINE_COLOURS, LINE_LABELS } from "../../components/mapShared/constants.js";
import {
    FALLBACK_TRAINS_PER_LINE,
    MIN_EDGE_TRAVEL_TIME_SECONDS,
} from "./trainMovementConstants.js";
import {
    estimateStopRemainingSeconds,
    formatEtaShort,
    getPunctuality,
    hashString,
    interpolatePosition,
} from "./trainMovementTiming.js";

/**
 * Builds deterministic fallback train templates from graph edges.
 * 
 * These templates are used when live TfL arrivals are unavailable, allowing the
 * map to continue showing simulated train movement.
 * 
 * @param {Map<string, Array<Object>>} edgesByLine - Edges grouped by line. 
 * @returns {Array<Object>} - Fallback train animation templates.
 */
export function buildFallbackTemplates(edgesByLine) {
    const templates = [];

    for (const [lineId, lineEdges] of edgesByLine.entries()) {
        if (!LINE_COLOURS[lineId] || lineEdges.length === 0) continue;

        const step = Math.max(1, Math.floor(lineEdges.length / FALLBACK_TRAINS_PER_LINE));
        let added = 0;

        for (let i = 0; i < lineEdges.length && added < FALLBACK_TRAINS_PER_LINE; i += step) {
            const edge = lineEdges[i];
            const travelTime = Math.max(MIN_EDGE_TRAVEL_TIME_SECONDS, Number(edge.travelTime) || MIN_EDGE_TRAVEL_TIME_SECONDS);
            templates.push({
                id: `fallback-${lineId}-${edge.from}-${edge.to}`,
                lineId,
                fromId: edge.from,
                toId: edge.to,
                travelTime,
                phase: hashString(`${lineId}|${edge.from}|${edge.to}`) % (travelTime * 2),
            });
            added += 1;
        }
    }

    return templates;
}

/**
 * Converts live train snapshots into map marker positions.
 * 
 * Determines each train's active stop, interpolates its current map position
 * and attaches display metadata for labels, ETA, route and punctuality.
 * 
 * @param {Array<Object>} snapshots - Live train snapshots. 
 * @param {number} nowMs - Current time in epoch milliseconds.
 * @param {Map<string, Object>} nodeById - Station lookup by ID.
 * @returns {Array<Object>} - Train marker objects for rendering.
 */
export function buildLiveTrainPositions(snapshots, nowMs, nodeById) {
    const trains = [];
    for (const snapshot of snapshots) {
        const stops = Array.isArray(snapshot.stops) && snapshot.stops.length > 0
            ? snapshot.stops
            : [{
                toId: snapshot.toId,
                eta: snapshot.eta,
                expectedArrival: snapshot.expectedArrival,
                expectedArrivalMs: snapshot.expectedArrivalMs,
                platformName: snapshot.platformName,
                currentLocation: snapshot.currentLocation,
                towards: snapshot.towards,
            }];

        let activeStopIndex = stops.findIndex(
            (stop) => estimateStopRemainingSeconds(stop, nowMs, snapshot.capturedAtMs) > 0
        );
        if (activeStopIndex === -1) activeStopIndex = stops.length - 1;

        const activeStop = stops[activeStopIndex];
        const previousStop = activeStopIndex > 0 ? stops[activeStopIndex - 1] : null;
        const activeFromId = previousStop?.toId || snapshot.fromId;
        const activeToId = activeStop?.toId || snapshot.toId;

        const fromNode = nodeById.get(activeFromId);
        const toNode = nodeById.get(activeToId);
        if (!fromNode || !toNode) continue;

        const remainingToStation = estimateStopRemainingSeconds(activeStop, nowMs, snapshot.capturedAtMs);
        const previousArrivalMs = previousStop?.expectedArrivalMs;
        const activeArrivalMs = activeStop?.expectedArrivalMs;
        const queuedTravelTime = Number.isFinite(previousArrivalMs) && Number.isFinite(activeArrivalMs)
            ? Math.max(MIN_EDGE_TRAVEL_TIME_SECONDS, (activeArrivalMs - previousArrivalMs) / 1000)
            : snapshot.edgeTravelTime;
        const edgeTravelTime = activeStopIndex === 0 ? snapshot.edgeTravelTime : queuedTravelTime;
        const progress = activeFromId === activeToId
            ? 1
            : (1 - (remainingToStation / edgeTravelTime));

        const position = interpolatePosition(fromNode, toNode, progress);
        const etaLabel = formatEtaShort(remainingToStation);
        const punctuality = getPunctuality(snapshot.punctualityDeltaSeconds);
        const locationLabel = activeStop.isEstimatedSegment || activeStopIndex > 0
            ? `Estimated between ${fromNode.name} and ${toNode.name}`
            : (snapshot.currentLocation || activeStop.currentLocation || "");
        trains.push({
            id: snapshot.id,
            lineId: snapshot.lineId,
            lat: position.lat,
            lon: position.lon,
            isLive: true,
            label: LINE_LABELS[snapshot.lineId] || snapshot.lineId,
            routeLabel: `${fromNode.name} → ${toNode.name}`,
            fromName: fromNode.name,
            toName: toNode.name,
            etaSeconds: Math.round(remainingToStation),
            etaLabel,
            nextArrivalTime: activeStop.expectedArrival || snapshot.expectedArrival || "",
            towards: activeStop.towards || snapshot.towards || "",
            platformName: activeStop.platformName || snapshot.platformName || "",
            currentLocation: locationLabel,
            vehicleId: snapshot.vehicleId || "",
            punctualityState: punctuality.state,
            punctualityLabel: punctuality.label,
        });
    }
    return trains;
}

/**
 * Converts fallback train templates into simulated map marker positions.
 * 
 * Animates trains back and forth along selected edges using deterministic phase
 * offsets so fallback movement appears stable between renders.
 * 
 * @param {Array<Object>} templates - Fallback train templates.
 * @param {number} nowMs - Current time in epoch milliseconds.
 * @param {Map<string, Object>} nodeById - Station lookup by ID.
 * @returns {Array<Object>} - Simulated train marker objects for rendering.
 */
export function buildFallbackTrainPositions(templates, nowMs, nodeById) {
    const nowSeconds = nowMs / 1000;
    const trains = [];

    for (const template of templates) {
        const fromNode = nodeById.get(template.fromId);
        const toNode = nodeById.get(template.toId);
        if (!fromNode || !toNode) continue;

        const fullCycle = template.travelTime * 2;
        const cycleProgress = ((nowSeconds + template.phase) % fullCycle) / template.travelTime;
        const isForward = cycleProgress <= 1;
        const progress = isForward ? cycleProgress : (2 - cycleProgress);
        const activeFromNode = isForward ? fromNode : toNode;
        const activeToNode = isForward ? toNode : fromNode;
        const etaSeconds = isForward
            ? Math.max(0, Math.round((1 - progress) * template.travelTime))
            : Math.max(0, Math.round(progress * template.travelTime));

        const position = interpolatePosition(fromNode, toNode, progress);
        trains.push({
            id: template.id,
            lineId: template.lineId,
            lat: position.lat,
            lon: position.lon,
            isLive: false,
            label: LINE_LABELS[template.lineId] || template.lineId,
            routeLabel: `${activeFromNode.name} → ${activeToNode.name}`,
            fromName: activeFromNode.name,
            toName: activeToNode.name,
            etaSeconds,
            etaLabel: formatEtaShort(etaSeconds),
            nextArrivalTime: "",
            towards: activeToNode.name,
            platformName: "",
            currentLocation: "Simulated fallback movement",
            vehicleId: template.id,
            punctualityState: "scheduled",
            punctualityLabel: "Schedule estimate",
        });
    }

    return trains;
}
