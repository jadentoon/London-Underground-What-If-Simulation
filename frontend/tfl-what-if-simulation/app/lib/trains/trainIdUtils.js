/**
 * Normalises TfL stop Identifies so live API data matches the station IDs
 * used in the app graph.
 * 
 * @param {string | null | undefined} rawId - Id of the stop before being normalised.
 * @returns - Station-level stop ID, or an empty string if no ID is provided.
 */
export function normaliseTflStopId(rawId) {
    const id = String(rawId || "");
    if (!id) return "";

    if (id.startsWith("9400ZZ")) {
        let body = id.slice(4);
        if (body.startsWith("ZZLU") && /\d$/.test(body)) {
            body = body.slice(0, -1);
        }
        return `940G${body}`;
    }
    return id;
}

/**
 * Reduces station names to a comparable search key for matching noisy live
 * feed text against graph station names.
 * 
 * @param {string | null | undefined} name - Name of the station before being normalised.
 * @returns - Lowercased station name with transport suffixes and punctuation removed.
 */
export function normaliseStationName(name) {
    return String(name || "")
        .toLowerCase()
        .replace(/\b(underground|station|rail)\b/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

/**
 * Parses an ISO-style timestamp into epoch milliseconds, returning null
 * when the input is missing or invalid.
 * 
 * @param {string | null | undefined} value - Timestamp value from the live feed.
 * @returns - Parsed epoch time in milliseconds, or null if invalid.
 */
export function parseTimestampMs(value) {
    if (!value) return null;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
}
