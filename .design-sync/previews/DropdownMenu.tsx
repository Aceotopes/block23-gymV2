import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Button,
} from "block23-gym";

export const RowActions = () => (
  <DropdownMenu open>
    <DropdownMenuTrigger asChild>
      <Button variant="outline">Actions</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start">
      <DropdownMenuLabel>Member</DropdownMenuLabel>
      <DropdownMenuItem>View profile</DropdownMenuItem>
      <DropdownMenuItem>Renew membership</DropdownMenuItem>
      <DropdownMenuItem>Check in</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>Archive member</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);
