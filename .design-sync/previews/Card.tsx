import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
  Button,
  Badge,
} from "block23-gym";

export const MemberSummary = () => (
  <Card style={{ width: 340 }}>
    <CardHeader>
      <CardTitle>Juan Dela Cruz</CardTitle>
      <CardDescription>Monthly membership · Member since Jan 2026</CardDescription>
      <CardAction>
        <Badge>Active</Badge>
      </CardAction>
    </CardHeader>
    <CardContent>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
        <span style={{ color: "var(--muted-foreground)" }}>Expires</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>Jul 30, 2026</span>
      </div>
    </CardContent>
    <CardFooter style={{ gap: 8 }}>
      <Button size="sm">Renew</Button>
      <Button size="sm" variant="outline">
        Profile
      </Button>
    </CardFooter>
  </Card>
);

export const Kpi = () => (
  <Card style={{ width: 240 }}>
    <CardHeader>
      <CardDescription>Revenue today</CardDescription>
      <CardTitle style={{ fontSize: 28, fontVariantNumeric: "tabular-nums" }}>
        ₱ 12,450
      </CardTitle>
    </CardHeader>
    <CardContent>
      <span style={{ fontSize: 13, color: "var(--success-on)" }}>▲ 8% vs. yesterday</span>
    </CardContent>
  </Card>
);
