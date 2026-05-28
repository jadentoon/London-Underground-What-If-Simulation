import { jest } from "@jest/globals";

import { buildFromRoutes } from "../data/buildFromRoutes.js";
import { fetchAllLines } from "../data/fetchAllLines.js";
import { fetchTfl } from "../data/tFlClient.js";

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
  jest.restoreAllMocks();
  global.fetch = originalFetch;
});

describe("TfL data import modules", () => {
  test("fetchTfl returns parsed json from the TfL API", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ ok: true }));

    const result = await fetchTfl("/Line/Mode/tube");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/^https:\/\/api\.tfl\.gov\.uk\/Line\/Mode\/tube\?app_key=/),
    );
    expect(result).toEqual({ ok: true });
  });

  test("fetchTfl logs context and throws on non-OK responses", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    global.fetch.mockResolvedValue({
      ok: false,
      status: 503,
    });

    await expect(fetchTfl("/Line/Mode/tube")).rejects.toThrow("TfL API error");

    expect(consoleSpy).toHaveBeenNthCalledWith(1, "Status:", 503);
    expect(consoleSpy).toHaveBeenNthCalledWith(
      2,
      "URL:",
      expect.stringContaining("/Line/Mode/tube?app_key="),
    );
  });

  test("fetchAllLines maps TfL line objects down to id and name", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse([
        { id: "victoria", name: "Victoria", modeName: "tube" },
        { id: "jubilee", name: "Jubilee", extra: true },
      ]),
    );

    const result = await fetchAllLines();

    expect(result).toEqual([
      { id: "victoria", name: "Victoria" },
      { id: "jubilee", name: "Jubilee" },
    ]);
  });

  test("buildFromRoutes fetches each line route and creates unique stations plus edges", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes("/Line/red/Route/Sequence/all")) {
        return Promise.resolve(
          jsonResponse({
            stopPointSequences: [
              {
                stopPoint: [
                  { id: "A", name: "Alpha", lat: 51.5, lon: -0.1 },
                  { id: "B", name: "Bravo", lat: 51.51, lon: -0.11 },
                  { id: "C", name: "Charlie", lat: 51.52, lon: -0.12 },
                ],
              },
            ],
          }),
        );
      }

      if (url.includes("/Line/blue/Route/Sequence/all")) {
        return Promise.resolve(
          jsonResponse({
            stopPointSequences: [
              {
                stopPoint: [
                  { id: "B", name: "Bravo", lat: 51.51, lon: -0.11 },
                  { id: "D", name: "Delta", lat: 51.53, lon: -0.13 },
                ],
              },
              {
                stopPoint: [
                  { id: "D", name: "Delta", lat: 51.53, lon: -0.13 },
                  { id: "E", name: "Echo", lat: 51.54, lon: -0.14 },
                ],
              },
            ],
          }),
        );
      }

      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const result = await buildFromRoutes([
      { id: "red", name: "Red Line" },
      { id: "blue", name: "Blue Line" },
    ]);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result.stations).toHaveLength(5);
    expect(result.stations).toEqual(
      expect.arrayContaining([
        { id: "A", name: "Alpha", lat: 51.5, lon: -0.1 },
        { id: "B", name: "Bravo", lat: 51.51, lon: -0.11 },
        { id: "E", name: "Echo", lat: 51.54, lon: -0.14 },
      ]),
    );
    expect(result.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "A",
          to: "B",
          line: "red",
          lineName: "Red Line",
        }),
        expect.objectContaining({
          from: "B",
          to: "D",
          line: "blue",
          lineName: "Blue Line",
        }),
      ]),
    );
    expect(result.edges).toHaveLength(4);
    expect(result.edges.every((edge) => edge.distance > 0)).toBe(true);
  });

  test("buildFromRoutes propagates API failures from the route fetch", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(
      buildFromRoutes([{ id: "victoria", name: "Victoria" }]),
    ).rejects.toThrow("TfL API error");

    expect(consoleSpy).toHaveBeenCalledWith("Status:", 500);
  });
});
