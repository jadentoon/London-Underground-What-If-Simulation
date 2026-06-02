import { useEffect, useState } from "react";

const TFL_STATION_DISRUPTIONS_URL = 
    "/api/tfl/station-disruptions";

/**
 * Polls live TfL station disruption data and returns closed station ids.
 * 
 * When disabled, the hook clears live closures so What-If mode can use only the 
 * simulated closure state controlled by the user.
 * 
 * @param {Object} params - Live closure options.
 * @param {boolean} params.enabled - Whether live station closures should be fetched.
 * @param {number} [params.pollMs=15000] - Polling interval in milliseconds.
 * @returns {Set<string>} Station ids currently reported as closed.
 */
export function useLiveStationClosures({
    enabled,
    pollMs = 15_000,
}) {
    // Live real-world closed stations (from TfL Unified API)
    const [liveClosedStations, setLiveClosedStations] = useState(new Set());

    // Fetch live station closures from TfL StopPoint Disruption API
    useEffect(() => {
        if (!enabled) {
            setLiveClosedStations(new Set());
            return;
        }

        let cancelled = false;

        async function fetchLiveStationClosures() {
            try {
                const res = await fetch(TFL_STATION_DISRUPTIONS_URL);

                if (!res.ok) {
                    throw new Error(`TfL API ${res.status}`);
                }

                const disruptions = await res.json();
                const closed = extractClosedStationIds(disruptions);

                if (!cancelled) {
                    setLiveClosedStations(closed);
                }
            } catch (err) {
                console.error("Error fetching live station disruptions", err);

                if (!cancelled) {
                    setLiveClosedStations(new Set());
                }
            }
        }

        // Initial fetch
        fetchLiveStationClosures();

        const intervalId = setInterval(fetchLiveStationClosures, pollMs);

        return () => {
            cancelled = true;
            clearInterval(intervalId);
        };
    }, [enabled, pollMs]);

    return liveClosedStations;
}

function extractClosedStationIds(disruptions) {
    const disruptionList = Array.isArray(disruptions) ? disruptions : [];
    const closed = new Set();

    disruptionList.forEach((disruption) => {
        const stops = disruption.affectedStops || disruption.affectedStopPoints || [];
        const stopPointIds = Array.isArray(disruption.stopPointIds)
            ? disruption.stopPointIds
            : [];
        
        stops.forEach((stop) => {
            if (!stop) return;

            if (typeof stop === "string") {
                closed.add(stop);
            } else if (stop.id) {
                closed.add(String(stop.id));
            } else if (stop.stationId) {
                closed.add(String(stop.stationId));
            }
        });

        stopPointIds.forEach((id) => {
            if (id) closed.add(String(id));
        });
    });

    return closed;               
}