import { renderHook, waitFor } from "@testing-library/react";

import { useTrainMovements } from "../app/hooks/useTrainMovements";

const originalFetch = global.fetch;

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
];

const edges = [
  {
    from: "940GZZLUALP",
    to: "940GZZLUBRV",
    line: "victoria",
    travel_time: 120,
  },
];

function jsonResponse(body) {
  return {
    ok: true,
    json: jest.fn().mockResolvedValue(body),
  };
}

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
  global.fetch = originalFetch;
});

describe("useTrainMovements", () => {
  test("stays disabled in what-if mode without polling the live API", async () => {
    const { result } = renderHook(() =>
      useTrainMovements({ nodes, edges, enabled: false }),
    );

    await waitFor(() =>
      expect(result.current.feedStatus.reason).toBe("Disabled in What-If mode"),
    );

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.feedStatus.source).toBe("fallback");
    expect(result.current.trains).toEqual([]);
  });

  test("reports that the graph is not ready when nodes or edges are missing", async () => {
    const { result } = renderHook(() =>
      useTrainMovements({ nodes: [], edges: [], enabled: true }),
    );

    await waitFor(() =>
      expect(result.current.feedStatus.reason).toBe(
        "Network graph not loaded yet; using schedule fallback",
      ),
    );

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.feedStatus.source).toBe("fallback");
    expect(result.current.feedStatus.trainCount).toBe(0);
  });

  test("switches to live train positions when the live feed returns usable arrivals", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({
        trackableArrivals: [
          {
            lineId: "victoria",
            vehicleId: "train-1",
            naptanId: "9400ZZLUBRV1",
            currentLocation: "Between Alpha Underground Station and Bravo Underground Station.",
            timeToStation: 120,
            towards: "Bravo Underground Station",
          },
        ],
        meta: {},
      }),
    );

    const { result } = renderHook(() =>
      useTrainMovements({ nodes, edges, enabled: true }),
    );

    await waitFor(() => expect(result.current.feedStatus.source).toBe("live"));

    expect(global.fetch).toHaveBeenCalledWith("/api/trains/live", { cache: "no-store" });
    expect(result.current.feedStatus.reason).toBe("");
    expect(result.current.feedStatus.trainCount).toBe(1);
    expect(result.current.trains[0]).toEqual(
      expect.objectContaining({
        isLive: true,
        lineId: "victoria",
        routeLabel: "Alpha Underground Station → Bravo Underground Station",
      }),
    );
  });

  test("falls back to simulated trains when live arrivals are present but unusable", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({
        trackableArrivals: [],
        meta: { untrackableArrivalCount: 3 },
      }),
    );

    const { result } = renderHook(() =>
      useTrainMovements({ nodes, edges, enabled: true }),
    );

    await waitFor(() =>
      expect(result.current.feedStatus.reason).toBe(
        "Live arrivals only contained untrackable services",
      ),
    );

    expect(result.current.feedStatus.source).toBe("fallback");
    expect(result.current.feedStatus.trainCount).toBe(1);
    expect(result.current.trains[0]).toEqual(expect.objectContaining({ isLive: false }));
    expect([
      "Alpha Underground Station → Bravo Underground Station",
      "Bravo Underground Station → Alpha Underground Station",
    ]).toContain(result.current.trains[0].routeLabel);
  });

  test("falls back cleanly when the live arrivals API errors", async () => {
    global.fetch.mockRejectedValue(new Error("TfL unavailable"));

    const { result } = renderHook(() =>
      useTrainMovements({ nodes, edges, enabled: true }),
    );

    await waitFor(() =>
      expect(result.current.feedStatus.reason).toBe(
        "Live TfL arrivals unavailable; using schedule fallback",
      ),
    );

    expect(result.current.feedStatus.source).toBe("fallback");
    expect(result.current.feedStatus.trainCount).toBe(1);
    expect(result.current.trains[0].isLive).toBe(false);
  });
});
