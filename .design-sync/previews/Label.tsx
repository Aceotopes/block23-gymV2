import { Label, Input } from "block23-gym";

export const WithField = () => (
  <div style={{ display: "grid", gap: 8, width: 260 }}>
    <Label htmlFor="phone">Phone number</Label>
    <Input id="phone" placeholder="0917 000 0000" />
  </div>
);
