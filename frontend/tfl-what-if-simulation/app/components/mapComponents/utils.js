/**
 * Group edges by station pair
 * Groups all edges connecting the same two stations together
 * 
 * @param {Array} edges - Array of edge objects
 * @returns {Object} Object with station pair keys and arrays of edges as values
 */
export function groupEdges(edges) {
    const groups = {};
    for (const edge of edges) {
        const a = String(edge.from);
        const b = String(edge.to);
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(edge);
    }
    return groups;
}

export function buildUndirectedLineEdgeKey(from, to, line) {
    const a = String(from);
    const b = String(to);
    const l = String(line);
    return a < b ? `${a}-${b}-${l}` : `${b}-${a}-${l}`;
}

/**
 * Deduplicate bidirectional edges
 * Removes duplicate edges where from-to and to-from connections exist
 * 
 * @param {Array} edges - Array of edge objects with from, to, and line properties
 * @returns {Array} Deduplicated array of edges
 */
export function dedupeEdges(edges) {
    const seen = new Set();
    const result = [];
    for (const edge of edges) {
        const key = buildUndirectedLineEdgeKey(edge.from, edge.to, edge.line);
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(edge);
    }
    return result;
}

/**
 * offsetSegment
 * 
 * Compute offset coordinates for overlapping lines to display them side
 * by side.
 * 
 * @param {Array} start - [lat, lon] of starting station. 
 * @param {Array} end - [lat, lon] of ending station. 
 * @param {number} offset - Distance offset in degrees.
 * @returns {Array} - Two coordinates for the offset line.
 */
export function offsetSegment([lat1, lon1], [lat2, lon2], offset) {
    const dx = lon2 - lon1;
    const dy = lat2 - lat1;
    const length = Math.sqrt(dx * dx + dy * dy) || 1;

    const ox = (-dy / length) * offset;
    const oy = (dx / length) * offset;

    return [
        [lat1 + oy, lon1 + ox],
        [lat2 + oy, lon2 + ox],
    ];
}

export function buildNodeById(nodes) {
    const map = new Map();
    for (const n of nodes) map.set(String(n.id), n);
    return map;
}

export function normaliseIdSet(inputSet) {
    const out = new Set();
    for (const v of inputSet) out.add(String(v));
    return out;
}
