import { useEffect, useState } from "react";

const TFL_LINE_STATUS_URL = "/api/tfl/line-status";

/**
 * Polls TfL line status and extracts delay details for display.
 * 
 * This hook keeps richer delay text separate from the route-blocking line
 * closure state used by `useLineStatus`.
 * 
 * @param {Object} [options] - Delay polling options.
 * @param {number} [options.pollMs=60000] - Polling interval in milliseconds. 
 * @returns {Map<string, Object>} Delay/status details keyed by line id.
 */
export function useLineDelays({pollMs = 60_000} = {}) {
    const [lineDelays, setLineDelays] = useState(new Map());

    useEffect(() => {
        let cancelled = false;

        async function fetchDelays() {
            try {
                const res = await fetch(TFL_LINE_STATUS_URL);
                if (!res.ok) throw new Error(`TfL Status API ${res.status}`);

                const data = await res.json();
                const delayMap = new Map();

                data.forEach(line => {
                    const status = line.lineStatuses?.[0];

                    if (status) {
                        delayMap.set(line.id, {
                            severity: status.statusSeverity || 10,
                            description: status.statusSeverityDescription || "Good Service",
                            reason: status.reason || null,
                            fullDescription: status.disruption?.description || null,
                            additionalInfo: status.disruption?.additionalInfo || null,
                        });
                    }
                });
                
                if (!cancelled) {
                    setLineDelays(delayMap);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error("Failed to fetch line delays:", err);
                }
            }
        }
        
        fetchDelays();
        const intervalId = setInterval(fetchDelays, pollMs); 

        return () => {
            cancelled = true;
            clearInterval(intervalId);
        };
    }, [pollMs]);

    return lineDelays;
}