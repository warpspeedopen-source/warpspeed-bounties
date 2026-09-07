/**
 * Tests for file extractors. Mock-heavy: avoids real PDF/DOCX
 * fixtures so the suite stays fast and dependency-free.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import {
  detectFileKind,
  extractBuffer,
  stripHtml,
} from "../src/extractors.js";

test("detectFileKind: pdf extension", () => {
  assert.equal(detectFileKind("report.pdf"), "pdf");
  assert.equal(detectFileKind("REPORT.PDF", "application/pdf"), "pdf");
});

test("detectFileKind: docx extension", () => {
  assert.equal(detectFileKind("notes.docx"), "docx");
  assert.equal(
    detectFileKind("foo.bin", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    "docx",
  );
});

test("detectFileKind: xlsx and csv", () => {
  assert.equal(detectFileKind("data.xlsx"), "xlsx");
  assert.equal(detectFileKind("data.xls"), "xlsx");
  assert.equal(detectFileKind("data.csv", "text/csv"), "csv");
});

test("detectFileKind: html", () => {
  assert.equal(detectFileKind("page.html"), "html");
  assert.equal(detectFileKind("page.htm", "text/html"), "html");
});

test("detectFileKind: txt", () => {
  assert.equal(detectFileKind("readme.txt"), "txt");
  assert.equal(detectFileKind("any.txt", "text/plain"), "txt");
});

test("detectFileKind: image", () => {
  assert.equal(detectFileKind("photo.png"), "image");
  assert.equal(detectFileKind("photo.jpg"), "image");
  assert.equal(detectFileKind("photo.jpeg"), "image");
  assert.equal(detectFileKind("foo", "image/png"), "image");
});

test("detectFileKind: unknown", () => {
  assert.equal(detectFileKind("blob.xyz"), "unknown");
});

test("stripHtml: removes tags and decodes entities", () => {
  const html = `<html><body><h1>Title</h1><p>Hello &amp; goodbye &lt;world&gt;</p></body></html>`;
  const result = stripHtml(html);
  assert.ok(result.includes("Title"));
  assert.ok(result.includes("Hello & goodbye <world>"));
  // Make sure actual HTML tags are gone. Entity-decoded "<world>" is
  // expected to remain; what must be stripped is raw tags like
  // "<html>", "<p>", etc.
  assert.ok(!/<html/i.test(result));
  assert.ok(!/<body/i.test(result));
  assert.ok(!/<p>/i.test(result));
  assert.ok(!/<h1>/i.test(result));
});

test("stripHtml: removes script and style blocks", () => {
  const html = `<style>p { color: red }</style><p>visible</p><script>alert(1)</script>`;
  const result = stripHtml(html);
  assert.ok(!result.includes("color"));
  assert.ok(!result.includes("alert"));
  assert.ok(result.includes("visible"));
});

test("extractBuffer: text file round-trip", async () => {
  const text = "Hello world\nLine 3";
  const result = await extractBuffer(Buffer.from(text, "utf8"), "hello.txt");
  assert.equal(result.text, "Hello world\nLine 3");
  assert.equal(result.detectedType, "txt");
  assert.match(result.contentHash, /^[a-f0-9]{64}$/);
});

test("extractBuffer: html file strips tags", async () => {
  const html = `<html><body><h1>Title</h1><p>Body text.</p></body></html>`;
  const result = await extractBuffer(Buffer.from(html, "utf8"), "page.html");
  assert.equal(result.detectedType, "html");
  assert.ok(result.text.includes("Title"));
  assert.ok(!result.text.includes("<"));
});

test("extractBuffer: unsupported file throws", async () => {
  await assert.rejects(
    () => extractBuffer(Buffer.from("hi"), "data.xyz"),
    /Unsupported file kind/,
  );
});

test("extractBuffer: csv returns text content", async () => {
  const csv = "name,age\nalice,30\nbob,25\n";
  const result = await extractBuffer(Buffer.from(csv, "utf8"), "table.csv");
  assert.equal(result.detectedType, "csv");
  assert.ok(result.text.includes("name,age"));
  assert.ok(result.text.includes("alice,30"));
});

test("extractBuffer: trims whitespace", async () => {
  const text = "   \n\n   hello   \n\n   ";
  const result = await extractBuffer(Buffer.from(text, "utf8"), "trim.txt");
  assert.equal(result.text, "hello");
});