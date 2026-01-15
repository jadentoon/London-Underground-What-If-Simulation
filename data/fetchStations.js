import { fetchTfl } from "./tFlClient.js";

export async function getStations() {
    const data = await fetchTfl("/StopPoint/Mode/tube");

    return data.stopPoints.map(s => ({
        id: s.id,
        name: s.commonName,
        lat: s.lat,
        lon: s.lon,
        parentId: s.parentId || null
    }));
}