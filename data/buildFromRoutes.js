import { fetchTfl } from "./tFlClient.js"

export async function buildFromRoutes(lines) {
    const stationMap = new Map();
    const edges = [];

    for (const line of lines) {
        const data = await fetchTfl(`/Line/${line.id}/Route/Sequence/all`);

        data.stopPointSequences.forEach(seq => {
            const stops = seq.stopPoint;

            for (let i = 0; i < stops.length; i++) {
                const s = stops[i];

                if (!stationMap.has(s.id)) {
                    stationMap.set(s.id, {
                        id: s.id,
                        name: s.name,
                        lat: s.lat,
                        lon: s.lon
                    });
                }

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

    return {
        stations: Array.from(stationMap.values()),
        edges
    }
}