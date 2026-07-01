import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  Button,
  Label,
  Input,
} from "block23-gym";

export const PriceOverride = () => (
  <Popover open>
    <PopoverTrigger asChild>
      <Button variant="outline">Adjust price</Button>
    </PopoverTrigger>
    <PopoverContent>
      <PopoverHeader>
        <PopoverTitle>Override price</PopoverTitle>
        <PopoverDescription>Applies to this transaction only.</PopoverDescription>
      </PopoverHeader>
      <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
        <Label htmlFor="ov-amount">Amount</Label>
        <Input id="ov-amount" defaultValue="₱ 60.00" />
      </div>
    </PopoverContent>
  </Popover>
);
