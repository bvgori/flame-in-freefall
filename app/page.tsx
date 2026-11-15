"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Flame from "./Flame";
import Planet, { type Body } from "./Planet";
import Predict from "./Predict";
import { INVESTIGATIONS, SCENARIOS, FUEL_LABEL, type Investigation, type FuelType, type Scenario } from "@/lib/data.ts";
import { rank, coverage, physicsNotes, type Condition, type Focus } from "@/lib/rank.ts";
import { psiFor, clip, PSI_COUNT } from "@/lib/psi.ts";

const W = 720, H = 440, M = { l: 64, r: 16, t: 14, b: 44 };
const O2 = [10, 100] as const, P = [3, 50] as const;
const X = (o2: number) => M.l + ((Math.log(o2) - Math.log(O2[0])) / (Math.log(O2[1]) - Math.log(O2[0]))) * (W - M.l - M.r);
const Y = (p: number) => M.t + (1 - (Math.log(p) - Math.log(P[0])) / (Math.log(P[1]) - Math.log(P[0]))) * (H - M.t - M.b);
const FUELS: FuelType[] = ["solid", "liquid", "gas", "aerosol"];
const FUEL_VAR: Record<FuelType, string> = { gas: "var(--s-gas)", liquid: "var(--s-liquid)", solid: "var(--s-solid)", aerosol: "var(--muted)" };
const FOCI: [Focus, string][] = [["all", "All"], ["prevention", "Prevention"], ["detection", "Detection"], ["suppression", "Suppression"]];
const STATUS = { cubierto: { icon: "✓", cls: "good", say: "Data available" }, parcial: { icon: "◐", cls: "warn", say: "Little data" }, brecha: { icon: "✕", cls: "crit", say: "No data" } } as const;
const PLAIN: Record<FuelType, [string, string]> = {
  solid: ["Materials", "fabrics, plastics, cables"],
  liquid: ["Liquids", "fuels and oils"],
  gas: ["Gases", "gas leaks"],
  aerosol: ["Smoke", "what detectors measure"],
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
const STEPS = [["paso-1", "Habitat"], ["paso-2", "Fire"], ["prediccion", "Prediction"], ["paso-3", "Data"], ["paso-4", "Experiments"], ["paso-5", "Ask"]] as const;
const gLabel = (g: number) => (g < 0.02 ? "no gravity" : Math.abs(g - 0.16) < 0.02 ? "Moon gravity (1/6 of Earth)" : Math.abs(g - 0.38) < 0.02 ? "Mars gravity (1/3 of Earth)" : g >= 0.98 ? "Earth gravity" : `${g} g`);

function plainFire(c: Condition) {
  const d = Math.round(((c.o2 - 21) / 21) * 100);
  return [
    c.gravity < 0.02
      ? "Without gravity, hot air does not rise. The flame becomes a blue sphere and oxygen reaches it slowly, by diffusion."
      : c.gravity < 0.98
        ? `With ${gLabel(c.gravity)}, hot air rises very slowly. The flame stretches a little, but not like a candle on Earth.`
        : "With Earth gravity, hot air rises and the flame takes a teardrop shape.",
    c.o2 > 23
      ? `There is ${c.o2} % oxygen, ${d} % more than in normal air. Things catch fire more easily and the flame is hotter.`
      : c.o2 < 19 ? `There is ${c.o2} % oxygen, less than in normal air. It is harder for things to catch fire.` : "The oxygen level is close to the air we breathe.",
    c.flow < 3
      ? "Without ventilation the flame can smother itself, but if a fan starts it can flare up again."
      : c.flow <= 30
        ? `The ventilation (${c.flow} cm/s) brings oxygen to the flame. In this range fire spreads best over materials.`
        : "With this much airflow the flame can be blown out.",
  ];
}

const QUESTIONS = [
  "Which cabin materials are the most risky in this atmosphere?",
  "How should smoke detection be designed for this habitat?",
  "Would CO₂ work as a fire suppressant here?",
  "What experiment is missing to fill this data gap?",
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
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Coverage map of O₂ against pressure. Boxes show the range tested by each investigation, diamonds show habitats and circles show incidents.">
      {xt.map((t) => <g key={t}><line x1={X(t)} x2={X(t)} y1={M.t} y2={H - M.b} className="grid" /><text x={X(t)} y={H - M.b + 16} className="tick" textAnchor="middle">{t}</text></g>)}
      {yt.map((t) => <g key={t}><line x1={M.l} x2={W - M.r} y1={Y(t)} y2={Y(t)} className="grid" /><text x={M.l - 8} y={Y(t) + 4} className="tick" textAnchor="end">{t}</text></g>)}
      <line x1={M.l} x2={W - M.r} y1={H - M.b} y2={H - M.b} className="axis" />
      <text x={(W + M.l) / 2} y={H - 6} className="axlabel" textAnchor="middle">O₂ (%, log)</text>
      <text transform={`translate(14 ${(H - M.b + M.t) / 2}) rotate(-90)`} className="axlabel" textAnchor="middle">Total pressure (psi, log)</text>

      <rect x={X(28)} y={Y(10.5)} width={X(36) - X(28)} height={Y(7.8) - Y(10.5)} className="target" />
      <text x={X(28)} y={Y(7.8) + 14} className="targetlabel">ARTEMIS ZONE</text>

      {INVESTIGATIONS.filter((inv) => !hidden.has(inv.fuelType)).map((inv) => {
        const b = box(inv);
        return (
          <rect key={inv.id} x={b.x} y={b.y} width={b.w} height={b.h} rx={3} className={`inv ${inv.fuelType}${inv.inPsi ? "" : " ext"}`} style={cssVar(FUEL_VAR[inv.fuelType])}
            onMouseMove={(e) => setTip({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, title: `${inv.id} · ${FUEL_LABEL[inv.fuelType]}`, body: `O₂ ${inv.o2.join("–")}% · ${inv.pressure.join("–")} psi · flow ${inv.flow.join("–")} cm/s` })}
            onMouseLeave={() => setTip(null)} />
        );
      })}

      {issOnly.length > 1 && (
        <g className="stack" tabIndex={0} role="img" aria-label={`${issOnly.length} investigations tested only in ISS air: ${issOnly.map((i) => i.id).join(", ")}`}
          onMouseMove={(e) => setTip({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, title: `${issOnly.length} investigations only in ISS air`, body: issOnly.map((i) => i.id).join(", ") })}
          onMouseLeave={() => setTip(null)} onFocus={() => setTip({ x: X(21) - 150, y: Y(14.7) + 40, title: `${issOnly.length} investigations only in ISS air`, body: issOnly.map((i) => i.id).join(", ") })} onBlur={() => setTip(null)}>
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
  const place = custom ? "your atmosphere" : scenario!.name;

  const pick = (s: Scenario) => { setSelected(s.id); setCond({ o2: s.o2, pressure: s.pressure, flow: s.flow, gravity: s.gravity }); setAns(null); };
  const ask = async (question: string) => {
    setQ(question); setLoading(true); setAns(null);
    try {
      const r = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, condition: cond }) });
      setAns(await r.json());
    } catch { setAns({ answer: "Could not reach the server.", engine: "error", cited: [] }); }
    setLoading(false);
  };
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const gaps = cov.filter((c) => c.status === "brecha").length;
  const solidsHighO2 = INVESTIGATIONS.filter((i) => i.fuelType === "solid" && i.inPsi && i.o2[1] > 21).length;
  const stats = [
    { label: "NASA investigations in the atlas", value: String(INVESTIGATIONS.length) },
    { label: "with an official PSI record", value: String(PSI_COUNT) },
    { label: "PSI tests with solid materials above 21 % O₂", value: String(solidsHighO2) },
    { label: "combustion datasets in PSI at Moon or Mars gravity", value: "0" },
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
          <h1>Do we know how fire burns <em>where we are going to live?</em></h1>
          <p className="lede">NASA wants to go back to the Moon and then on to Mars. The air in those habitats will have more oxygen than here, and with more oxygen everything catches fire more easily. In 6 steps we show what is known, what our model predicts and what still needs to be measured.</p>
          <button className="cta" onClick={() => go("paso-1")}>Start</button>
        </div>
        <div className="heroviz">
          <Planet body={body} />
          <p className="flamecap">{place}</p>
        </div>
      </header>

      <main>
        <section id="paso-1" className="step" data-reveal>
          <StepHead n={1} title="Where will you live?" hint="Pick a place. Everything below adapts to your choice." />
          <div className="habitats">
            {SCENARIOS.filter((s) => s.kind === "habitat").map((s, i) => {
              const on = selected === s.id && !custom;
              const d = Math.round(((s.o2 - 21) / 21) * 100);
              return (
                <button key={s.id} className={`habitat-card ${on ? "on" : ""}`} style={{ "--i": i } as React.CSSProperties} onClick={() => pick(s)} aria-pressed={on}>
                  <Planet body={BODY[s.id]} still className="mini" />
                  <b>{s.name}</b>
                  <span className="hstat"><em>{s.o2} %</em> oxygen{d > 0 ? ` (+${d} % vs. normal air)` : ""}</span>
                  <span className="hstat"><em>{s.pressure}</em> psi · {gLabel(s.gravity)}</span>
                  {on && <span className="picked">Selected ✓</span>}
                </button>
              );
            })}
          </div>
          <button className="next" onClick={() => go("paso-2")}>Next: how fire behaves there ↓</button>
        </section>

        <section id="paso-2" className="step" data-reveal>
          <StepHead n={2} title={`How does fire behave in ${custom ? "your atmosphere" : scenario!.name}?`} hint="The animation is for illustration. Move the sliders and watch how it changes." />
          <div className="fire">
            <div className="flamebox">
              <Flame o2={cond.o2} gravity={cond.gravity} flow={cond.flow} />
            </div>
            <div className="firetext">
              <ol className="plain">{plainFire(cond).map((t, i) => <li key={i}>{t}</li>)}</ol>
              <div className="sliders">
                {([["o2", "Oxygen", 10, 100, 1, " %"], ["gravity", "Gravity", 0, 1, 0.01, " g"], ["flow", "Ventilation", 0, 70, 1, " cm/s"], ["pressure", "Pressure", 3, 50, 0.1, " psi"]] as const).map(([k, label, min, max, step, unit]) => (
                  <label key={k}>
                    <span>{label} <b>{cond[k]}{unit}</b></span>
                    <input type="range" min={min} max={max} step={step} value={cond[k]} onChange={(e) => setCond({ ...cond, [k]: +e.target.value })} />
                  </label>
                ))}
              </div>
              <details className="fine">
                <summary className="mono">See the physics in detail</summary>
                {!custom && <p className="muted small">{scenario?.note}</p>}
                <ul className="notes">{notes.map((n) => <li key={n}>{n}</li>)}</ul>
              </details>
            </div>
          </div>
          <button className="next" onClick={() => go("prediccion")}>Next: would something catch fire here? ↓</button>
        </section>

        <section id="prediccion" className="step" data-reveal>
          <StepHead n={3} title="Would something catch fire here?" hint="Our model predicts whether a cabin material keeps burning. It was trained on ISS data and checked against tests it never saw." />
          <Predict cond={cond} place={custom ? "your atmosphere" : scenario!.name} />
          <button className="next" onClick={() => go("paso-3")}>Next: does NASA have data for this? ↓</button>
        </section>

        <section id="paso-3" className="step" data-reveal>
          <StepHead n={4} title="Do we have NASA data for this?" hint="We look for experiments in the PSI repository that were run in similar conditions." />
          <div className="verdictbox">
            <p className="verdict" aria-live="polite">
              {gaps === 0 ? <><b>Yes</b>there are nearby experiments for all four fire types.</> : <><b>{gaps} of 4</b>fire types have no experiments close to this atmosphere.</>}
            </p>
            <div className="cov">
              {cov.map((c) => (
                <div key={c.fuel} className={`covtile ${STATUS[c.status].cls}`}>
                  <span className="covicon" aria-hidden>{STATUS[c.status].icon}</span>
                  <span><b>{PLAIN[c.fuel][0]}</b><span className="muted small">{PLAIN[c.fuel][1]}</span><span className="tag">{STATUS[c.status].say}</span></span>
                </div>
              ))}
            </div>
            {cov.find((c) => c.fuel === "solid")?.status !== "cubierto" && cond.o2 > 23 && <p className="aside-note">NASA has already burned materials at higher oxygen in Saffire-V, Saffire-VI and SoFIE, but that data is not published in PSI yet.</p>}
          </div>

          <details className="mapbox">
            <summary><span className="mono">See the full map</span><span className="muted small">All experiments by the oxygen and pressure they used</span></summary>
            <ul className="howto">
              <li><i className="sw solid" style={cssVar(FUEL_VAR.solid)} />Each box is what one experiment tested.</li>
              <li><i className="sw hab" />The diamond is where you will live.</li>
              <li><span className="howdot" />If the diamond is far from the boxes, there is no data.</li>
            </ul>
            <div className="legend">
              {FUELS.map((f) => <button key={f} className={hidden.has(f) ? "off" : ""} aria-pressed={!hidden.has(f)} onClick={() => toggle(f)}><i className={`sw ${f}`} style={cssVar(FUEL_VAR[f])} />{PLAIN[f][0]}</button>)}
              <span><i className="sw incd" />Incident</span>
            </div>
            <div className="chartwrap">
              <Chart cond={cond} selected={selected} onPick={pick} setTip={setTip} hidden={hidden} />
              {tip && <div className="tip" style={{ left: tip.x + 14, top: tip.y + 14 }}><b>{tip.title}</b><br />{tip.body}</div>}
            </div>
            <p className="caption">Dashed boxes are experiments named in the challenge that are not in PSI. Tap the legend to filter.</p>
          </details>
          <button className="next" onClick={() => go("paso-4")}>Next: which experiments help most ↓</button>
        </section>

        <section id="paso-4" className="step" data-reveal>
          <StepHead n={5} title="Which experiments help most?" hint="We sort them by how close their conditions were to yours." />
          <div className="top3">
            {ranked.slice(0, 3).map((r, i) => (
              <button key={r.inv.id} className="topcard" style={{ "--i": i } as React.CSSProperties} onClick={() => { setShowAll(true); setOpen(r.inv.id); setTimeout(() => go("ranking"), 50); }}>
                <span className="toprank">{i + 1}</span>
                <span className="mono muted">{PLAIN[r.inv.fuelType][0]} · {Math.round(r.score * 100)} % match</span>
                <b>{r.inv.id}</b>
                <span className="small clamp3">{r.inv.finding}</span>
                <span className="mono small cardfoot">See details →</span>
              </button>
            ))}
          </div>
          <details id="ranking" className="mapbox" open={showAll} onToggle={(e) => setShowAll((e.target as HTMLDetailsElement).open)}>
            <summary><span className="mono">See all {ranked.length} investigations</span><span className="muted small">With conditions, sensors and the official PSI record</span></summary>
            <div className="seg" role="group" aria-label="Focus">{FOCI.map(([f, l]) => <button key={f} aria-pressed={focus === f} className={focus === f ? "on" : ""} onClick={() => setFocus(f)}>{l}</button>)}</div>
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
                      <span className="bar" aria-label={`score ${Math.round(r.total * 100)}`}><span style={{ width: `${r.total * 100}%` }} /></span>
                      <span className="num mono">{Math.round(r.total * 100)}</span>
                    </button>
                    {isOpen && (
                      <div className="rbody">
                        <p>{r.inv.finding}</p>
                        <div className="detail">
                          <dl>
                            <dt>Conditions</dt><dd>O₂ {r.inv.o2.join("–")}% · {r.inv.pressure.join("–")} psi · flow {r.inv.flow.join("–")} cm/s</dd>
                            <dt>Distance</dt><dd>{!r.deltaO2 && !r.deltaP && !r.deltaFlow ? "Inside the tested range" : [r.deltaO2 ? `${r.deltaO2 > 0 ? "+" : ""}${r.deltaO2.toFixed(0)} O₂ points` : "", r.deltaP ? `${r.deltaP > 0 ? "+" : ""}${r.deltaP.toFixed(1)} psi` : "", r.deltaFlow ? `${r.deltaFlow.toFixed(0)} cm/s of flow` : ""].filter(Boolean).join(", ") + " outside the range"}</dd>
                            <dt>Fuel</dt><dd>{r.inv.fuels}</dd>
                            <dt>Sensors</dt><dd>{r.inv.sensors}</dd>
                            {r.inv.earth && <><dt>On Earth</dt><dd>{r.inv.earth}</dd></>}
                          </dl>
                          {flight ? (
                            <div className="psicard">
                              <p className="mono"><span className="psibadge">PSI RECORD</span> {flight.psiId} · <a href={`https://doi.org/${flight.doi}`} target="_blank" rel="noreferrer">doi:{flight.doi}</a></p>
                              {flight.hypothesis && <p className="quote">“{clip(flight.hypothesis.replace(/^"|"$/g, ""), 260)}”</p>}
                              <p className="mono muted">{flight.publications.length} publications{flight.publications[0]?.link && <> · <a href={flight.publications[0].link} target="_blank" rel="noreferrer">see the first one</a></>}</p>
                            </div>
                          ) : (
                            <p className="mono muted small">{r.inv.inPsi ? "In PSI, record not loaded yet." : "Named in the challenge, not in PSI."}{(r.inv as { source?: string }).source && <> · <a href={(r.inv as { source?: string }).source} target="_blank" rel="noreferrer">source</a></>}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </details>
          <button className="next" onClick={() => go("paso-5")}>Next: ask anything you want ↓</button>
        </section>

        <section id="paso-5" className="step" data-reveal>
          <StepHead n={6} title="Still have a question? Ask" hint="The copilot answers using the experiments closest to your atmosphere and tells you which ones it used." />
          <div className="panel copilot">
            <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) ask(q); }} className="ask">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="E.g. what happens if the ventilation stops?" aria-label="Question" />
              <button disabled={loading || !q.trim()}>{loading ? "Searching…" : "Ask"}</button>
            </form>
            <div className="chips"><span className="chiplabel">Try</span>{QUESTIONS.slice(0, 3).map((x) => <button key={x} className="chip ghost" onClick={() => ask(x)} disabled={loading}>{x}</button>)}</div>
            {ans && (
              <div className="answer">
                <p style={{ whiteSpace: "pre-wrap" }}>{ans.answer}</p>
                <p className="mono muted small">Engine: {ans.engine} · Experiments used: {ans.cited.join(", ")}</p>
              </div>
            )}
          </div>
        </section>

        <section id="incidentes" className="step extra" data-reveal>
          <div className="sechead"><p className="kicker">History</p><h2>Fires that already happened</h2><p className="muted">Tap one to see its conditions in the steps above.</p></div>
          <div className="cards">
            {SCENARIOS.filter((s) => s.kind === "incident").map((s, i) => (
              <button key={s.id} className="card" style={{ "--i": i } as React.CSSProperties} onClick={() => { pick(s); go("paso-2"); }}>
                <span className="mono muted">{s.o2}% O₂ · {s.pressure} psi</span>
                <b className="cardtitle">{s.name}</b>
                <span className="small clamp3">{s.note}</span>
                <span className="mono small cardfoot">See this case →</span>
              </button>
            ))}
          </div>
        </section>

        <section className="step extra" data-reveal>
          <div className="sechead"><p className="kicker">By the numbers</p><h2>What we found</h2></div>
          <div className="stats">
            {stats.map((s, i) => (
              <div key={s.label} className="stat" style={{ "--i": i } as React.CSSProperties}><span className="mono">{s.label}</span><b><CountUp value={s.value} /></b></div>
            ))}
          </div>
        </section>

        <section id="tierra" className="step extra" data-reveal>
          <div className="sechead"><p className="kicker">On Earth</p><h2>What is already in use here</h2></div>
          <div className="earthgrid">
            <div className="earthcard" style={{ "--i": 0 } as React.CSSProperties}><b>Fine water mist</b><span>Extinguishers developed for the ISS that are now used in buildings and vehicles.</span></div>
            <div className="earthcard" style={{ "--i": 1 } as React.CSSProperties}><b>Smoke detectors</b><span>A 1970s detector that tells smoke apart from dust gives fewer false alarms in mining and industry.</span></div>
            <div className="earthcard" style={{ "--i": 2 } as React.CSSProperties}><b>Firefighter gear</b><span>Air tanks and protective clothing adapted from spacesuit technology.</span></div>
          </div>
        </section>

        <section id="equipo" className="step extra team" data-reveal>
          <div className="sechead">
            <p className="kicker">Team</p>
            <h2>Equipo Dinamita</h2>
            <p className="muted">Six members from Argentina at NASA Space Apps 2026.</p>
          </div>
          <div className="crew">
            {TEAM.map(([name, handle], i) => (
              <div key={handle} className="member" style={{ "--i": i } as React.CSSProperties}>
                <span className="avatar" aria-hidden><span className="orbit" style={{ animationDuration: `${7 + i * 1.3}s`, animationDelay: `${-i * 0.9}s` }} />{name.split(" ").filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join("")}</span>
                <b>{name}</b>
                <span className="mono muted">@{handle}</span>
              </div>
            ))}
          </div>
        </section>

        <footer className="mono muted small">
          Made by Equipo Dinamita, Argentina. {PSI_COUNT} investigations with an official PSI record. Numeric ranges are approximate until we load the test matrices. There is no partial gravity data, so for the Moon and Mars we use µg and 1 g as bounds.
          <br />Built with help from AI tools. The code was written with an AI coding assistant (Claude) and reviewed by the team, and the copilot answers are generated by Google Gemini from NASA data and our model. The prediction model was trained by the team on NASA data.
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
