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
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Oxígeno límite para que el PMMA siga quemando, según la ventilación, con la gravedad elegida">
      {[0.1, 0.3, 1, 3, 10, 30].map((t) => <g key={t}><line x1={x(t)} x2={x(t)} y1={M.t} y2={H - M.b} className="grid" /><text x={x(t)} y={H - M.b + 16} className="tick" textAnchor="middle">{t}</text></g>)}
      {[12, 14, 16, 18, 20, 22, 24].map((t) => <g key={t}><line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} className="grid" /><text x={M.l - 8} y={y(t) + 4} className="tick" textAnchor="end">{t}</text></g>)}
      <text x={(W + M.l) / 2} y={H - 6} className="axlabel" textAnchor="middle">Ventilación (cm/s, log)</text>
      <text transform={`translate(13 ${(H - M.b + M.t) / 2}) rotate(-90)`} className="axlabel" textAnchor="middle">O₂ (%)</text>
      <path d={`${line}L${x(FX[1])},${M.t}L${x(FX[0])},${M.t}Z`} className="zone-burn" />
      <path d={area} className="band" />
      {cond.gravity > 0.02 && <><path d={zeroG} className="zerog" /><text x={x(0.16)} y={y(Math.min(OY[1], limitAt(uEff(0.16, 0)))) - 8} className="zerolabel">0 g (ISS)</text></>}
      <path d={line} className="limitline" />
      <text x={x(0.12)} y={M.t + 16} className="zonelabel">se sostiene</text>
      <text x={x(40)} y={H - M.b - 10} className="zonelabel" textAnchor="end">se apaga</text>
      <line x1={M.l} x2={W - M.r} y1={y(Math.min(cond.o2, OY[1]))} y2={y(Math.min(cond.o2, OY[1]))} className="o2line" />
      <text x={W - M.r - 4} y={y(Math.min(cond.o2, OY[1])) - 6} className="o2label" textAnchor="end">{off ? `tu atmósfera: ${cond.o2} % ↑` : `tu atmósfera: ${cond.o2} %`}</text>
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
    <svg viewBox={`0 0 ${w} ${h}`} className="chart" role="img" aria-label="Validación: límite predicho contra ensayos de centrífuga en gravedad parcial">
      {[0, 0.16, 0.38, 0.65, 1].map((t) => <g key={t}><line x1={gx(t)} x2={gx(t)} y1={m.t} y2={h - m.b} className="grid" /><text x={gx(t)} y={h - m.b + 14} className="tick" textAnchor="middle">{t}</text></g>)}
      {[13, 14, 15, 16].map((t) => <g key={t}><line x1={m.l} x2={w - m.r} y1={gy(t)} y2={gy(t)} className="grid" /><text x={m.l - 6} y={gy(t) + 4} className="tick" textAnchor="end">{t}</text></g>)}
      <text x={(w + m.l) / 2} y={h - 4} className="axlabel" textAnchor="middle">Gravedad (g)</text>
      <path d={d} className="limitline" />
      {PG_POINTS.map((p, i) => <circle key={i} cx={gx(p.g)} cy={gy(p.o2_pct)} r={4.5} className={p.y ? "pt-burn" : "pt-ext"}><title>{`${p.g} g · ${p.o2_pct} % O₂ · ${p.y ? "se sostuvo" : "se apagó"}`}</title></circle>)}
    </svg>
  );
}

