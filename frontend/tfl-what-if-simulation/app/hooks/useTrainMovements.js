'use client';

import { useEffect, useMemo, useState } from "react";
import { buildEdgeIndexes, buildStationNameIndex } from "../lib/trains/trainGraphUtils.js";
import {
    ANIMATION_TICK_MS,
    LIVE_REFRESH_MS,
} from "../lib/trains/trainMovementConstants.js";
import {
    buildFallbackTrainPositions,
    buildFallbackTemplates,
    buildLiveTrainPositions,
} from "../lib/trains/trainPositionBuilders.js";
import {
    buildLiveSnapshots,
    mergeLiveSnapshots,
} from "../lib/trains/trainSnapshotBuilder.js";

/**
 * React hook that manages train marker data for the map.
 * 
 * It builds graph lookup indexes, polls the live train API when enabled,
 * merges live snapshots between refreshes and falls back to simulated train
 * movement when live data is unavailable.
 * 
 * @param {Object} params
 * @param {Array<Object>} params.nodes - Station nodes from the graph.
 * @param {Array<Object>} params.edges - Graph edges between stations.
 * @param {boolean} [params.enabled=true] - Whether train movement should be active.
 * @returns {{ trains: Array<Object>, feedStatus: Object }} - Train marker data and live feed status.
 */
export function useTrainMovements({ nodes, edges, enabled = true }) {
    const [clockMs, setClockMs] = useState(0);
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

    // Poll live arrivals and fall back to simulated movement when the feed is unavailable.
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
                const res = await fetch("/api/trains/live", { cache: "no-store" });
                if (!res.ok) throw new Error(`Live train API ${res.status}`);

                const payload = await res.json();
                const arrivals = Array.isArray(payload?.trackableArrivals)
                    ? payload.trackableArrivals
                    : [];
                const snapshots = buildLiveSnapshots({
                    arrivals,
                    nowMs,
                    nodeById,
                    stationNameToId,
                    directedTravelTimeByLine,
                    inboundByLineTo,
                    edgesByLine,
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
                    setFeedReason(
                        Number(payload?.meta?.untrackableArrivalCount) > 0
                            ? "Live arrivals only contained untrackable services"
                            : "Live arrivals returned no usable train positions"
                    );
                    setFeedUpdatedAt(new Date());
                }
            } catch {
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
        edgesByLine,
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
