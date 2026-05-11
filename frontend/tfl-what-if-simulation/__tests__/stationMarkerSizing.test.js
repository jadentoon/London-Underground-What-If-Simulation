import {
  getStationMarkerRadius,
  getStationMarkerStrokeWeight,
  getStationOcclusionRadius,
} from "../app/components/mapComponents/stationMarkerSizing";

describe("stationMarkerSizing", () => {
  test("matches the base zoom radius scale", () => {
    expect(getStationMarkerRadius({ zoomLevel: 12 })).toBe(7);
    expect(getStationMarkerRadius({ zoomLevel: 13 })).toBe(9);
    expect(getStationMarkerRadius({ zoomLevel: 14 })).toBe(11);
    expect(getStationMarkerRadius({ zoomLevel: 15 })).toBe(13);
    expect(getStationMarkerRadius({ zoomLevel: 16 })).toBe(15);
  });

  test("applies the same state-based radius boosts used by the station layer", () => {
    expect(getStationMarkerRadius({ zoomLevel: 14, isOnPath: true })).toBe(12);
    expect(getStationMarkerRadius({ zoomLevel: 14, isStart: true })).toBe(13);
    expect(getStationMarkerRadius({ zoomLevel: 14, isHighlighted: true })).toBe(15);
  });

  test("uses stroke width in the occlusion radius so clicks match the visible footprint", () => {
    expect(getStationMarkerStrokeWeight({})).toBe(2);
    expect(getStationMarkerStrokeWeight({ isClosed: true })).toBe(3);
    expect(getStationMarkerStrokeWeight({ isHighlighted: true })).toBe(5);

    expect(getStationOcclusionRadius({ zoomLevel: 14 })).toBe(12);
    expect(getStationOcclusionRadius({ zoomLevel: 14, isClosed: true })).toBe(12.5);
    expect(getStationOcclusionRadius({ zoomLevel: 14, isHighlighted: true })).toBe(17.5);
  });
});
