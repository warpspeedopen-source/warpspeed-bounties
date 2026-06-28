import { describe, expect, it } from "vitest";
import { extractCsv, extractHtml, extensionOf } from "../src/extractors/index.js";

describe("extractors", () => {
  it("normalizes file extensions", () => {
    expect(extensionOf("Quarterly.Report.PDF")).toBe(".pdf");
    expect(extensionOf("no-extension")).toBe("");
  });

  it("extracts visible HTML text", () => {
    const text = extractHtml("<html><body><h1>Hello</h1><script>bad()</script><p>World</p></body></html>");
    expect(text).toBe("Hello World");
  });

  it("turns CSV into readable pipe-delimited text", () => {
    expect(extractCsv("name,amount\nAcme,42")).toContain("Acme | 42");
  });
});

