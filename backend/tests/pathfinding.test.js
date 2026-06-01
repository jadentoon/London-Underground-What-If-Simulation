import { buildGraph } from "../../frontend/tfl-what-if-simulation/app/lib/graph.js";
import { dijkstra } from "../../frontend/tfl-what-if-simulation/app/lib/pathfinding.js";

function buildUndirectedLineEdgeKey(from, to, line) {
  const a = String(from);
  const b = String(to);
  const l = String(line);
  return a < b ? `${a}-${b}-${l}` : `${b}-${a}-${l}`;
}

describe("dijkstra", () => {
  const baseNodes = [
    { id: "1", name: "Station A" },
    { id: "2", name: "Station B" },
    { id: "3", name: "Station C" },
    { id: "4", name: "Station D" },
    { id: "5", name: "Station E" },
    { id: "6", name: "Station F" },
  ];

  const baseEdges = [
    { from: "1", to: "2", travel_time: 4, line: "red" },
    { from: "2", to: "3", travel_time: 4, line: "red" },
    { from: "3", to: "4", travel_time: 4, line: "red" },
    { from: "1", to: "5", travel_time: 20, line: "blue" },
    { from: "5", to: "4", travel_time: 20, line: "blue" },
    { from: "2", to: "6", travel_time: 2, line: "green" },
    { from: "6", to: "4", travel_time: 2, line: "green" },
  ];

  function makeBaseGraph() {
    return buildGraph(baseNodes, baseEdges);
  }

  test("returns the direct path and totals on a single line", () => {
    const result = dijkstra(makeBaseGraph(), "1", "2");

    expect(result.path).toEqual(["1", "2"]);
    expect(result.totalSeconds).toBe(4);
    expect(result.changeCount).toBe(0);
  });

  test("returns the start node when start and end are the same", () => {
    const result = dijkstra(makeBaseGraph(), "1", "1");

    expect(result.path).toEqual(["1"]);
    expect(result.totalSeconds).toBe(0);
    expect(result.changeCount).toBe(0);
  });

  test("prefers staying on one line when changing lines would be heavily penalised", () => {
    const result = dijkstra(makeBaseGraph(), "1", "4");

    expect(result.path).toEqual(["1", "2", "3", "4"]);
    expect(result.totalSeconds).toBe(12);
    expect(result.changeCount).toBe(0);
  });

  test("counts a line change in the total travel time when a change is required", () => {
    const graph = buildGraph(
      [{ id: "1" }, { id: "2" }, { id: "3" }],
      [
        { from: "1", to: "2", travel_time: 3, line: "red" },
        { from: "2", to: "3", travel_time: 4, line: "green" },
      ],
    );

    const result = dijkstra(graph, "1", "3");

    expect(result.path).toEqual(["1", "2", "3"]);
    expect(result.totalSeconds).toBe(307);
    expect(result.changeCount).toBe(1);
  });

  test("routes around a closed station when an alternative exists", () => {
    const result = dijkstra(makeBaseGraph(), "1", "4", new Set(["2"]));

    expect(result.path).toEqual(["1", "5", "4"]);
    expect(result.totalSeconds).toBe(40);
  });

  test("recomputes to a different route after a station disruption closes the main hub", () => {
    const baseline = dijkstra(makeBaseGraph(), "1", "4");
    const rerouted = dijkstra(makeBaseGraph(), "1", "4", new Set(["2"]));

    expect(baseline.path).toEqual(["1", "2", "3", "4"]);
    expect(rerouted.path).toEqual(["1", "5", "4"]);
    expect(rerouted.totalSeconds).toBeGreaterThan(baseline.totalSeconds);
  });

  test("still allows a closed station to be used as the destination", () => {
    const result = dijkstra(makeBaseGraph(), "1", "4", new Set(["4"]));

    expect(result.path).toEqual(["1", "2", "3", "4"]);
    expect(result.totalSeconds).toBe(12);
  });

  test("avoids closed lines", () => {
    const result = dijkstra(makeBaseGraph(), "1", "4", new Set(), new Set(["red"]));

    expect(result.path).toEqual(["1", "5", "4"]);
    expect(result.totalSeconds).toBe(40);
    expect(result.changeCount).toBe(0);
  });

  test("treats blocked edges as undirected", () => {
    const blockedEdges = new Set([buildUndirectedLineEdgeKey("3", "2", "red")]);
    const result = dijkstra(makeBaseGraph(), "1", "4", new Set(), new Set(), blockedEdges);

    expect(result.path).toEqual(["1", "5", "4"]);
    expect(result.totalSeconds).toBe(40);
  });

  test("returns no route when closures and blocked edges remove every path", () => {
    const blockedEdges = new Set([
      buildUndirectedLineEdgeKey("1", "2", "red"),
      buildUndirectedLineEdgeKey("1", "5", "blue"),
    ]);

    const result = dijkstra(
      makeBaseGraph(),
      "1",
      "4",
      new Set(),
      new Set(),
      blockedEdges,
    );

    expect(result.path).toEqual([]);
    expect(result.totalSeconds).toBe(Infinity);
    expect(result.changeCount).toBe(0);
  });

  test("returns no route when a station disruption removes the main route and the fallback line is also closed", () => {
    const result = dijkstra(
      makeBaseGraph(),
      "1",
      "4",
      new Set(["2"]),
      new Set(["blue"]),
    );

    expect(result.path).toEqual([]);
    expect(result.totalSeconds).toBe(Infinity);
    expect(result.changeCount).toBe(0);
  });

  test("returns no route for an empty graph", () => {
    const result = dijkstra({}, "1", "2");

    expect(result.path).toEqual([]);
    expect(result.totalSeconds).toBe(Infinity);
  });

  test("returns no route when the destination does not exist", () => {
    const result = dijkstra(makeBaseGraph(), "1", "999");

    expect(result.path).toEqual([]);
    expect(result.totalSeconds).toBe(Infinity);
  });
});
