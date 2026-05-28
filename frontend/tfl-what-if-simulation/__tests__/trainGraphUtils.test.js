import {
  buildEdgeIndexes,
  buildStationNameIndex,
  chooseFromStop,
} from "../app/lib/trains/trainGraphUtils";

describe("trainGraphUtils", () => {
  test("buildStationNameIndex normalises names and keeps the first matching station id", () => {
    const index = buildStationNameIndex([
      { id: 1, name: "Oxford Circus Underground Station" },
      { id: 2, name: "Oxford Circus Station" },
      { id: 3, name: "Victoria Rail Station" },
    ]);

    expect(index.get("oxford circus")).toBe("1");
    expect(index.get("victoria")).toBe("3");
  });

  test("buildEdgeIndexes deduplicates reverse duplicates and fills default travel times", () => {
    const { directedTravelTimeByLine, inboundByLineTo, edgesByLine } = buildEdgeIndexes([
      { from: "A", to: "B", line: "victoria", travel_time: 120 },
      { from: "B", to: "A", line: "victoria", travel_time: 120 },
      { from: "B", to: "C", line: "victoria" },
    ]);

    expect(directedTravelTimeByLine.get("victoria|A|B")).toBe(120);
    expect(directedTravelTimeByLine.get("victoria|B|A")).toBe(120);
    expect(directedTravelTimeByLine.get("victoria|B|C")).toBe(60);
    expect(directedTravelTimeByLine.get("victoria|C|B")).toBe(60);

    expect(inboundByLineTo.get("victoria|B")).toEqual(
      expect.arrayContaining([
        { from: "A", travelTime: 120 },
        { from: "C", travelTime: 60 },
      ]),
    );
    expect(edgesByLine.get("victoria")).toHaveLength(2);
  });

  test("chooseFromStop prefers current location text and otherwise falls back to the closest ETA match", () => {
    const stationNameToId = buildStationNameIndex([
      { id: "A", name: "Alpha Underground Station" },
      { id: "B", name: "Bravo Underground Station" },
      { id: "C", name: "Charlie Underground Station" },
    ]);
    const { directedTravelTimeByLine, inboundByLineTo } = buildEdgeIndexes([
      { from: "A", to: "B", line: "victoria", travel_time: 120 },
      { from: "C", to: "B", line: "victoria", travel_time: 90 },
    ]);

    const fromLocationText = chooseFromStop({
      prediction: {
        currentLocation: "Between Alpha Underground Station and Bravo Underground Station.",
        timeToStation: 95,
      },
      etaSeconds: 95,
      lineId: "victoria",
      toId: "B",
      directedTravelTimeByLine,
      inboundByLineTo,
      stationNameToId,
    });

    const fromEta = chooseFromStop({
      prediction: {
        currentLocation: "At platform",
        timeToStation: 95,
      },
      etaSeconds: 95,
      lineId: "victoria",
      toId: "B",
      directedTravelTimeByLine,
      inboundByLineTo,
      stationNameToId,
    });

    expect(fromLocationText).toBe("A");
    expect(fromEta).toBe("C");
  });
});
