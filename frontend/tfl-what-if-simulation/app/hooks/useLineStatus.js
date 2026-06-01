'use client';

import { useEffect, useMemo, useState } from "react";
import { LINE_COLOURS, LINE_LABELS } from "../components/mapShared/constants";

const EMPTY_LINE_SET = new Set();
const EMPTY_LINE_MAP = new Map();
const LIVE_STATUS_POLL_MS = 15_000;
const PARTIAL_CLOSURE_KEYWORDS = [
    "part closure",
    "partly closed",
    "part suspended",
];
const FULL_CLOSURE_KEYWORDS = [
    "service closed",
    "closed",
    "suspended",
    "closure",
    "not running",
];

const FALLBACK_LINES = Object.keys(LINE_COLOURS).map((id) => ({
    id,
    label: LINE_LABELS[id] || id,
    color: LINE_COLOURS[id],
}));

function classifyLineStatus(status) {
    const severityRaw = status?.statusSeverity;
    const severity = typeof severityRaw === "number" ? severityRaw : Number(severityRaw);
    const severityDescription = String(status?.statusSeverityDescription || "").toLowerCase();

    if (severityDescription.includes("special service")) {
        return "open";
    }

    const text = `${severityDescription} ${status?.reason || ""}`.toLowerCase();

    if (PARTIAL_CLOSURE_KEYWORDS.some((keyword) => text.includes(keyword))) {
        return "partial";
    }
    if (FULL_CLOSURE_KEYWORDS.some((keyword) => text.includes(keyword))) {
        return "closed";
    }

    if (Number.isFinite(severity)) {
        if (severity <= 2) return "closed";
        if (severity <= 5) return "partial";
    }

    return "open";
}

function normaliseTflStopId(rawId) {
    const id = String(rawId || "");
    if (!id) return "";

    // Convert platform-level NaPTAN IDs to station-level IDs used by our graph.
    if (id.startsWith("9400ZZ")) {
        let body = id.slice(4);
        if (body.startsWith("ZZLU") && /\d$/.test(body)) {
            body = body.slice(0, -1);
        }
        return `940G${body}`;
    }

    return id;
}

function getStopId(stop) {
    const rawId =
        stop?.stationNaptanId ||
        stop?.stationNaptan ||
        stop?.naptanId ||
        stop?.id ||
        stop?.parentId;

    return normaliseTflStopId(rawId);
}

function getLiveLineDisruptions(lines) {
    const closed = new Set();
    const partial = new Set();
    const partialStationIdsByLine = new Map();

    for (const line of lines) {
        const statuses = Array.isArray(line?.lineStatuses) ? line.lineStatuses : [];
        let lineState = "open";

        for (const status of statuses) {
            const statusState = classifyLineStatus(status);
            if (statusState === "closed") {
                lineState = "closed";
                break;
            }
            if (statusState === "partial") {
                lineState = "partial";
            }
        }

        if (lineState === "closed") {
            closed.add(line.id);
        } else if (lineState === "partial") {
            partial.add(line.id);

            const affectedStops = new Set();
            for (const status of statuses) {
                if (classifyLineStatus(status) !== "partial") continue;
                const stops = Array.isArray(status?.disruption?.affectedStops)
                    ? status.disruption.affectedStops
                    : [];
                for (const stop of stops) {
                    const stopId = getStopId(stop);
                    if (stopId) affectedStops.add(stopId);
                }
            }

            if (affectedStops.size > 0) {
                partialStationIdsByLine.set(String(line.id), affectedStops);
            }
        }
    }

    return { closed, partial, partialStationIdsByLine };
}

