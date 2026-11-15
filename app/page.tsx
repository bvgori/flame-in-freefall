"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Flame from "./Flame";
import Planet, { type Body } from "./Planet";
import { INVESTIGATIONS, SCENARIOS, FUEL_LABEL, type Investigation, type FuelType, type Scenario } from "@/lib/data.ts";
import { rank, coverage, physicsNotes, type Condition, type Focus } from "@/lib/rank.ts";
import { psiFor, clip, PSI_COUNT } from "@/lib/psi.ts";

const W = 720, H = 440, M = { l: 64, r: 16, t: 14, b: 44 };
const O2 = [10, 100] as const, P = [3, 50] as const;
const X = (o2: number) => M.l + ((Math.log(o2) - Math.log(O2[0])) / (Math.log(O2[1]) - Math.log(O2[0]))) * (W - M.l - M.r);
const Y = (p: number) => M.t + (1 - (Math.log(p) - Math.log(P[0])) / (Math.log(P[1]) - Math.log(P[0]))) * (H - M.t - M.b);
const FUELS: FuelType[] = ["solid", "liquid", "gas", "aerosol"];
const FUEL_VAR: Record<FuelType, string> = { gas: "var(--s-gas)", liquid: "var(--s-liquid)", solid: "var(--s-solid)", aerosol: "var(--muted)" };
const FOCI: [Focus, string][] = [["all", "Todo"], ["prevention", "Prevención"], ["detection", "Detección"], ["suppression", "Supresión"]];
const STATUS = { cubierto: { icon: "✓", cls: "good", say: "Hay datos" }, parcial: { icon: "◐", cls: "warn", say: "Pocos datos" }, brecha: { icon: "✕", cls: "crit", say: "Sin datos" } } as const;
const PLAIN: Record<FuelType, [string, string]> = {
  solid: ["Materiales", "telas, plásticos, cables"],
  liquid: ["Líquidos", "combustibles y aceites"],
  gas: ["Gases", "fugas de gas"],
  aerosol: ["Humo", "lo que miden los detectores"],
};
const BODY: Record<string, Body> = { iss: "earth", rover: "moon", moonbase: "moon", mars: "mars", suit: "moon", apollo1: "earth", apollo13: "moon", mir: "earth", artemis2: "moon" };
const TEAM = [
  ["Oriana Letini", "orianaletini"],
  ["Catalina Graffigna Lynch", "graf"],
  ["Melanie Sampayo", "melanie_sampayo"],
  ["Carolina Uesato", "caro.uca"],
  ["María Lucía Báez", "lubaez"],
  ["Guadalupe Nogueira", "guadanogueira_"],
] as const;
const STEPS = [["paso-1", "Hábitat"], ["paso-2", "Fuego"], ["paso-3", "Datos"], ["paso-4", "Experimentos"], ["paso-5", "Preguntar"]] as const;
const gLabel = (g: number) => (g < 0.02 ? "sin gravedad" : Math.abs(g - 0.16) < 0.02 ? "gravedad lunar (1/6 de la Tierra)" : Math.abs(g - 0.38) < 0.02 ? "gravedad de Marte (1/3 de la Tierra)" : g >= 0.98 ? "gravedad terrestre" : `${g} g`);

