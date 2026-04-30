import { render, screen } from "@testing-library/react";
import StationLayer from "../app/components/mapLayers/StationLayer";

describe("StationLayer", () => {
  test("renders a marker X for a live-closed station", () => {
    render(
      <StationLayer
        nodes={[
          {
            id: "940GZZLUHAW",
            name: "Harrow & Wealdstone Underground Station",
            lat: 51.592268,
            lon: -0.335217,
          },
        ]}
        startId={null}
        setStartId={jest.fn()}
        pathSet={new Set()}
        closedSet={new Set()}
        hasPath={false}
        hypotheticalSettingsEnabled={false}
        redXIcon={{}}
        onSingleClickStation={jest.fn()}
        onDoubleClickStation={jest.fn()}
        zoomLevel={14}
        liveClosedSet={new Set(["940GZZLUHAW"])}
      />
    );

    expect(screen.getByTestId("marker")).toBeInTheDocument();
  });

  test("does not render a marker X when station is not closed", () => {
    render(
      <StationLayer
        nodes={[
          {
            id: "940GZZLUHAW",
            name: "Harrow & Wealdstone Underground Station",
            lat: 51.592268,
            lon: -0.335217,
          },
        ]}
        startId={null}
        setStartId={jest.fn()}
        pathSet={new Set()}
        closedSet={new Set()}
        hasPath={false}
        hypotheticalSettingsEnabled={false}
        redXIcon={{}}
        onSingleClickStation={jest.fn()}
        onDoubleClickStation={jest.fn()}
        zoomLevel={14}
        liveClosedSet={new Set()}
      />
    );

    expect(screen.queryByTestId("marker")).not.toBeInTheDocument();
  });
});