export function useLineStatus({
    hypotheticalSettingsEnabled,
    simulatedClosedLines = EMPTY_LINE_SET,
    pollMs = LIVE_STATUS_POLL_MS,
}) {
    const [lineOptions, setLineOptions] = useState(FALLBACK_LINES);
    const [linesSource, setLinesSource] = useState("fallback");
    const [linesUpdatedAt, setLinesUpdatedAt] = useState(null);
    const [linesReason, setLinesReason] = useState("Waiting for live line status");
    const [liveClosedLines, setLiveClosedLines] = useState(new Set());
    const [livePartialLines, setLivePartialLines] = useState(new Set());
    const [livePartialStationIdsByLine, setLivePartialStationIdsByLine] = useState(new Map());

    useEffect(() => {
        let cancelled = false;
        let pollId = null;

        async function fetchLinesAndStatus() {
            try {
                const res = await fetch("/api/tfl/line-status?detail=true");
                if (!res.ok) throw new Error(`TfL API ${res.status}`);

                const data = await res.json();
                const lines = Array.isArray(data) ? data : [];
                const mapped = lines
                    .map((line) => {
                        const color = LINE_COLOURS[line.id];
                        if (!color) return null;
                        return {
                            id: line.id,
                            label: line.name || line.id,
                            color,
                        };
                    })
                    .filter(Boolean);

                if (!cancelled) {
                    const { closed, partial, partialStationIdsByLine } = getLiveLineDisruptions(lines);
                    setLineOptions(mapped.length ? mapped : FALLBACK_LINES);
                    setLiveClosedLines(closed);
                    setLivePartialLines(partial);
                    setLivePartialStationIdsByLine(partialStationIdsByLine);
                    setLinesSource(mapped.length ? "live" : "fallback");
                    setLinesUpdatedAt(mapped.length ? new Date() : null);
                    setLinesReason(mapped.length ? "" : "TfL line status returned no usable lines");
                }
            } catch {
                if (!cancelled) {
                    setLineOptions(FALLBACK_LINES);
                    setLiveClosedLines(new Set());
                    setLivePartialLines(new Set());
                    setLivePartialStationIdsByLine(new Map());
                    setLinesSource("fallback");
                    setLinesUpdatedAt(null);
                    setLinesReason("Live TfL line status unavailable");
                }
            }
        }

        fetchLinesAndStatus();
        pollId = setInterval(fetchLinesAndStatus, pollMs);

        return () => {
            cancelled = true;
            if (pollId) clearInterval(pollId);
        };
    }, [pollMs]);

    const effectiveLines = hypotheticalSettingsEnabled ? FALLBACK_LINES : lineOptions;
    const effectiveClosedLines = hypotheticalSettingsEnabled ? simulatedClosedLines : liveClosedLines;
    const effectivePartialLines = hypotheticalSettingsEnabled ? EMPTY_LINE_SET : livePartialLines;
    const effectivePartialStationIdsByLine = hypotheticalSettingsEnabled
        ? EMPTY_LINE_MAP
        : livePartialStationIdsByLine;
    const isLiveLines = !hypotheticalSettingsEnabled && linesSource === "live";
    const liveClosedCount = liveClosedLines.size;
    const livePartialCount = livePartialLines.size;

    const lineStatusLabel = useMemo(() => {
        if (hypotheticalSettingsEnabled) return "Fallback (What-If mode)";
        if (!isLiveLines) return "Fallback (TfL API unavailable)";
        return "Live TfL status";
    }, [
        hypotheticalSettingsEnabled,
        isLiveLines,
    ]);

    const lineStatusColor = hypotheticalSettingsEnabled
        ? "#fbbf24"
        : (
            isLiveLines
                ? (liveClosedCount > 0 ? "#ef4444" : (livePartialCount > 0 ? "#f59e0b" : "#22c55e"))
                : "#f97316"
        );

    const lineStatusBg = hypotheticalSettingsEnabled
        ? "rgba(251, 191, 36, 0.12)"
        : (
            isLiveLines
                ? (liveClosedCount > 0 ? "rgba(239, 68, 68, 0.12)" : (livePartialCount > 0 ? "rgba(245, 158, 11, 0.12)" : "rgba(34, 197, 94, 0.12)"))
                : "rgba(249, 115, 22, 0.12)"
        );

    return {
        effectiveLines,
        effectiveClosedLines,
        effectivePartialLines,
        effectivePartialStationIdsByLine,
        isLiveLines,
        linesUpdatedAt,
        linesSource,
        linesReason,
        liveClosedCount,
        livePartialCount,
        lineStatusLabel,
        lineStatusColor,
        lineStatusBg,
    };
}
