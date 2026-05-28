import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { RouteInfoPanel } from "../app/components/layout/RouteInfoPanel";

const COLORS = {
  card: "rgba(15, 23, 42, 0.8)",
  border: "#1e3a5f",
  text: "#94a3b8",
  textMuted: "#64748b",
};

const lineColours = {
  victoria: "#0098d4",
  jubilee: "#7c878e",
};

const lineLabels = {
  victoria: "Victoria",
  jubilee: "Jubilee",
};

beforeEach(() => {
  jest.useRealTimers();
  window.requestAnimationFrame = jest.fn((callback) => {
    callback();
    return 1;
  });
  window.cancelAnimationFrame = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("RouteInfoPanel", () => {
  test("shows route summary actions when collapsed", () => {
    const onToggle = jest.fn();
    const onClearRoute = jest.fn();

    render(
      <RouteInfoPanel
        isOpen={false}
        onToggle={onToggle}
        onClearRoute={onClearRoute}
        routeInfo={{
          hasPath: true,
          startName: "Oxford Circus",
          endName: "Brixton",
          stops: [{ id: "1" }, { id: "2" }, { id: "3" }],
          groupedLegs: [],
          totalTravelSeconds: 480,
          changeCount: 1,
        }}
        COLORS={COLORS}
        accentColor="#3b82f6"
        lineColours={lineColours}
        lineLabels={lineLabels}
      />,
    );

    expect(screen.getByText("Route")).toBeInTheDocument();
    expect(screen.getByText("Oxford Circus -> Brixton")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear Route" }));
    fireEvent.click(screen.getByRole("button", { name: "View Route" }));

    expect(onClearRoute).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test("renders route details and legs when expanded", () => {
    const onToggle = jest.fn();
    const onClearRoute = jest.fn();

    render(
      <RouteInfoPanel
        isOpen={true}
        onToggle={onToggle}
        onClearRoute={onClearRoute}
        routeInfo={{
          hasPath: true,
          startName: "Oxford Circus",
          endName: "Brixton",
          stops: [{ id: "1" }, { id: "2" }, { id: "3" }],
          groupedLegs: [
            {
              line: "victoria",
              fromName: "Oxford Circus",
              toName: "Green Park",
              stops: 1,
              travelTimeSeconds: 120,
            },
            {
              line: "jubilee",
              fromName: "Green Park",
              toName: "Brixton",
              stops: 2,
              travelTimeSeconds: 360,
            },
          ],
          totalTravelSeconds: 480,
          changeCount: 1,
        }}
        COLORS={COLORS}
        accentColor="#3b82f6"
        lineColours={lineColours}
        lineLabels={lineLabels}
      />,
    );

    expect(screen.getByText("Route Details")).toBeInTheDocument();
    expect(screen.getByText("Oxford Circus -> Brixton: 2 stops")).toBeInTheDocument();
    expect(screen.getByText("Line Segments")).toBeInTheDocument();
    expect(screen.getByText("Victoria")).toBeInTheDocument();
    expect(screen.getByText("Jubilee")).toBeInTheDocument();
    expect(screen.getByText("Oxford Circus -> Green Park • 1 stop")).toBeInTheDocument();
    expect(screen.getByText("Green Park -> Brixton • 2 stops")).toBeInTheDocument();
    expect(screen.getByText("2 min")).toBeInTheDocument();
    expect(screen.getByText("6 min")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Clear Route" })[1]);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onClearRoute).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test("offers undo clear action when there is no active route", () => {
    const onUndoClearRoute = jest.fn();

    render(
      <RouteInfoPanel
        isOpen={true}
        onToggle={jest.fn()}
        onUndoClearRoute={onUndoClearRoute}
        routeInfo={{ hasPath: false, stops: [], groupedLegs: [] }}
        lastClearedRoute={{
          startId: "1",
          startName: "Waterloo",
          endId: "2",
          endName: "Paddington",
        }}
        COLORS={COLORS}
        accentColor="#3b82f6"
        lineColours={lineColours}
        lineLabels={lineLabels}
      />,
    );

    expect(screen.getAllByText("Last cleared: Waterloo -> Paddington")).toHaveLength(2);
    expect(screen.getByText("Restore Waterloo -> Paddington, or select a new route on the map.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Undo clear route" }));

    expect(onUndoClearRoute).toHaveBeenCalledTimes(1);
  });
});