function plainFire(c: Condition) {
  const d = Math.round(((c.o2 - 21) / 21) * 100);
  return [
    c.gravity < 0.02
      ? "Sin gravedad el aire caliente no sube. La llama queda como una esfera azul y el oxígeno le llega despacio, por difusión."
      : c.gravity < 0.98
        ? `Con ${gLabel(c.gravity)} el aire caliente sube muy despacio. La llama se estira un poco, pero no como una vela en la Tierra.`
        : "Con la gravedad de la Tierra el aire caliente sube y la llama toma forma de lágrima.",
    c.o2 > 23
      ? `Hay ${c.o2} % de oxígeno, ${d} % más que en el aire. Las cosas prenden más fácil y la llama es más caliente.`
      : c.o2 < 19 ? `Hay ${c.o2} % de oxígeno, menos que en el aire. Cuesta más que algo prenda.` : "El oxígeno es parecido al del aire que respiramos.",
    c.flow < 3
      ? "Sin ventilación la llama se puede ahogar sola, pero si arranca un ventilador vuelve a prender."
      : c.flow <= 30
        ? `La ventilación (${c.flow} cm/s) le acerca oxígeno. Justo en este rango el fuego avanza mejor sobre los materiales.`
        : "Con tanto flujo de aire la llama se puede soplar y apagar.",
  ];
}

const QUESTIONS = [
  "¿Qué materiales de cabina son más riesgosos en esta atmósfera?",
  "¿Cómo conviene diseñar la detección de humo para este hábitat?",
  "¿Sirve el CO₂ como supresor acá?",
  "¿Qué experimento falta para cerrar la brecha?",
];
const pad = (n: number) => String(n).padStart(2, "0");
const cssVar = (c: string) => ({ "--c": c }) as React.CSSProperties;

type Tip = { x: number; y: number; title: string; body: string } | null;

