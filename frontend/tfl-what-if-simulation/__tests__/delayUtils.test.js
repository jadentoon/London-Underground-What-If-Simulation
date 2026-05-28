import {
  getDelaySeverityColor,
  getDelaySeverityLabel,
} from "../app/components/mapShared/delayUtils";

describe("delayUtils", () => {
  test("maps known delay severities to the expected colors", () => {
    expect(getDelaySeverityColor(10)).toBe("#22c55e");
    expect(getDelaySeverityColor(6)).toBe("#f59e0b");
    expect(getDelaySeverityColor(0)).toBe("#991b1b");
  });

  test("falls back to gray and unknown for unrecognised severities", () => {
    expect(getDelaySeverityColor(7)).toBe("#6b7280");
    expect(getDelaySeverityLabel(7)).toBe("Unknown");
  });

  test("maps known delay severities to the expected labels", () => {
    expect(getDelaySeverityLabel(10)).toBe("Good Service");
    expect(getDelaySeverityLabel(5)).toBe("Part Closure");
    expect(getDelaySeverityLabel(2)).toBe("Suspended");
  });
});
