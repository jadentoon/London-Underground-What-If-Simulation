import { jest } from "@jest/globals";
import neo4j from "neo4j-driver";

function makeRecord(values) {
  return {
    get(key) {
      return values[key];
    },
  };
}

async function loadStationsRouteModule({ runImpl } = {}) {
  jest.resetModules();

  const json = jest.fn((body, init = {}) => ({ body, init }));
  const run = jest.fn(runImpl);
  const close = jest.fn().mockResolvedValue(undefined);
  const session = { run, close };
  const driver = {
    session: jest.fn(() => session),
  };

  jest.unstable_mockModule("next/server", () => ({
    NextResponse: { json },
  }));
  jest.unstable_mockModule("../frontend/tfl-what-if-simulation/app/lib/neo4j.js", () => ({
    default: driver,
  }));

  const module = await import("../frontend/tfl-what-if-simulation/app/api/stations/route.js");

  return {
    GET: module.GET,
    close,
    driver,
    json,
    run,
  };
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("GET /api/stations", () => {
  test("maps Neo4j records into deduplicated nodes and numeric edges", async () => {
    const safeTime = neo4j.int(120);
    const bigTime = neo4j.int("9007199254740993");

    const { GET, close, driver, run } = await loadStationsRouteModule({
      runImpl: async () => ({
        records: [
          makeRecord({
            fromId: "A",
            fromName: "Alpha",
            fromLat: 51.5,
            fromLon: -0.1,
            toId: "B",
            toName: "Bravo",
            toLat: 51.51,
            toLon: -0.11,
            line: "red",
            travel_time: safeTime,
          }),
          makeRecord({
            fromId: "B",
            fromName: "Bravo",
            fromLat: 51.51,
            fromLon: -0.11,
            toId: "C",
            toName: "Charlie",
            toLat: 51.52,
            toLon: -0.12,
            line: "blue",
            travel_time: bigTime,
          }),
        ],
      }),
    });

    const response = await GET();

    expect(driver.session).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(response.body.nodes).toEqual([
      { id: "A", name: "Alpha", lat: 51.5, lon: -0.1 },
      { id: "B", name: "Bravo", lat: 51.51, lon: -0.11 },
      { id: "C", name: "Charlie", lat: 51.52, lon: -0.12 },
    ]);
    expect(response.body.edges).toEqual([
      { from: "A", to: "B", line: "red", travel_time: 120 },
      { from: "B", to: "C", line: "blue", travel_time: Number(bigTime.toString()) },
    ]);
    expect(response.init.headers["X-Station-Graph-Cache"]).toBe("MISS");
    expect(response.init.headers["Cache-Control"]).toContain("s-maxage=3600");
  });

  test("serves the second request from the in-memory cache", async () => {
    const { GET, close, driver, run } = await loadStationsRouteModule({
      runImpl: async () => ({
        records: [
          makeRecord({
            fromId: "A",
            fromName: "Alpha",
            fromLat: 51.5,
            fromLon: -0.1,
            toId: "B",
            toName: "Bravo",
            toLat: 51.51,
            toLon: -0.11,
            line: "red",
            travel_time: { toNumber: () => 60, toString: () => "60" },
          }),
        ],
      }),
    });

    const first = await GET();
    const second = await GET();

    expect(first.init.headers["X-Station-Graph-Cache"]).toBe("MISS");
    expect(second.init.headers["X-Station-Graph-Cache"]).toBe("HIT");
    expect(driver.session).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(second.body).toEqual(first.body);
  });

  test("returns 500 on Neo4j failure and can recover on a later request", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("neo4j unavailable");

    const { GET, close, driver, run } = await loadStationsRouteModule({
      runImpl: jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          records: [],
        }),
    });

    const failed = await GET();
    const recovered = await GET();

    expect(failed.body).toEqual({ error: "Failed to fetch stations" });
    expect(failed.init.status).toBe(500);
    expect(consoleSpy).toHaveBeenCalledWith("Neo4j error: ", error);
    expect(recovered.body).toEqual({ nodes: [], edges: [] });
    expect(recovered.init.headers["X-Station-Graph-Cache"]).toBe("MISS");
    expect(driver.session).toHaveBeenCalledTimes(2);
    expect(run).toHaveBeenCalledTimes(2);
    expect(close).toHaveBeenCalledTimes(2);
  });
});
