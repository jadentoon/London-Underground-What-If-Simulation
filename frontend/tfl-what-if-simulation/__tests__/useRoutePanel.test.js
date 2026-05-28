import { act, renderHook } from "@testing-library/react";

import { useRoutePanel } from "../app/hooks/map/useRoutePanel";

describe("useRoutePanel", () => {
  test("starts closed with no route or routing error", () => {
    const { result } = renderHook(() => useRoutePanel());

    expect(result.current.routingError).toBeNull();
    expect(result.current.routeInfo).toBeNull();
    expect(result.current.isRoutePanelOpen).toBe(false);
  });

  test("opens the panel when a valid route is set and closes it when no path is available", () => {
    const { result } = renderHook(() => useRoutePanel());

    act(() => {
      result.current.handleRouteChange({
        hasPath: true,
        startName: "Waterloo",
        endName: "Paddington",
      });
    });

    expect(result.current.routeInfo).toEqual({
      hasPath: true,
      startName: "Waterloo",
      endName: "Paddington",
    });
    expect(result.current.isRoutePanelOpen).toBe(true);

    act(() => {
      result.current.handleRouteChange({
        hasPath: false,
        startName: "Waterloo",
        endName: "Paddington",
      });
    });

    expect(result.current.routeInfo).toEqual({
      hasPath: false,
      startName: "Waterloo",
      endName: "Paddington",
    });
    expect(result.current.isRoutePanelOpen).toBe(false);
  });

  test("toggle and collapse handlers update the panel open state", () => {
    const { result } = renderHook(() => useRoutePanel());

    act(() => {
      result.current.toggleRoutePanel();
    });
    expect(result.current.isRoutePanelOpen).toBe(true);

    act(() => {
      result.current.toggleRoutePanel();
    });
    expect(result.current.isRoutePanelOpen).toBe(false);

    act(() => {
      result.current.toggleRoutePanel();
      result.current.collapseRoutePanel();
    });
    expect(result.current.isRoutePanelOpen).toBe(false);
  });

  test("clearRoutePanel resets routing error, route info, and open state", () => {
    const { result } = renderHook(() => useRoutePanel());

    act(() => {
      result.current.setRoutingError({ reason: "closed-lines" });
      result.current.handleRouteChange({
        hasPath: true,
        startName: "Oxford Circus",
        endName: "Brixton",
      });
    });

    expect(result.current.routingError).toEqual({ reason: "closed-lines" });
    expect(result.current.routeInfo?.hasPath).toBe(true);
    expect(result.current.isRoutePanelOpen).toBe(true);

    act(() => {
      result.current.clearRoutePanel();
    });

    expect(result.current.routingError).toBeNull();
    expect(result.current.routeInfo).toBeNull();
    expect(result.current.isRoutePanelOpen).toBe(false);
  });
});