export default function Predict({ cond, place }: { cond: Condition; place: string }) {
  const pr = predict(cond.o2, cond.flow, cond.gravity);
  const p = pr.pBurn[0];
  const verdict = p > 0.9 ? ["Seguiría quemando", "burn"] : p < 0.1 ? ["Se apagaría", "ext"] : ["Está en el límite", "edge"];
  const cut = pr.pBurnVentCut[0];
  const iss = predict(21, 10, 0), moon = predict(34, 5, 0.16);
  const v = VALIDATION;
  const ext = v.external as { model: string; accuracy: number }[];
  const physAcc = ext[0].accuracy, xgbAcc = ext.find((r) => r.model.startsWith("XGBoost sin"))!.accuracy;
  const pO2safe = (moon.limit[0] / 100) * 8.2 * 6.895;

  return (
    <div className="predict">
      <div className="predhero">
        <div>
          <p className="mono muted">Si algo de acrílico (PMMA) se prende en {place}…</p>
          <p className={`predverdict ${verdict[1]}`}>{verdict[0]}</p>
          <p className="muted">Probabilidad de que la llama se sostenga: <b>{pct(p)}</b></p>
        </div>
        <div className="predtiles">
          <div className="ptile"><span className="mono muted">Oxígeno mínimo para que queme acá</span><b>{pr.limit[0].toFixed(1)} %</b><span className="small muted">entre {pr.limit[1].toFixed(1)} y {pr.limit[2].toFixed(1)} % (IC 95 %)</span></div>
          <div className="ptile"><span className="mono muted">Tu atmósfera está</span><b>{pts(pr.margin[0])} pts</b><span className="small muted">{pr.margin[0] > 0 ? "por encima del límite" : "por debajo del límite"}</span></div>
          <div className="ptile"><span className="mono muted">Si se corta la ventilación</span><b>{cut > 0.9 ? "Sigue" : cut < 0.5 ? "Se ahoga" : "Puede seguir"}</b><span className="small muted">probabilidad de que siga: {pct(cut)}</span></div>
        </div>
      </div>

      <div className="panel">
        <LimitChart cond={cond} />
        <p className="caption">La línea blanca es el oxígeno mínimo para que el PMMA siga quemando en {cond.gravity} g, con su banda de incertidumbre. La punteada es la misma curva en 0 g. Arriba de la línea el fuego se sostiene. La línea punteada vertical marca la ventilación más peligrosa en 0 g ({U_STAR.toFixed(1)} cm/s).</p>
      </div>

      <div className="insights">
        <div className="insight"><span className="mono muted">Hallazgo 1</span><b>La Luna cae en el peor lugar</b><span>En 0 g la ventilación más peligrosa es {U_STAR.toFixed(1)} cm/s. En la Luna la gravedad sola mueve el aire a {moon.naturalFlow.toFixed(1)} cm/s: justo ahí.</span></div>
        <div className="insight"><span className="mono muted">Hallazgo 2</span><b>Cortar la ventilación no sirve en la Luna</b><span>En la ISS, con el aire casi quieto, la probabilidad de que siga quemando baja a {pct(iss.pBurnVentCut[0])}. En la base lunar queda en {pct(moon.pBurnVentCut[0])}: la gravedad sigue soplando.</span></div>
        <div className="insight"><span className="mono muted">Hallazgo 3</span><b>No hay un oxígeno seguro para respirar</b><span>Para que el PMMA no queme en la Luna habría que bajar el O₂ a menos de {moon.limit[0].toFixed(1)} %. A 8.2 psi eso deja {pO2safe.toFixed(1)} kPa de oxígeno, menos de la mitad de lo que respiramos (21 kPa). La seguridad depende de los materiales y la detección.</span></div>
      </div>

      <details className="mapbox">
        <summary><span className="mono">Cómo sabemos que funciona</span><span className="muted small">Validación con ensayos que el modelo nunca vio</span></summary>
        <div className="valid">
          <div>
            <GravityChart />
            <p className="caption">Línea: predicción. Puntos: 16 ensayos en centrífuga (2024). Naranja: se sostuvo. Azul: se apagó.</p>
          </div>
          <ul className="validlist">
            <li><b>Entrenamiento:</b> curva límite de NASA para 0 g (BASS-II) y {v.n_train} ensayos en la ISS para medir el ruido.</li>
            <li><b>Prueba:</b> {v.n_external} ensayos en centrífuga a 0.04, 0.16, 0.38, 0.65 y 1 g, de otro laboratorio y otro año.</li>
            <li><b>Error del límite:</b> {v.mae_loo.toFixed(2)} puntos de O₂. Acierta {Math.round(physAcc * v.n_external)} de {v.n_external} ensayos ({pct(physAcc)}); XGBoost sin física, {pct(xgbAcc)}.</li>
            <li><b>Chequeo a 1 g:</b> predice {limitAt(uEff(0, 1)).toFixed(1)} %; la literatura da 15.0 a 15.4 %.</li>
            <li><b>Por qué no ML puro:</b> los ensayos se hacen en el borde del límite y son ruidosos. Ni la curva de NASA acierta más del {pct(v.acc_nasa_curve)} ensayo por ensayo. Con tan pocos datos, la física con 4 parámetros le gana a XGBoost, que además no puede extrapolar a 34 % de O₂.</li>
            <li><b>Límites:</b> un solo material, datos a ~1 atm. A menos presión los materiales suelen quemar algo menos, así que la predicción queda del lado seguro.</li>
          </ul>
        </div>
      </details>
    </div>
  );
}
