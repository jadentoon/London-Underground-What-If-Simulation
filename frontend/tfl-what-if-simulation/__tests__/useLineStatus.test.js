import React from "react";
import { renderHook, waitFor } from "@testing-library/react";

import { useLineStatus } from "../app/hooks/useLineStatus";

const originalFetch = global.fetch;

function jsonResponse(data) {
  return {
    ok: true,
    json: jest.fn().mockResolvedValue(data),
  };
}

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
  global.fetch = originalFetch;
});

describe("useLineStatus", () => {
  test("uses simulated closures in what-if mode", () => {
    global.fetch.mockResolvedValue(jsonResponse([]));

    const simulatedClosedLines = new Set(["district"]);

    const { result } = renderHook(() =>
      useLineStatus({
        hypotheticalSettingsEnabled: true,
        simulatedClosedLines,
        pollMs: 999999,
      }),
    );

    expect(result.current.lineStatusLabel).toBe("Fallback (What-If mode)");
    expect(result.current.effectiveClosedLines).toBe(simulatedClosedLines);
    expect(result.current.effectivePartialLines.size).toBe(0);
    expect(result.current.effectivePartialStationIdsByLine.size).toBe(0);
  });

  test("maps live line closures and partial closure stop ids from the TfL payload", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse([
        {
          id: "victoria",
          name: "Victoria",
          lineStatuses: [
            {
              statusSeverityDescription: "Part Closure",
              disruption: {
                affectedStops: [
                  { id: "9400ZZLUVIC1" },
                  { id: "9400ZZLUGPK" },
                ],
              },
            },
          ],
        },
        {
          id: "northern",
          name: "Northern",
          lineStatuses: [
            {
              statusSeverityDescription: "Service Closed",
            },
          ],
        },
      ]),
    );

    const { result } = renderHook(() =>
      useLineStatus({
        hypotheticalSettingsEnabled: false,
        simulatedClosedLines: new Set(),
        pollMs: 999999,
      }),
    );

    await waitFor(() => expect(result.current.linesSource).toBe("live"));

    expect(result.current.lineStatusLabel).toBe("Live TfL status");
    expect(result.current.effectiveClosedLines.has("northern")).toBe(true);
    expect(result.current.effectivePartialLines.has("victoria")).toBe(true);
    expect(result.current.effectivePartialStationIdsByLine.get("victoria")).toEqual(
      new Set(["940GZZLUVIC", "940GZZLUGPK"]),
    );
    expect(result.current.liveClosedCount).toBe(1);
    expect(result.current.livePartialCount).toBe(1);
  });

  test("falls back cleanly when the TfL status API fails", async () => {
    global.fetch.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() =>
      useLineStatus({
        hypotheticalSettingsEnabled: false,
        simulatedClosedLines: new Set(),
        pollMs: 999999,
      }),
    );

    await waitFor(() =>
      expect(result.current.linesReason).toBe("Live TfL line status unavailable"),
    );

    expect(result.current.linesSource).toBe("fallback");
    expect(result.current.isLiveLines).toBe(false);
    expect(result.current.effectiveClosedLines.size).toBe(0);
    expect(result.current.effectivePartialLines.size).toBe(0);
    expect(result.current.lineStatusLabel).toBe("Fallback (TfL API unavailable)");
  });
});
