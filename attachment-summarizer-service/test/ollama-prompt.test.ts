import { describe, expect, it } from "vitest";
import { buildSummaryPrompt } from "../src/llm/ollamaClient.js";

describe("buildSummaryPrompt", () => {
  it("instructs the model to avoid invented facts", () => {
    const prompt = buildSummaryPrompt("Invoice due Friday for $1200.");
    expect(prompt).toContain("Do not invent facts");
    expect(prompt).toContain("$1200");
  });

  it("clips long text to keep local inference bounded", () => {
    const prompt = buildSummaryPrompt("x".repeat(25000));
    expect(prompt.length).toBeLessThan(19000);
  });
});

