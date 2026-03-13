import { jest } from '@jest/globals';

jest.setTimeout(10000);

// Helper function to build graph from nodes and edges
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

describe('Graph Building Tests', () => {
  describe('Basic Graph Construction', () => {
    test('should build graph from nodes and edges', () => {
      const nodes = [
        { id: '1', name: 'Station A' },
        { id: '2', name: 'Station B' }
      ];
      
      const edges = [
        { from: '1', to: '2', travel_time: 5, line: 'red' }
      ];
      
      const graph = buildGraph(nodes, edges);
      
      expect(graph).toHaveProperty('1');
      expect(graph).toHaveProperty('2');
      expect(graph['1']).toHaveLength(1);
      expect(graph['2']).toHaveLength(1);
    });

    test('should create bidirectional edges', () => {
      const nodes = [
        { id: '1', name: 'Station A' },
        { id: '2', name: 'Station B' }
      ];
      
      const edges = [
        { from: '1', to: '2', travel_time: 5, line: 'red' }
      ];
      
      const graph = buildGraph(nodes, edges);
      
      // Check forward edge
      expect(graph['1']).toContainEqual({
        to: '2',
        weight: 5,
        line: 'red'
      });
      
      // Check reverse edge
      expect(graph['2']).toContainEqual({
        to: '1',
        weight: 5,
        line: 'red'
      });
    });

    test('should initialize all nodes even without edges', () => {
      const nodes = [
        { id: '1', name: 'Station A' },
        { id: '2', name: 'Station B' },
        { id: '3', name: 'Station C' }
      ];
      
      const edges = [];
      
      const graph = buildGraph(nodes, edges);
      
      expect(graph).toHaveProperty('1');
      expect(graph).toHaveProperty('2');
      expect(graph).toHaveProperty('3');
      expect(graph['1']).toEqual([]);
      expect(graph['2']).toEqual([]);
      expect(graph['3']).toEqual([]);
    });

    test('should handle multiple edges between same nodes on different lines', () => {
      const nodes = [
        { id: '1', name: 'Station A' },
        { id: '2', name: 'Station B' }
      ];
      
      const edges = [
        { from: '1', to: '2', travel_time: 5, line: 'red' },
        { from: '1', to: '2', travel_time: 6, line: 'blue' }
      ];
      
      const graph = buildGraph(nodes, edges);
      
      expect(graph['1']).toHaveLength(2);
      expect(graph['2']).toHaveLength(2);
    });
  });

  describe('Edge Properties', () => {
    test('should correctly store travel time as weight', () => {
      const nodes = [
        { id: '1' },
        { id: '2' }
      ];
      
      const edges = [
        { from: '1', to: '2', travel_time: 10, line: 'red' }
      ];
      
      const graph = buildGraph(nodes, edges);
      
      expect(graph['1'][0].weight).toBe(10);
      expect(graph['2'][0].weight).toBe(10);
    });

    test('should correctly store line information', () => {
      const nodes = [
        { id: '1' },
        { id: '2' }
      ];
      
      const edges = [
        { from: '1', to: '2', travel_time: 5, line: 'jubilee' }
      ];
      
      const graph = buildGraph(nodes, edges);
      
      expect(graph['1'][0].line).toBe('jubilee');
      expect(graph['2'][0].line).toBe('jubilee');
    });

    test('should convert line to string', () => {
      const nodes = [
        { id: '1' },
        { id: '2' }
      ];
      
      const edges = [
        { from: '1', to: '2', travel_time: 5, line: 123 }
      ];
      
      const graph = buildGraph(nodes, edges);
      
      expect(graph['1'][0].line).toBe('123');
      expect(typeof graph['1'][0].line).toBe('string');
    });
  });

  describe('Node ID Type Handling', () => {
    test('should convert numeric node IDs to strings', () => {
      const nodes = [
        { id: 1, name: 'Station A' },
        { id: 2, name: 'Station B' }
      ];
      
      const edges = [
        { from: 1, to: 2, travel_time: 5, line: 'red' }
      ];
      
      const graph = buildGraph(nodes, edges);
      
      expect(graph).toHaveProperty('1');
      expect(graph).toHaveProperty('2');
      expect(graph['1'][0].to).toBe('2');
    });

    test('should handle mixed string and number IDs', () => {
      const nodes = [
        { id: '1', name: 'Station A' },
        { id: 2, name: 'Station B' }
      ];
      
      const edges = [
        { from: '1', to: 2, travel_time: 5, line: 'red' }
      ];
      
      const graph = buildGraph(nodes, edges);
      
      expect(graph).toHaveProperty('1');
      expect(graph).toHaveProperty('2');
    });
  });

  describe('Invalid Edge Handling', () => {
    test('should skip edges with non-existent from node', () => {
      const nodes = [
        { id: '1', name: 'Station A' },
        { id: '2', name: 'Station B' }
      ];
      
      const edges = [
        { from: '999', to: '2', travel_time: 5, line: 'red' },
        { from: '1', to: '2', travel_time: 3, line: 'blue' }
      ];
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const graph = buildGraph(nodes, edges);
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(graph['2']).toHaveLength(1); // Only the valid edge
      expect(graph).not.toHaveProperty('999');
      
      consoleSpy.mockRestore();
    });

    test('should skip edges with non-existent to node', () => {
      const nodes = [
        { id: '1', name: 'Station A' },
        { id: '2', name: 'Station B' }
      ];
      
      const edges = [
        { from: '1', to: '999', travel_time: 5, line: 'red' },
        { from: '1', to: '2', travel_time: 3, line: 'blue' }
      ];
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const graph = buildGraph(nodes, edges);
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(graph['1']).toHaveLength(1); // Only the valid edge
      expect(graph).not.toHaveProperty('999');
      
      consoleSpy.mockRestore();
    });

    test('should log warning for invalid edges', () => {
      const nodes = [
        { id: '1', name: 'Station A' }
      ];
      
      const edges = [
        { from: '1', to: '999', travel_time: 5, line: 'red' }
      ];
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      buildGraph(nodes, edges);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid edge: ',
        expect.objectContaining({ from: '1', to: '999' })
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Complex Network Structures', () => {
    test('should build star topology correctly', () => {
      const nodes = [
        { id: 'hub' },
        { id: 'spoke1' },
        { id: 'spoke2' },
        { id: 'spoke3' }
      ];
      
      const edges = [
        { from: 'hub', to: 'spoke1', travel_time: 5, line: 'red' },
        { from: 'hub', to: 'spoke2', travel_time: 5, line: 'blue' },
        { from: 'hub', to: 'spoke3', travel_time: 5, line: 'green' }
      ];
      
      const graph = buildGraph(nodes, edges);
      
      expect(graph['hub']).toHaveLength(3);
      expect(graph['spoke1']).toHaveLength(1);
      expect(graph['spoke2']).toHaveLength(1);
      expect(graph['spoke3']).toHaveLength(1);
    });

    test('should build ring topology correctly', () => {
      const nodes = [
        { id: '1' },
        { id: '2' },
        { id: '3' },
        { id: '4' }
      ];
      
      const edges = [
        { from: '1', to: '2', travel_time: 5, line: 'circle' },
        { from: '2', to: '3', travel_time: 5, line: 'circle' },
        { from: '3', to: '4', travel_time: 5, line: 'circle' },
        { from: '4', to: '1', travel_time: 5, line: 'circle' }
      ];
      
      const graph = buildGraph(nodes, edges);
      
      expect(graph['1']).toHaveLength(2); // Connected to 2 and 4
      expect(graph['2']).toHaveLength(2); // Connected to 1 and 3
      expect(graph['3']).toHaveLength(2); // Connected to 2 and 4
      expect(graph['4']).toHaveLength(2); // Connected to 3 and 1
    });

    test('should handle dense graph with multiple connections', () => {
      const nodes = [
        { id: '1' },
        { id: '2' },
        { id: '3' }
      ];
      
      const edges = [
        { from: '1', to: '2', travel_time: 5, line: 'red' },
        { from: '2', to: '3', travel_time: 5, line: 'red' },
        { from: '1', to: '3', travel_time: 8, line: 'blue' }
      ];
      
      const graph = buildGraph(nodes, edges);
      
      expect(graph['1']).toHaveLength(2); // Connected to 2 and 3
      expect(graph['2']).toHaveLength(2); // Connected to 1 and 3
      expect(graph['3']).toHaveLength(2); // Connected to 1 and 2
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty nodes array', () => {
      const nodes = [];
      const edges = [];
      
      const graph = buildGraph(nodes, edges);
      
      expect(graph).toEqual({});
    });

    test('should handle empty edges array with nodes', () => {
      const nodes = [
        { id: '1', name: 'Station A' }
      ];
      const edges = [];
      
      const graph = buildGraph(nodes, edges);
      
      expect(graph['1']).toEqual([]);
    });

    test('should handle self-loop edges', () => {
      const nodes = [
        { id: '1', name: 'Station A' }
      ];
      
      const edges = [
        { from: '1', to: '1', travel_time: 0, line: 'loop' }
      ];
      
      const graph = buildGraph(nodes, edges);
      
      // Self-loop should create two edges pointing to itself
      expect(graph['1']).toHaveLength(2);
      expect(graph['1'][0].to).toBe('1');
      expect(graph['1'][1].to).toBe('1');
    });

    test('should handle large travel times', () => {
      const nodes = [
        { id: '1' },
        { id: '2' }
      ];
      
      const edges = [
        { from: '1', to: '2', travel_time: 999999, line: 'slow' }
      ];
      
      const graph = buildGraph(nodes, edges);
      
      expect(graph['1'][0].weight).toBe(999999);
    });

    test('should handle zero travel time', () => {
      const nodes = [
        { id: '1' },
        { id: '2' }
      ];
      
      const edges = [
        { from: '1', to: '2', travel_time: 0, line: 'instant' }
      ];
      
      const graph = buildGraph(nodes, edges);
      
      expect(graph['1'][0].weight).toBe(0);
    });
  });

  describe('Data Integrity', () => {
    test('should not mutate original nodes array', () => {
      const nodes = [
        { id: '1', name: 'Station A' },
        { id: '2', name: 'Station B' }
      ];
      
      const nodesCopy = JSON.parse(JSON.stringify(nodes));
      const edges = [];
      
      buildGraph(nodes, edges);
      
      expect(nodes).toEqual(nodesCopy);
    });

    test('should not mutate original edges array', () => {
      const nodes = [
        { id: '1' },
        { id: '2' }
      ];
      
      const edges = [
        { from: '1', to: '2', travel_time: 5, line: 'red' }
      ];
      
      const edgesCopy = JSON.parse(JSON.stringify(edges));
      
      buildGraph(nodes, edges);
      
      expect(edges).toEqual(edgesCopy);
    });

    test('should create independent edge objects', () => {
      const nodes = [
        { id: '1' },
        { id: '2' }
      ];
      
      const edges = [
        { from: '1', to: '2', travel_time: 5, line: 'red' }
      ];
      
      const graph = buildGraph(nodes, edges);
      
      // Modify the graph edge
      graph['1'][0].weight = 100;
      
      // Original edge should be unchanged
      expect(edges[0].travel_time).toBe(5);
    });
  });
});
