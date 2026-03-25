import { describe, expect, it } from "vitest";
import { render, screen } from "@/test/test-utils";
import { SecretsPanel } from "./secrets-panel";

describe("SecretsPanel", () => {
  it("renders the panel title", () => {
    render(<SecretsPanel />);
    expect(screen.getByText("Secrets")).toBeInTheDocument();
  });

  it("renders all mock secrets", () => {
    render(<SecretsPanel />);
    expect(screen.getByTestId("secret-sec1")).toBeInTheDocument();
    expect(screen.getByTestId("secret-sec2")).toBeInTheDocument();
    expect(screen.getByTestId("secret-sec3")).toBeInTheDocument();
    expect(screen.getByTestId("secret-sec4")).toBeInTheDocument();
  });

  it("shows source badges", () => {
    render(<SecretsPanel />);
    expect(screen.getAllByText("env")).toHaveLength(2);
    expect(screen.getByText("vault")).toBeInTheDocument();
    expect(screen.getByText("config")).toBeInTheDocument();
  });

  it("displays secret names and masked values", () => {
    render(<SecretsPanel />);
    expect(screen.getByText("OPENAI_API_KEY")).toBeInTheDocument();
    expect(screen.getByText("sk-****")).toBeInTheDocument();
  });
});
