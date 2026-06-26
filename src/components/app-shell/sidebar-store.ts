import { create } from "zustand";

// Sidebar collapsed/expanded state (DESIGN-SYSTEM §5.4 — 240px ⇄ 64px rail).
// UI-only client state per the TECH-STACK state decision tree. Not persisted
// across reloads at MVP; persistence can be added with zustand/middleware later.
type SidebarState = {
  collapsed: boolean;
  toggle: () => void;
};

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: false,
  toggle: () => set((s) => ({ collapsed: !s.collapsed })),
}));
