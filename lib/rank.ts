import type { Investigation, FuelType, Range } from "./data.ts";
import { MODEL } from "./predict.ts";

export type Condition = { o2: number; pressure: number; flow: number; gravity: number };
export type Focus = "all" | "prevention" | "detection" | "suppression";

const gap = (v: number, [a, b]: Range) => (v < a ? a - v : v > b ? v - b : 0);

export function conditionMatch(inv: Investigation, c: Condition) {
  const dO2 = gap(c.o2, inv.o2) / 10;
  const dP = gap(Math.log2(c.pressure), [Math.log2(inv.pressure[0]), Math.log2(inv.pressure[1])]) / 0.5;
  const dF = gap(c.flow, inv.flow) / 20;
  return {
    score: Math.exp(-(dO2 * dO2 + dP * dP + dF * dF) / 2),
    deltaO2: gap(c.o2, inv.o2) * Math.sign(c.o2 - inv.o2[1] || c.o2 - inv.o2[0]),
    deltaP: gap(c.pressure, inv.pressure) * Math.sign(c.pressure - inv.pressure[1] || c.pressure - inv.pressure[0]),
    deltaFlow: gap(c.flow, inv.flow),
  };
}

export function relevance(inv: Investigation, focus: Focus) {
  const r = inv.relevance;
  return (focus === "all" ? Math.max(r.prevention, r.detection, r.suppression) : r[focus]) / 3;
}

export function rank(invs: Investigation[], c: Condition, focus: Focus) {
  return invs
    .map((inv) => {
      const m = conditionMatch(inv, c);
      const rel = relevance(inv, focus);
      return { inv, ...m, rel, total: 0.7 * m.score + 0.3 * rel };
    })
    .sort((a, b) => b.total - a.total);
}

export type Coverage = { fuel: FuelType; best: ReturnType<typeof rank>[number] | null; status: "cubierto" | "parcial" | "brecha" };

export function coverage(invs: Investigation[], c: Condition): Coverage[] {
  return (["solid", "liquid", "gas", "aerosol"] as FuelType[]).map((fuel) => {
    const best = rank(invs.filter((i) => i.fuelType === fuel && i.inPsi), c, "all").sort((a, b) => b.score - a.score)[0] ?? null;
    const s = best?.score ?? 0;
    return { fuel, best, status: s >= 0.6 ? "cubierto" : s >= 0.2 ? "parcial" : "brecha" };
  });
}

export const pO2kPa = (c: Pick<Condition, "o2" | "pressure">) => (c.o2 / 100) * c.pressure * 6.89476;

export function physicsNotes(c: Condition): string[] {
  const notes: string[] = [];
  const p = pO2kPa(c);
  notes.push(`O₂ partial pressure ≈ ${p.toFixed(1)} kPa (sea-level air ≈ 21.2 kPa).`);
  if (c.o2 > 23.5)
    notes.push(`At ${c.o2}% O₂, the mole fraction is ${Math.round(((c.o2 - 21) / 21) * 100)}% above air. For solids, flammability follows the O₂ fraction more than the partial pressure. There is less N₂ to absorb heat, so the flame runs hotter.`);
  if (c.pressure < 12)
    notes.push("Lower pressure slightly reduces reaction rate and soot radiation, but it does not offset the higher O₂ fraction.");
  if (c.gravity < 0.02) {
    notes.push(c.flow < 3
      ? "With nearly still air in 0 g, O₂ reaches the flame only by diffusion and the flame can die from radiative loss (BASS-II). If a fan starts, it can flare back up."
      : "In 0 g the most dangerous flow is around 3 cm/s (BASS-II). Shutting off ventilation and leaving the air nearly still helps starve the flame.");
  } else {
    const natural = MODEL.Ub * Math.pow(c.gravity, MODEL.n);
    notes.push(`At ${c.gravity} g buoyancy moves the air by itself, about ${natural.toFixed(1)} cm/s according to our model. Shutting off ventilation does not leave the air still, so it is not enough to put out a fire.`);
    if (c.gravity < 1)
      notes.push(`PSI has no tests at ${c.gravity} g. Our model was validated against centrifuge tests published in 2024, which are not in PSI. LUCI and FM2 will measure in that range.`);
  }
  return notes;
}
