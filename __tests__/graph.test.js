import { jest } from "@jest/globals";

import { buildGraph } from "../frontend/tfl-what-if-simulation/app/lib/graph.js";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("buildGraph", () => {
  test("creates adjacency lists for every node", () => {
    const nodes = [
      { id: "1", name: "Station A" },
      { id: "2", name: "Station B" },
      { id: "3", name: "Station C" },
    ];

    const graph = buildGraph(nodes, []);

    expect(graph).toEqual({
      "1": [],
      "2": [],
      "3": [],
    });
  });

  test("creates bidirectional edges and normalises ids to strings", () => {
    const nodes = [{ id: 1 }, { id: 2 }];
    const edges = [{ from: 1, to: 2, travel_time: 5, line: "red" }];

    const graph = buildGraph(nodes, edges);

    expect(graph["1"]).toContainEqual({
      to: "2",
      weight: 5,
      line: "red",
    });
    expect(graph["2"]).toContainEqual({
      to: "1",
      weight: 5,
      line: "red",
    });
  });

  test("stores travel time and line metadata on edges", () => {
    const graph = buildGraph(
      [{ id: "1" }, { id: "2" }],
      [{ from: "1", to: "2", travel_time: 10, line: 123 }],
    );

    expect(graph["1"][0]).toEqual({
      to: "2",
      weight: 10,
      line: "123",
    });
  });

  test("supports multiple edges between the same stations on different lines", () => {
    const graph = buildGraph(
      [{ id: "1" }, { id: "2" }],
      [
        { from: "1", to: "2", travel_time: 5, line: "red" },
        { from: "1", to: "2", travel_time: 6, line: "blue" },
      ],
    );

    expect(graph["1"]).toHaveLength(2);
    expect(graph["2"]).toHaveLength(2);
  });

  test("skips invalid edges and logs a warning", () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const graph = buildGraph(
      [{ id: "1" }, { id: "2" }],
      [
        { from: "1", to: "999", travel_time: 5, line: "red" },
        { from: "1", to: "2", travel_time: 3, line: "blue" },
      ],
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "Invalid edge: ",
      expect.objectContaining({ from: "1", to: "999" }),
    );
    expect(graph["1"]).toEqual([
      {
        to: "2",
        weight: 3,
        line: "blue",
      },
    ]);
  });

  test("handles self-loops without mutating the source edge objects", () => {
    const nodes = [{ id: "1", name: "Loop" }];
    const edges = [{ from: "1", to: "1", travel_time: 0, line: "loop" }];
    const edgesClone = JSON.parse(JSON.stringify(edges));

    const graph = buildGraph(nodes, edges);

    expect(graph["1"]).toHaveLength(2);
    expect(graph["1"][0].to).toBe("1");
    expect(graph["1"][1].to).toBe("1");
    expect(edges).toEqual(edgesClone);
  });

  test("does not mutate the source node array", () => {
    const nodes = [
      { id: "1", name: "Station A" },
      { id: "2", name: "Station B" },
    ];
    const nodesClone = JSON.parse(JSON.stringify(nodes));

    buildGraph(nodes, []);

    expect(nodes).toEqual(nodesClone);
  });
});
