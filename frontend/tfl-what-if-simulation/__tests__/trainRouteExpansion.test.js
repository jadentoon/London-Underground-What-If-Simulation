import {
  expandStopQueue,
  findLinePath,
} from "../app/lib/trains/trainRouteExpansion";

describe("trainRouteExpansion", () => {
  test("findLinePath picks the shortest route on a line by travel time", () => {
    const edgesByLine = new Map([
      [
        "victoria",
        [
          { from: "A", to: "B", travelTime: 60 },
          { from: "B", to: "C", travelTime: 60 },
          { from: "A", to: "C", travelTime: 200 },
        ],
      ],
    ]);

    expect(findLinePath("victoria", "A", "C", edgesByLine)).toEqual(["A", "B", "C"]);
  });

  test("expandStopQueue inserts estimated intermediate stops with interpolated timing", () => {
    const nowMs = 1_000_000;
    const edgesByLine = new Map([
      [
        "victoria",
        [
          { from: "A", to: "B", travelTime: 60 },
          { from: "B", to: "C", travelTime: 120 },
        ],
      ],
    ]);
    const directedTravelTimeByLine = new Map([
      ["victoria|A|B", 60],
      ["victoria|B|A", 60],
      ["victoria|B|C", 120],
      ["victoria|C|B", 120],
    ]);

    const expanded = expandStopQueue({
      fromId: "A",
      stops: [
        {
          toId: "C",
          eta: 180,
          expectedArrivalMs: nowMs + 180_000,
          expectedArrival: "2026-01-01T00:03:00.000Z",
          platformName: "Northbound",
          currentLocation: "Between Alpha and Charlie",
        },
      ],
      lineId: "victoria",
      nowMs,
      edgesByLine,
      directedTravelTimeByLine,
    });

    expect(expanded).toHaveLength(2);
    expect(expanded[0]).toEqual(
      expect.objectContaining({
        toId: "B",
        eta: 60,
        expectedArrivalMs: nowMs + 60_000,
        isEstimatedSegment: true,
      }),
    );
    expect(expanded[1]).toEqual(
      expect.objectContaining({
        toId: "C",
        eta: 180,
        expectedArrivalMs: nowMs + 180_000,
      }),
    );
  });
});
