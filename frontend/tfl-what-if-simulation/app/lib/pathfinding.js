const CHANGE_PENALTY_SECONDS = 300; // 5 min

function makeKey(stationId, line) {
    return `${stationId}__${line ?? "START"}`;
}

function buildUndirectedLineEdgeKey(from, to, line) {
    const a = String(from);
    const b = String(to);
    const l = String(line);
    return a < b ? `${a}-${b}-${l}` : `${b}-${a}-${l}`;
}

function splitKey(k) {
    const [stationId, line] = k.split("__");
    return { stationId, line: line === "START" ? null : line };
}


/**
 * Calculates the shortest route between two stations using Dijkstra's algorithm.
 * 
 * The search treats each station/line combination as a separate state so line 
 * changes can be penalised. It also supports closed stations, closed lines and blocked
 * edges for live disruption and What-If routing.
 * 
 * @param {Object<string, Array<{ to: string, weight: number, line: string }>>} graph - Adjacency-list network graph.
 * @param {string | number} start - Start station id.
 * @param {string | number} end - Destination station id. 
 * @param {Set<string | number>} [closedStations] - Station ids to avoid, except when the station is the destination. 
 * @param {Set<string | number>} [closedLines] - Line ids to avoid. 
 * @param {Set<string>} [blockedEdges] - Undirected line-edges to avoid. 
 * @returns {{ path: Array<string>, totalSeconds: number, changeCount: number, statePath: Array<string> }} Route Result.
 */
export function dijkstra(
    graph,
    start,
    end,
    closedStations = new Set(),
    closedLines = new Set(),
    blockedEdges = new Set(),
) {
    const startId = String(start);
    const endId = String(end);

    const closedSet = new Set([...closedStations].map(String));
    const closedLineSet = new Set([...closedLines].map(String));
    const blockedEdgeSet = new Set([...blockedEdges].map(String));

    const linesByStation = new Map();
    for (const [u, edges] of Object.entries(graph)) {
        const set = new Set();
        for (const e of edges ?? []) set.add(String(e.line ?? "unknown"));
        linesByStation.set(String(u), [...set]);
    }

    const distances = {};
    const previous = {};
    const unvisited = new Set();

    for (const stationId of Object.keys(graph)) {
        const s = String(stationId);

        const startKey = makeKey(s, "START");
        distances[startKey] = Infinity;
        unvisited.add(startKey);

        const linesHere = linesByStation.get(s) ?? [];
        for (const line of linesHere) {
            const k = makeKey(s, line);
            distances[k] = Infinity;
            unvisited.add(k);
        }
    }

    const s0 = makeKey(startId, "START");
    distances[s0] = 0;

    while (unvisited.size > 0) {
        let currentKey = null;
        for (const k of unvisited) if (currentKey === null || distances[k] < distances[currentKey]) currentKey = k;

        if (currentKey === null || distances[currentKey] === Infinity) break;

        unvisited.delete(currentKey);

        const { stationId: u, line: currentLine } = splitKey(currentKey);

        if (u === endId) break;

        for (const edge of graph[u] ?? []) {
            const neighbour = String(edge.to);
            const edgeLine = String(edge.line ?? "unknown");
            const rideTime = Number(edge.weight ?? 0);

            // skip all the closed stations 
            if (closedSet.has(neighbour) && neighbour !== endId) continue;

            // Skip closed lines
            if (closedLineSet.has(edgeLine)) continue;

            const edgeKey = buildUndirectedLineEdgeKey(u, neighbour, edgeLine);
            if (blockedEdgeSet.has(edgeKey)) continue;

            const penalty =
                currentLine && currentLine !== edgeLine 
                    ? CHANGE_PENALTY_SECONDS 
                    : 0;

            const nextKey = makeKey(neighbour, edgeLine);
            if (!unvisited.has(nextKey)) continue;

            const alt = distances[currentKey] + rideTime + penalty;

            if (alt < distances[nextKey]) {
                distances[nextKey] = alt;
                previous[nextKey] = currentKey;
            }
        }
    }

    const endLines = linesByStation.get(endId) ?? [];
    const candidateEndKeys = [
        makeKey(endId, "START"),
        ...endLines.map((l) => makeKey(endId, l)),
    ].filter((k) => k in distances);

    let bestEndKey = null;
    for (const k of candidateEndKeys) if (bestEndKey === null || distances[k] < distances[bestEndKey]) bestEndKey = k;

    if (!bestEndKey || distances[bestEndKey] === Infinity) return { path: [], totalSeconds: Infinity, changeCount: 0 };

    const statePath = [];
    let k = bestEndKey;
    while (k) {
        statePath.unshift(k);
        k = previous[k];
    }

    const path = [];
    let lastStation = null;
    let lastLine = null;
    let changeCount = 0;

    for (const sk of statePath) {
        const { stationId, line } = splitKey(sk);

        if (stationId !== lastStation) path.push(stationId);

        if (line && lastLine && line !== lastLine) changeCount++;
        if (line) lastLine = line;

        lastStation = stationId;
    }

    return {
        path,
        totalSeconds: distances[bestEndKey],
        changeCount,
        statePath
    };
}
