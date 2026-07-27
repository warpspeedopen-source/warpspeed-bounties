import { spawn } from "child_process";

describe("Attachment Summarizer Service", () => {
  test("runCommand resolves with stdout on success", async () => {
    const { runCommand } = await import("../index");
    const output = await runCommand("echo", ["hello"]);
    expect(output.trim()).toBe("hello");
  });

  test("runCommand rejects on non-zero exit code", async () => {
    const { runCommand } = await import("../index");
    await expect(runCommand("false", [])).rejects.toThrow();
  });

  test("extractText returns empty string for unknown extension", async () => {
    const { extractText } = await import("../index");
    const text = await extractText("/tmp/file.unknown");
    expect(text).toBe("");
  });

  test("generateSummary returns a string", async () => {
    const { generateSummary } = await import("../index");
    // We mock spawn to simulate LLM output
    jest.spyOn(require("child_process"), "spawn").mockImplementation(() => {
      const { PassThrough } = require("stream");
      const stdout = new PassThrough();
      const stderr = new PassThrough();
      process.nextTick(() => {
        stdout.emit("data", "summary text");
        stdout.emit("end");
      });
      return {
        stdout,
        stderr,
        on: (event: string, cb: Function) => {
          if (event === "close") cb(0);
        },
      };
    });
    const summary = await generateSummary("some text");
    expect(summary).toBe("summary text");
  });
});
