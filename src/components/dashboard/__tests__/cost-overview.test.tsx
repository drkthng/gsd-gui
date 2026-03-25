import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { CostOverview } from "../cost-overview";
import { mockCostData } from "@/test/mock-data";

vi.mock("@/services/gsd-client", () => ({
  createGsdClient: () => ({
    startSession: vi.fn(), stopSession: vi.fn(), sendCommand: vi.fn(),
    queryState: vi.fn(), listProjects: vi.fn(), startFileWatcher: vi.fn(),
    stopFileWatcher: vi.fn(), onGsdEvent: vi.fn().mockResolvedValue(vi.fn()),
    onProcessExit: vi.fn().mockResolvedValue(vi.fn()),
    onProcessError: vi.fn().mockResolvedValue(vi.fn()),
    onFileChanged: vi.fn().mockResolvedValue(vi.fn()),
  }),
}));

// Mock Recharts to avoid SVG rendering issues in jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => children,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  Legend: () => null,
}));

describe("CostOverview", () => {
  it("shows total cost", () => {
    renderWithProviders(<CostOverview data={mockCostData} />);
    expect(screen.getByText("$12.50")).toBeInTheDocument();
  });

  it("shows budget ceiling", () => {
    renderWithProviders(<CostOverview data={mockCostData} />);
    expect(screen.getByText("$50.00")).toBeInTheDocument();
  });

  it("shows budget usage percentage", () => {
    renderWithProviders(<CostOverview data={mockCostData} />);
    expect(screen.getByText(/25%/)).toBeInTheDocument();
  });

  it("renders phase breakdown chart", () => {
    renderWithProviders(<CostOverview data={mockCostData} />);
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("renders model breakdown chart", () => {
    renderWithProviders(<CostOverview data={mockCostData} />);
    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
  });

  it("renders per-slice cost table", () => {
    renderWithProviders(<CostOverview data={mockCostData} />);
    expect(screen.getByText("Scaffold")).toBeInTheDocument();
    expect(screen.getByText("$3.50")).toBeInTheDocument();
  });

  it("shows no budget when ceiling is null", () => {
    renderWithProviders(<CostOverview data={{ ...mockCostData, budgetCeiling: null }} />);
    expect(screen.getByText("No budget set")).toBeInTheDocument();
  });
});
