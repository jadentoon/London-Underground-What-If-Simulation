import { fetchTfl } from "./tFlClient.js"

/**
 * buildFromRoutes
 * 
 * Builds a station graph directly from TfL route data.
 * Stations are extracted from each line's route sequence,
 * and edges are created between consecutive stops.
 * 
 * @param {Array<{id: string, name: string}>} lines
 *      Lines of tube lines returned from fetchAllLines().
 *  
 * @returns {Promise<{
 *  stations: Array<{id: string, name: string, lat: number, lon: number}>,
 *  edges: Array<{from: string, to: string, line: string, lineName: string}>
 * }>}
 * 
 * Why this approach:
 *      - Route API data is cleaner than StopPoint API.
 *      - Avoids duplicate entrances/platforms.
 *      - Guarantees only real networks are stored.
 */
export async function buildFromRoutes(lines) {
    // Map used to ensure each station is only stored once.
    const stationMap = new Map();

    // Array of graph edges between stations.
    const edges = [];

    // Loop through each tube line
    for (const line of lines) {
        // Fetch ordered route sequence for this line.
        const data = await fetchTfl(`/Line/${line.id}/Route/Sequence/all`);

        // Each sequence represents a branch or direction
        data.stopPointSequences.forEach(seq => {
            const stops = seq.stopPoint;

            // Iterate through all stops in order.
            for (let i = 0; i < stops.length; i++) {
                const s = stops[i];

                // Store station only once using ID as key.
                if (!stationMap.has(s.id)) {
                    stationMap.set(s.id, {
                        id: s.id,
                        name: s.name,
                        lat: s.lat,
                        lon: s.lon
                    });
                }

                // Create edge to next station in sequence.
                if (i < stops.length - 1) {
                    edges.push({
                        from: s.id,
                        to: stops[i + 1].id,
                        line: line.id,
                        lineName: line.name
                    })
                }
            }
        })
    }

    // Return final graph structure.
    return {
        stations: Array.from(stationMap.values()),
        edges
    }
}