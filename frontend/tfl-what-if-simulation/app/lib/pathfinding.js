export function dijkstra(graph, start, end) {
    const distances = {};
    const previous = {};
    const unvisited = new Set(Object.keys(graph));

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