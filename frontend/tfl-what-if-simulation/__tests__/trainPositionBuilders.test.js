import {
  buildFallbackTemplates,
  buildFallbackTrainPositions,
  buildLiveTrainPositions,
} from "../app/lib/trains/trainPositionBuilders";

const nodeById = new Map([
  [
    "A",
    { id: "A", name: "Alpha Underground Station", lat: 51.5, lon: -0.1 },
  ],
  [
    "B",
    { id: "B", name: "Bravo Underground Station", lat: 51.51, lon: -0.11 },
  ],
  [
    "C",
    { id: "C", name: "Charlie Underground Station", lat: 51.52, lon: -0.12 },
  ],
]);

describe("trainPositionBuilders", () => {
  test("buildFallbackTemplates creates deterministic templates only for known lines", () => {
    const templates = buildFallbackTemplates(
      new Map([
        [
          "victoria",
          [
            { from: "A", to: "B", travelTime: 0, lineId: "victoria" },
            { from: "B", to: "C", travelTime: 90, lineId: "victoria" },
          ],
        ],
        [
          "made-up-line",
          [{ from: "A", to: "C", travelTime: 80, lineId: "made-up-line" }],
        ],
      ]),
    );

    expect(templates).toHaveLength(2);
    expect(templates[0]).toEqual(
      expect.objectContaining({
        id: "fallback-victoria-A-B",
        fromId: "A",
        toId: "B",
        travelTime: 60,
      }),
    );
    expect(templates.every((template) => template.lineId === "victoria")).toBe(true);
    expect(Number.isFinite(templates[0].phase)).toBe(true);
  });

  test("buildLiveTrainPositions uses the active stop queue segment and estimated-location label", () => {
    const nowMs = 1_000_000;
    const trains = buildLiveTrainPositions(
      [
        {
          id: "victoria|train-1",
          lineId: "victoria",
          fromId: "A",
          toId: "B",
          eta: 120,
          edgeTravelTime: 120,
          stops: [
            {
              toId: "B",
              eta: 0,
              expectedArrivalMs: nowMs,
            },
            {
              toId: "C",
              eta: 60,
              expectedArrivalMs: nowMs + 60_000,
              isEstimatedSegment: true,
              towards: "Charlie Underground Station",
            },
          ],
          capturedAtMs: nowMs,
          currentLocation: "Departed Alpha",
          platformName: "Platform 1",
          towards: "Charlie Underground Station",
          expectedArrival: "",
          expectedArrivalMs: null,
          vehicleId: "veh-1",
          punctualityDeltaSeconds: 30,
        },
      ],
      nowMs,
      nodeById,
    );

    expect(trains).toHaveLength(1);
    expect(trains[0]).toEqual(
      expect.objectContaining({
        id: "victoria|train-1",
        isLive: true,
        label: "Victoria",
        routeLabel: "Bravo Underground Station → Charlie Underground Station",
        currentLocation: "Estimated between Bravo Underground Station and Charlie Underground Station",
        etaSeconds: 60,
        etaLabel: "1m",
        platformName: "Platform 1",
        punctualityState: "late",
        punctualityLabel: "Late by 30s",
      }),
    );
    expect(trains[0].lat).toBeCloseTo(51.51);
    expect(trains[0].lon).toBeCloseTo(-0.11);
  });

  test("buildFallbackTrainPositions returns simulated schedule-based markers", () => {
    const trains = buildFallbackTrainPositions(
      [
        {
          id: "fallback-victoria-A-B",
          lineId: "victoria",
          fromId: "A",
          toId: "B",
          travelTime: 100,
          phase: 0,
        },
      ],
      0,
      nodeById,
    );

    expect(trains).toHaveLength(1);
    expect(trains[0]).toEqual(
      expect.objectContaining({
        id: "fallback-victoria-A-B",
        isLive: false,
        label: "Victoria",
        routeLabel: "Alpha Underground Station → Bravo Underground Station",
        etaSeconds: 100,
        etaLabel: "1m 40s",
        currentLocation: "Simulated fallback movement",
        punctualityState: "scheduled",
        punctualityLabel: "Schedule estimate",
      }),
    );
  });
});
