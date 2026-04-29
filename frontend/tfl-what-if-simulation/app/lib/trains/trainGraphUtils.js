import { dedupeEdges } from "../../components/mapComponents/utils";
import { normaliseStationName } from "./trainIdUtils";

const MIN_EDGE_TRAVEL_TIME_SECONDS = 60;

function buildDirectedEdgeKey(lineId, from, to) {
    return `${lineId}|${from}|${to}`;
}

function buildInboundKey(lineId, stationId) {
    return `${lineId}|${stationId}`;
}

/**
 * Builds a lookup map from normalised station names to station IDs so live
 * feed text can be matched against stations in the network graph.
 * 
 * @param {Array<{ id: string | number, name: string }>} nodes - Station nodes from the graph. 
 * @returns - Map of normalised station names to station IDs
 */
export function buildStationNameIndex(nodes) {
    const nameToId = new Map();
    for (const node of nodes) {
        const key = normaliseStationName(node.name);
        if (key && !nameToId.has(key)) {
            nameToId.set(key, String(node.id));
        }
    }
    return nameToId;
}

/**
 * Extracts station names from live feed text written in a "between X and Y"
 * format and maps them to graph station IDs where possible.
 * 
 * @param {string | null | undefined} currentLocation - Raw location text from a live prediction.
 * @param {Map<string, string>} stationNameToId - Lookup map of normalised station name to station IDs
 * @returns - Station IDs found in the location text.
 */
function parseBetweenStations(currentLocation, stationNameToId) {
    const text = String(currentLocation || "");
    if (!text) return [];

    const betweenMatch = text.match(/between\s+(.+?)\s+and\s+(.+?)(?:$|\.|,)/i);
    if (!betweenMatch) return [];

    const [, firstName, secondName] = betweenMatch;
    const firstId = stationNameToId.get(normaliseStationName(firstName)) || "";
    const secondId = stationNameToId.get(normaliseStationName(secondName)) || "";

    return [firstId, secondId].filter(Boolean);
}

/**
 * Builds indexed edge lookups for matching live train predictions to likely graph segements
 * and travel times.
 * 
 * @param {Array<{ from: string | number, to: string | number, line: string, travel_time?: number }>} edges - Graph edges for the network.
 * @returns - Indexed edge data used during train inference and fallback generation.
 */
export function buildEdgeIndexes(edges) {
    const directedTravelTimeByLine = new Map();
    const inboundByLineTo = new Map();
    const edgesByLine = new Map();

    const uniqueEdges = dedupeEdges(edges || []);

    for (const edge of uniqueEdges) {
        const lineId = String(edge.line || "");
        if (!lineId) continue;

        const from = String(edge.from);
        const to = String(edge.to);
        const rawTravelTime = Number(edge.travel_time);
        const travelTime = Number.isFinite(rawTravelTime) && rawTravelTime > 0
            ? rawTravelTime
            : MIN_EDGE_TRAVEL_TIME_SECONDS;

        directedTravelTimeByLine.set(buildDirectedEdgeKey(lineId, from, to), travelTime);
        directedTravelTimeByLine.set(buildDirectedEdgeKey(lineId, to, from), travelTime);

        const inboundForwardKey = buildInboundKey(lineId, to);
        if (!inboundByLineTo.has(inboundForwardKey)) inboundByLineTo.set(inboundForwardKey, []);
        inboundByLineTo.get(inboundForwardKey).push({ from, travelTime });

        const inboundReverseKey = buildInboundKey(lineId, from);
        if (!inboundByLineTo.has(inboundReverseKey)) inboundByLineTo.set(inboundReverseKey, []);
        inboundByLineTo.get(inboundReverseKey).push({ from: to, travelTime });

        if (!edgesByLine.has(lineId)) edgesByLine.set(lineId, []);
        edgesByLine.get(lineId).push({ from, to, travelTime, lineId });
    }

    return { directedTravelTimeByLine, inboundByLineTo, edgesByLine };
}

function chooseFromLocationText({ prediction, stationNameToId, lineId, toId, directedTravelTimeByLine}) {
    const betweenIds = parseBetweenStations(prediction.currentLocation, stationNameToId);

    for (const candidate of betweenIds) {
        if (candidate === toId) continue;
        if (directedTravelTimeByLine.has(`${lineId}|${candidate}|${toId}`)) {
            return candidate;
        }
    }

    return "";
}

function chooseFromEta({ prediction, etaSeconds, lineId, toId, inboundByLineTo }) {
    const inbound = inboundByLineTo.get(`${lineId}|${toId}`) || [];
    if (inbound.length === 0) return "";

    const eta = Number.isFinite(etaSeconds)
        ? etaSeconds
        : Number(prediction.timeToStation);

    if (!Number.isFinite(eta)) return inbound[0].from;

    let best = inbound[0];
    let bestDiff = Math.abs(best.travelTime - eta);

    for (let i = 1; i < inbound.length; i++) {
        const diff = Math.abs(inbound[i].travelTime - eta);
        if (diff < bestDiff) {
            best = inbound[i];
            bestDiff = diff;
        }
    }

    return best.from;
}

export function chooseFromStop({
    prediction,
    etaSeconds,
    lineId,
    toId,
    directedTravelTimeByLine,
    inboundByLineTo,
    stationNameToId,
}) {
    const fromLocationText = chooseFromLocationText({
        prediction,
        stationNameToId,
        lineId,
        toId,
        directedTravelTimeByLine,
    });

    if (fromLocationText) return fromLocationText;

    return chooseFromEta({
        prediction,
        etaSeconds,
        lineId,
        toId,
        inboundByLineTo,
    })
}
