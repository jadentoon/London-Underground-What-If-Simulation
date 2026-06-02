/**
 * Builds an undirected adjacency-list graph from station nodes and connection edges.
 * 
 * The pathfinding layer expects each station id to map to an array of connected
 * stations with travel-time weights and line metadata. Invalid edges are skipped
 * so incomplete API/database data does not break the whole graph.
 * 
 * @param {Array<{ id: string | number }>} nodes - Station nodes in the network. 
 * @param {Array<{ from: string | number, to : string | number, line: string, travel_time: number }>} edges - Station connections.
 * @returns {Object<string, Array<{ to: string, weight: number, line: string }>>} Adjacency-list graph.
 */
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
