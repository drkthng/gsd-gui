import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/test/test-utils";
import { ProToolsPage, panelCategories } from "@/pages/pro-tools-page";

describe("ProToolsPage", () => {
  it("renders the page heading", () => {
    renderWithProviders(<ProToolsPage />);
    expect(screen.getByRole("heading", { level: 1, name: /pro tools/i })).toBeInTheDocument();
  });

  it("renders a page icon", () => {
    renderWithProviders(<ProToolsPage />);
    expect(screen.getByTestId("page-icon")).toBeInTheDocument();
  });

  it("renders all 5 categories", () => {
    renderWithProviders(<ProToolsPage />);
    const categories = screen.getAllByTestId("panel-category");
    expect(categories).toHaveLength(5);
  });

  it("renders category headings", () => {
    renderWithProviders(<ProToolsPage />);
    for (const cat of panelCategories) {
      expect(screen.getByRole("heading", { level: 2, name: new RegExp(cat.name, "i") })).toBeInTheDocument();
    }
  });

  it("renders all 19 panel cards", () => {
    renderWithProviders(<ProToolsPage />);
    const cards = screen.getAllByTestId("panel-card");
    expect(cards).toHaveLength(19);
  });

  it("each panel card is a link with the correct path prefix", () => {
    renderWithProviders(<ProToolsPage />);
    const cards = screen.getAllByTestId("panel-card");
    for (const card of cards) {
      expect(card.tagName).toBe("A");
      expect(card.getAttribute("href")).toMatch(/^\/pro-tools\//);
    }
  });
});
