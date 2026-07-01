import { Button } from "block23-gym";

export const Variants = () => (
  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
    <Button>Add member</Button>
    <Button variant="secondary">Renew</Button>
    <Button variant="outline">Filter</Button>
    <Button variant="ghost">Cancel</Button>
    <Button variant="destructive">Void payment</Button>
    <Button variant="link">View profile</Button>
  </div>
);

export const Sizes = () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
    <Button size="sm">Small</Button>
    <Button size="default">Default</Button>
    <Button size="lg">Large</Button>
    <Button disabled>Disabled</Button>
  </div>
);
