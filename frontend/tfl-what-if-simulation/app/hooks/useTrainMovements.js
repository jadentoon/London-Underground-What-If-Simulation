'use client';

import { useEffect, useMemo, useState } from "react";
import { LINE_COLOURS, LINE_LABELS } from "../components/mapComponents/constants";
import { normaliseTflStopId, parseTimestampMs} from "../lib/trains/trainIdUtils.js";
import { buildStationNameIndex, buildEdgeIndexes, chooseFromStop } from "../lib/trains/trainGraphUtils.js"

const LIVE_REFRESH_MS = 15_000;
const ANIMATION_TICK_MS = 250;
const MAX_LIVE_ETA_SECONDS = 480;
const MAX_LIVE_TRAINS = 260;
const FALLBACK_TRAINS_PER_LINE = 5;
const MIN_EDGE_TRAVEL_TIME_SECONDS = 60;
const SNAPSHOT_CARRYOVER_MS = 180_000;
const PUNCTUALITY_THRESHOLD_SECONDS = 20;


function hashString(input) {
    let hash = 0;
    const text = String(input);
    for (let i = 0; i < text.length; i++) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function interpolatePosition(fromNode, toNode, progress) {
    const p = Math.max(0, Math.min(1, progress));
    return {
        lat: fromNode.lat + (toNode.lat - fromNode.lat) * p,
        lon: fromNode.lon + (toNode.lon - fromNode.lon) * p,
    };
}

function formatEtaShort(seconds) {
    const s = Math.max(0, Math.round(Number(seconds) || 0));
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return rem === 0 ? `${m}m` : `${m}m ${rem}s`;
}

function estimateRemainingSeconds(snapshot, nowMs) {
    if (!snapshot) return 0;

    if (Number.isFinite(snapshot.expectedArrivalMs)) {
        return Math.max(0, (snapshot.expectedArrivalMs - nowMs) / 1000);
    }

    const elapsedSeconds = Math.max(0, (nowMs - Number(snapshot.capturedAtMs || 0)) / 1000);
    return Math.max(0, Number(snapshot.eta || 0) - elapsedSeconds);
}

function getPunctuality(deltaSeconds) {
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

function buildFallbackTemplates(edgesByLine) {
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

function buildLiveSnapshots({
    arrivals,
    nowMs,
    nodeById,
    stationNameToId,
    directedTravelTimeByLine,
    inboundByLineTo,
}) {
    const closestByVehicle = new Map();

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
        if (!Number.isFinite(eta) || eta < -15 || eta > MAX_LIVE_ETA_SECONDS) continue;

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

        const existing = closestByVehicle.get(vehicleKey);
        if (!existing || eta < existing.eta) {
            closestByVehicle.set(vehicleKey, { prediction, eta, toId, lineId, vehicleKey });
        }
    }

    const closestArrivals = Array.from(closestByVehicle.values())
        .sort((a, b) => a.eta - b.eta)
        .slice(0, MAX_LIVE_TRAINS);

    const snapshots = [];
    for (const item of closestArrivals) {
        const { prediction, eta, toId, lineId, vehicleKey } = item;
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

        const travelTime = resolvedFromId
            ? directedTravelTimeByLine.get(`${lineId}|${resolvedFromId}|${toId}`)
            : null;
        const edgeTravelTime = Math.max(
            MIN_EDGE_TRAVEL_TIME_SECONDS,
            Number.isFinite(travelTime) ? travelTime : (eta + 20)
        );

        snapshots.push({
            id: vehicleKey,
            lineId,
            fromId: resolvedFromId,
            toId,
            eta: Math.max(0, eta),
            edgeTravelTime,
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

function mergeLiveSnapshots({
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

        const previousRemaining = estimateRemainingSeconds(previous, nowMs);
        let nextRemaining = estimateRemainingSeconds(nextSnapshot, nowMs);

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
            eta: Math.max(0, nextRemaining),
            capturedAtMs: nowMs,
            punctualityDeltaSeconds,
        });
        previousById.delete(nextSnapshot.id);
    }

    for (const staleSnapshot of previousById.values()) {
        const ageMs = nowMs - Number(staleSnapshot.capturedAtMs || 0);
        const remaining = estimateRemainingSeconds(staleSnapshot, nowMs);
        if (ageMs <= SNAPSHOT_CARRYOVER_MS && remaining > 0) {
            merged.push({
                ...staleSnapshot,
                eta: remaining,
                punctualityDeltaSeconds: 0,
            });
        }
    }

    return merged
        .sort((a, b) => estimateRemainingSeconds(a, nowMs) - estimateRemainingSeconds(b, nowMs))
        .slice(0, MAX_LIVE_TRAINS);
}

function buildLiveTrainPositions(snapshots, nowMs, nodeById) {
    const trains = [];
    for (const snapshot of snapshots) {
        const fromNode = nodeById.get(snapshot.fromId);
        const toNode = nodeById.get(snapshot.toId);
        if (!fromNode || !toNode) continue;

        const remainingToStation = estimateRemainingSeconds(snapshot, nowMs);
        const progress = snapshot.fromId === snapshot.toId
            ? 1
            : (1 - (remainingToStation / snapshot.edgeTravelTime));

        const position = interpolatePosition(fromNode, toNode, progress);
        const etaLabel = formatEtaShort(remainingToStation);
        const punctuality = getPunctuality(snapshot.punctualityDeltaSeconds);
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
            nextArrivalTime: snapshot.expectedArrival || "",
            towards: snapshot.towards || "",
            platformName: snapshot.platformName || "",
            currentLocation: snapshot.currentLocation || "",
            vehicleId: snapshot.vehicleId || "",
            punctualityState: punctuality.state,
            punctualityLabel: punctuality.label,
        });
    }
    return trains;
}

function buildFallbackTrainPositions(templates, nowMs, nodeById) {
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

export function useTrainMovements({ nodes, edges, enabled = true }) {
    const [clockMs, setClockMs] = useState(Date.now());
    const [feedSource, setFeedSource] = useState("fallback");
    const [feedUpdatedAt, setFeedUpdatedAt] = useState(null);
    const [feedReason, setFeedReason] = useState("Waiting for live feed");
    const [liveSnapshots, setLiveSnapshots] = useState([]);

    const nodeById = useMemo(() => {
        const map = new Map();
        for (const node of nodes || []) {
            map.set(String(node.id), node);
        }
        return map;
    }, [nodes]);

    const stationNameToId = useMemo(() => buildStationNameIndex(nodes || []), [nodes]);
    const {
        directedTravelTimeByLine,
        inboundByLineTo,
        edgesByLine,
    } = useMemo(() => buildEdgeIndexes(edges || []), [edges]);

    const fallbackTemplates = useMemo(
        () => buildFallbackTemplates(edgesByLine),
        [edgesByLine]
    );

    useEffect(() => {
        if (!enabled) return;
        const id = setInterval(() => setClockMs(Date.now()), ANIMATION_TICK_MS);
        return () => clearInterval(id);
    }, [enabled]);

    useEffect(() => {
        if (!enabled) {
            setLiveSnapshots([]);
            setFeedSource("fallback");
            setFeedReason("Disabled in What-If mode");
            setFeedUpdatedAt(null);
            return;
        }

        if (!nodes?.length || !edges?.length) {
            setFeedSource("fallback");
            setFeedReason("Network graph not loaded yet; using schedule fallback");
            return;
        }

        let cancelled = false;
        let pollId = null;

        async function fetchLiveArrivals() {
            const nowMs = Date.now();
            try {
                const res = await fetch("https://api.tfl.gov.uk/Mode/tube/Arrivals");
                if (!res.ok) throw new Error(`TfL API ${res.status}`);

                const arrivals = await res.json();
                const snapshots = buildLiveSnapshots({
                    arrivals: Array.isArray(arrivals) ? arrivals : [],
                    nowMs,
                    nodeById,
                    stationNameToId,
                    directedTravelTimeByLine,
                    inboundByLineTo,
                });

                if (cancelled) return;

                if (snapshots.length > 0) {
                    setLiveSnapshots((previousSnapshots) => mergeLiveSnapshots({
                        previousSnapshots,
                        nextSnapshots: snapshots,
                        nowMs,
                        directedTravelTimeByLine,
                    }));
                    setFeedSource("live");
                    setFeedReason("");
                    setFeedUpdatedAt(new Date());
                } else {
                    setFeedSource("fallback");
                    setFeedReason("Live arrivals returned no usable train positions");
                    setFeedUpdatedAt(new Date());
                }
            } catch (err) {
                if (cancelled) return;
                setFeedSource("fallback");
                setFeedReason("Live TfL arrivals unavailable; using schedule fallback");
                setFeedUpdatedAt(new Date());
            }
        }

        fetchLiveArrivals();
        pollId = setInterval(fetchLiveArrivals, LIVE_REFRESH_MS);

        return () => {
            cancelled = true;
            if (pollId) clearInterval(pollId);
        };
    }, [
        nodes,
        edges,
        enabled,
        nodeById,
        stationNameToId,
        directedTravelTimeByLine,
        inboundByLineTo,
    ]);

    const trains = useMemo(() => {
        if (!enabled) return [];
        if (feedSource === "live" && liveSnapshots.length > 0) {
            const liveTrains = buildLiveTrainPositions(liveSnapshots, clockMs, nodeById);
            if (liveTrains.length > 0) return liveTrains;
        }
        return buildFallbackTrainPositions(fallbackTemplates, clockMs, nodeById);
    }, [feedSource, liveSnapshots, clockMs, nodeById, fallbackTemplates, enabled]);

    const feedStatus = useMemo(() => ({
        source: feedSource,
        updatedAt: feedUpdatedAt,
        reason: feedReason,
        trainCount: trains.length,
    }), [feedSource, feedUpdatedAt, feedReason, trains.length]);

    return { trains, feedStatus };
}
