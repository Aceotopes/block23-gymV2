import { Badge } from "block23-gym";

export const Statuses = () => (
  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
    <Badge>Active</Badge>
    <Badge variant="secondary">Walk-in</Badge>
    <Badge variant="outline">Upcoming</Badge>
    <Badge variant="destructive">Expired</Badge>
  </div>
);
