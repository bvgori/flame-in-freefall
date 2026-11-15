export const maxDuration = 60;
import Anthropic from "@anthropic-ai/sdk";
import { INVESTIGATIONS } from "@/lib/data.ts";
import { rank, physicsNotes, type Condition, type Focus } from "@/lib/rank.ts";
import type { FuelType } from "@/lib/data.ts";
import { psiFor, clip } from "@/lib/psi.ts";
import { predict } from "@/lib/predict.ts";

const SYSTEM = `You are a PhD student in combustion who works with NASA's microgravity data (PSI). A fellow engineer who is designing a habitat is asking you a question. Answer plainly and specifically, in English, in a professional register.

How to answer:
- 4 to 8 sentences of prose. No lists, no headings, no bold, no emoji.
- Write numbers as digits with units, like 34 %, 8.2 psi, 3.2 cm/s. Never spell them out.
- If the question is about whether something ignites, how much oxygen it takes, or what ventilation does, start with the [MODEL] prediction and do not contradict it. It is our own model, validated against partial-gravity tests.
- Use only the investigations in the context and cite them as [ID] right after the fact you take from them. If a number comes from the context, state the number.
- Lead with the answer. No introduction and no restating the question.
- Cite investigations by their "id" field (for example [FLEX-2], [BASS-II]), never by the PSI number.
- If no investigation covers the requested condition and the question is not answered by [MODEL] (low match, or outside the range in O₂, pressure, flow or gravity), say so first with "No data for this", then say what the closest data is and how far off it is. After that, propose the specific experiment that would be needed (fuel, O₂, pressure, flow).
- Explain the physics only when it changes the conclusion, for example O₂ diffusion, radiative loss, O₂ mole fraction versus partial pressure, ventilation flow, or buoyancy.
- End with one practical recommendation for prevention, detection or suppression. Do not summarize what you already said.
- Ranges in the context are approximate. If the answer depends on an exact number, say so in half a sentence.

Avoid em dashes (—), "not only... but also", reflexive lists of three, the words "crucial", "key", "fundamental", "delve", "in summary", "it is important to note", chains of -ing clauses, assistant phrases ("Great question!", "I hope this helps") and generic disclaimers. If you do not know something, say it is not in the data and stop there.`;

const words = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^\w\s-]/g, " ").split(/\s+/).filter((w) => w.length > 2);

const INTENTS: [RegExp, Focus, FuelType[]][] = [
  [/material|cabina|cabin|tela|fabric|plastic|solid|textil|textile|espuma|foam|cable|wiring/, "prevention", ["solid"]],
  [/humo|smoke|deteccion|detect|sensor|alarma|alarm|polvo|dust/, "detection", ["aerosol", "solid"]],
  [/supres|suppress|extin|apagar|put out|co2|helio|helium|niebla|mist|agua|water/, "suppression", ["liquid", "solid"]],
  [/gas|fuga|leak|propano|propane|metano|methane|hidrogeno|hydrogen/, "prevention", ["gas"]],
  [/gota|droplet|liquid|combustible|fuel|spray/, "suppression", ["liquid"]],
];

function retrieve(q: string, c: Condition) {
  const qn = words(q).join(" ");
  const qw = new Set(qn.split(" "));
  const intent = INTENTS.find(([re]) => re.test(qn));
  return rank(INVESTIGATIONS, c, intent?.[1] ?? "all")
    .map((r) => {
      const f = psiFor(r.inv.id).flight;
      const text = words(Object.values(r.inv).join(" ") + (f ? ` ${f.objective} ${f.hypothesis} ${f.keywords.join(" ")}` : ""));
      const hits = text.filter((w) => qw.has(w)).length;
      const fuelBoost = intent?.[2].includes(r.inv.fuelType) ? 0.5 : 0;
      return { ...r, hits, s: r.total + fuelBoost + Math.min(hits, 6) * 0.1 };
    })
    .sort((a, b) => b.s - a.s)
    .slice(0, 6);
}

