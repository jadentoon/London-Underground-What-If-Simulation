import { fetchTfl } from "./tFlClient.js"

/**
 * haversineDistance
 * 
 * Calculate the straight-line distance between 2 points on Earth.
 * This uses the Haversine formula, which takes the Earth's curvature into account.
 * Perfect for estimating distances between 2 tube stations.
 * 
 * @param {number} lat1 - Latitude of the first station in degrees (north/south) 
 * @param {number} lon1 - Longitude of the first station in degrees (east/west) 
 * @param {number} lat2 - Latitude of the second station in degrees.
 * @param {number} lon2 - Longitude of the second station in degrees.
 * @returns {number} Distance in meters
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRadians = deg => deg * (Math.PI / 180); // Average radius of the Earth

    const earthRadius = 6371000; // Radius of the Earth in meters

    const lat1InRadians = toRadians(lat1);
    const lat2InRadians = toRadians(lat2);

    const diffInLatitude = toRadians(lat2 - lat1);
    const diffInLongitude = toRadians(lon2 - lon1);

    const halfChordLengthSquared = Math.sin(diffInLatitude / 2) ** 2 +
        Math.cos(lat1InRadians) *
        Math.cos(lat2InRadians) *
        Math.sin(diffInLongitude / 2) ** 2;
    
    const angularDistance = 2 * Math.atan2(Math.sqrt(halfChordLengthSquared), Math.sqrt(1 - halfChordLengthSquared));

    const distanceInMeters = earthRadius * angularDistance;

    return distanceInMeters;
}
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
 *  edges: Array<{from: string, to: string, line: string, lineName: string, distance: number}>
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
                    const nextStop = stops[i + 1];
                    const distance = haversineDistance(s.lat, s.lon, nextStop.lat, nextStop.lon);

                    edges.push({
                        from: s.id,
                        to: stops[i + 1].id,
                        line: line.id,
                        lineName: line.name,
                        distance: distance
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