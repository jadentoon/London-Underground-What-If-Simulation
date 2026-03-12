import { Fragment } from "react";
import { CircleMarker, Popup } from "react-leaflet";
import { TRAIN_COLOURS } from "./constants";

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

function getTrainVisuals(train) {
    const lineId = String(train?.lineId || "");
    const isLive = Boolean(train?.isLive);
    const isNorthern = lineId === "northern";

    const baseColour = TRAIN_COLOURS[lineId] || "#38bdf8";
    const coreColour = isNorthern ? "#111827" : baseColour;
    const glowColour = isNorthern ? "#f8fafc" : baseColour;

    return {
        glowOuterRadius: isLive ? 11.5 : 9.2,
        glowInnerRadius: isLive ? 8 : 6.5,
        coreRadius: isLive ? 4.8 : 4,
        glowOuterOpacity: isNorthern ? (isLive ? 0.26 : 0.2) : (isLive ? 0.2 : 0.14),
        glowInnerOpacity: isNorthern ? (isLive ? 0.38 : 0.3) : (isLive ? 0.32 : 0.24),
        coreOpacity: isLive ? 0.98 : 0.9,
        glowColour,
        coreColour,
        coreBorderColour: isNorthern ? "#f8fafc" : "#020617",
        coreBorderWeight: isNorthern ? 1.8 : 1.6,
    };
}

export default function TrainLayer({ trains = [] }) {
    return (
        <>
            {trains.map((train) => {
                const visuals = getTrainVisuals(train);
                const arrivalLabel = formatArrivalTime(train.nextArrivalTime);
                const routeLabel = train.routeLabel || `${train.fromName || "?"} → ${train.toName || "?"}`;

                return (
                    <Fragment key={train.id}>
                        <CircleMarker
                            center={[train.lat, train.lon]}
                            radius={visuals.glowOuterRadius}
                            pathOptions={{
                                color: visuals.glowColour,
                                fillColor: visuals.glowColour,
                                fillOpacity: visuals.glowOuterOpacity,
                                weight: 0,
                            }}
                            interactive={false}
                        />
                        <CircleMarker
                            center={[train.lat, train.lon]}
                            radius={visuals.glowInnerRadius}
                            pathOptions={{
                                color: visuals.glowColour,
                                fillColor: visuals.glowColour,
                                fillOpacity: visuals.glowInnerOpacity,
                                weight: 0,
                            }}
                            interactive={false}
                        />
                        <CircleMarker
                            center={[train.lat, train.lon]}
                            radius={visuals.coreRadius}
                            pathOptions={{
                                color: visuals.coreBorderColour,
                                fillColor: visuals.coreColour,
                                fillOpacity: visuals.coreOpacity,
                                weight: visuals.coreBorderWeight,
                            }}
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
                        </CircleMarker>
                    </Fragment>
                );
            })}
        </>
    );
}
