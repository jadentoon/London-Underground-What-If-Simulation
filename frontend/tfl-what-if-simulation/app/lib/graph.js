export function buildGraph(nodes, edges) {
    const graph = {};

    nodes.forEach(node => {
        const id = String(node.id);
        graph[id] = [];
    });

    edges.forEach(edge => {
        const from = String(edge.from);
        const to = String(edge.to);
        
        if (!graph[from] || !graph[to]){
            console.warn("Invalid edge: ", edge);
            return;
        }

        graph[from].push({
            to,
            weight: edge.distance,
        });

        graph[to].push({
            to: from,
            weight: edge.distance,
        });
    });

    return graph;
}