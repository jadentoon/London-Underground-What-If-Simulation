import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MapSearchBox } from "../app/components/layout/MapSearchBox";

describe("MapSearchBox", () => {
  test("pressing Enter triggers the first match handler when matches exist", () => {
    const onStationQueryChange = jest.fn();
    const onSelectStation = jest.fn();
    const onEnterFirstMatch = jest.fn();

    render(
      <MapSearchBox
        hypotheticalSettingsEnabled={false}
        COLORS={{
          card: "rgba(15, 23, 42, 0.8)",
          border: "#1e3a5f",
          text: "#94a3b8",
        }}
        accentColor="#3b82f6"
        stationQuery="Harrow"
        onStationQueryChange={onStationQueryChange}
        stationMatches={[
          {
            id: "940GZZLUHAW",
            name: "Harrow & Wealdstone Underground Station",
          },
        ]}
        onSelectStation={onSelectStation}
        onEnterFirstMatch={onEnterFirstMatch}
      />
    );

    // open search drawer
    fireEvent.click(screen.getByTitle("Open search"));

    const input = screen.getByPlaceholderText("Search station...");

    fireEvent.keyDown(input, {
      key: "Enter",
      code: "Enter",
      charCode: 13,
    });

    expect(onEnterFirstMatch).toHaveBeenCalledTimes(1);
  });

  test("clicking a station suggestion calls onSelectStation with that station", () => {
    const onStationQueryChange = jest.fn();
    const onSelectStation = jest.fn();
    const onEnterFirstMatch = jest.fn();

    const station = {
      id: "940GZZLUHAW",
      name: "Harrow & Wealdstone Underground Station",
    };

    render(
      <MapSearchBox
        hypotheticalSettingsEnabled={false}
        COLORS={{
          card: "rgba(15, 23, 42, 0.8)",
          border: "#1e3a5f",
          text: "#94a3b8",
        }}
        accentColor="#3b82f6"
        stationQuery="Harrow"
        onStationQueryChange={onStationQueryChange}
        stationMatches={[station]}
        onSelectStation={onSelectStation}
        onEnterFirstMatch={onEnterFirstMatch}
      />
    );

    fireEvent.click(screen.getByTitle("Open search"));
    fireEvent.click(
      screen.getByText("Harrow & Wealdstone Underground Station")
    );

    expect(onSelectStation).toHaveBeenCalledTimes(1);
    expect(onSelectStation).toHaveBeenCalledWith(station);
  });
});