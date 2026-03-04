import { jest } from '@jest/globals';

jest.setTimeout(10000);

//helper function to build graph from nodes and edges
function buildGraph(nodes, edges) {
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
            weight: edge.travel_time,
            line: String(edge.line),
        });

        graph[to].push({
            to: from,
            weight: edge.travel_time,
            line: String(edge.line),
        });
    });
    return graph;
}

//helper function to build edge keys
function buildUndirectedLineEdgeKey(from, to, line) {
    const a = String(from);
    const b = String(to);
    const l = String(line);
    return a < b ? `${a}-${b}-${l}` : `${b}-${a}-${l}`;
}

// Dijkstra pathfinding implementation
function dijkstra(
    graph,
    start,
    end,
    closedStations = new Set(),
    closedLines = new Set(),
    blockedEdges = new Set()
) {
    const distances = {};
    const previous = {};
    const unvisited = new Set(Object.keys(graph));

    const closedSet = new Set([...closedStations].map(String));
    const closedLineSet = new Set([...closedLines].map(String));
    const blockedEdgeSet = new Set([...blockedEdges].map(String));

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
            const edgeKey = buildUndirectedLineEdgeKey(current, neighbour, line);
            
            //skip all the closed stations 
            if (closedSet.has(neighbour) && neighbour !== end) {
                continue;
            }

            //skip connections that belong to a closed line.
            if (line && closedLineSet.has(line)) {
                continue;
            }

            //skip blocked segments (used for partial-closure station ranges).
            if (blockedEdgeSet.has(edgeKey)) {
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

describe('Pathfinding Algorithm Tests - Dijkstra', () => {
  //mock graph data for testing
  const mockNodes = [
    { id: '1', name: 'Station A' },
    { id: '2', name: 'Station B' },
    { id: '3', name: 'Station C' },
    { id: '4', name: 'Station D' },
    { id: '5', name: 'Station E' },
    { id: '6', name: 'Station F' }
  ];

  const mockEdges = [
    { from: '1', to: '2', travel_time: 5, line: 'red' },
    { from: '2', to: '3', travel_time: 3, line: 'red' },
    { from: '3', to: '4', travel_time: 4, line: 'red' },
    { from: '1', to: '5', travel_time: 10, line: 'blue' },
    { from: '5', to: '4', travel_time: 2, line: 'blue' },
    { from: '2', to: '6', travel_time: 2, line: 'green' },
    { from: '6', to: '4', travel_time: 3, line: 'green' }
  ];

  let graph;

  beforeAll(() => {
    graph = buildGraph(mockNodes, mockEdges);
  });

  describe('Basic Pathfinding', () => {
    test('should find shortest path between two connected stations', () => {
      const path = dijkstra(graph, '1', '4');
      
      expect(path).toBeDefined();
      expect(path.length).toBeGreaterThan(0);
      expect(path[0]).toBe('1');
      expect(path[path.length - 1]).toBe('4');
    });

    test('should return path with correct sequence - direct route', () => {
      const path = dijkstra(graph, '1', '2');
      
      expect(path).toEqual(['1', '2']);
    });

    test('should find optimal path considering travel times', () => {
      const path = dijkstra(graph, '1', '4');
      
      //shortest path should be 1->2->6->4 (5+2+3=10) or 1->2->3->4 (5+3+4=12)
      //or 1->5->4 (10+2=12)
      //best is 1->2->6->4 = 10
      expect(path).toEqual(['1', '2', '6', '4']);
    });

    test('should return empty array when no path exists', () => {
      //add disconnected node
      const isolatedGraph = {
        '1': [],
        '2': []
      };
      
      const path = dijkstra(isolatedGraph, '1', '2');
      
      expect(path).toEqual([]);
    });

    test('should handle same start and end station', () => {
      const path = dijkstra(graph, '1', '1');
      
      expect(path).toEqual(['1']);
    });
  });

  describe('Closed Stations', () => {
    test('should route around a closed station', () => {
      const closedStations = new Set(['2']);
      const path = dijkstra(graph, '1', '4', closedStations);
      
      expect(path).toBeDefined();
      expect(path).not.toContain('2');
      expect(path[0]).toBe('1');
      expect(path[path.length - 1]).toBe('4');
    });

    test('should still reach closed station if it is the destination', () => {
      const closedStations = new Set(['4']);
      const path = dijkstra(graph, '1', '4', closedStations);
      
      expect(path).toBeDefined();
      expect(path[path.length - 1]).toBe('4');
    });

    test('should return empty array when all intermediate stations are closed', () => {
      const closedStations = new Set(['2', '5', '6']);
      const path = dijkstra(graph, '1', '4', closedStations);
      
      expect(path).toEqual([]);
    });

    test('should handle multiple closed stations', () => {
      const closedStations = new Set(['2', '3']);
      const path = dijkstra(graph, '1', '4', closedStations);
      
      expect(path).toBeDefined();
      expect(path).not.toContain('2');
      expect(path).not.toContain('3');
    });
  });

  describe('Closed Lines', () => {
    test('should avoid connections on a closed line', () => {
      const closedLines = new Set(['red']);
      const path = dijkstra(graph, '1', '4', new Set(), closedLines);
      
      expect(path).toBeDefined();
      expect(path[0]).toBe('1');
      expect(path[path.length - 1]).toBe('4');
      //path should use blue or green line, not red
      expect(path).toEqual(['1', '5', '4']); // Using blue line
    });

    test('should return empty array when only available line is closed', () => {
      //create a graph where only one line connects two stations
      const singleLineGraph = {
        '1': [{ to: '2', weight: 5, line: 'red' }],
        '2': [{ to: '1', weight: 5, line: 'red' }]
      };
      
      const closedLines = new Set(['red']);
      const path = dijkstra(singleLineGraph, '1', '2', new Set(), closedLines);
      
      expect(path).toEqual([]);
    });

    test('should handle multiple closed lines', () => {
      const closedLines = new Set(['red', 'blue']);
      const path = dijkstra(graph, '1', '4', new Set(), closedLines);
      
      expect(path).toBeDefined();
      //should use green line: 1->2->6->4, but red is closed so can't go 1->2
      //actually with both red and blue closed, there's no path from 1 to 4
      expect(path).toEqual([]);
    });
  });

  describe('Blocked Edges', () => {
    test('should route around a blocked edge segment', () => {
      //block the edge between 1 and 2 on red line
      const blockedEdges = new Set(['1-2-red']);
      const path = dijkstra(graph, '1', '4', new Set(), new Set(), blockedEdges);
      
      expect(path).toBeDefined();
      // should take alternative route through blue line
      expect(path).toEqual(['1', '5', '4']);
    });

    test('should handle bidirectional edge blocking', () => {
      //block should work in both directions
      const blockedEdges = new Set(['2-1-red']); // Opposite direction
      const path = dijkstra(graph, '1', '4', new Set(), new Set(), blockedEdges);
      
      expect(path).toBeDefined();
      expect(path).toEqual(['1', '5', '4']);
    });

    test('should handle multiple blocked edges', () => {
      const blockedEdges = new Set(['1-2-red', '5-4-blue']);
      const path = dijkstra(graph, '1', '4', new Set(), new Set(), blockedEdges);
      
      // can't use 1->2 or 5->4, but can't reach 4 without these
      // actually, no path should exist now
      expect(path).toEqual([]);
    });

    test('should still find path when blocked edge is not on optimal route', () => {
      const blockedEdges = new Set(['3-4-red']); //block a non-optimal edge
      const path = dijkstra(graph, '1', '4', new Set(), new Set(), blockedEdges);
      
      expect(path).toBeDefined();
      expect(path[0]).toBe('1');
      expect(path[path.length - 1]).toBe('4');
    });
  });

  describe('Combined Constraints', () => {
    test('should handle closed stations and closed lines together', () => {
      const closedStations = new Set(['3']);
      const closedLines = new Set(['blue']);
      const path = dijkstra(graph, '1', '4', closedStations, closedLines);
      
      expect(path).toBeDefined();
      expect(path).not.toContain('3');
      //should use 1->2->6->4 (green line)
      expect(path).toEqual(['1', '2', '6', '4']);
    });

    test('should handle all three constraint types simultaneously', () => {
      const closedStations = new Set(['3']);
      const closedLines = new Set(['blue']);
      const blockedEdges = new Set(['6-4-green']);
      const path = dijkstra(graph, '1', '4', closedStations, closedLines, blockedEdges);
      
      //with station 3 closed, blue line closed, and 6->4 blocked, no path exists
      expect(path).toEqual([]);
    });

    test('should find alternative route with multiple constraints', () => {
      const closedStations = new Set(['6']);
      const closedLines = new Set(['blue']);
      const path = dijkstra(graph, '1', '4', closedStations, closedLines);
      
      expect(path).toBeDefined();
      //should use red line: 1->2->3->4
      expect(path).toEqual(['1', '2', '3', '4']);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty graph', () => {
      const emptyGraph = {};
      const path = dijkstra(emptyGraph, '1', '2');
      
      expect(path).toEqual([]);
    });

    test('should handle single node graph', () => {
      const singleNodeGraph = {
        '1': []
      };
      const path = dijkstra(singleNodeGraph, '1', '1');
      
      expect(path).toEqual(['1']);
    });

    test('should handle non-existent start node', () => {
      const path = dijkstra(graph, '999', '4');
      
      expect(path).toEqual([]);
    });

    test('should handle non-existent end node', () => {
      const path = dijkstra(graph, '1', '999');
      
      expect(path).toEqual([]);
    });

    test('should handle nodes with no connections', () => {
      const graphWithIsolated = {
        ...graph,
        '999': []
      };
      const path = dijkstra(graphWithIsolated, '1', '999');
      
      expect(path).toEqual([]);
    });

    test('should handle zero weight edges', () => {
      const zeroWeightGraph = {
        '1': [{ to: '2', weight: 0, line: 'red' }],
        '2': [{ to: '1', weight: 0, line: 'red' }]
      };
      const path = dijkstra(zeroWeightGraph, '1', '2');
      
      expect(path).toEqual(['1', '2']);
    });
  });

  describe('Path Properties', () => {
    test('path should always start with start node', () => {
      const path = dijkstra(graph, '1', '4');
      
      expect(path[0]).toBe('1');
    });

    test('path should always end with end node', () => {
      const path = dijkstra(graph, '1', '4');
      
      expect(path[path.length - 1]).toBe('4');
    });

    test('path should contain unique nodes (no cycles)', () => {
      const path = dijkstra(graph, '1', '4');
      
      const uniqueNodes = new Set(path);
      expect(path.length).toBe(uniqueNodes.size);
    });

    test('path nodes should be connected in sequence', () => {
      const path = dijkstra(graph, '1', '4');
      
      for (let i = 0; i < path.length - 1; i++) {
        const currentNode = path[i];
        const nextNode = path[i + 1];
        
        //check if next node is in the adjacency list of current node
        const neighbors = graph[currentNode].map(edge => edge.to);
        expect(neighbors).toContain(nextNode);
      }
    });
  });

  describe('Complex Network Scenarios', () => {
    test('should handle triangular network topology', () => {
      const triangleGraph = buildGraph(
        [{ id: '1' }, { id: '2' }, { id: '3' }],
        [
          { from: '1', to: '2', travel_time: 5, line: 'red' },
          { from: '2', to: '3', travel_time: 5, line: 'red' },
          { from: '3', to: '1', travel_time: 5, line: 'red' }
        ]
      );
      
      const path = dijkstra(triangleGraph, '1', '2');
      expect(path).toEqual(['1', '2']);
    });

    test('should find shortest path in network with multiple routes of same length', () => {
      const multiRouteGraph = buildGraph(
        [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
        [
          { from: '1', to: '2', travel_time: 5, line: 'red' },
          { from: '2', to: '4', travel_time: 5, line: 'red' },
          { from: '1', to: '3', travel_time: 5, line: 'blue' },
          { from: '3', to: '4', travel_time: 5, line: 'blue' }
        ]
      );
      
      const path = dijkstra(multiRouteGraph, '1', '4');
      
      expect(path).toBeDefined();
      expect(path[0]).toBe('1');
      expect(path[path.length - 1]).toBe('4');
      expect(path.length).toBe(3); //should be length 3 for either route
    });

    test('should handle hub-and-spoke topology', () => {
      const hubSpokeGraph = buildGraph(
        [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }],
        [
          { from: '1', to: '2', travel_time: 2, line: 'red' },    //hub is 1
          { from: '1', to: '3', travel_time: 2, line: 'blue' },
          { from: '1', to: '4', travel_time: 2, line: 'green' },
          { from: '1', to: '5', travel_time: 2, line: 'yellow' }
        ]
      );
      
      const path = dijkstra(hubSpokeGraph, '2', '5');
      
      expect(path).toEqual(['2', '1', '5']); //must go through hub
    });
  });
});
