import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Button,
  Input,
  Label,
} from "block23-gym";

export const RenewMembership = () => (
  <Dialog defaultOpen>
    <DialogTrigger asChild>
      <Button>Renew membership</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Renew membership</DialogTitle>
        <DialogDescription>Extend Juan Dela Cruz&apos;s monthly plan.</DialogDescription>
      </DialogHeader>
      <div style={{ display: "grid", gap: 12, padding: "8px 0" }}>
        <div style={{ display: "grid", gap: 6 }}>
          <Label htmlFor="d-price">Price</Label>
          <Input id="d-price" defaultValue="₱ 800.00" />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button>Confirm renewal</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
