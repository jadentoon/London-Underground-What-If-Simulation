import { X } from "lucide-react";
import { LINE_COLOURS } from "../mapComponents/constants";

function formatArrivalTime(isoTimestamp) {
    if (!isoTimestamp) return "";
    const timestamp = new Date(isoTimestamp);
    if (Number.isNaN(timestamp.getTime())) return "";
    return timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function DetailRow({ label, value }) {
    if (!value) return null;
    return (
        <div style={{ display: "grid", gap: 2 }}>
            <span style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase" }}>{label}</span>
            <span style={{ color: "#f8fafc", fontSize: 13 }}>{value}</span>
        </div>
    );
}

export function SelectedTrainPanel({ train, layout, onClose }) {
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
                right: isMobilePortrait ? 12 : 20,
                bottom: isMobilePortrait ? 18 : 24,
                width: isMobilePortrait ? "calc(100% - 24px)" : 320,
                maxWidth: "calc(100% - 24px)",
                zIndex: 1200,
                border: "1px solid rgba(148, 163, 184, 0.28)",
                borderLeft: `4px solid ${lineColour}`,
                borderRadius: 8,
                background: "rgba(15, 23, 42, 0.94)",
                boxShadow: "0 18px 45px rgba(0, 0, 0, 0.38)",
                backdropFilter: "blur(12px)",
                color: "#f8fafc",
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
                    borderBottom: "1px solid rgba(148, 163, 184, 0.18)",
                }}
            >
                <div style={{ minWidth: 0 }}>
                    <div style={{ color: "#cbd5e1", fontSize: 12 }}>{train.isLive ? "Live train" : "Schedule estimate"}</div>
                    <h2
                        style={{
                            margin: 0,
                            marginTop: 2,
                            color: "#ffffff",
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
                        border: "1px solid rgba(148, 163, 184, 0.28)",
                        borderRadius: 6,
                        background: "rgba(15, 23, 42, 0.8)",
                        color: "#f8fafc",
                        cursor: "pointer",
                        flex: "0 0 auto",
                    }}
                >
                    <X size={16} aria-hidden="true" />
                </button>
            </div>

            <div style={{ display: "grid", gap: 12, padding: 14 }}>
                <DetailRow label="Route" value={routeLabel} />
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                    }}
                >
                    <DetailRow label="Next station" value={train.toName || "Unknown"} />
                    <DetailRow label="ETA" value={train.etaLabel || "Unknown"} />
                </div>
                {train.punctualityLabel && (
                    <div style={{ display: "grid", gap: 2 }}>
                        <span style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase" }}>Status</span>
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
                    <DetailRow label="Arrives at" value={arrivalLabel} />
                    <DetailRow label="Platform" value={train.platformName} />
                </div>
                <DetailRow label="Towards" value={train.towards} />
                <DetailRow label="Location" value={train.currentLocation} />
            </div>
        </section>
    );
}
