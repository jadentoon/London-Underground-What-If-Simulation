import { fetchTfl } from "./tFlClient.js";

export async function fetchAllLines() {
    const lines = await fetchTfl("/Line/Mode/tube");
    return lines.map(line => ({
        id: line.id,
        name: line.name
    }));
}