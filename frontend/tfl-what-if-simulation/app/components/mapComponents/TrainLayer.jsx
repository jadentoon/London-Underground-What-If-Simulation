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

export default function TrainLayer({ trains = [] }) {
    return (
        <>
            {trains.map((train) => {
                const color = TRAIN_COLOURS[train.lineId] || "#38bdf8";
                const glowOuterRadius = train.isLive ? 9 : 7.2;
                const glowInnerRadius = train.isLive ? 6 : 5;
                const coreRadius = train.isLive ? 3.4 : 3;
                const glowOuterOpacity = train.isLive ? 0.2 : 0.14;
                const glowInnerOpacity = train.isLive ? 0.32 : 0.24;
                const coreOpacity = train.isLive ? 0.98 : 0.88;
                const arrivalLabel = formatArrivalTime(train.nextArrivalTime);
                const routeLabel = train.routeLabel || `${train.fromName || "?"} → ${train.toName || "?"}`;

                return (
                    <Fragment key={train.id}>
                        <CircleMarker
                            center={[train.lat, train.lon]}
                            radius={glowOuterRadius}
                            pathOptions={{
                                color,
                                fillColor: color,
                                fillOpacity: glowOuterOpacity,
                                weight: 0,
                            }}
                            interactive={false}
                        />
                        <CircleMarker
                            center={[train.lat, train.lon]}
                            radius={glowInnerRadius}
                            pathOptions={{
                                color,
                                fillColor: color,
                                fillOpacity: glowInnerOpacity,
                                weight: 0,
                            }}
                            interactive={false}
                        />
                        <CircleMarker
                            center={[train.lat, train.lon]}
                            radius={coreRadius}
                            pathOptions={{
                                color: "#020617",
                                fillColor: color,
                                fillOpacity: coreOpacity,
                                weight: 1.6,
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
