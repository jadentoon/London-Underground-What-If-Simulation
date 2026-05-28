import {
  estimateActiveStopRemainingSeconds,
  estimateRemainingSeconds,
  estimateStopRemainingSeconds,
  formatEtaShort,
  getEdgeTravelTime,
  getPunctuality,
  hashString,
  interpolatePosition,
} from "../app/lib/trains/trainMovementTiming";

describe("trainMovementTiming", () => {
  test("formatEtaShort handles seconds-only, minute-only, and mixed minute-second labels", () => {
    expect(formatEtaShort(0)).toBe("0s");
    expect(formatEtaShort(59)).toBe("59s");
    expect(formatEtaShort(60)).toBe("1m");
    expect(formatEtaShort(90)).toBe("1m 30s");
    expect(formatEtaShort(3600)).toBe("60m");
  });

  test("interpolatePosition clamps progress and linearly interpolates coordinates", () => {
    const fromNode = { lat: 51.5, lon: -0.1 };
    const toNode = { lat: 51.6, lon: -0.2 };

    expect(interpolatePosition(fromNode, toNode, -1)).toEqual({ lat: 51.5, lon: -0.1 });
    const midpoint = interpolatePosition(fromNode, toNode, 0.5);
    expect(midpoint.lat).toBeCloseTo(51.55);
    expect(midpoint.lon).toBeCloseTo(-0.15);
    expect(interpolatePosition(fromNode, toNode, 2)).toEqual({ lat: 51.6, lon: -0.2 });
  });

  test("estimateRemainingSeconds prefers expectedArrivalMs and otherwise falls back to capturedAt plus eta", () => {
    expect(
      estimateRemainingSeconds(
        { expectedArrivalMs: 1_200_000, eta: 10, capturedAtMs: 0 },
        1_000_000,
      ),
    ).toBe(200);

    expect(
      estimateRemainingSeconds(
        { eta: 300, capturedAtMs: 1_000_000 },
        1_120_000,
      ),
    ).toBe(180);
  });

  test("estimateStopRemainingSeconds supports both timestamp and eta fallback paths", () => {
    expect(
      estimateStopRemainingSeconds(
        { expectedArrivalMs: 1_090_000, eta: 999 },
        1_000_000,
        0,
      ),
    ).toBe(90);

    expect(
      estimateStopRemainingSeconds(
        { eta: 120 },
        1_030_000,
        1_000_000,
      ),
    ).toBe(90);
  });

  test("estimateActiveStopRemainingSeconds returns the first future stop and falls back to the snapshot eta", () => {
    expect(
      estimateActiveStopRemainingSeconds(
        {
          stops: [
            { eta: 0, expectedArrivalMs: 1_000_000 },
            { eta: 60, expectedArrivalMs: 1_060_000 },
          ],
          capturedAtMs: 1_000_000,
          eta: 120,
        },
        1_000_000,
      ),
    ).toBe(60);

    expect(
      estimateActiveStopRemainingSeconds(
        {
          stops: [{ eta: 0, expectedArrivalMs: 1_000_000 }],
          capturedAtMs: 1_000_000,
          eta: 120,
        },
        1_030_000,
      ),
    ).toBe(90);
  });

  test("getEdgeTravelTime returns the graph travel time when present and otherwise enforces the minimum fallback", () => {
    const directedTravelTimeByLine = new Map([
      ["victoria|A|B", 95],
    ]);

    expect(
      getEdgeTravelTime({
        lineId: "victoria",
        fromId: "A",
        toId: "B",
        fallbackSeconds: 30,
        directedTravelTimeByLine,
      }),
    ).toBe(95);

    expect(
      getEdgeTravelTime({
        lineId: "victoria",
        fromId: "B",
        toId: "C",
        fallbackSeconds: 30,
        directedTravelTimeByLine,
      }),
    ).toBe(60);
  });

  test("getPunctuality returns on-time, late, and early labels around the threshold", () => {
    expect(getPunctuality(20)).toEqual({ state: "on-time", label: "On time" });
    expect(getPunctuality(21)).toEqual({ state: "late", label: "Late by 21s" });
    expect(getPunctuality(-21)).toEqual({ state: "early", label: "Early by 21s" });
  });

  test("hashString is stable and produces a non-negative integer", () => {
    const first = hashString("victoria|A|B");
    const second = hashString("victoria|A|B");
    const third = hashString("victoria|B|A");

    expect(first).toBe(second);
    expect(Number.isInteger(first)).toBe(true);
    expect(first).toBeGreaterThanOrEqual(0);
    expect(third).not.toBe(first);
  });
});
