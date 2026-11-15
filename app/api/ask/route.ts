import Anthropic from "@anthropic-ai/sdk";
import { INVESTIGATIONS } from "@/lib/data.ts";
import { rank, physicsNotes, type Condition, type Focus } from "@/lib/rank.ts";
import type { FuelType } from "@/lib/data.ts";
import { psiFor, clip } from "@/lib/psi.ts";

const SYSTEM = `Sos estudiante de doctorado en combustión en una universidad argentina y trabajás con los datos de microgravedad de NASA (PSI). Te consulta un colega ingeniero que está diseñando un hábitat. Le contestás como en un pasillo del laboratorio: directo, concreto, en español rioplatense con voseo, sin formalidades.

Cómo responder:
- Entre 4 y 8 oraciones, en prosa. Sin listas, sin títulos, sin negritas, sin emojis.
- Usá solo las investigaciones del contexto y citalas como [ID] justo después del dato que sacás de ellas. Si un número viene del contexto, decí el número.
- Arrancá por la respuesta. Nada de introducción ni de repetir la pregunta.
- Si ninguna investigación cubre la condición pedida (coincidencia baja o fuera de rango en O₂, presión, flujo o gravedad), decilo de entrada: "No hay datos para esto" y explicá qué es lo más cercano y cuán lejos queda. Después proponé el experimento concreto que haría falta (combustible, O₂, presión, flujo).
- Explicá el porqué físico solo si cambia la conclusión: difusión de O₂, pérdida radiativa, fracción molar de O₂ contra presión parcial, flujo de ventilación, flotación.
- Cerrá con una sola recomendación práctica de prevención, detección o supresión. No resumas lo que ya dijiste.
- Los rangos del contexto son aproximados. Si la respuesta depende de un número exacto, aclaralo en media frase.

Evitá: guiones largos (—), "no solo… sino también", listas de tres por costumbre, "crucial", "clave", "fundamental", "cabe destacar", "es importante", "en resumen", "en este sentido", "a la hora de", "de cara a", gerundios encadenados, frases de asistente ("¡Buena pregunta!", "Espero que te sirva") y advertencias genéricas. Si no sabés algo, decí que no está en los datos y listo.`;

const words = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^\w\s-]/g, " ").split(/\s+/).filter((w) => w.length > 2);

const INTENTS: [RegExp, Focus, FuelType[]][] = [
  [/material|cabina|tela|plastic|solid|textil|espuma|cable/, "prevention", ["solid"]],
  [/humo|deteccion|detector|sensor|alarma|polvo/, "detection", ["aerosol", "solid"]],
  [/supres|extin|apagar|co2|helio|niebla|agua/, "suppression", ["liquid", "solid"]],
  [/gas|fuga|propano|metano|hidrogeno/, "prevention", ["gas"]],
  [/gota|liquid|combustible|spray/, "suppression", ["liquid"]],
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
  for (const model of process.env.OPENAI_MODEL!.split(",").map((m) => m.trim()).filter(Boolean)) {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(process.env.OPENAI_API_KEY ? { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } : {}) },
      body: JSON.stringify({ model, messages: [{ role: "system", content: SYSTEM }, { role: "user", content: prompt }] }),
    });
    if (res.ok) return [(await res.json()).choices[0].message.content as string, model];
    last = `${model}: ${res.status} ${(await res.text()).slice(0, 120)}`;
    if (![404, 429, 500, 502, 503].includes(res.status)) break;
  }
  throw new Error(last);
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
  if (msg.stop_reason === "refusal") return "El modelo no pudo responder esta consulta.";
  return msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n");
}

function offline(q: string, hits: ReturnType<typeof retrieve>, c: Condition) {
  const top = hits.slice(0, 3);
  const weak = top[0].score < 0.6;
  return [
    weak
      ? `No hay datos: ninguna investigación del atlas cubre ${c.o2}% O₂ / ${c.pressure} psi / ${c.flow} cm/s. Lo más cercano:`
      : `Lo más cercano a ${c.o2}% O₂ / ${c.pressure} psi / ${c.flow} cm/s:`,
    ...top.map((h) => `[${h.inv.id}] (${Math.round(h.score * 100)} % de coincidencia) ${h.inv.finding}`),
    ...physicsNotes(c).slice(0, 2),
  ].join("\n");
}

export async function POST(req: Request) {
  const { question, condition } = (await req.json()) as { question: string; condition: Condition };
  if (!question?.trim()) return Response.json({ error: "Pregunta vacía" }, { status: 400 });
  const hits = retrieve(question, condition);
  const context = hits.map((h) => ({
    id: h.inv.id, nombre: h.inv.name, combustible: h.inv.fuels, O2_pct: h.inv.o2, presion_psi: h.inv.pressure,
    flujo_cm_s: h.inv.flow, sensores: h.inv.sensors, hallazgo: h.inv.finding, coincidencia_condicion: +h.score.toFixed(2),
    ...(() => {
      const f = psiFor(h.inv.id).flight;
      return f ? { ficha_psi: { id: f.psiId, doi: f.doi, objetivo_nasa: clip(f.objective, 500), hipotesis_nasa: clip(f.hypothesis, 400), enfoque_nasa: clip(f.approach, 500) } } : {};
    })(),
  }));
  const prompt = `Condición del hábitat: ${JSON.stringify(condition)}\nNotas físicas: ${physicsNotes(condition).join(" ")}\nContexto PSI:\n${JSON.stringify(context, null, 1)}\n\nPregunta: ${question}`;
  const cited = hits.map((h) => h.inv.id);
  try {
    if (process.env.OPENAI_MODEL) { const [answer, model] = await askOpenAICompatible(prompt); return Response.json({ answer, engine: model, cited }); }
    if (process.env.ANTHROPIC_API_KEY) return Response.json({ answer: await askClaude(prompt), engine: "Claude Opus 5.5", cited });
  } catch (e) {
    return Response.json({ answer: offline(question, hits, condition), engine: `offline (LLM falló: ${(e as Error).message})`, cited });
  }
  return Response.json({ answer: offline(question, hits, condition), engine: "offline · recuperación local", cited });
}
