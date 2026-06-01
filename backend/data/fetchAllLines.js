import { fetchTfl } from "./tFlClient.js";

/**
 * fetchAllLines - Fetches all tube lines from TfL API.
 * 
 * @returns {Promise<Array<{id: string, name: string}>>} - Array of tube line objects,
 *          each containing its 'id' and 'name'.
 * 
 * Usage:
 *      const lines = await fetcheAllLines();
 * 
 * Notes:
 *      - The TfL API returns a list of all lines for the tube mode.
 *      - The `id` is used for other TfL API calls, e.g., fetching routes.
 *      - The  `name` is human-readable and useful for logging or UI.
 */
export async function fetchAllLines() {
    // Fetch all tube lines from the TfL API
    const lines = await fetchTfl("/Line/Mode/tube");

    // Map the raw API data to a simplified format
    return lines.map(line => ({
        id: line.id,        // Unique identifier for API calls
        name: line.name     // Human-readable name
    }));
}