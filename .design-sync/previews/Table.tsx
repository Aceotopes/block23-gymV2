import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "block23-gym";

export const CheckInLog = () => (
  <div style={{ width: 520 }}>
    <Table>
      <TableCaption>Recent check-ins · today</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Time in</TableHead>
          <TableHead style={{ textAlign: "right" }}>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Juan Dela Cruz</TableCell>
          <TableCell>Member</TableCell>
          <TableCell style={{ fontVariantNumeric: "tabular-nums" }}>7:02 AM</TableCell>
          <TableCell style={{ textAlign: "right", color: "var(--muted-foreground)" }}>—</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Maria Santos</TableCell>
          <TableCell>Walk-in</TableCell>
          <TableCell style={{ fontVariantNumeric: "tabular-nums" }}>7:15 AM</TableCell>
          <TableCell style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>₱ 60.00</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Pedro Reyes</TableCell>
          <TableCell>Walk-in</TableCell>
          <TableCell style={{ fontVariantNumeric: "tabular-nums" }}>7:20 AM</TableCell>
          <TableCell style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>₱ 60.00</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
);
