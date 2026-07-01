import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  Label,
} from "block23-gym";

export const PlanPicker = () => (
  <div style={{ display: "grid", gap: 8, width: 240 }}>
    <Label>Membership plan</Label>
    <Select defaultValue="monthly">
      <SelectTrigger>
        <SelectValue placeholder="Select a plan" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Plans</SelectLabel>
          <SelectItem value="daily">Daily walk-in</SelectItem>
          <SelectItem value="monthly">Monthly</SelectItem>
          <SelectItem value="quarterly">Quarterly</SelectItem>
          <SelectItem value="annual">Annual</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
);
