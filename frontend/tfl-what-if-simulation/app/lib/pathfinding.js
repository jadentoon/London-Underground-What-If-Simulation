export function dijkstra(graph, start, end, closedStations = new Set(), closedLines = new Set()) {
    const distances = {};
    const previous = {};
    const unvisited = new Set(Object.keys(graph));

    const closedSet = new Set([...closedStations].map(String));
    const closedLineSet = new Set([...closedLines].map(String));

    for (const node of unvisited){
        distances[node] = Infinity;
    }

    distances[start] = 0;

    while (unvisited.size > 0) {
        const current = [...unvisited].reduce((a, b) => 
            distances[a] < distances[b] ? a : b
        );

        if (distances[current] === Infinity) break;
        if (current === end) break;

        unvisited.delete(current);

        for (const edge of graph[current]) {
            const neighbour = String(edge.to);
            const line = String(edge.line ?? "");
            
            // akip all the closed stations 
            if (closedSet.has(neighbour) && neighbour !== end) {
                continue;
            }

            // Skip connections that belong to a closed line.
            if (line && closedLineSet.has(line)) {
                continue;
            }
            
            const alt = distances[current] + edge.weight;

            if(alt < distances[neighbour]) {
                distances[neighbour] = alt;
                previous[neighbour] = current;
            }
        }
    }

    if (distances[end] === Infinity) return [];

    const path = [];
    let curr = end;

    while (curr) {
        path.unshift(curr);
        curr = previous[curr];
    }

    return path;
}
