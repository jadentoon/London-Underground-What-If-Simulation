import React from "react";

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body, init = {}) => ({ body, init })),
  },
}));

jest.mock("../app/lib/trains/liveTrainFeedService", () => ({
  getLiveTrainFeed: jest.fn(),
}));

import { GET } from "../app/api/trains/live/route";
import { getLiveTrainFeed } from "../app/lib/trains/liveTrainFeedService";

describe("GET /api/trains/live", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("passes parsed line ids to the live feed service", async () => {
    getLiveTrainFeed.mockResolvedValue({
      trackableArrivals: [],
      meta: { requestedLineIds: ["victoria", "northern"] },
    });

    const response = await GET({
      url: "https://example.test/api/trains/live?lineIds=victoria,%20northern,,",
    });

    expect(getLiveTrainFeed).toHaveBeenCalledWith({
      lineIds: ["victoria", "northern"],
    });
    expect(response.body.meta.requestedLineIds).toEqual(["victoria", "northern"]);
  });

  test("passes undefined when no lineIds query is provided", async () => {
    getLiveTrainFeed.mockResolvedValue({
      trackableArrivals: [],
      meta: { requestedLineIds: ["victoria"] },
    });

    await GET({
      url: "https://example.test/api/trains/live",
    });

    expect(getLiveTrainFeed).toHaveBeenCalledWith({
      lineIds: undefined,
    });
  });

  test("returns 502 when the live feed service throws", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("TfL down");
    getLiveTrainFeed.mockRejectedValue(error);

    const response = await GET({
      url: "https://example.test/api/trains/live?lineIds=victoria",
    });

    expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch live train feed:", error);
    expect(response.body).toEqual({ error: "Failed to fetch live train feed" });
    expect(response.init.status).toBe(502);
  });
});
