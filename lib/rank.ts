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
  notes.push(`Presión parcial de O₂ ≈ ${p.toFixed(1)} kPa (aire a nivel del mar ≈ 21.2 kPa).`);
  if (c.o2 > 23.5)
    notes.push(`Con ${c.o2}% O₂, la fracción molar está ${Math.round(((c.o2 - 21) / 21) * 100)}% por encima del aire. Para sólidos, la inflamabilidad sigue a la fracción de O₂ más que a la presión parcial: hay menos N₂ que absorba calor y la llama es más caliente.`);
  if (c.pressure < 12)
    notes.push("Menor presión reduce algo la tasa de reacción y la radiación de hollín, pero no compensa el aumento de fracción de O₂.");
  if (c.gravity < 0.02) {
    notes.push(c.flow < 3
      ? "Con el aire casi quieto, en 0 g el O₂ llega solo por difusión y la llama se puede ahogar por pérdida radiativa (BASS-II). Si arranca un ventilador, vuelve a prender."
      : "En 0 g el flujo más peligroso ronda los 3 cm/s (BASS-II). Cortar la ventilación y dejar el aire casi quieto ayuda a ahogar la llama.");
  } else {
    const natural = MODEL.Ub * Math.pow(c.gravity, MODEL.n);
    notes.push(`A ${c.gravity} g la flotación mueve el aire por sí sola, unos ${natural.toFixed(1)} cm/s según nuestro modelo. Cortar la ventilación no deja el aire quieto, así que no alcanza para apagar un fuego.`);
    if (c.gravity < 1)
      notes.push(`En PSI no hay ensayos a ${c.gravity} g. Nuestro modelo se validó con ensayos en centrífuga publicados en 2024, que no están en PSI. LUCI y FM2 van a medir en ese rango.`);
  }
  return notes;
}
