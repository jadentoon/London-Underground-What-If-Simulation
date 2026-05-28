import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MapSearchBox } from "../app/components/search/MapSearchBox";

describe("MapSearchBox", () => {
  test("pressing Enter selects the highlighted station", () => {
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

    const input = screen.getByPlaceholderText("Search stations");

    fireEvent.keyDown(input, {
      key: "Enter",
      code: "Enter",
      charCode: 13,
    });

    expect(onSelectStation).toHaveBeenCalledTimes(1);
    expect(onSelectStation).toHaveBeenCalledWith(station);
    expect(onEnterFirstMatch).not.toHaveBeenCalled();
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

    fireEvent.click(
      screen.getByText("Harrow & Wealdstone Underground Station")
    );

    expect(onSelectStation).toHaveBeenCalledTimes(1);
    expect(onSelectStation).toHaveBeenCalledWith(station);
  });
});
