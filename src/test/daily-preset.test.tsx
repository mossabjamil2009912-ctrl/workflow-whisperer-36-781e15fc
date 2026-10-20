import { describe, it, expect } from "vitest";
import { presetForDaily, dailyProduction } from "@/components/QuoteBuilder";

const t = (n: number) => presetForDaily(n).title;
const prod = (n: number) => dailyProduction(presetForDaily(n));

describe("presetForDaily — bot formulas with daily kWh input", () => {
  it("production = panels × W × 5.5 / 1000 (4×720 → 15.84)", () => expect(prod(16)).toBeCloseTo(15.84));
  it("3 kWh → nearest 1.6 system (3.27)", () => expect(prod(3)).toBeCloseTo(3.2725));
  it("20 kWh → 6.2 with 5 panels (19.8)", () => expect(t(20)).toContain("5 ألواح"));
  it("30 kWh → 8k never below need (31.68)", () => expect(prod(30)).toBeCloseTo(31.68));
  it("100 kWh → 12k 27 panels", () => expect(t(100)).toContain("27 لوح"));
  it("above residential max goes commercial, smallest covering", () => {
    expect(presetForDaily(120).type).toBe("com");
    expect(prod(120)).toBeCloseTo(130.68);
  });
  it("300 kWh → commercial covering ≥ 300 (594)", () => expect(prod(300)).toBeCloseTo(594));
});

import { presetForCom, presetForResBill } from "@/components/QuoteBuilder";
describe("bot entry paths", () => {
  it("commercial 150 kWh/month → 8k covering 5/day (31.68)", () => expect(dailyProduction(presetForCom("kwh", 150))).toBeCloseTo(31.68));
  it("commercial result is always commercial", () => expect(presetForCom("diesel", 100).type).toBe("com"));
  it("residential bill 8700 YER → need 1/day → 1.6 system", () => expect(dailyProduction(presetForResBill(8700))).toBeCloseTo(3.2725));
  it("kWh price is 250 YER like the bot: 7500 YER/month → need 1/day → 1.6 system", () => expect(dailyProduction(presetForResBill(7500))).toBeCloseTo(3.2725));
  it("commercial bill 37500 YER/month → 150 kWh → 8k covering 5/day", () => expect(dailyProduction(presetForCom("bill", 37500))).toBeCloseTo(31.68));
});

import { presetForCom as pc2, presetForDaily as pd2 } from "@/components/QuoteBuilder";
import { describe as d2, it as i2, expect as e2 } from "vitest";
d2("small commercial treated as residential", () => {
  i2("100 kWh/month commercial → same as residential daily 3.33", () => {
    const p = pc2("kwh", 100);
    e2(p.type).not.toBe("com");
    e2(p).toBe(pd2(100 / 30));
  });
  i2("150 kWh/month (5/day) commercial → residential system, not 8 kW commercial", () => {
    e2(pc2("kwh", 150).type).not.toBe("com");
  });
  i2("1500 kWh/month (50/day) stays commercial", () => {
    e2(pc2("kwh", 1500).type).toBe("com");
  });
});