function Chart({ cond, selected, onPick, setTip, hidden }: { cond: Condition; selected: string; onPick: (s: Scenario) => void; setTip: (t: Tip) => void; hidden: Set<FuelType> }) {
  const groups = useMemo(() => {
    const m = new Map<string, Scenario[]>();
    SCENARIOS.forEach((s) => { const k = `${s.o2}|${s.pressure}`; m.set(k, [...(m.get(k) ?? []), s]); });
    return [...m.values()];
  }, []);
  const xt = [10, 15, 21, 30, 40, 50, 70, 100];
  const yt = [3, 4.3, 7.3, 10.2, 14.7, 20, 30, 50];
  const issOnly = INVESTIGATIONS.filter((i) => !hidden.has(i.fuelType) && i.o2[0] === 21 && i.o2[1] === 21 && i.pressure[0] === 14.7 && i.pressure[1] === 14.7);
  const box = (inv: Investigation) => {
    const x0 = X(inv.o2[0]), x1 = X(inv.o2[1]), y0 = Y(inv.pressure[1]), y1 = Y(inv.pressure[0]);
    const w = Math.max(x1 - x0, 10), h = Math.max(y1 - y0, 10);
    return { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w, h };
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Mapa de cobertura: O₂ contra presión. Cajas: rango ensayado por cada investigación. Rombos: hábitats. Círculos: incidentes.">
      {xt.map((t) => <g key={t}><line x1={X(t)} x2={X(t)} y1={M.t} y2={H - M.b} className="grid" /><text x={X(t)} y={H - M.b + 16} className="tick" textAnchor="middle">{t}</text></g>)}
      {yt.map((t) => <g key={t}><line x1={M.l} x2={W - M.r} y1={Y(t)} y2={Y(t)} className="grid" /><text x={M.l - 8} y={Y(t) + 4} className="tick" textAnchor="end">{t}</text></g>)}
      <line x1={M.l} x2={W - M.r} y1={H - M.b} y2={H - M.b} className="axis" />
      <text x={(W + M.l) / 2} y={H - 6} className="axlabel" textAnchor="middle">O₂ (%, log)</text>
      <text transform={`translate(14 ${(H - M.b + M.t) / 2}) rotate(-90)`} className="axlabel" textAnchor="middle">Presión total (psi, log)</text>

      <rect x={X(28)} y={Y(10.5)} width={X(36) - X(28)} height={Y(7.8) - Y(10.5)} className="target" />
      <text x={X(28)} y={Y(7.8) + 14} className="targetlabel">ZONA ARTEMIS</text>

      {INVESTIGATIONS.filter((inv) => !hidden.has(inv.fuelType)).map((inv) => {
        const b = box(inv);
        return (
          <rect key={inv.id} x={b.x} y={b.y} width={b.w} height={b.h} rx={3} className={`inv ${inv.fuelType}${inv.inPsi ? "" : " ext"}`} style={cssVar(FUEL_VAR[inv.fuelType])}
            onMouseMove={(e) => setTip({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, title: `${inv.id} · ${FUEL_LABEL[inv.fuelType]}`, body: `O₂ ${inv.o2.join("–")}% · ${inv.pressure.join("–")} psi · flujo ${inv.flow.join("–")} cm/s` })}
            onMouseLeave={() => setTip(null)} />
        );
      })}

      {issOnly.length > 1 && (
        <g className="stack" tabIndex={0} role="img" aria-label={`${issOnly.length} investigaciones ensayadas solo en aire ISS: ${issOnly.map((i) => i.id).join(", ")}`}
          onMouseMove={(e) => setTip({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, title: `${issOnly.length} investigaciones solo en aire ISS`, body: issOnly.map((i) => i.id).join(", ") })}
          onMouseLeave={() => setTip(null)} onFocus={() => setTip({ x: X(21) - 150, y: Y(14.7) + 40, title: `${issOnly.length} investigaciones solo en aire ISS`, body: issOnly.map((i) => i.id).join(", ") })} onBlur={() => setTip(null)}>
          <line x1={X(21)} y1={Y(14.7)} x2={X(21) - 26} y2={Y(14.7) + 34} className="leader" />
          <circle cx={X(21) - 34} cy={Y(14.7) + 42} r={13} className="badge" />
          <text x={X(21) - 34} y={Y(14.7) + 46} textAnchor="middle" className="badgetxt">×{issOnly.length}</text>
        </g>
      )}

      <ellipse cx={X(cond.o2)} cy={Y(cond.pressure)} rx={X(cond.o2 + 10) - X(cond.o2)} ry={Math.abs(Y(cond.pressure * 2 ** 0.5) - Y(cond.pressure))} className="halo" />

      {groups.map((g) => {
        const s = g[0], x = X(s.o2), y = Y(s.pressure);
        const idx = g.findIndex((q) => q.id === selected);
        const incident = g.every((q) => q.kind === "incident");
        const label = g.map((q) => q.name.replace(/ \(.*\)/, "")).join(" · ");
        const right = x < W - 200;
        return (
          <g key={s.id} className={`scn ${idx >= 0 ? "sel" : ""}`} tabIndex={0} role="button" aria-label={`${label}: ${s.o2}% O₂, ${s.pressure} psi`} aria-pressed={idx >= 0}
            onClick={() => onPick(idx >= 0 ? g[(idx + 1) % g.length] : s)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(idx >= 0 ? g[(idx + 1) % g.length] : s); } }}
            onFocus={() => setTip({ x: x + 10, y: y + 10, title: label, body: `${s.o2}% O₂ · ${s.pressure} psi` })} onBlur={() => setTip(null)}
            onMouseMove={(e) => setTip({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, title: label, body: `${s.o2}% O₂ · ${s.pressure} psi` })} onMouseLeave={() => setTip(null)}>
            <circle cx={x} cy={y} r={14} className="hit" />
            {incident ? <circle cx={x} cy={y} r={6} className="incident" /> : <rect x={x - 6} y={y - 6} width={12} height={12} transform={`rotate(45 ${x} ${y})`} className="habitat" />}
            <text x={right ? x + 12 : x - 12} y={y - 8} textAnchor={right ? "start" : "end"} className="scnlabel">{label}</text>
          </g>
        );
      })}
      <circle cx={X(cond.o2)} cy={Y(cond.pressure)} r={4} className="cursor" />
    </svg>
  );
}

