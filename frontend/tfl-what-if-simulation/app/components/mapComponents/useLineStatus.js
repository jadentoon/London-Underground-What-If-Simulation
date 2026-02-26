'use client';

import { useEffect, useMemo, useState } from "react";
import { LINE_COLOURS, LINE_LABELS } from "./constants";

const EMPTY_LINE_SET = new Set();
const LIVE_STATUS_POLL_MS = 60_000;
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

function getLiveLineDisruptions(lines) {
    const closed = new Set();
    const partial = new Set();

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
        }
    }

    return { closed, partial };
}

export function useLineStatus({
    hypotheticalSettingsEnabled,
    simulatedClosedLines = EMPTY_LINE_SET,
}) {
    const [lineOptions, setLineOptions] = useState(FALLBACK_LINES);
    const [linesSource, setLinesSource] = useState("fallback");
    const [linesUpdatedAt, setLinesUpdatedAt] = useState(null);
    const [liveClosedLines, setLiveClosedLines] = useState(new Set());
    const [livePartialLines, setLivePartialLines] = useState(new Set());

    useEffect(() => {
        let cancelled = false;
        let pollId = null;

        async function fetchLinesAndStatus() {
            try {
                const res = await fetch("https://api.tfl.gov.uk/Line/Mode/tube/Status");
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
                    const { closed, partial } = getLiveLineDisruptions(lines);
                    setLineOptions(mapped.length ? mapped : FALLBACK_LINES);
                    setLiveClosedLines(closed);
                    setLivePartialLines(partial);
                    setLinesSource(mapped.length ? "live" : "fallback");
                    setLinesUpdatedAt(mapped.length ? new Date() : null);
                }
            } catch (err) {
                if (!cancelled) {
                    setLineOptions(FALLBACK_LINES);
                    setLiveClosedLines(new Set());
                    setLivePartialLines(new Set());
                    setLinesSource("fallback");
                    setLinesUpdatedAt(null);
                }
            }
        }

        fetchLinesAndStatus();
        pollId = setInterval(fetchLinesAndStatus, LIVE_STATUS_POLL_MS);

        return () => {
            cancelled = true;
            if (pollId) clearInterval(pollId);
        };
    }, []);

    const effectiveLines = hypotheticalSettingsEnabled ? FALLBACK_LINES : lineOptions;
    const effectiveClosedLines = hypotheticalSettingsEnabled ? simulatedClosedLines : liveClosedLines;
    const effectivePartialLines = hypotheticalSettingsEnabled ? EMPTY_LINE_SET : livePartialLines;
    const isLiveLines = !hypotheticalSettingsEnabled && linesSource === "live";
    const liveClosedCount = liveClosedLines.size;
    const livePartialCount = livePartialLines.size;

    const lineStatusLabel = useMemo(() => {
        if (hypotheticalSettingsEnabled) return "What-If mode";
        if (!isLiveLines) return "Fallback (TfL API unavailable)";

        const liveStatusSummaryParts = [];
        if (liveClosedCount) liveStatusSummaryParts.push(`${liveClosedCount} closed`);
        if (livePartialCount) liveStatusSummaryParts.push(`${livePartialCount} partly closed`);
        const liveStatusSummary = liveStatusSummaryParts.length
            ? ` · ${liveStatusSummaryParts.join(" · ")}`
            : "";

        return `Live TfL status${liveStatusSummary}`;
    }, [
        hypotheticalSettingsEnabled,
        isLiveLines,
        liveClosedCount,
        livePartialCount,
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
        isLiveLines,
        linesUpdatedAt,
        lineStatusLabel,
        lineStatusColor,
        lineStatusBg,
    };
}
