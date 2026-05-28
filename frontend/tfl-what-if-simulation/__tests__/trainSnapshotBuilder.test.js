import { buildEdgeIndexes, buildStationNameIndex } from "../app/lib/trains/trainGraphUtils";
import {
  buildLiveSnapshots,
  mergeLiveSnapshots,
} from "../app/lib/trains/trainSnapshotBuilder";

const nodes = [
  {
    id: "940GZZLUALP",
    name: "Alpha Underground Station",
    lat: 51.5,
    lon: -0.1,
  },
  {
    id: "940GZZLUBRV",
    name: "Bravo Underground Station",
    lat: 51.51,
    lon: -0.11,
  },
  {
    id: "940GZZLUCHR",
    name: "Charlie Underground Station",
    lat: 51.52,
    lon: -0.12,
  },
];

const edges = [
  { from: "940GZZLUALP", to: "940GZZLUBRV", line: "victoria", travel_time: 120 },
  { from: "940GZZLUBRV", to: "940GZZLUCHR", line: "victoria", travel_time: 120 },
];

function makeIndexes() {
  return buildEdgeIndexes(edges);
}

describe("trainSnapshotBuilder", () => {
  test("buildLiveSnapshots normalises stop ids, filters invalid arrivals, and deduplicates repeated stops", () => {
    const nowMs = 1_000_000;
    const { directedTravelTimeByLine, inboundByLineTo, edgesByLine } = makeIndexes();
    const snapshots = buildLiveSnapshots({
      arrivals: [
        {
          lineId: "victoria",
          vehicleId: "train-1",
          naptanId: "9400ZZLUBRV1",
          currentLocation: "Between Alpha Underground Station and Bravo Underground Station.",
          timeToStation: 120,
          platformName: "Eastbound",
          towards: "Charlie Underground Station",
        },
        {
          lineId: "victoria",
          vehicleId: "train-1",
          naptanId: "9400ZZLUBRV1",
          currentLocation: "Between Alpha Underground Station and Bravo Underground Station.",
          timeToStation: 150,
        },
        {
          lineId: "victoria",
          vehicleId: "train-1",
          naptanId: "9400ZZLUCHR1",
          timeToStation: 240,
          towards: "Charlie Underground Station",
        },
        {
          lineId: "not-a-real-line",
          vehicleId: "ignored-1",
          naptanId: "9400ZZLUBRV1",
          timeToStation: 60,
        },
        {
          lineId: "victoria",
          vehicleId: "ignored-2",
          naptanId: "9400ZZLUBRV1",
          timeToStation: 5_000,
        },
      ],
      nowMs,
      nodeById: new Map(nodes.map((node) => [node.id, node])),
      stationNameToId: buildStationNameIndex(nodes),
      directedTravelTimeByLine,
      inboundByLineTo,
      edgesByLine,
    });

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toEqual(
      expect.objectContaining({
        id: "victoria|train-1",
        lineId: "victoria",
        fromId: "940GZZLUALP",
        toId: "940GZZLUBRV",
        edgeTravelTime: 120,
        vehicleId: "train-1",
      }),
    );
    expect(snapshots[0].stops.map((stop) => stop.toId)).toEqual([
      "940GZZLUBRV",
      "940GZZLUCHR",
    ]);
  });

  test("mergeLiveSnapshots stabilises rewinding ETAs and keeps the previous from-station when the destination is unchanged", () => {
    const nowMs = 1_000_000;
    const { directedTravelTimeByLine } = makeIndexes();

    const merged = mergeLiveSnapshots({
      previousSnapshots: [
        {
          id: "victoria|train-1",
          lineId: "victoria",
          fromId: "940GZZLUALP",
          toId: "940GZZLUBRV",
          eta: 60,
          edgeTravelTime: 120,
          stops: [{ toId: "940GZZLUBRV", eta: 60 }],
          capturedAtMs: nowMs - 10_000,
        },
      ],
      nextSnapshots: [
        {
          id: "victoria|train-1",
          lineId: "victoria",
          fromId: "940GZZLUCHR",
          toId: "940GZZLUBRV",
          eta: 120,
          edgeTravelTime: 120,
          stops: [{ toId: "940GZZLUBRV", eta: 120 }],
          capturedAtMs: nowMs,
        },
      ],
      nowMs,
      directedTravelTimeByLine,
    });

    expect(merged).toHaveLength(1);
    expect(merged[0]).toEqual(
      expect.objectContaining({
        fromId: "940GZZLUALP",
        toId: "940GZZLUBRV",
        eta: 95,
        edgeTravelTime: 120,
        punctualityDeltaSeconds: 45,
        capturedAtMs: nowMs,
      }),
    );
  });

  test("mergeLiveSnapshots carries over a recent live train when a poll temporarily omits it", () => {
    const nowMs = 1_000_000;

    const merged = mergeLiveSnapshots({
      previousSnapshots: [
        {
          id: "victoria|carry",
          lineId: "victoria",
          fromId: "940GZZLUALP",
          toId: "940GZZLUBRV",
          eta: 40,
          edgeTravelTime: 120,
          stops: [{ toId: "940GZZLUBRV", eta: 40 }],
          capturedAtMs: nowMs - 10_000,
        },
      ],
      nextSnapshots: [],
      nowMs,
      directedTravelTimeByLine: new Map(),
    });

    expect(merged).toHaveLength(1);
    expect(merged[0]).toEqual(
      expect.objectContaining({
        id: "victoria|carry",
        eta: 30,
        punctualityDeltaSeconds: 0,
      }),
    );
  });
});
