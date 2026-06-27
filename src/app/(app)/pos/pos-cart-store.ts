import { create } from "zustand";
import { cartKey, type CartLine, type CartMode } from "@/lib/pos/cart";

// POS cart — the one Zustand store reserved for client state by ADR-047 (alongside the
// sidebar). Ephemeral: not persisted across reloads (MODULE-SPECS — navigating away
// discards the cart). Keyed by product+mode so a serving-based product can sit in the
// cart both per-serving and per-container. Adding an existing line bumps its quantity.

type AddInput = Omit<CartLine, "quantity"> & { quantity?: number };

type CartState = {
  lines: CartLine[];
  add: (line: AddInput) => void;
  setQuantity: (productId: string, mode: CartMode, quantity: number) => void;
  remove: (productId: string, mode: CartMode) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  lines: [],
  add: (input) =>
    set((s) => {
      const key = cartKey(input.productId, input.mode);
      const qty = input.quantity ?? 1;
      const existing = s.lines.find(
        (l) => cartKey(l.productId, l.mode) === key,
      );
      if (existing) {
        return {
          lines: s.lines.map((l) =>
            cartKey(l.productId, l.mode) === key
              ? { ...l, quantity: l.quantity + qty }
              : l,
          ),
        };
      }
      return { lines: [...s.lines, { ...input, quantity: qty }] };
    }),
  setQuantity: (productId, mode, quantity) =>
    set((s) => {
      const key = cartKey(productId, mode);
      if (quantity <= 0) {
        return { lines: s.lines.filter((l) => cartKey(l.productId, l.mode) !== key) };
      }
      return {
        lines: s.lines.map((l) =>
          cartKey(l.productId, l.mode) === key ? { ...l, quantity } : l,
        ),
      };
    }),
  remove: (productId, mode) =>
    set((s) => ({
      lines: s.lines.filter(
        (l) => cartKey(l.productId, l.mode) !== cartKey(productId, mode),
      ),
    })),
  clear: () => set({ lines: [] }),
}));
