import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { MilestoneFilterBar } from "@/components/milestones/milestone-filter-bar";
import type { StatusFilter } from "@/lib/milestone-filters";

const defaultCounts: Record<StatusFilter, number> = {
  all: 5,
  active: 1,
  complete: 2,
  planned: 2,
};

function renderBar(
  overrides: {
    counts?: Record<StatusFilter, number>;
    activeFilter?: StatusFilter;
    onChange?: (f: StatusFilter) => void;
  } = {},
) {
  const onChange = overrides.onChange ?? vi.fn();
  return {
    onChange,
    ...renderWithProviders(
      <MilestoneFilterBar
        counts={overrides.counts ?? defaultCounts}
        activeFilter={overrides.activeFilter ?? "all"}
        onChange={onChange}
      />,
    ),
  };
}

describe("MilestoneFilterBar", () => {
  it("renders All, Active, Complete, and Planned buttons", () => {
    renderBar();
    expect(screen.getByRole("button", { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /active/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /complete/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /planned/i }),
    ).toBeInTheDocument();
  });

  it("'All' button is pressed by default", () => {
    renderBar({ activeFilter: "all" });
    const allBtn = screen.getByRole("button", { name: /all/i });
    expect(allBtn).toHaveAttribute("data-active", "true");
  });

  it("the active filter button has data-active='true', others do not", () => {
    renderBar({ activeFilter: "active" });
    expect(screen.getByRole("button", { name: /^active/i })).toHaveAttribute(
      "data-active",
      "true",
    );
    expect(screen.getByRole("button", { name: /all/i })).toHaveAttribute(
      "data-active",
      "false",
    );
    expect(screen.getByRole("button", { name: /complete/i })).toHaveAttribute(
      "data-active",
      "false",
    );
  });

  it("clicking a filter calls onChange with the correct StatusFilter", async () => {
    const user = userEvent.setup();
    const { onChange } = renderBar();

    await user.click(screen.getByRole("button", { name: /complete/i }));
    expect(onChange).toHaveBeenCalledWith("complete");

    await user.click(screen.getByRole("button", { name: /planned/i }));
    expect(onChange).toHaveBeenCalledWith("planned");
  });

  it("displays counts as badge text on each button", () => {
    renderBar();
    // Each button should contain its count
    expect(screen.getByRole("button", { name: /all/i })).toHaveTextContent(
      "5",
    );
    expect(screen.getByRole("button", { name: /active/i })).toHaveTextContent(
      "1",
    );
    expect(
      screen.getByRole("button", { name: /complete/i }),
    ).toHaveTextContent("2");
    expect(
      screen.getByRole("button", { name: /planned/i }),
    ).toHaveTextContent("2");
  });

  it("renders zero counts without crashing", () => {
    const zeroCounts: Record<StatusFilter, number> = {
      all: 0,
      active: 0,
      complete: 0,
      planned: 0,
    };
    renderBar({ counts: zeroCounts });
    expect(screen.getByRole("button", { name: /all/i })).toHaveTextContent(
      "0",
    );
  });
});
