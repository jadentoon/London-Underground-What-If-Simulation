export function buildGraph(nodes, edges) {
    const graph = {};

    nodes.forEach(node => {
        const id = String(node.id);
        graph[id] = [];
    });

    edges.forEach(edge => {
        const from = String(edge.from);
        const to = String(edge.to);
        const line = String(edge.line)
        
        if (!graph[from] || !graph[to]){
            console.warn("Invalid edge: ", edge);
            return;
        }

        graph[from].push({
            to,
            weight: edge.travel_time,
            line: line,
        });

        graph[to].push({
            to: from,
            weight: edge.travel_time,
            line: line,
        });
    });
    return graph;
}
