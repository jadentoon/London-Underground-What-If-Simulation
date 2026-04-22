const TFL_TUBE_ARRIVALS_URL = "https://api.tfl.gov.uk/Mode/tube/Arrivals";

function normaliseVehicleId(vehicleId) {
    return String(vehicleId || "").trim();
}

function isTrackablePrediction(prediction) {
    const vehicleId = normaliseVehicleId(prediction?.vehicleId);
    return vehicleId !== "" && vehicleId !== "000";
}

export async function getLiveTrainFeed() {
    const response = await fetch(TFL_TUBE_ARRIVALS_URL, {
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

    for (const prediction of arrivals) {
        if (isTrackablePrediction(prediction)) {
            trackableArrivals.push(prediction);
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
            rawArrivalCount: arrivals.length,
            trackableArrivalCount: trackableArrivals.length,
            untrackableArrivalCount: untrackableArrivals.length,
        },
    };
}
