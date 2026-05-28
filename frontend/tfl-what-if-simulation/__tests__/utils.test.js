import {
  buildNodeById,
  buildUndirectedLineEdgeKey,
  dedupeEdges,
  groupEdges,
  normaliseIdSet,
  offsetSegment,
  splitStateKey,
} from "../app/components/mapShared/utils";

describe("map utilities", () => {
  test("groupEdges groups station pairs without regard to direction", () => {
    const groups = groupEdges([
      { from: "A", to: "B", line: "victoria" },
      { from: "B", to: "A", line: "jubilee" },
      { from: "A", to: "C", line: "northern" },
    ]);

    expect(Object.keys(groups).sort()).toEqual(["A-B", "A-C"]);
    expect(groups["A-B"]).toHaveLength(2);
    expect(groups["A-C"]).toHaveLength(1);
  });

  test("buildUndirectedLineEdgeKey produces a canonical key order", () => {
    expect(buildUndirectedLineEdgeKey("B", "A", "victoria")).toBe("A-B-victoria");
    expect(buildUndirectedLineEdgeKey(2, 10, "red")).toBe("10-2-red");
  });

  test("dedupeEdges removes reverse duplicates on the same line but keeps distinct lines", () => {
    const deduped = dedupeEdges([
      { from: "A", to: "B", line: "victoria" },
      { from: "B", to: "A", line: "victoria" },
      { from: "A", to: "B", line: "jubilee" },
    ]);

    expect(deduped).toHaveLength(2);
    expect(deduped).toEqual(
      expect.arrayContaining([
        { from: "A", to: "B", line: "victoria" },
        { from: "A", to: "B", line: "jubilee" },
      ]),
    );
  });

  test("offsetSegment computes parallel coordinates for an overlapped line segment", () => {
    expect(offsetSegment([0, 0], [0, 2], 1)).toEqual([
      [1, 0],
      [1, 2],
    ]);
  });

  test("buildNodeById and normaliseIdSet normalise ids to strings", () => {
    const nodeById = buildNodeById([{ id: 1, name: "One" }, { id: "2", name: "Two" }]);
    const normalisedSet = normaliseIdSet(new Set([1, "2"]));

    expect(nodeById.get("1")).toEqual({ id: 1, name: "One" });
    expect(nodeById.get("2")).toEqual({ id: "2", name: "Two" });
    expect(normalisedSet).toEqual(new Set(["1", "2"]));
  });

  test("splitStateKey parses station-state keys and converts START back to null", () => {
    expect(splitStateKey("940GZZLUWLO__victoria")).toEqual({
      stationId: "940GZZLUWLO",
      line: "victoria",
    });
    expect(splitStateKey("940GZZLUWLO__START")).toEqual({
      stationId: "940GZZLUWLO",
      line: null,
    });
  });
});
