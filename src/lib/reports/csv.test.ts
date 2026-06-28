import { describe, it, expect } from "vitest";
import { csvCell, toCsv } from "./csv";

describe("csvCell", () => {
  it("passes plain values through", () => {
    expect(csvCell("Water")).toBe("Water");
    expect(csvCell(42)).toBe("42");
  });

  it("renders null/undefined as empty", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });

  it("quotes and escapes fields with commas, quotes, or newlines", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
  });
});

describe("toCsv", () => {
  it("joins headers + rows with CRLF and escapes cells", () => {
    const csv = toCsv(
      ["Name", "Amount", "Note"],
      [
        ["Membership", 1000, "ok"],
        ["Walk-in, late", 75, 'said "hi"'],
      ],
    );
    expect(csv).toBe(
      'Name,Amount,Note\r\nMembership,1000,ok\r\n"Walk-in, late",75,"said ""hi"""',
    );
  });
});
