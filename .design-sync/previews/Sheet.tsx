import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
  Button,
  Label,
  Input,
} from "block23-gym";

export const MemberDetails = () => (
  <Sheet defaultOpen>
    <SheetTrigger asChild>
      <Button variant="outline">Open details</Button>
    </SheetTrigger>
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Member details</SheetTitle>
        <SheetDescription>Juan Dela Cruz · Monthly</SheetDescription>
      </SheetHeader>
      <div style={{ display: "grid", gap: 12, padding: 16 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <Label htmlFor="s-phone">Phone</Label>
          <Input id="s-phone" defaultValue="0917 000 0000" />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <Label htmlFor="s-plan">Plan</Label>
          <Input id="s-plan" defaultValue="Monthly · ₱800" />
        </div>
      </div>
      <SheetFooter>
        <Button>Save changes</Button>
        <SheetClose asChild>
          <Button variant="outline">Close</Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  </Sheet>
);
