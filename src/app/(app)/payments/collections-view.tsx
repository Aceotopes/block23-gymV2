import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import type { CollectionsSummary } from "@/lib/payments/collections";
import { CollectionsDate } from "./collections-date";

function peso(value: number): string {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// End-of-day Collections Summary (US-5.4, Flow 17) — today's (or a selected day's)
// non-voided totals by payment method, spanning CLIENT_TRANSACTION and POS_SALE
// (ADR-006; POS arrives M6). Always shows all four methods, even at ₱0.
export function CollectionsView({
  summary,
  date,
  maxDate,
}: {
  summary: CollectionsSummary;
  date: string;
  maxDate: string;
}) {
  return (
    <div className="space-y-4">
      <CollectionsDate date={date} maxDate={maxDate} />

      <Card className="max-w-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment method</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.lines.map((l) => (
                <TableRow key={l.method}>
                  <TableCell className="font-medium">{l.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{l.count}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {peso(l.total)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2">
                <TableCell className="font-semibold">Grand total</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {summary.grandCount}
                </TableCell>
                <TableCell className="text-right font-mono text-base font-semibold tabular-nums">
                  {peso(summary.grandTotal)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {summary.grandCount === 0 ? (
        <p className="text-muted-foreground text-sm">
          No transactions recorded for this date.
        </p>
      ) : (
        <p className="text-muted-foreground text-sm">
          Totals span all client payments and product sales for the selected day.
          Voided transactions are excluded.
        </p>
      )}
    </div>
  );
}
