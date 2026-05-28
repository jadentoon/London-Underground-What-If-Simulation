import { buildGraph } from "../frontend/tfl-what-if-simulation/app/lib/graph.js";
import { dijkstra } from "../frontend/tfl-what-if-simulation/app/lib/pathfinding.js";

function findReachableStationIds(graph, startId) {
  const start = String(startId);
  const visited = new Set();
  const queue = [start];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    for (const edge of graph[current] ?? []) {
      if (!visited.has(edge.to)) queue.push(edge.to);
    }
  }

  return visited;
}

describe("graph validation checks", () => {
  test("confirms a sample network has no orphan stations and every node is reachable from the hub", () => {
    const nodes = [
      { id: "hub", name: "Central Hub" },
      { id: "a", name: "Station A" },
      { id: "b", name: "Station B" },
      { id: "c", name: "Station C" },
      { id: "d", name: "Station D" },
    ];
    const edges = [
      { from: "hub", to: "a", travel_time: 2, line: "red" },
      { from: "a", to: "b", travel_time: 2, line: "red" },
      { from: "hub", to: "c", travel_time: 3, line: "blue" },
      { from: "c", to: "d", travel_time: 3, line: "blue" },
    ];

    const graph = buildGraph(nodes, edges);
    const reachable = findReachableStationIds(graph, "hub");

    expect([...reachable].sort()).toEqual(["a", "b", "c", "d", "hub"]);
    for (const node of nodes) {
      expect(Array.isArray(graph[node.id])).toBe(true);
      expect(graph[node.id].length).toBeGreaterThan(0);
    }
  });

  test("detects isolated subgraphs by listing unreachable stations from the hub", () => {
    const nodes = [
      { id: "hub" },
      { id: "a" },
      { id: "b" },
      { id: "x" },
      { id: "y" },
    ];
    const edges = [
      { from: "hub", to: "a", travel_time: 2, line: "red" },
      { from: "a", to: "b", travel_time: 2, line: "red" },
      { from: "x", to: "y", travel_time: 2, line: "green" },
    ];

    const graph = buildGraph(nodes, edges);
    const reachable = findReachableStationIds(graph, "hub");
    const unreachable = nodes
      .map((node) => node.id)
      .filter((id) => !reachable.has(id))
      .sort();

    expect(unreachable).toEqual(["x", "y"]);
  });

  test("returns a detour when a major hub closes but an alternate corridor still exists", () => {
    const graph = buildGraph(
      [
        { id: "a" },
        { id: "hub" },
        { id: "b" },
        { id: "d" },
        { id: "e" },
      ],
      [
        { from: "a", to: "hub", travel_time: 1, line: "red" },
        { from: "hub", to: "b", travel_time: 1, line: "red" },
        { from: "a", to: "d", travel_time: 2, line: "blue" },
        { from: "d", to: "e", travel_time: 2, line: "blue" },
        { from: "e", to: "b", travel_time: 2, line: "blue" },
      ],
    );

    const rerouted = dijkstra(graph, "a", "b", new Set(["hub"]));

    expect(rerouted.path).toEqual(["a", "d", "e", "b"]);
    expect(rerouted.totalSeconds).toBe(6);
  });

  test("returns no route when a hub closure cuts the only corridor", () => {
    const graph = buildGraph(
      [{ id: "a" }, { id: "hub" }, { id: "b" }],
      [
        { from: "a", to: "hub", travel_time: 1, line: "red" },
        { from: "hub", to: "b", travel_time: 1, line: "red" },
      ],
    );

    const result = dijkstra(graph, "a", "b", new Set(["hub"]));

    expect(result.path).toEqual([]);
    expect(result.totalSeconds).toBe(Infinity);
  });
});
