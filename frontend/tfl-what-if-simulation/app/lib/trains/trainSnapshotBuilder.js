import { LINE_COLOURS } from "../../components/mapComponents/constants.js";
import { normaliseTflStopId, parseTimestampMs } from "./trainIdUtils.js";
import { chooseFromStop } from "./trainGraphUtils.js";
import {
    MAX_LIVE_ETA_SECONDS,
    MAX_LIVE_TRAINS,
    MAX_ROUTE_ETA_SECONDS,
    MIN_EDGE_TRAVEL_TIME_SECONDS,
    SNAPSHOT_CARRYOVER_MS,
} from "./trainMovementConstants.js";
import {
    estimateActiveStopRemainingSeconds,
    getEdgeTravelTime,
} from "./trainMovementTiming.js";
import { expandStopQueue } from "./trainRouteExpansion.js";

export function buildLiveSnapshots({
    arrivals,
    nowMs,
    nodeById,
    stationNameToId,
    directedTravelTimeByLine,
    inboundByLineTo,
    edgesByLine,
}) {
    const arrivalsByVehicle = new Map();

    for (const prediction of arrivals) {
        const lineId = String(prediction?.lineId || "");
        if (!LINE_COLOURS[lineId]) continue;

        const rawEta = Number(prediction?.timeToStation);
        const expectedArrival = prediction?.expectedArrival || "";
        const expectedArrivalMs = parseTimestampMs(expectedArrival);
        const expectedEta = Number.isFinite(expectedArrivalMs)
            ? (expectedArrivalMs - nowMs) / 1000
            : NaN;
        const eta = Number.isFinite(expectedEta) ? expectedEta : rawEta;
        if (!Number.isFinite(eta) || eta < -15 || eta > MAX_ROUTE_ETA_SECONDS) continue;

        const toId = normaliseTflStopId(
            prediction?.naptanId ||
            prediction?.stationNaptanId ||
            prediction?.nextStationNaptanId
        );
        if (!toId || !nodeById.has(toId)) continue;

        const vehicleToken = prediction?.vehicleId
            ? String(prediction.vehicleId)
            : `${toId}:${prediction?.platformName || ""}:${prediction?.towards || ""}`;
        const vehicleKey = `${lineId}|${vehicleToken}`;

        if (!arrivalsByVehicle.has(vehicleKey)) arrivalsByVehicle.set(vehicleKey, []);
        arrivalsByVehicle.get(vehicleKey).push({ prediction, eta, toId, lineId, vehicleKey });
    }

    const trainRoutes = Array.from(arrivalsByVehicle.values())
        .map((vehicleArrivals) => vehicleArrivals.sort((a, b) => a.eta - b.eta))
        .filter((vehicleArrivals) => vehicleArrivals.length > 0 && vehicleArrivals[0].eta <= MAX_LIVE_ETA_SECONDS)
        .sort((a, b) => a[0].eta - b[0].eta)
        .slice(0, MAX_LIVE_TRAINS);

    const snapshots = [];
    for (const vehicleArrivals of trainRoutes) {
        const firstArrival = vehicleArrivals[0];
        const { prediction, eta, toId, lineId, vehicleKey } = firstArrival;
        const fromId = chooseFromStop({
            prediction,
            etaSeconds: Math.max(0, eta),
            lineId,
            toId,
            directedTravelTimeByLine,
            inboundByLineTo,
            stationNameToId,
        });
        const resolvedFromId = fromId || toId;

        const stops = [];
        const seenStops = new Set();
        for (const item of vehicleArrivals) {
            if (seenStops.has(item.toId)) continue;
            seenStops.add(item.toId);

            stops.push({
                toId: item.toId,
                eta: Math.max(0, item.eta),
                expectedArrival: item.prediction?.expectedArrival || "",
                expectedArrivalMs: parseTimestampMs(item.prediction?.expectedArrival || ""),
                platformName: item.prediction?.platformName || "",
                currentLocation: item.prediction?.currentLocation || "",
                towards: item.prediction?.towards || item.prediction?.destinationName || "",
            });
        }

        const expandedStops = expandStopQueue({
            fromId: resolvedFromId,
            stops,
            lineId,
            nowMs,
            edgesByLine,
            directedTravelTimeByLine,
        });

        const firstStop = expandedStops[0] || stops[0];
        const edgeTravelTime = getEdgeTravelTime({
            lineId,
            fromId: resolvedFromId,
            toId: firstStop?.toId || toId,
            fallbackSeconds: eta + 20,
            directedTravelTimeByLine,
        });

        snapshots.push({
            id: vehicleKey,
            lineId,
            fromId: resolvedFromId,
            toId: firstStop?.toId || toId,
            eta: Math.max(0, eta),
            edgeTravelTime,
            stops: expandedStops,
            capturedAtMs: nowMs,
            platformName: prediction?.platformName || "",
            currentLocation: prediction?.currentLocation || "",
            towards: prediction?.towards || prediction?.destinationName || "",
            expectedArrival: prediction?.expectedArrival || "",
            expectedArrivalMs: parseTimestampMs(prediction?.expectedArrival || ""),
            vehicleId: prediction?.vehicleId ? String(prediction.vehicleId) : "",
            punctualityDeltaSeconds: 0,
        });
    }

    return snapshots;
}

