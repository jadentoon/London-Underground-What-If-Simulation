import { Popup, Marker } from "react-leaflet";
import L from "leaflet";
import { TRAIN_COLOURS } from "../mapComponents/constants.js";


function formatArrivalTime(isoTimestamp) {
    if (!isoTimestamp) return "";
    const timestamp = new Date(isoTimestamp);
    if (Number.isNaN(timestamp.getTime())) return "";
    return timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function DetailRow({ label, value }) {
    if (!value) return null;
    return (
        <div>
            <span style={{ fontWeight: 700 }}>{`${label}:`}</span>
            {` ${value}`}
        </div>
    );
}

function StatusRow({ state, label }) {
    if (!label) return null;

    const colourByState = {
        "on-time": "#22c55e",
        late: "#f97316",
        early: "#38bdf8",
        scheduled: "#f59e0b",
    };
    const colour = colourByState[state] || "#cbd5e1";

    return (
        <div>
            <span style={{ fontWeight: 700 }}>Status:</span>
            <span style={{ color: colour, fontWeight: 700 }}>{` ${label}`}</span>
        </div>
    );
}

const trainIconCache = new Map();

function getTrainIcon(train) {
    const lineId = String(train?.lineId || "");
    const isLive = Boolean(train?.isLive);
    const cacheKey = `${lineId}|${isLive ? "live" : "fallback"}`;

    const cached = trainIconCache.get(cacheKey);
    if (cached) return cached;

    const isNorthern = lineId === "northern";
    const baseColour = TRAIN_COLOURS[lineId] || "#38bdf8";
    const trainColour = isNorthern ? "#111827" : baseColour;
    const borderColour = isNorthern ? "#f8fafc" : "#020617";
    const glowColour = isNorthern ? "#f8fafc" : baseColour;
    const size = 25;

    const icon = L.divIcon({
        className: "live-train-marker",
        html: `
            <div style="
                width: ${size}px;
                height: ${size}px;
                border-radius: 999px;
                background: rgba(15, 23, 42, 0.92);
                border: 2px solid ${borderColour};
                box-shadow: 0 0 ${isLive ? 14 : 9}px ${glowColour};
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <svg
                    width="${isLive ? 21 : 18}"
                    height="${isLive ? 21 : 18}"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                >
                    <path
                        d="M7 2h10c2.2 0 4 1.8 4 4v8c0 2.2-1.8 4-4 4l2 3h-2.3l-1.3-2H8.6l-1.3 2H5l2-3c-2.2 0-4-1.8-4-4V6c0-2.2 1.8-4 4-4Z"
                        fill="${trainColour}"
                    />
                    <path
                        d="M7 5h10v5H7V5Z"
                        fill="#ffffff"
                        opacity="0.95"
                    />
                    <circle cx="8" cy="14" r="1.5" fill="#ffffff" />
                    <circle cx="16" cy="14" r="1.5" fill="#ffffff" />
                </svg>
            </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
    });

    trainIconCache.set(cacheKey, icon);
    return icon;
}

export default function TrainLayer({ trains = [] }) {
    return (
        <>
            {trains.map((train) => {
                const trainIcon = getTrainIcon(train);
                const arrivalLabel = formatArrivalTime(train.nextArrivalTime);
                const routeLabel = train.routeLabel || `${train.fromName || "?"} → ${train.toName || "?"}`;

                return (
                    <Marker
                        key={train.id}
                        position={[train.lat, train.lon]}
                        icon={trainIcon}
                    >
                        <Popup>
                            <div style={{ minWidth: 210, fontFamily: "monospace", fontSize: 12, lineHeight: 1.4 }}>
                                <div style={{ fontWeight: 700, marginBottom: 4 }}>{train.label} train</div>
                                <DetailRow label="Route" value={routeLabel} />
                                <DetailRow label="Next station" value={train.toName || "Unknown"} />
                                <DetailRow label="ETA" value={train.etaLabel || "Unknown"} />
                                <StatusRow state={train.punctualityState} label={train.punctualityLabel} />
                                <DetailRow label="Arrives at" value={arrivalLabel} />
                                <DetailRow label="Towards" value={train.towards} />
                                <DetailRow label="Platform" value={train.platformName} />
                                <DetailRow label="Location" value={train.currentLocation} />
                                {!train.isLive && (
                                    <div style={{ marginTop: 4, color: "#f59e0b" }}>
                                        Schedule fallback estimate
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
}