/**
 * Tests for the Ollama summarizer. Uses a fake fetch to capture the
 * outgoing request and feed a canned response back.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { Summarizer } from "../src/summarizer.js";
import type { Logger } from "../src/types.js";

const silentLogger: Logger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  debug: () => undefined,
  child: () => silentLogger,
};

function makeFetch(
  handler: (url: string, init?: RequestInit) => Promise<Response>,
) {
  return (async (input: unknown, init?: RequestInit) => {
    const url = typeof input === "string" ? input : (input as URL).toString();
    return handler(url, init);
  }) as unknown as typeof fetch;
}

test("Summarizer.summarize: posts to /api/generate and parses response", async () => {
  let captured: { url: string; body: unknown } | null = null;
  const fakeFetch = makeFetch(async (url, init) => {
    captured = {
      url,
      body: init?.body ? JSON.parse(String(init.body)) : null,
    };
    return new Response(
      JSON.stringify({ response: "Concise summary here.", model: "llama3" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  });

  const summarizer = new Summarizer({
    baseUrl: "http://localhost:11434",
    model: "llama3",
    maxChars: 1000,
    logger: silentLogger,
    fetchImpl: fakeFetch,
  });

  const result = await summarizer.summarize("hello world");
  assert.equal(result.summary, "Concise summary here.");
  assert.equal(result.model, "llama3");
  assert.ok(captured);
  assert.equal(captured!.url, "http://localhost:11434/api/generate");
  const body = captured!.body as { model: string; prompt: string; stream: boolean };
  assert.equal(body.model, "llama3");
  assert.equal(body.stream, false);
  assert.equal(body.prompt, "hello world");
});

test("Summarizer.summarize: throws on non-2xx", async () => {
  const fakeFetch = makeFetch(async () => {
    return new Response("boom", { status: 500, statusText: "Internal Server Error" });
  });

  const summarizer = new Summarizer({
    baseUrl: "http://localhost:11434",
    model: "llama3",
    maxChars: 1000,
    logger: silentLogger,
    fetchImpl: fakeFetch,
  });

  await assert.rejects(() => summarizer.summarize("hi"), /Ollama request failed/);
});

test("Summarizer.summarize: truncates long input to maxChars", async () => {
  let captured: { body: unknown } | null = null;
  const fakeFetch = makeFetch(async (_url, init) => {
    captured = { body: init?.body ? JSON.parse(String(init.body)) : null };
    return new Response(JSON.stringify({ response: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });

  const summarizer = new Summarizer({
    baseUrl: "http://localhost:11434",
    model: "llama3",
    maxChars: 100,
    logger: silentLogger,
    fetchImpl: fakeFetch,
  });

  const long = "word ".repeat(500);
  await summarizer.summarize(long);
  const body = captured!.body as { prompt: string };
  assert.ok(body.prompt.length <= 100);
});

test("Summarizer.summarizeStream: yields chunks from NDJSON", async () => {
  const encoder = new TextEncoder();
  const ndjson = [
    JSON.stringify({ response: "Hello", done: false }),
    JSON.stringify({ response: " world", done: false }),
    JSON.stringify({ response: ".", done: true }),
    "",
  ].join("\n");

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(ndjson));
      controller.close();
    },
  });

  const fakeFetch = (async () => {
    return new Response(stream, { status: 200 });
  }) as unknown as typeof fetch;

  const summarizer = new Summarizer({
    baseUrl: "http://localhost:11434",
    model: "llama3",
    maxChars: 1000,
    logger: silentLogger,
    fetchImpl: fakeFetch,
  });

  const out: string[] = [];
  for await (const ev of summarizer.summarizeStream("hello")) {
    out.push(ev.chunk);
  }
  assert.deepEqual(out, ["Hello", " world", "."]);
});

test("Summarizer.summarizeStream: surfaces non-2xx as error", async () => {
  const fakeFetch = (async () =>
    new Response("bad", { status: 503, statusText: "Service Unavailable" })) as unknown as typeof fetch;

  const summarizer = new Summarizer({
    baseUrl: "http://localhost:11434",
    model: "llama3",
    maxChars: 1000,
    logger: silentLogger,
    fetchImpl: fakeFetch,
  });

  await assert.rejects(
    (async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of summarizer.summarizeStream("hi")) {
        // unreachable
      }
    })(),
    /Ollama stream failed/,
  );
});