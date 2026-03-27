import { describe, expect, it } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test/test-utils";
import { MilestoneGroupedList } from "./milestone-grouped-list";
import type { StatusGroup } from "@/lib/milestone-filters";
import type { MilestoneInfo } from "@/lib/types";

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const activeMilestone: MilestoneInfo = {
  id: "M002",
  title: "Backend Bridge",
  status: "in-progress",
  cost: 3.1,
  progress: 50,
  slices: [],
};

const completeMilestone: MilestoneInfo = {
  id: "M001",
  title: "Project Scaffolding",
  status: "done",
  cost: 2.4,
  progress: 100,
  slices: [],
};

const plannedMilestone: MilestoneInfo = {
  id: "M003",
  title: "Dashboard Polish",
  status: "pending",
  cost: 0,
  progress: 0,
  slices: [],
};

const twoGroups: StatusGroup[] = [
  { label: "Active", status: ["in-progress"], milestones: [activeMilestone] },
  {
    label: "Complete",
    status: ["done"],
    milestones: [completeMilestone],
  },
];

const threeGroups: StatusGroup[] = [
  ...twoGroups,
  {
    label: "Planned",
    status: ["pending", "blocked"],
    milestones: [plannedMilestone],
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MilestoneGroupedList", () => {
  it("renders group headers with labels and milestone counts", () => {
    renderWithProviders(<MilestoneGroupedList groups={twoGroups} />);

    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Complete")).toBeInTheDocument();

    // Both groups have count 1 — use getAllByText to verify badges render
    const countBadges = screen.getAllByText("1");
    expect(countBadges).toHaveLength(2);
  });

  it("renders all groups when given multiple groups", () => {
    renderWithProviders(<MilestoneGroupedList groups={threeGroups} />);

    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(screen.getByText("Planned")).toBeInTheDocument();
  });

  it("renders milestone IDs inside each group (all expanded by default)", () => {
    renderWithProviders(<MilestoneGroupedList groups={twoGroups} />);

    // Milestones should be visible because groups are expanded by default
    expect(screen.getByText(/M002/)).toBeInTheDocument();
    expect(screen.getByText(/M001/)).toBeInTheDocument();
  });

  it("collapses a group when its header is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MilestoneGroupedList groups={twoGroups} />);

    // Both groups' milestones visible initially
    expect(screen.getByText(/M002/)).toBeInTheDocument();
    expect(screen.getByText(/M001/)).toBeInTheDocument();

    // Click the Active group header to collapse it
    await user.click(screen.getByRole("button", { name: /Active/i }));

    // M002 (active milestone) should be hidden, M001 still visible
    expect(screen.queryByText(/M002/)).not.toBeInTheDocument();
    expect(screen.getByText(/M001/)).toBeInTheDocument();
  });

  it("re-expands a collapsed group on second click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MilestoneGroupedList groups={twoGroups} />);

    const activeHeader = screen.getByRole("button", { name: /Active/i });

    // Collapse
    await user.click(activeHeader);
    expect(screen.queryByText(/M002/)).not.toBeInTheDocument();

    // Re-expand
    await user.click(activeHeader);
    expect(screen.getByText(/M002/)).toBeInTheDocument();
  });

  it("renders nothing when groups array is empty", () => {
    const { container } = renderWithProviders(
      <MilestoneGroupedList groups={[]} />,
    );
    // Should render an empty container — no group headers
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(container.querySelector("[data-slot='collapsible']")).not.toBeInTheDocument();
  });

  it("shows correct count badges for groups with multiple milestones", () => {
    const multiGroup: StatusGroup[] = [
      {
        label: "Complete",
        status: ["done"],
        milestones: [
          completeMilestone,
          { ...completeMilestone, id: "M004", title: "Extra Complete" },
        ],
      },
    ];

    renderWithProviders(<MilestoneGroupedList groups={multiGroup} />);

    // Count badge should show 2
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
