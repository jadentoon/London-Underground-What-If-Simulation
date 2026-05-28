import {
  normaliseStationName,
  normaliseTflStopId,
  parseTimestampMs,
} from "../app/lib/trains/trainIdUtils";

describe("trainIdUtils", () => {
  test("normaliseTflStopId maps TfL platform stop ids onto station ids", () => {
    expect(normaliseTflStopId("9400ZZLUWLO1")).toBe("940GZZLUWLO");
    expect(normaliseTflStopId("9400ZZLUVIC")).toBe("940GZZLUVIC");
    expect(normaliseTflStopId("9400ZZDLRABC")).toBe("940GZZDLRABC");
  });

  test("normaliseTflStopId returns the original value for non-TfL-prefixed ids and empty input", () => {
    expect(normaliseTflStopId("940GZZLUWLO")).toBe("940GZZLUWLO");
    expect(normaliseTflStopId("custom-stop")).toBe("custom-stop");
    expect(normaliseTflStopId(null)).toBe("");
    expect(normaliseTflStopId(undefined)).toBe("");
  });

  test("normaliseStationName removes transport suffixes and punctuation", () => {
    expect(normaliseStationName("King's Cross St. Pancras Underground Station")).toBe(
      "king s cross st pancras",
    );
    expect(normaliseStationName("Victoria Rail Station")).toBe("victoria");
    expect(normaliseStationName("  Baker Street  ")).toBe("baker street");
  });

  test("parseTimestampMs parses valid timestamps and rejects missing or invalid values", () => {
    expect(parseTimestampMs("2026-05-27T12:34:56.000Z")).toBe(Date.parse("2026-05-27T12:34:56.000Z"));
    expect(parseTimestampMs("not-a-date")).toBeNull();
    expect(parseTimestampMs("")).toBeNull();
    expect(parseTimestampMs(null)).toBeNull();
  });
});
