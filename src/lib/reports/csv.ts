// CSV generation for report export (US-8.10). Every report can be exported to CSV.
// RFC 4180-ish: fields containing a comma, double-quote, or newline are wrapped in
// double-quotes with embedded quotes doubled. Pure + testable; the client export
// button builds the same string from the rows the server already rendered.

export type CsvValue = string | number | null | undefined;

export function csvCell(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: CsvValue[][]): string {
  const lines = [headers.map(csvCell).join(",")];
  for (const row of rows) lines.push(row.map(csvCell).join(","));
  return lines.join("\r\n");
}
