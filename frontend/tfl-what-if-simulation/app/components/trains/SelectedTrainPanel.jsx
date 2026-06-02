import { X } from "lucide-react";
import { LINE_COLOURS } from "../mapShared/constants";

/**
 * Formats a live train arrival timestamp for compact panel display.
 *
 * Invalid or missing timestamps are hidden so the detail panel only renders
 * useful arrival information.
 *
 * @param {string | null | undefined} isoTimestamp - ISO timestamp from the train feed.
 * @returns {string} Localised time label, or an empty string when unavailable.
 */
function formatArrivalTime(isoTimestamp) {
    if (!isoTimestamp) return "";
    const timestamp = new Date(isoTimestamp);
    if (Number.isNaN(timestamp.getTime())) return "";
    return timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const FALLBACK_COLORS = {
    card: "rgba(15, 23, 42, 0.94)",
    border: "rgba(148, 163, 184, 0.28)",
    text: "#f8fafc",
    textStrong: "#ffffff",
    textMuted: "#94a3b8",
    control: "rgba(15, 23, 42, 0.8)",
    shadowStrong: "0 18px 45px rgba(0, 0, 0, 0.38)",
};

/**
 * Renders one labelled train detail if a value is available.
 *
 * Returning null for empty values keeps the selected-train panel compact and
 * avoids showing placeholder rows for unavailable live feed data.
 *
 * @param {Object} props - Detail row props.
 * @param {string} props.label - Short label shown above the value.
 * @param {string | number | null | undefined} props.value - Detail value to display.
 * @param {Object} props.COLORS - Theme tokens used by the row.
 * @returns {JSX.Element | null} Labelled detail row or null.
 */
function DetailRow({ label, value, COLORS }) {
    if (!value) return null;
    return (
        <div style={{ display: "grid", gap: 2 }}>
            <span style={{ color: COLORS.textMuted, fontSize: 11, textTransform: "uppercase" }}>{label}</span>
            <span style={{ color: COLORS.textStrong, fontSize: 13 }}>{value}</span>
        </div>
    );
}

/**
 * Displays details for the train currently selected on the map.
 *
 * The panel combines live or fallback train metadata, including route,
 * destination, ETA, punctuality and platform/location details. It is positioned
 * responsively so the same component works on desktop and mobile map layouts.
 *
 * @param {Object} props - Selected train panel props.
 * @param {Object | null} props.train - Selected train marker data, or null when no train is selected.
 * @param {Object} props.layout - Current map layout state.
 * @param {boolean} props.layout.isMobilePortrait - Whether the map is in mobile portrait layout.
 * @param {Object} [props.COLORS] - Theme tokens for panel styling.
 * @param {() => void} props.onClose - Called when the close button is pressed.
 * @returns {JSX.Element | null} Selected train detail panel or null.
 */
export function SelectedTrainPanel({ train, layout, COLORS = FALLBACK_COLORS, onClose }) {
    if (!train) return null;

    const lineId = String(train.lineId || "");
    const lineColour = LINE_COLOURS[lineId] || "#38bdf8";
    const routeLabel = train.routeLabel || `${train.fromName || "?"} -> ${train.toName || "?"}`;
    const arrivalLabel = formatArrivalTime(train.nextArrivalTime);
    const isMobilePortrait = Boolean(layout?.isMobilePortrait);

    const statusColourByState = {
        "on-time": "#22c55e",
        late: "#f97316",
        early: "#38bdf8",
        scheduled: "#f59e0b",
    };
    const statusColour = statusColourByState[train.punctualityState] || "#cbd5e1";

    return (
        <section
            aria-label="Selected train details"
            style={{
                position: "absolute",
                right: isMobilePortrait ? 12 : 70,
                bottom: isMobilePortrait ? 18 : 24,
                width: isMobilePortrait ? "calc(100% - 24px)" : 320,
                maxWidth: "calc(100% - 24px)",
                zIndex: 1200,
                border: `1px solid ${COLORS.border}`,
                borderLeft: `4px solid ${lineColour}`,
                borderRadius: 8,
                background: COLORS.strong ?? COLORS.card,
                boxShadow: COLORS.shadowStrong,
                backdropFilter: "blur(12px)",
                color: COLORS.text,
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "14px 14px 10px 14px",
                    borderBottom: `1px solid ${COLORS.border}`,
                }}
            >
                <div style={{ minWidth: 0 }}>
                    <div style={{ color: COLORS.textMuted, fontSize: 12 }}>{train.isLive ? "Live train" : "Schedule estimate"}</div>
                    <h2
                        style={{
                            margin: 0,
                            marginTop: 2,
                            color: COLORS.textStrong,
                            fontSize: 16,
                            fontWeight: 800,
                            lineHeight: 1.25,
                        }}
                    >
                        {train.label} train
                    </h2>
                </div>

                <button
                    type="button"
                    aria-label="Close selected train details"
                    onClick={onClose}
                    style={{
                        width: 30,
                        height: 30,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 6,
                        background: COLORS.control,
                        color: COLORS.text,
                        cursor: "pointer",
                        flex: "0 0 auto",
                    }}
                >
                    <X size={16} aria-hidden="true" />
                </button>
            </div>

            <div style={{ display: "grid", gap: 12, padding: 14 }}>
                <DetailRow label="Route" value={routeLabel} COLORS={COLORS} />
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                    }}
                >
                    <DetailRow label="Next station" value={train.toName || "Unknown"} COLORS={COLORS} />
                    <DetailRow label="ETA" value={train.etaLabel || "Unknown"} COLORS={COLORS} />
                </div>
                {train.punctualityLabel && (
                    <div style={{ display: "grid", gap: 2 }}>
                        <span style={{ color: COLORS.textMuted, fontSize: 11, textTransform: "uppercase" }}>Status</span>
                        <span style={{ color: statusColour, fontSize: 13, fontWeight: 800 }}>{train.punctualityLabel}</span>
                    </div>
                )}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                    }}
                >
                    <DetailRow label="Arrives at" value={arrivalLabel} COLORS={COLORS} />
                    <DetailRow label="Platform" value={train.platformName} COLORS={COLORS} />
                </div>
                <DetailRow label="Towards" value={train.towards} COLORS={COLORS} />
                <DetailRow label="Location" value={train.currentLocation} COLORS={COLORS} />
            </div>
        </section>
    );
}