export default function Home() {
  const init = SCENARIOS.find((s) => s.id === "moonbase")!;
  const [selected, setSelected] = useState(init.id);
  const [cond, setCond] = useState<Condition>({ o2: init.o2, pressure: init.pressure, flow: init.flow, gravity: init.gravity });
  const [focus, setFocus] = useState<Focus>("all");
  const [tip, setTip] = useState<Tip>(null);
  const [q, setQ] = useState("");
  const [ans, setAns] = useState<{ answer: string; engine: string; cited: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [hidden, setHidden] = useState<Set<FuelType>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [active, setActive] = useState("");
  const toggle = (f: FuelType) => setHidden((h) => { const n = new Set(h); if (n.has(f)) n.delete(f); else n.add(f); return n; });

  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    const spy = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }), { rootMargin: "-45% 0px -50% 0px" });
    STEPS.forEach(([id]) => { const el = document.getElementById(id); if (el) spy.observe(el); });
    return () => { io.disconnect(); spy.disconnect(); };
  }, []);

  const scenario = SCENARIOS.find((s) => s.id === selected);
  const ranked = useMemo(() => rank(INVESTIGATIONS, cond, focus), [cond, focus]);
  const cov = useMemo(() => coverage(INVESTIGATIONS, cond), [cond]);
  const notes = physicsNotes(cond);
  const custom = !scenario || scenario.o2 !== cond.o2 || scenario.pressure !== cond.pressure || scenario.flow !== cond.flow || scenario.gravity !== cond.gravity;
  const body: Body = BODY[selected] ?? "moon";
  const place = custom ? "tu atmósfera" : scenario!.name;

  const pick = (s: Scenario) => { setSelected(s.id); setCond({ o2: s.o2, pressure: s.pressure, flow: s.flow, gravity: s.gravity }); setAns(null); };
  const ask = async (question: string) => {
    setQ(question); setLoading(true); setAns(null);
    try {
      const r = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, condition: cond }) });
      setAns(await r.json());
    } catch { setAns({ answer: "No se pudo contactar al servidor.", engine: "error", cited: [] }); }
    setLoading(false);
  };
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const gaps = cov.filter((c) => c.status === "brecha").length;
  const solidsHighO2 = INVESTIGATIONS.filter((i) => i.fuelType === "solid" && i.inPsi && i.o2[1] > 21).length;
  const stats = [
    { label: "investigaciones de NASA en el atlas", value: String(INVESTIGATIONS.length) },
    { label: "con ficha oficial de PSI", value: String(PSI_COUNT) },
    { label: "ensayos en PSI con materiales sólidos por encima de 21 % O₂", value: String(solidsHighO2) },
    { label: "datos de combustión en gravedad lunar o marciana", value: "0" },
  ];

  return (
    <>
      <nav className="nav">
        <span className="brand">FLAME<span>/</span>IN<span>/</span>FREEFALL</span>
        <ol className="stepper">
          {STEPS.map(([id, label], i) => (
            <li key={id}><a href={`#${id}`} className={active === id ? "on" : ""}><span>{i + 1}</span>{label}</a></li>
          ))}
        </ol>
      </nav>

      <header className="hero">
        <div className="herocopy">
          <p className="kicker">NASA Space Apps 2026 · Flame in Freefall</p>
          <h1>¿Sabemos cómo quema el fuego <em>donde vamos a vivir?</em></h1>
          <p className="lede">La NASA quiere volver a la Luna y llegar a Marte. Allá el aire va a tener más oxígeno que acá, y con más oxígeno todo prende más fácil. Te mostramos en 5 pasos qué se sabe y qué falta medir.</p>
          <button className="cta" onClick={() => go("paso-1")}>Empezar</button>
        </div>
        <div className="heroviz">
          <Planet body={body} />
          <p className="flamecap">{place}</p>
        </div>
      </header>

      <main>
        <section id="paso-1" className="step" data-reveal>
          <StepHead n={1} title="¿Dónde vas a vivir?" hint="Elegí un lugar. Todo lo que sigue se adapta a tu elección." />
          <div className="habitats">
            {SCENARIOS.filter((s) => s.kind === "habitat").map((s, i) => {
              const on = selected === s.id && !custom;
              const d = Math.round(((s.o2 - 21) / 21) * 100);
              return (
                <button key={s.id} className={`habitat-card ${on ? "on" : ""}`} style={{ "--i": i } as React.CSSProperties} onClick={() => pick(s)} aria-pressed={on}>
                  <Planet body={BODY[s.id]} still className="mini" />
                  <b>{s.name}</b>
                  <span className="hstat"><em>{s.o2} %</em> oxígeno{d > 0 ? ` (+${d} % que el aire)` : ""}</span>
                  <span className="hstat"><em>{s.pressure}</em> psi · {gLabel(s.gravity)}</span>
                  {on && <span className="picked">Elegido ✓</span>}
                </button>
              );
            })}
          </div>
          <button className="next" onClick={() => go("paso-2")}>Siguiente: cómo se comporta el fuego ahí ↓</button>
        </section>

        <section id="paso-2" className="step" data-reveal>
          <StepHead n={2} title={`¿Cómo se comporta el fuego en ${custom ? "tu atmósfera" : scenario!.name}?`} hint="La animación es ilustrativa. Mové los controles y mirá cómo cambia." />
          <div className="fire">
            <div className="flamebox">
              <Flame o2={cond.o2} gravity={cond.gravity} flow={cond.flow} />
            </div>
            <div className="firetext">
              <ol className="plain">{plainFire(cond).map((t, i) => <li key={i}>{t}</li>)}</ol>
              <div className="sliders">
                {([["o2", "Oxígeno", 10, 100, 1, " %"], ["gravity", "Gravedad", 0, 1, 0.01, " g"], ["flow", "Ventilación", 0, 70, 1, " cm/s"], ["pressure", "Presión", 3, 50, 0.1, " psi"]] as const).map(([k, label, min, max, step, unit]) => (
                  <label key={k}>
                    <span>{label} <b>{cond[k]}{unit}</b></span>
                    <input type="range" min={min} max={max} step={step} value={cond[k]} onChange={(e) => setCond({ ...cond, [k]: +e.target.value })} />
                  </label>
                ))}
              </div>
              <details className="fine">
                <summary className="mono">Ver la física en detalle</summary>
                {!custom && <p className="muted small">{scenario?.note}</p>}
                <ul className="notes">{notes.map((n) => <li key={n}>{n}</li>)}</ul>
              </details>
            </div>
          </div>
          <button className="next" onClick={() => go("paso-3")}>Siguiente: ¿hay datos para esto? ↓</button>
        </section>

        <section id="paso-3" className="step" data-reveal>
          <StepHead n={3} title="¿Tenemos datos de NASA para esto?" hint="Buscamos experimentos del repositorio PSI hechos en condiciones parecidas." />
          <div className="verdictbox">
            <p className="verdict" aria-live="polite">
              {gaps === 0 ? <><b>Sí</b>hay experimentos cerca para los cuatro tipos de fuego.</> : <><b>{gaps} de 4</b>tipos de fuego no tienen experimentos cerca de esta atmósfera.</>}
            </p>
            <div className="cov">
              {cov.map((c) => (
                <div key={c.fuel} className={`covtile ${STATUS[c.status].cls}`}>
                  <span className="covicon" aria-hidden>{STATUS[c.status].icon}</span>
                  <span><b>{PLAIN[c.fuel][0]}</b><span className="muted small">{PLAIN[c.fuel][1]}</span><span className="tag">{STATUS[c.status].say}</span></span>
                </div>
              ))}
            </div>
            {cov.find((c) => c.fuel === "solid")?.status !== "cubierto" && cond.o2 > 23 && <p className="aside-note">NASA ya quemó materiales con más oxígeno en Saffire-V, Saffire-VI y SoFIE, pero esos datos todavía no están publicados en PSI.</p>}
          </div>

          <details className="mapbox">
            <summary><span className="mono">Ver el mapa completo</span><span className="muted small">Todos los experimentos según el oxígeno y la presión que usaron</span></summary>
            <ul className="howto">
              <li><i className="sw solid" style={cssVar(FUEL_VAR.solid)} />Cada caja es lo que probó un experimento.</li>
              <li><i className="sw hab" />El rombo es dónde vas a vivir.</li>
              <li><span className="howdot" />Si el rombo queda lejos de las cajas, no hay datos.</li>
            </ul>
            <div className="legend">
              {FUELS.map((f) => <button key={f} className={hidden.has(f) ? "off" : ""} aria-pressed={!hidden.has(f)} onClick={() => toggle(f)}><i className={`sw ${f}`} style={cssVar(FUEL_VAR[f])} />{PLAIN[f][0]}</button>)}
              <span><i className="sw incd" />Incidente</span>
            </div>
            <div className="chartwrap">
              <Chart cond={cond} selected={selected} onPick={pick} setTip={setTip} hidden={hidden} />
              {tip && <div className="tip" style={{ left: tip.x + 14, top: tip.y + 14 }}><b>{tip.title}</b><br />{tip.body}</div>}
            </div>
            <p className="caption">Cajas punteadas: experimentos que menciona el reto pero que no están en PSI. Tocá la leyenda para filtrar.</p>
          </details>
          <button className="next" onClick={() => go("paso-4")}>Siguiente: qué experimentos sirven ↓</button>
        </section>

        <section id="paso-4" className="step" data-reveal>
          <StepHead n={4} title="¿Qué experimentos sirven más?" hint="Los ordenamos por qué tan parecidas fueron sus condiciones a las tuyas." />
          <div className="top3">
            {ranked.slice(0, 3).map((r, i) => (
              <button key={r.inv.id} className="topcard" style={{ "--i": i } as React.CSSProperties} onClick={() => { setShowAll(true); setOpen(r.inv.id); setTimeout(() => go("ranking"), 50); }}>
                <span className="toprank">{i + 1}</span>
                <span className="mono muted">{PLAIN[r.inv.fuelType][0]} · {Math.round(r.score * 100)} % parecido</span>
                <b>{r.inv.id}</b>
                <span className="small clamp3">{r.inv.finding}</span>
                <span className="mono small cardfoot">Ver detalle →</span>
              </button>
            ))}
          </div>
          <details id="ranking" className="mapbox" open={showAll} onToggle={(e) => setShowAll((e.target as HTMLDetailsElement).open)}>
            <summary><span className="mono">Ver las {ranked.length} investigaciones</span><span className="muted small">Con condiciones, sensores y la ficha oficial de PSI</span></summary>
            <div className="seg" role="group" aria-label="Enfoque">{FOCI.map(([f, l]) => <button key={f} aria-pressed={focus === f} className={focus === f ? "on" : ""} onClick={() => setFocus(f)}>{l}</button>)}</div>
            <ol className="ranked">
              {ranked.map((r, i) => {
                const { flight } = psiFor(r.inv.id);
                const isOpen = open === r.inv.id;
                return (
                  <li key={r.inv.id} className={isOpen ? "open" : ""}>
                    <button className="rrow" onClick={() => setOpen(isOpen ? null : r.inv.id)} aria-expanded={isOpen}>
                      <span className="rk mono">{pad(i + 1)}</span>
                      <i className={`sw ${r.inv.fuelType}`} style={cssVar(FUEL_VAR[r.inv.fuelType])} />
                      <span className="rname"><b>{r.inv.id}</b> <span className="muted">{r.inv.name}</span></span>
                      <span className="bar" aria-label={`puntaje ${Math.round(r.total * 100)}`}><span style={{ width: `${r.total * 100}%` }} /></span>
                      <span className="num mono">{Math.round(r.total * 100)}</span>
                    </button>
                    {isOpen && (
                      <div className="rbody">
                        <p>{r.inv.finding}</p>
                        <div className="detail">
                          <dl>
                            <dt>Condiciones</dt><dd>O₂ {r.inv.o2.join("–")}% · {r.inv.pressure.join("–")} psi · flujo {r.inv.flow.join("–")} cm/s</dd>
                            <dt>Distancia</dt><dd>{!r.deltaO2 && !r.deltaP && !r.deltaFlow ? "Dentro del rango ensayado" : [r.deltaO2 ? `${r.deltaO2 > 0 ? "+" : ""}${r.deltaO2.toFixed(0)} pts de O₂` : "", r.deltaP ? `${r.deltaP > 0 ? "+" : ""}${r.deltaP.toFixed(1)} psi` : "", r.deltaFlow ? `${r.deltaFlow.toFixed(0)} cm/s de flujo` : ""].filter(Boolean).join(", ") + " fuera del rango"}</dd>
                            <dt>Combustible</dt><dd>{r.inv.fuels}</dd>
                            <dt>Sensores</dt><dd>{r.inv.sensors}</dd>
                            {r.inv.earth && <><dt>En la Tierra</dt><dd>{r.inv.earth}</dd></>}
                          </dl>
                          {flight ? (
                            <div className="psicard">
                              <p className="mono"><span className="psibadge">FICHA PSI</span> {flight.psiId} · <a href={`https://doi.org/${flight.doi}`} target="_blank" rel="noreferrer">doi:{flight.doi}</a></p>
                              {flight.hypothesis && <p lang="en" className="quote">“{clip(flight.hypothesis.replace(/^"|"$/g, ""), 260)}”</p>}
                              <p className="mono muted">{flight.publications.length} publicaciones{flight.publications[0]?.link && <> · <a href={flight.publications[0].link} target="_blank" rel="noreferrer">ver la primera</a></>}</p>
                            </div>
                          ) : (
                            <p className="mono muted small">{r.inv.inPsi ? "En PSI, sin ficha cargada." : "Mencionada en el reto, no está en PSI."}{(r.inv as { source?: string }).source && <> · <a href={(r.inv as { source?: string }).source} target="_blank" rel="noreferrer">fuente</a></>}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </details>
          <button className="next" onClick={() => go("paso-5")}>Siguiente: preguntá lo que quieras ↓</button>
        </section>

        <section id="paso-5" className="step" data-reveal>
          <StepHead n={5} title="¿Te quedó una duda? Preguntá" hint="El copiloto contesta con los experimentos más cercanos a tu atmósfera y te dice cuál usó." />
          <div className="panel copilot">
            <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) ask(q); }} className="ask">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej.: ¿qué pasa si se corta la ventilación?" aria-label="Pregunta" />
              <button disabled={loading || !q.trim()}>{loading ? "Buscando…" : "Preguntar"}</button>
            </form>
            <div className="chips"><span className="chiplabel">Probá con</span>{QUESTIONS.slice(0, 3).map((x) => <button key={x} className="chip ghost" onClick={() => ask(x)} disabled={loading}>{x}</button>)}</div>
            {ans && (
              <div className="answer">
                <p style={{ whiteSpace: "pre-wrap" }}>{ans.answer}</p>
                <p className="mono muted small">Motor: {ans.engine} · Experimentos usados: {ans.cited.join(", ")}</p>
              </div>
            )}
          </div>
        </section>

        <section id="incidentes" className="step extra" data-reveal>
          <div className="sechead"><p className="kicker">Historia</p><h2>Incendios que ya pasaron</h2><p className="muted">Tocá uno para ver sus condiciones en los pasos de arriba.</p></div>
          <div className="cards">
            {SCENARIOS.filter((s) => s.kind === "incident").map((s, i) => (
              <button key={s.id} className="card" style={{ "--i": i } as React.CSSProperties} onClick={() => { pick(s); go("paso-2"); }}>
                <span className="mono muted">{s.o2}% O₂ · {s.pressure} psi</span>
                <b className="cardtitle">{s.name}</b>
                <span className="small clamp3">{s.note}</span>
                <span className="mono small cardfoot">Ver este caso →</span>
              </button>
            ))}
          </div>
        </section>

        <section className="step extra" data-reveal>
          <div className="sechead"><p className="kicker">En números</p><h2>Lo que encontramos</h2></div>
          <div className="stats">
            {stats.map((s, i) => (
              <div key={s.label} className="stat" style={{ "--i": i } as React.CSSProperties}><span className="mono">{s.label}</span><b><CountUp value={s.value} /></b></div>
            ))}
          </div>
        </section>

        <section id="tierra" className="step extra" data-reveal>
          <div className="sechead"><p className="kicker">En la Tierra</p><h2>Lo que ya se usa acá</h2></div>
          <div className="earthgrid">
            <div className="earthcard" style={{ "--i": 0 } as React.CSSProperties}><b>Niebla fina de agua</b><span>Extintores desarrollados para la ISS que hoy se usan en edificios y vehículos.</span></div>
            <div className="earthcard" style={{ "--i": 1 } as React.CSSProperties}><b>Detectores de humo</b><span>Un detector de los 70 que distingue humo de polvo da menos falsas alarmas en minería e industria.</span></div>
            <div className="earthcard" style={{ "--i": 2 } as React.CSSProperties}><b>Equipo de bomberos</b><span>Tanques de aire y ropa adaptados de la tecnología de trajes espaciales.</span></div>
          </div>
        </section>

        <section id="equipo" className="step extra team" data-reveal>
          <div className="sechead">
            <p className="kicker">Equipo</p>
            <h2>Equipo Dinamita</h2>
            <p className="muted">Seis integrantes desde Argentina en NASA Space Apps 2026.</p>
          </div>
          <div className="crew">
            {TEAM.map(([name, handle], i) => (
              <div key={handle} className="member" style={{ "--i": i } as React.CSSProperties}>
                <span className="avatar" aria-hidden><span className="orbit" style={{ animationDuration: `${7 + i * 1.3}s`, animationDelay: `${-i * 0.9}s` }} />{name.split(" ").filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join("")}</span>
                <b>{name}</b>
                <span className="mono muted">@{handle}</span>
                {i === 0 && <span className="owner mono">Team owner</span>}
              </div>
            ))}
          </div>
        </section>

        <footer className="mono muted small">
          Hecho por Equipo Dinamita, Argentina. {PSI_COUNT} investigaciones con ficha oficial de PSI. Rangos numéricos aproximados hasta cargar las matrices de ensayo. Sin datos de gravedad parcial: para la Luna y Marte, µg y 1g funcionan como cotas.
        </footer>
      </main>
    </>
  );
}

function StepHead({ n, title, hint }: { n: number; title: string; hint: string }) {
  return (
    <div className="stephead">
      <span className="stepnum">{n}</span>
      <div><h2>{title}</h2><p className="muted">{hint}</p></div>
    </div>
  );
}

function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const m = value.match(/^([^\d-]*)(-?\d+)(.*)$/);
  const [shown, setShown] = useState(m ? `${m[1]}0${m[3]}` : value);
  const done = useRef(false);
  useEffect(() => {
    if (!m) return setShown(value);
    if (done.current || matchMedia("(prefers-reduced-motion: reduce)").matches) { done.current = true; return setShown(value); }
    const el = ref.current!;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const end = +m[2], t0 = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / 1100);
        setShown(`${m[1]}${Math.round(end * (1 - (1 - k) ** 3))}${m[3]}`);
        if (k < 1) requestAnimationFrame(tick); else done.current = true;
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [value]);
  return <span ref={ref}>{shown}</span>;
}
