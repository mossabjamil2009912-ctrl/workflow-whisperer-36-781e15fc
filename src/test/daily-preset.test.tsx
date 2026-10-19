import { describe, it, expect } from "vitest";
import { presetForDaily } from "@/components/QuoteBuilder";

const t = (n: number) => presetForDaily(n).title;
const m = (n: number) => Object.fromEntries(presetForDaily(n).items) as Record<string, number>;

describe("presetForDaily — battery ≈ daily consumption", () => {
  it("5 kWh → battery 5.12", () => expect(t(5)).toContain("بطارية 5.12"));
  it("10 kWh → 2×5.12 (10.24)", () => expect(t(10)).toContain("بطارية 10.24"));
  it("13 kWh → one 16", () => expect(t(13)).toContain("بطارية 16 ·"));
  it("20 kWh → one 16", () => expect(t(20)).toContain("بطارية 16 ·"));
  it("21 kWh → two 16 (32)", () => expect(t(21)).toContain("بطارية 32"));
  it("36 kWh → two 16 (32)", () => expect(t(36)).toContain("بطارية 32"));
  it("above 36 goes commercial", () => expect(presetForDaily(40).type).toBe("com"));
});

describe("system composition matches the bot's fixed quotes", () => {
  it("30 kWh → 12k system: two 16 kWh batteries, 1 m cable, DC box 2-input, AC panel, MC4 ×2", () => {
    const p = m(30);
    expect(p["BAT_FIDUS_16K"]).toBe(2);
    expect(p["cable_cu_1500v_10mm"]).toBe(1);
    expect(p["DCBOX_1000_2"]).toBe(1);
    expect(p["ac_01"]).toBe(1);
    expect(p["mc4_connector"]).toBe(2);
    expect(p["PV_SUNTECH_720"]).toBe(18);
  });
  it("10 kWh → 6.2 system: two 5.12 batteries, 5 panels, 30 m cable, no DC box", () => {
    const p = m(10);
    expect(p["BAT_UF5000"]).toBe(2);
    expect(p["STAND_LITHIUM_6K"]).toBe(1);
    expect(p["cable_cu_1500v_10mm"]).toBe(30);
    expect(p["PV_SUNTECH_720"]).toBe(5);
    expect(p["DCBOX_1000_2"]).toBeUndefined();
  });
  it("40 kWh → commercial 50k: DC box 1500_6, battery protection box, 4 HV batteries, 75 panels", () => {
    const p = m(40);
    expect(p["DCBOX_1500_6"]).toBe(1);
    expect(p["bat_protect_dc1500_250a"]).toBe(1);
    expect(p["BAT_HITHIUM_16K_HV"]).toBe(4);
    expect(p["PV_SUNTECH_720"]).toBe(75);
    expect(p["cable_cu_1500v_10mm"]).toBe(1);
  });
  it("250 kWh → 2×50k with 180 panels uses DC box 1500_6 ×2 (as the bot quote)", () => {
    expect(m(250)["DCBOX_1500_6"]).toBe(2);
  });
  it("400 kWh → 125k uses DC box 1500_8 ×2 (as the bot quote)", () => {
    expect(m(400)["DCBOX_1500_8"]).toBe(2);
  });
  it("700 kWh → 2×125k uses DC box 1500_10 ×2 + 1500_8 ×1 (as the bot quote)", () => {
    const p = m(700);
    expect(p["DCBOX_1500_10"]).toBe(2);
    expect(p["DCBOX_1500_8"]).toBe(1);
  });
});
