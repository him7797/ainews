import { describe, it, expect } from "vitest";
import { sanitize } from "../../src/sanitizer.js";

describe("sanitize", () => {
  it("strips <p> tags", () => {
    expect(sanitize("<p>Hello world</p>")).toBe("Hello world");
  });

  it("strips <a href> tags, keeping text content", () => {
    expect(sanitize('<a href="https://example.com">Click here</a>')).toBe(
      "Click here"
    );
  });

  it("strips <img> tags (no text content)", () => {
    expect(sanitize('<img src="photo.jpg" alt="photo">')).toBe("");
  });

  it("strips nested tags", () => {
    expect(sanitize("<p><strong>Bold</strong> and <em>italic</em></p>")).toBe(
      "Bold and italic"
    );
  });

  it("decodes &amp;", () => {
    expect(sanitize("Cats &amp; Dogs")).toBe("Cats & Dogs");
  });

  it("decodes &#8217; (right single quote)", () => {
    expect(sanitize("It&#8217;s great")).toBe("It\u2019s great");
  });

  it("decodes &lt; and &gt;", () => {
    expect(sanitize("1 &lt; 2 &gt; 0")).toBe("1 < 2 > 0");
  });

  it("returns empty string for empty input", () => {
    expect(sanitize("")).toBe("");
  });

  it("returns empty string for null", () => {
    expect(sanitize(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(sanitize(undefined)).toBe("");
  });

  it("passes through plain text unchanged", () => {
    expect(sanitize("Just plain text here.")).toBe("Just plain text here.");
  });

  it("returns empty string when input is only tags", () => {
    expect(sanitize("<div><span></span></div>")).toBe("");
  });
});
