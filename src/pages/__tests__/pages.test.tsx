import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { ChatPage } from "@/pages/chat-page";
import { ProjectsPage } from "@/pages/projects-page";
import { MilestonesPage } from "@/pages/milestones-page";
import { TimelinePage } from "@/pages/timeline-page";
import { CostsPage } from "@/pages/costs-page";
import { SettingsPage } from "@/pages/settings-page";
import { HelpPage } from "@/pages/help-page";

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

interface PageDef {
  name: string;
  Component: React.ComponentType;
  uniqueText: string;
  hasMockSections?: boolean;
  sections?: string[];
}

const pages: PageDef[] = [
  {
    name: "Chat",
    Component: ChatPage,
    uniqueText: "Start a conversation",
    hasMockSections: false,
  },
  {
    name: "Projects",
    Component: ProjectsPage,
    uniqueText: "No projects",
    hasMockSections: false,
  },
  {
    name: "Milestones",
    Component: MilestonesPage,
    uniqueText: "M001",
    hasMockSections: false,
  },
  {
    name: "Timeline",
    Component: TimelinePage,
    uniqueText: "Rust process manager",
    hasMockSections: false,
  },
  {
    name: "Costs",
    Component: CostsPage,
    uniqueText: "Cost by Phase",
    hasMockSections: false,
  },
  {
    name: "Settings",
    Component: SettingsPage,
    uniqueText: "Token Profile",
    hasMockSections: false,
  },
  {
    name: "Help",
    Component: HelpPage,
    uniqueText: "Getting Started",
    hasMockSections: true,
    sections: ["Getting Started", "Keyboard Shortcuts"],
  },
];

describe("Page components", () => {
  for (const { name, Component } of pages) {
    it(`${name}Page renders a heading with "${name}"`, () => {
      renderWithProviders(<Component />);
      expect(
        screen.getByRole("heading", { level: 1, name: new RegExp(name, "i") }),
      ).toBeInTheDocument();
    });
  }

  for (const { name, Component } of pages) {
    it(`${name}Page renders a page icon`, () => {
      renderWithProviders(<Component />);
      expect(screen.getByTestId("page-icon")).toBeInTheDocument();
    });
  }

  for (const { name, Component, uniqueText } of pages) {
    it(`${name}Page renders page-specific content ("${uniqueText}")`, () => {
      renderWithProviders(<Component />);
      expect(screen.getByText(new RegExp(uniqueText, "i"))).toBeInTheDocument();
    });
  }

  const pagesWithMockSections = pages.filter((p) => p.hasMockSections && p.sections);
  for (const { name, Component, sections } of pagesWithMockSections) {
    it(`${name}Page renders mock data sections`, () => {
      renderWithProviders(<Component />);
      const mockSections = screen.getAllByTestId("mock-section");
      expect(mockSections.length).toBeGreaterThanOrEqual(2);
      for (const sectionTitle of sections!) {
        const matches = screen.getAllByText(new RegExp(sectionTitle, "i"));
        expect(matches.length).toBeGreaterThanOrEqual(1);
      }
    });
  }
});