export function mergeLiveSnapshots({
    previousSnapshots,
    nextSnapshots,
    nowMs,
    directedTravelTimeByLine,
}) {
    const previousById = new Map((previousSnapshots || []).map((snapshot) => [snapshot.id, snapshot]));
    const merged = [];

    for (const nextSnapshot of nextSnapshots) {
        const previous = previousById.get(nextSnapshot.id);
        if (!previous) {
            merged.push(nextSnapshot);
            continue;
        }

        const previousRemaining = estimateActiveStopRemainingSeconds(previous, nowMs);
        let nextRemaining = estimateActiveStopRemainingSeconds(nextSnapshot, nowMs);

        let stableFromId = nextSnapshot.fromId;
        let stableEdgeTravelTime = nextSnapshot.edgeTravelTime;
        if (previous.toId === nextSnapshot.toId && previous.fromId !== nextSnapshot.fromId) {
            const stableEdgeKey = `${nextSnapshot.lineId}|${previous.fromId}|${nextSnapshot.toId}`;
            const stableTravelTime = directedTravelTimeByLine.get(stableEdgeKey);
            if (Number.isFinite(stableTravelTime)) {
                stableFromId = previous.fromId;
                stableEdgeTravelTime = Math.max(MIN_EDGE_TRAVEL_TIME_SECONDS, stableTravelTime);
            }
        }

        // TfL updates can occasionally jump ETA upward between polls; cap large leaps so dots do not visibly rewind.
        if (previous.toId === nextSnapshot.toId && nextRemaining > previousRemaining + 45) {
            nextRemaining = previousRemaining + 45;
        }

        const punctualityDeltaSeconds = Math.round(nextRemaining - previousRemaining);
        merged.push({
            ...nextSnapshot,
            fromId: stableFromId,
            edgeTravelTime: stableEdgeTravelTime,
            stops: nextSnapshot.stops || [],
            eta: Math.max(0, nextRemaining),
            capturedAtMs: nowMs,
            punctualityDeltaSeconds,
        });
        previousById.delete(nextSnapshot.id);
    }

    for (const staleSnapshot of previousById.values()) {
        const ageMs = nowMs - Number(staleSnapshot.capturedAtMs || 0);
        const remaining = estimateActiveStopRemainingSeconds(staleSnapshot, nowMs);
        if (ageMs <= SNAPSHOT_CARRYOVER_MS && remaining > 0) {
            merged.push({
                ...staleSnapshot,
                eta: remaining,
                punctualityDeltaSeconds: 0,
            });
        }
    }

    return merged
        .sort((a, b) => estimateActiveStopRemainingSeconds(a, nowMs) - estimateActiveStopRemainingSeconds(b, nowMs))
        .slice(0, MAX_LIVE_TRAINS);
}
