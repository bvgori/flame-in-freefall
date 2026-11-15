"use client";

import { useMemo } from "react";
import { predict, limitAt, uEff, limitVsGravity, PG_POINTS, VALIDATION, MODEL, U_STAR } from "@/lib/predict.ts";
import type { Condition } from "@/lib/rank.ts";

const W = 900, H = 340, M = { l: 52, r: 16, t: 14, b: 40 };
const FX = [0.1, 60] as const, OY = [12, 24] as const;
const x = (f: number) => M.l + (Math.log(f / FX[0]) / Math.log(FX[1] / FX[0])) * (W - M.l - M.r);
const y = (o: number) => M.t + (1 - (o - OY[0]) / (OY[1] - OY[0])) * (H - M.t - M.b);
const FLOWS = Array.from({ length: 70 }, (_, i) => FX[0] * Math.pow(FX[1] / FX[0], i / 69));
const pct = (p: number) => `${Math.round(p * 100)} %`;
const pts = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}`;

function LimitChart({ cond }: { cond: Condition }) {
  const { line, area, zeroG } = useMemo(() => {
    const mc = MODEL.mc as [number, number, number][];
    const rows = FLOWS.map((f) => {
      const v = mc.map(([nn, ub, sh]) => limitAt(uEff(f, cond.gravity, nn, ub), sh)).sort((a, b) => a - b);
      return [f, limitAt(uEff(f, cond.gravity)), v[Math.round(v.length * 0.025)], v[Math.round(v.length * 0.975) - 1]];
    });
    const clampY = (o: number) => y(Math.min(OY[1], Math.max(OY[0], o)));
    return {
      zeroG: FLOWS.map((f, i) => `${i ? "L" : "M"}${x(f).toFixed(1)},${clampY(limitAt(uEff(f, 0))).toFixed(1)}`).join(""),
      line: rows.map(([f, m], i) => `${i ? "L" : "M"}${x(f).toFixed(1)},${clampY(m).toFixed(1)}`).join(""),
      area: rows.map(([f, , lo], i) => `${i ? "L" : "M"}${x(f).toFixed(1)},${clampY(lo).toFixed(1)}`).join("") +
        rows.slice().reverse().map(([f, , , hi]) => `L${x(f).toFixed(1)},${clampY(hi).toFixed(1)}`).join("") + "Z",
    };
  }, [cond.gravity]);
  const flow = Math.min(FX[1], Math.max(FX[0], cond.flow || FX[0]));
  const off = cond.o2 > OY[1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Limiting oxygen for PMMA to keep burning, by ventilation, at the chosen gravity">
      {[0.1, 0.3, 1, 3, 10, 30].map((t) => <g key={t}><line x1={x(t)} x2={x(t)} y1={M.t} y2={H - M.b} className="grid" /><text x={x(t)} y={H - M.b + 16} className="tick" textAnchor="middle">{t}</text></g>)}
      {[12, 14, 16, 18, 20, 22, 24].map((t) => <g key={t}><line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} className="grid" /><text x={M.l - 8} y={y(t) + 4} className="tick" textAnchor="end">{t}</text></g>)}
      <text x={(W + M.l) / 2} y={H - 6} className="axlabel" textAnchor="middle">Ventilation (cm/s, log)</text>
      <text transform={`translate(13 ${(H - M.b + M.t) / 2}) rotate(-90)`} className="axlabel" textAnchor="middle">O₂ (%)</text>
      <path d={`${line}L${x(FX[1])},${M.t}L${x(FX[0])},${M.t}Z`} className="zone-burn" />
      <path d={area} className="band" />
      {cond.gravity > 0.02 && <><path d={zeroG} className="zerog" /><text x={x(0.16)} y={y(Math.min(OY[1], limitAt(uEff(0.16, 0)))) - 8} className="zerolabel">0 g (ISS)</text></>}
      <path d={line} className="limitline" />
      <text x={x(0.12)} y={M.t + 16} className="zonelabel">keeps burning</text>
      <text x={x(40)} y={H - M.b - 10} className="zonelabel" textAnchor="end">goes out</text>
      <line x1={M.l} x2={W - M.r} y1={y(Math.min(cond.o2, OY[1]))} y2={y(Math.min(cond.o2, OY[1]))} className="o2line" />
      <text x={W - M.r - 4} y={y(Math.min(cond.o2, OY[1])) - 6} className="o2label" textAnchor="end">{off ? `your atmosphere: ${cond.o2} % ↑` : `your atmosphere: ${cond.o2} %`}</text>
      <circle cx={x(flow)} cy={y(Math.min(cond.o2, OY[1]))} r={6} className="cursor" />
      <line x1={x(U_STAR)} x2={x(U_STAR)} y1={M.t} y2={H - M.b} className="ustar" />
    </svg>
  );
}

function GravityChart() {
  const w = 320, h = 200, m = { l: 40, r: 10, t: 10, b: 32 };
  const gx = (g: number) => m.l + (g / 1.05) * (w - m.l - m.r);
  const gy = (o: number) => m.t + (1 - (o - 12.8) / (16.5 - 12.8)) * (h - m.t - m.b);
  const gs = Array.from({ length: 80 }, (_, i) => 0.012 + (i / 79) * 1.04);
  const L = limitVsGravity(gs);
  const d = gs.map((g, i) => `${i ? "L" : "M"}${gx(g).toFixed(1)},${gy(Math.min(16.5, L[i])).toFixed(1)}`).join("");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart" role="img" aria-label="Validation of the predicted limit against centrifuge tests in partial gravity">
      {[0, 0.16, 0.38, 0.65, 1].map((t) => <g key={t}><line x1={gx(t)} x2={gx(t)} y1={m.t} y2={h - m.b} className="grid" /><text x={gx(t)} y={h - m.b + 14} className="tick" textAnchor="middle">{t}</text></g>)}
      {[13, 14, 15, 16].map((t) => <g key={t}><line x1={m.l} x2={w - m.r} y1={gy(t)} y2={gy(t)} className="grid" /><text x={m.l - 6} y={gy(t) + 4} className="tick" textAnchor="end">{t}</text></g>)}
      <text x={(w + m.l) / 2} y={h - 4} className="axlabel" textAnchor="middle">Gravity (g)</text>
      <path d={d} className="limitline" />
      {PG_POINTS.map((p, i) => <circle key={i} cx={gx(p.g)} cy={gy(p.o2_pct)} r={4.5} className={p.y ? "pt-burn" : "pt-ext"}><title>{`${p.g} g · ${p.o2_pct} % O₂ · ${p.y ? "kept burning" : "went out"}`}</title></circle>)}
    </svg>
  );
}

export default function Predict({ cond, place }: { cond: Condition; place: string }) {
  const pr = predict(cond.o2, cond.flow, cond.gravity);
  const p = pr.pBurn[0];
  const verdict = p > 0.9 ? ["It would keep burning", "burn"] : p < 0.1 ? ["It would go out", "ext"] : ["It is right at the limit", "edge"];
  const cut = pr.pBurnVentCut[0];
  const iss = predict(21, 10, 0), moon = predict(34, 5, 0.16);
  const v = VALIDATION;
  const ext = v.external as { model: string; accuracy: number }[];
  const physAcc = ext[0].accuracy, xgbAcc = ext.find((r) => r.model.startsWith("XGBoost without"))!.accuracy;
  const pO2safe = (moon.limit[0] / 100) * 8.2 * 6.895;

  return (
    <div className="predict">
      <div className="predhero">
        <div>
          <p className="mono muted">If a piece of acrylic (PMMA) catches fire in {place}…</p>
          <p className={`predverdict ${verdict[1]}`}>{verdict[0]}</p>
          <p className="muted">Chance that the flame keeps burning: <b>{pct(p)}</b></p>
        </div>
        <div className="predtiles">
          <div className="ptile"><span className="mono muted">Minimum oxygen for it to burn here</span><b>{pr.limit[0].toFixed(1)} %</b><span className="small muted">between {pr.limit[1].toFixed(1)} and {pr.limit[2].toFixed(1)} % (95 % CI)</span></div>
          <div className="ptile"><span className="mono muted">Your atmosphere is</span><b>{pts(pr.margin[0])} pts</b><span className="small muted">{pr.margin[0] > 0 ? "above the limit" : "below the limit"}</span></div>
          <div className="ptile"><span className="mono muted">If the ventilation stops</span><b>{cut > 0.9 ? "Keeps burning" : cut < 0.5 ? "Smothers" : "May keep burning"}</b><span className="small muted">chance it keeps burning: {pct(cut)}</span></div>
        </div>
      </div>

      <div className="panel">
        <LimitChart cond={cond} />
        <p className="caption">The white line is the minimum oxygen for PMMA to keep burning at {cond.gravity} g, with its uncertainty band. The dotted line is the same curve at 0 g. Above the line the fire keeps burning. The vertical dotted line marks the most dangerous ventilation at 0 g ({U_STAR.toFixed(1)} cm/s).</p>
      </div>

      <div className="insights">
        <div className="insight"><span className="mono muted">Finding 1</span><b>The Moon lands in the worst spot</b><span>At 0 g the most dangerous ventilation is {U_STAR.toFixed(1)} cm/s. On the Moon, gravity alone moves the air at {moon.naturalFlow.toFixed(1)} cm/s, which is right there.</span></div>
        <div className="insight"><span className="mono muted">Finding 2</span><b>Turning off the ventilation does not help on the Moon</b><span>On the ISS, with almost still air, the chance that it keeps burning drops to {pct(iss.pBurnVentCut[0])}. At the Moon base it stays at {pct(moon.pBurnVentCut[0])} because gravity keeps moving the air.</span></div>
        <div className="insight"><span className="mono muted">Finding 3</span><b>There is no oxygen level that is both breathable and safe</b><span>To stop PMMA from burning on the Moon, O₂ would have to drop below {moon.limit[0].toFixed(1)} %. At 8.2 psi that leaves {pO2safe.toFixed(1)} kPa of oxygen, less than half of what we breathe (21 kPa). Safety has to come from materials and detection.</span></div>
      </div>

      <details className="mapbox">
        <summary><span className="mono">How we know it works</span><span className="muted small">Validation with tests the model never saw</span></summary>
        <div className="valid">
          <div>
            <GravityChart />
            <p className="caption">Line shows the prediction. Dots are 16 centrifuge tests (2024). Orange kept burning and blue went out.</p>
          </div>
          <ul className="validlist">
            <li><b>Training.</b> NASA limit curve for 0 g (BASS-II) and {v.n_train} ISS tests to measure the noise.</li>
            <li><b>Test.</b> {v.n_external} centrifuge tests at 0.04, 0.16, 0.38, 0.65 and 1 g, from a different lab and a different year.</li>
            <li><b>Limit error.</b> {v.mae_loo.toFixed(2)} O₂ points. It gets {Math.round(physAcc * v.n_external)} of {v.n_external} tests right ({pct(physAcc)}). XGBoost without physics gets {pct(xgbAcc)}.</li>
            <li><b>Check at 1 g.</b> It predicts {limitAt(uEff(0, 1)).toFixed(1)} % and the literature gives 15.0 to 15.4 %.</li>
            <li><b>Why not pure ML.</b> The tests are run right at the edge of the limit and they are noisy. Even the NASA curve gets only {pct(v.acc_nasa_curve)} of tests right one by one. With so little data, physics with 4 parameters beats XGBoost, which also cannot extrapolate to 34 % O₂.</li>
            <li><b>Limitations.</b> One material only, with data at about 1 atm. At lower pressure materials usually burn a bit less, so the prediction stays on the safe side.</li>
          </ul>
        </div>
      </details>
    </div>
  );
}
