import { fetchTfl } from "./tFlClient.js";

/**
 * fetchAllLines - Fetches all tube lines from TfL API.
 * 
 * @returns {Promise<Array<{id: string, name: string}>>} - Array of tube line objects,
 *          each containing its 'id' and 'name'.
 */
export async function fetchAllLines() {
    const lines = await fetchTfl("/Line/Mode/tube");
    return lines.map(line => ({
        id: line.id,
        name: line.name
    }));
}