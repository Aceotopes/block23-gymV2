import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "block23-gym";

export const MemberSearch = () => (
  <div style={{ width: 340 }}>
    <Command
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
      }}
    >
      <CommandInput placeholder="Search members or actions…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Members">
          <CommandItem>Juan Dela Cruz</CommandItem>
          <CommandItem>Maria Santos</CommandItem>
          <CommandItem>Pedro Reyes</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem>
            New membership
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem>
            Record walk-in
            <CommandShortcut>⌘W</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  </div>
);
