"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toCsv, type CsvValue } from "@/lib/reports/csv";

// CSV export (US-8.10). The server already computed the rows; this builds the same CSV
// client-side and triggers a download — no second query, no extra route. The Blob is
// UTF-8 with a BOM so Excel reads ₱ and accented names correctly.
export function CsvExportButton({
  filename,
  headers,
  rows,
  disabled,
}: {
  filename: string;
  headers: string[];
  rows: CsvValue[][];
  disabled?: boolean;
}) {
  function download() {
    const csv = toCsv(headers, rows);
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={download}
      disabled={disabled || rows.length === 0}
    >
      <Download aria-hidden />
      Export CSV
    </Button>
  );
}
