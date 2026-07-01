import { Input, Label } from "block23-gym";

export const Labeled = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 280 }}>
    <Label htmlFor="m-name">Member name</Label>
    <Input id="m-name" placeholder="Juan Dela Cruz" />
  </div>
);

export const States = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 280 }}>
    <Input placeholder="Search members…" />
    <Input defaultValue="₱ 500.00" />
    <Input placeholder="Disabled" disabled />
    <Input aria-invalid defaultValue="invalid@email" />
  </div>
);
