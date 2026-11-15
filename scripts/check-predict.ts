import { predict } from "../lib/predict.ts";
const iss = predict(21, 10, 0), moon = predict(34, 5, 0.16);
console.assert(Math.abs(iss.margin[0] - 6.9) < 0.2, "ISS margin ≈ +6.9 like the notebook");
console.assert(moon.pBurn[0] > 0.99 && moon.pBurnVentCut[0] > 0.99, "Moon keeps burning even with ventilation cut");
console.assert(iss.pBurnVentCut[0] < 0.5, "ISS: cutting ventilation should likely extinguish");
console.log("ISS", iss.margin.map((x) => x.toFixed(2)), "cut P", iss.pBurnVentCut[0].toFixed(2), "| Moon margin", moon.margin[0].toFixed(2));
