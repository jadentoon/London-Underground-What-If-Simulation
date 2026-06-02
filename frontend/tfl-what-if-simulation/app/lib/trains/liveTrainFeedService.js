const DEFAULT_LINE_IDS = [
    "northern",
    "circle",
    "bakerloo",
    "district",
    "central",
    "piccadilly",
    "victoria",
    "hammersmith-city",
    "waterloo-city",
    "jubilee",
    "metropolitan"
];

function normaliseRequestedLineIds(lineIds) {
    const requested = Array.isArray(lineIds) ? lineIds : DEFAULT_LINE_IDS;
    const cleaned = requested
        .map((lineId) => String(lineId || "").trim().toLowerCase())
        .filter(Boolean);

    return cleaned.length > 0 ? Array.from(new Set(cleaned)) : DEFAULT_LINE_IDS;
}

function buildTflArrivalsUrl(lineIds) {
    const lines = normaliseRequestedLineIds(lineIds);
    return `https://api.tfl.gov.uk/Line/${lines.join(",")}/Arrivals`;
}

function normaliseVehicleId(vehicleId) {
    return String(vehicleId || "").trim();
}

function isTrackablePrediction(prediction) {
    const vehicleId = normaliseVehicleId(prediction?.vehicleId);
    return vehicleId !== "" && vehicleId !== "000";
}

function buildTrackableTrainKey(prediction) {
    const lineId = String(prediction?.lineId || "").trim().toLowerCase();
    const vehicleId = normaliseVehicleId(prediction?.vehicleId);
    return lineId && vehicleId ? `${lineId}|${vehicleId}` : "";
}

/**
 * Fetches live train arrival predictions from the TfL Arrivals API.
 *
 * The service separates predictions into trackable and untrackable arrivals so
 * the map can animate trains with reliable vehicle ids while still reporting
 * feed quality metadata.
 *
 * @param {Object} [options] - Fetch options.
 * @param {Array<string>} [options.lineIds] - TfL line ids to request. Defaults to all supported tube lines.
 * @returns {Promise<{ arrivals: Array<Object>, trackableArrivals: Array<Object>, untrackableArrivals: Array<Object>, meta: Object }>} Live feed payload.
 */
export async function getLiveTrainFeed({ lineIds } = {}) {
    const requestedLineIds = normaliseRequestedLineIds(lineIds);
    const response = await fetch(buildTflArrivalsUrl(requestedLineIds), {
        next: { revalidate: 0 },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`TfL API ${response.status}`);
    }

    const rawArrivals = await response.json();
    const arrivals = Array.isArray(rawArrivals) ? rawArrivals : [];
    const trackableArrivals = [];
    const untrackableArrivals = [];
    const trackableTrainKeys = new Set();

    for (const prediction of arrivals) {
        if (isTrackablePrediction(prediction)) {
            trackableArrivals.push(prediction);
            const trainKey = buildTrackableTrainKey(prediction);
            if (trainKey) trackableTrainKeys.add(trainKey);
        } else {
            untrackableArrivals.push(prediction);
        }
    }

    return {
        arrivals,
        trackableArrivals,
        untrackableArrivals,
        meta: {
            fetchedAt: new Date().toISOString(),
            requestedLineIds,
            rawArrivalCount: arrivals.length,
            trackableArrivalCount: trackableArrivals.length,
            trackableTrainCount: trackableTrainKeys.size,
            untrackableArrivalCount: untrackableArrivals.length,
        },
    };
}
