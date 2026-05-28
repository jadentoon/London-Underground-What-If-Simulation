import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { RoutingErrorBox } from "../app/components/route/RoutingErrorBox";

describe("RoutingErrorBox", () => {
  test("renders nothing when no routing error exists", () => {
    const { container } = render(<RoutingErrorBox error={null} onClose={jest.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  test("shows a closed-lines specific message and closes on click", () => {
    const onClose = jest.fn();

    render(
      <RoutingErrorBox
        error={{
          from: "Oxford Circus",
          to: "Brixton",
          reason: "closed-lines",
        }}
        onClose={onClose}
      />,
    );

    expect(screen.getByText("Route Not Possible")).toBeInTheDocument();
    expect(screen.getByText(/Cannot find a route from/i)).toBeInTheDocument();
    expect(screen.getByText("Oxford Circus")).toBeInTheDocument();
    expect(screen.getByText("Brixton")).toBeInTheDocument();
    expect(screen.getByText("Line closures or partial closures may be blocking all available paths.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "×" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("shows the closed-stations message when appropriate", () => {
    render(
      <RoutingErrorBox
        error={{
          from: "King's Cross",
          to: "Victoria",
          reason: "closed-stations",
        }}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText("Closed stations may be blocking all available paths.")).toBeInTheDocument();
  });
});
