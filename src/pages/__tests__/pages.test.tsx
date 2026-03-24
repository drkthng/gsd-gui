import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { ChatPage } from "@/pages/chat-page";
import { ProjectsPage } from "@/pages/projects-page";
import { MilestonesPage } from "@/pages/milestones-page";
import { TimelinePage } from "@/pages/timeline-page";
import { CostsPage } from "@/pages/costs-page";
import { SettingsPage } from "@/pages/settings-page";
import { HelpPage } from "@/pages/help-page";

const pages = [
  {
    name: "Chat",
    Component: ChatPage,
    uniqueText: "Recent Conversations",
    sections: ["Recent Conversations", "Quick Actions"],
  },
  {
    name: "Projects",
    Component: ProjectsPage,
    uniqueText: "Active Projects",
    sections: ["Active Projects"],
  },
  {
    name: "Milestones",
    Component: MilestonesPage,
    uniqueText: "Current Milestone",
    sections: ["Current Milestone", "Upcoming Milestones"],
  },
  {
    name: "Timeline",
    Component: TimelinePage,
    uniqueText: "Sprint Timeline",
    sections: ["Sprint Timeline", "Recent Activity"],
  },
  {
    name: "Costs",
    Component: CostsPage,
    uniqueText: "Total Spend",
    sections: ["Total Spend", "Cost Breakdown"],
  },
  {
    name: "Settings",
    Component: SettingsPage,
    uniqueText: "Appearance",
    sections: ["Appearance", "API Keys"],
  },
  {
    name: "Help",
    Component: HelpPage,
    uniqueText: "Getting Started",
    sections: ["Getting Started", "Keyboard Shortcuts"],
  },
] as const;

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

  for (const { name, Component, sections } of pages) {
    it(`${name}Page renders at least 2 mock data sections`, () => {
      renderWithProviders(<Component />);
      const mockSections = screen.getAllByTestId("mock-section");
      expect(mockSections.length).toBeGreaterThanOrEqual(2);
      // Verify section headings match expected content
      for (const sectionTitle of sections) {
        const matches = screen.getAllByText(new RegExp(sectionTitle, "i"));
        expect(matches.length).toBeGreaterThanOrEqual(1);
      }
    });
  }
});
