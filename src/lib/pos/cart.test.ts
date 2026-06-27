import { describe, it, expect } from "vitest";
import {
  cartKey,
  lineSubtotal,
  cartTotal,
  stockDeduction,
  changeDue,
  lineDescription,
  type CartLine,
} from "./cart";

const std = (qty: number): CartLine => ({
  productId: "p1",
  name: "Water",
  mode: "standard",
  unitPrice: 25,
  quantity: qty,
  servingsPerContainer: null,
});

const serving = (qty: number): CartLine => ({
  productId: "p2",
  name: "Whey",
  mode: "serving",
  unitPrice: 50,
  quantity: qty,
  servingsPerContainer: 70,
});

const container = (qty: number): CartLine => ({
  productId: "p2",
  name: "Whey",
  mode: "container",
  unitPrice: 3000,
  quantity: qty,
  servingsPerContainer: 70,
});

describe("cart math", () => {
  it("keys a product per mode", () => {
    expect(cartKey("p2", "serving")).toBe("p2:serving");
    expect(cartKey("p2", "container")).toBe("p2:container");
  });

  it("computes line subtotal and cart total", () => {
    expect(lineSubtotal(std(4))).toBe(100);
    expect(cartTotal([std(4), serving(2)])).toBe(200);
  });

  it("deducts quantity for standard/serving and qty×spc for container", () => {
    expect(stockDeduction(std(4))).toBe(4);
    expect(stockDeduction(serving(3))).toBe(3);
    expect(stockDeduction(container(2))).toBe(140); // 2 × 70
  });

  it("computes change due (can be negative)", () => {
    expect(changeDue(500, 200)).toBe(300);
    expect(changeDue(100, 200)).toBe(-100);
  });

  it("describes each mode", () => {
    expect(lineDescription(std(1))).toBe("Water — 1 unit");
    expect(lineDescription(serving(2))).toBe("Whey — 2 servings");
    expect(lineDescription(container(2))).toBe("Whey — 2 containers (140 servings)");
  });
});
