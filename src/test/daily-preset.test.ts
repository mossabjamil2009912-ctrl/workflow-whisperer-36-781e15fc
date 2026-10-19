import { describe, it, expect } from "vitest";
import { presetForDaily } from "@/components/QuoteBuilder";

describe("presetForDaily", () => {
  it("10 kWh → 6.2 inverter with 5.12 battery", () => {
    expect(presetForDaily(10).title).toContain("6.2 كيلو — بطارية 5.12");
  });
  it("30 kWh → 12 kW with 2 batteries (32), not commercial", () => {
    expect(presetForDaily(30).title).toContain("12 كيلو — بطارية 32");
  });
  it("36 kWh still max 2 batteries", () => {
    expect(presetForDaily(36).title).toContain("بطارية 32");
  });
  it("above 36 goes commercial", () => {
    expect(presetForDaily(40).type).toBe("com");
  });
});
