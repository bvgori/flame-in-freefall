import P from "./predictions.json" with { type: "json" };

const { A, B, C, s, Ub, n, u_star } = P.model;
const MC = P.model.mc as [number, number, number][];
const RESIDUAL = 0.1;

export const MODEL = P.model;
export const VALIDATION = P.validation;
export const U_STAR = u_star;

export const uEff = (flow: number, g: number, nn = n, ub = Ub) => Math.max(0.05, Math.hypot(flow, ub * Math.pow(g, nn)));
export const limitAt = (u: number, shift = 0) => A + B / u + C * u + shift;
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

function band(f: (nn: number, ub: number, sh: number) => number): [number, number, number] {
  const vals = MC.map(([nn, ub, sh]) => f(nn, ub, sh)).sort((a, b) => a - b);
  const q = (p: number) => vals[Math.min(vals.length - 1, Math.max(0, Math.round(p * (vals.length - 1))))];
  return [f(n, Ub, 0), q(0.025), q(0.975)];
}

export function predict(o2: number, flow: number, g: number) {
  return {
    limit: band((nn, ub, sh) => limitAt(uEff(flow, g, nn, ub), sh)),
    margin: band((nn, ub, sh) => o2 - limitAt(uEff(flow, g, nn, ub), sh)),
    pBurn: band((nn, ub, sh) => sigmoid((o2 - limitAt(uEff(flow, g, nn, ub), sh)) / s)),
    pBurnVentCut: band((nn, ub, sh) => sigmoid((o2 - limitAt(uEff(RESIDUAL, g, nn, ub), sh)) / s)),
    limitVentCut: band((nn, ub, sh) => limitAt(uEff(RESIDUAL, g, nn, ub), sh)),
    naturalFlow: Ub * Math.pow(g, n),
  };
}

export const limitCurve = (g: number, flows: number[]) => flows.map((f) => limitAt(uEff(f, g)));
export const limitVsGravity = (gs: number[]) => gs.map((g) => limitAt(uEff(0, g)));
export const PG_POINTS = P.validation.pg_points as { g: number; o2_pct: number; y: number }[];