async function askOpenAICompatible(prompt: string): Promise<[string, string]> {
  const base = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
  let last = "";
  const deadline = Date.now() + 25_000;
  for (const model of process.env.OPENAI_MODEL!.split(",").map((m) => m.trim()).filter(Boolean)) {
    const left = deadline - Date.now();
    if (left < 3_000) break;
    try {
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        signal: AbortSignal.timeout(Math.min(12_000, left)),
        headers: { "Content-Type": "application/json", ...(process.env.OPENAI_API_KEY ? { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } : {}) },
        body: JSON.stringify({
          model,
          max_tokens: 2000,
          ...(process.env.OPENAI_REASONING_EFFORT ? { reasoning_effort: process.env.OPENAI_REASONING_EFFORT } : {}),
          messages: [{ role: "system", content: SYSTEM }, { role: "user", content: prompt }],
        }),
      });
      if (res.ok) return [(await res.json()).choices[0].message.content as string, model];
      last = `${model}: ${res.status} ${(await res.text()).slice(0, 120)}`;
      if (![404, 429, 500, 502, 503].includes(res.status)) break;
    } catch (e) {
      last = `${model}: ${(e as Error).name === "TimeoutError" ? "timeout" : (e as Error).message}`;
    }
  }
  throw new Error(last || "no models available");
}

async function askClaude(prompt: string) {
  const client = new Anthropic();
  const msg = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low" },
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  if (msg.stop_reason === "refusal") return "The model could not answer this question.";
  return msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n");
}

function offline(q: string, hits: ReturnType<typeof retrieve>, c: Condition) {
  const top = hits.slice(0, 3);
  const weak = top[0].score < 0.6;
  return [
    weak
      ? `No data for this. No investigation in the atlas covers ${c.o2}% O₂ / ${c.pressure} psi / ${c.flow} cm/s. Closest matches:`
      : `Closest matches to ${c.o2}% O₂ / ${c.pressure} psi / ${c.flow} cm/s:`,
    ...top.map((h) => `[${h.inv.id}] (${Math.round(h.score * 100)} % match) ${h.inv.finding}`),
    ...physicsNotes(c).slice(0, 2),
  ].join("\n");
}

export async function POST(req: Request) {
  const { question, condition } = (await req.json()) as { question: string; condition: Condition };
  if (!question?.trim()) return Response.json({ error: "Empty question" }, { status: 400 });
  const hits = retrieve(question, condition);
  const context = hits.map((h) => ({
    id: h.inv.id, name: h.inv.name, fuel: h.inv.fuels, O2_pct: h.inv.o2, pressure_psi: h.inv.pressure,
    flow_cm_s: h.inv.flow, sensors: h.inv.sensors, finding: h.inv.finding, condition_match: +h.score.toFixed(2),
    ...(() => {
      const f = psiFor(h.inv.id).flight;
      return f ? { psi_record: { psi_number: f.psiId, doi: f.doi, nasa_objective: clip(f.objective, 500), nasa_hypothesis: clip(f.hypothesis, 400), nasa_approach: clip(f.approach, 500) } } : {};
    })(),
  }));
  const pr = predict(condition.o2, condition.flow, condition.gravity);
  const model = `Prediction from our own model (physics calibrated on BASS-II and validated against centrifuge tests). For PMMA, limiting oxygen for sustained burning is ${pr.limit[0].toFixed(1)} % (CI ${pr.limit[1].toFixed(1)}-${pr.limit[2].toFixed(1)}), probability that the flame is sustained is ${Math.round(pr.pBurn[0] * 100)} %, and ${Math.round(pr.pBurnVentCut[0] * 100)} % if ventilation is shut off. If you use it, cite it as [MODEL].`;
  const prompt = `Habitat condition: ${JSON.stringify(condition)}\n${model}\nPhysics notes: ${physicsNotes(condition).join(" ")}\nPSI context:\n${JSON.stringify(context, null, 1)}\n\nQuestion: ${question}`;
  const cited = hits.map((h) => h.inv.id);
  try {
    if (process.env.OPENAI_MODEL) { const [answer, model] = await askOpenAICompatible(prompt); return Response.json({ answer, engine: model, cited }); }
    if (process.env.ANTHROPIC_API_KEY) return Response.json({ answer: await askClaude(prompt), engine: "Claude Opus 5.5", cited });
  } catch (e) {
    return Response.json({ answer: offline(question, hits, condition), engine: `offline (LLM failed: ${(e as Error).message})`, cited });
  }
  return Response.json({ answer: offline(question, hits, condition), engine: "offline · local retrieval", cited });
}
