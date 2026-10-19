import { describe, it, expect } from "vitest";
import { presetForDaily } from "@/components/QuoteBuilder";

const t = (n: number) => presetForDaily(n).title;

describe("presetForDaily — battery ≈ daily consumption", () => {
  it("5 kWh → battery 5.12", () => expect(t(5)).toContain("بطارية 5.12"));
  it("10 kWh → 2×5.12 (10.24)", () => expect(t(10)).toContain("بطارية 10.24"));
  it("13 kWh → one 16", () => expect(t(13)).toContain("بطارية 16 ·"));
  it("20 kWh → one 16", () => expect(t(20)).toContain("بطارية 16 ·"));
  it("21 kWh → two 16 (32)", () => expect(t(21)).toContain("بطارية 32"));
  it("36 kWh → two 16 (32)", () => expect(t(36)).toContain("بطارية 32"));
  it("above 36 goes commercial", () => expect(presetForDaily(40).type).toBe("com"));
});
