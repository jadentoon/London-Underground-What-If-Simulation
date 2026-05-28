import { act, renderHook } from "@testing-library/react";

import { useWhatIfClosures } from "../app/hooks/map/useWhatIfClosures";

describe("useWhatIfClosures", () => {
  test("ignores station and line toggles when what-if mode is disabled", () => {
    const { result } = renderHook(() => useWhatIfClosures(false));

    act(() => {
      result.current.toggleClosedStation(123);
      result.current.handleLineToggle("victoria");
      result.current.handleResetClosures();
    });

    expect(result.current.closedStations).toEqual(new Set());
    expect(result.current.closedLines).toEqual(new Set());
  });

  test("toggles station and line closures when what-if mode is enabled", () => {
    const { result } = renderHook(() => useWhatIfClosures(true));

    act(() => {
      result.current.toggleClosedStation(123);
      result.current.handleLineToggle("victoria");
    });

    expect(result.current.closedStations).toEqual(new Set(["123"]));
    expect(result.current.closedLines).toEqual(new Set(["victoria"]));

    act(() => {
      result.current.toggleClosedStation("123");
      result.current.handleLineToggle("victoria");
    });

    expect(result.current.closedStations).toEqual(new Set());
    expect(result.current.closedLines).toEqual(new Set());
  });

  test("resets and clears closures with the dedicated handlers", () => {
    const { result } = renderHook(() => useWhatIfClosures(true));

    act(() => {
      result.current.toggleClosedStation("A");
      result.current.toggleClosedStation("B");
      result.current.handleLineToggle("victoria");
      result.current.handleLineToggle("jubilee");
    });

    expect(result.current.closedStations).toEqual(new Set(["A", "B"]));
    expect(result.current.closedLines).toEqual(new Set(["victoria", "jubilee"]));

    act(() => {
      result.current.clearClosedStations();
      result.current.clearClosedLines();
    });

    expect(result.current.closedStations).toEqual(new Set());
    expect(result.current.closedLines).toEqual(new Set());

    act(() => {
      result.current.toggleClosedStation("A");
      result.current.handleLineToggle("victoria");
      result.current.handleResetClosures();
    });

    expect(result.current.closedStations).toEqual(new Set());
    expect(result.current.closedLines).toEqual(new Set());
  });
});
