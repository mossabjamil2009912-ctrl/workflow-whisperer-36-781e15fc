import { describe, it, expect } from "vitest";
import { presetForDaily, dailyProduction } from "@/components/QuoteBuilder";

const t = (n: number) => presetForDaily(n).title;
const prod = (n: number) => dailyProduction(presetForDaily(n));

describe("presetForDaily — bot formulas with daily kWh input", () => {
  it("production = panels × W × 5.5 / 1000 (4×720 → 15.84)", () => expect(prod(16)).toBeCloseTo(15.84));
  it("3 kWh → nearest 1.6 system (3.27)", () => expect(prod(3)).toBeCloseTo(3.2725));
  it("20 kWh → 6.2 with 5 panels (19.8)", () => expect(t(20)).toContain("5 لوح"));
  it("30 kWh → 8k never below need (31.68)", () => expect(prod(30)).toBeCloseTo(31.68));
  it("100 kWh → 12k 27 panels", () => expect(t(100)).toContain("27 لوح"));
  it("above residential max goes commercial, smallest covering", () => {
    expect(presetForDaily(120).type).toBe("com");
    expect(prod(120)).toBeCloseTo(130.68);
  });
  it("300 kWh → commercial covering ≥ 300 (594)", () => expect(prod(300)).toBeCloseTo(594));
});
