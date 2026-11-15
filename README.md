# Flame in Freefall · Atlas de inflamabilidad

Dashboard para NASA Space Apps 2026. Ubica cada investigación de combustión de PSI en el espacio O₂ × presión × flujo, la compara con los hábitats de Artemis (base lunar, rover, Marte, traje) y con incidentes reales, rankea las investigaciones relevantes y muestra **dónde faltan datos**.

## Correr

```bash
npm install
npm run dev        # http://localhost:3000
npm run check      # self-check del ranking
```

### IA (opcional)
El copiloto usa cualquier API compatible con OpenAI: ChatGPT, Gemini (gratis), Groq (gratis) u Ollama local. Copiá `.env.example` a `.env.local` y descomentá una opción. Sin nada configurado responde en modo offline con recuperación local.

## Deploy (Vercel, gratis)
1. Subir el repo a GitHub (`.env.local` no se sube).
2. Importarlo en vercel.com, sin configuración extra.
3. En Settings → Environment Variables cargar `OPENAI_BASE_URL`, `OPENAI_API_KEY` y `OPENAI_MODEL` (ver `.env.example`).
4. Redeploy.

## Datos
- `lib/data.ts`: 19 investigaciones (16 listadas en PSI y 3 ACME mencionadas en el reto) más 9 escenarios. **Los rangos numéricos son aproximados**, recopilados de documentación pública. Hay que reemplazarlos por las matrices de ensayo de PSI.
- `lib/rank.ts`: puntaje = 70 % cercanía gaussiana (O₂ escala 10 pts, presión escala ½ octava, flujo escala 20 cm/s) + 30 % relevancia (prevención, detección, supresión 0–3). Cobertura: ≥ 0.6 cubierto, ≥ 0.2 parcial y el resto brecha.

## Pitch 30 s
> NASA propone que la base lunar tenga 34 % de oxígeno a 8 psi. En esa atmósfera las cosas se prenden mucho más fácil que en el aire. Y la pregunta que nos hicimos fue: ¿alguien probó cómo se quema algo ahí, en microgravedad? Juntamos los experimentos de fuego de NASA en un mapa de oxígeno y presión. Y en los datos públicos de PSI, los sólidos, que es de lo que está hecha una nave, solo se probaron con aire normal o menos oxígeno.

## Guion 2 min
**[0:00 Problema]**
En 1967 se prendió fuego la cápsula del Apollo 1 en la plataforma y murieron los tres astronautas. En 1997 hubo un incendio en la Mir. Y este año sonó una alarma de humo en Orion, en Artemis II. En una nave no podés abrir la puerta y salir.

**[0:20 Datos]**
NASA tiene muchos datos de fuego en microgravedad. Están en el repositorio PSI, experimentos de la ISS como BASS, FLEX, ACME, SAME y Saffire. El problema es que cada uno está en su formato. Nosotros tomamos 19 investigaciones y para cada una anotamos el combustible, el rango de oxígeno, la presión, el flujo de aire, los sensores y qué encontraron.

**[0:40 Demo]**
Les muestro. Elijo "Base lunar". Acá ven el mapa: cada caja es lo que ensayó un experimento, y el rombo es la base. Al costado está, por tipo de combustible, si hay datos cerca o no. Abajo, el ranking de qué experimentos sirven para esta atmósfera, y pueden ver por qué cada uno quedó donde quedó. Le pregunto al copiloto qué materiales son más riesgosos, y contesta citando cada experimento por su ID. Ahora elijo Apollo 1, y se ve en qué condiciones fue ese incendio comparado con lo que se midió después.

**[1:10 Resultado]**
Lo que encontramos: las condiciones de la ISS están bien cubiertas. En la zona de Artemis, para sólidos y humo no hay datos en PSI. NASA ya los midió en Saffire-V, Saffire-VI y SoFIE, pero todavía no los publicó ahí. Para gases hay algo, gracias a ACME. Y hay un dato que nos llamó la atención: BASS mostró que en microgravedad algunos materiales queman con menos oxígeno del que indica el ensayo estándar que se hace en la Tierra. O sea que ese ensayo puede no alcanzar.

**[1:35 Para qué sirve]**
Esto sirve para decidir qué experimento hacer primero, por ejemplo Saffire con más oxígeno, o LUCI y FM2. Y le sirve a quien elige materiales y sensores para un hábitat. Y en la Tierra, mucho de esto ya volvió en forma de detectores de humo y equipo para bomberos. Gracias.

## Pendiente
- [x] Fichas oficiales PSI (ISA-Tab) de BASS, BASS-II, FLEX, FLEX-2, Saffire I/II, SAME y PSI-62: `python3 -I scripts/ingest_psi.py "<carpeta con los zips>"` genera `lib/psi-metadata.json`.
- [ ] Fichas que faltan: ACME (BRE, S-Flames, E-FIELD), CFI, SPICE, SLICE, SAME-R, Saffire-III, DAFT.
- [ ] Agregar datos reales: velocidad de propagación vs. flujo (BASS) y diámetro de extinción (FLEX) como gráficos de detalle.
- [ ] Video de 2 min y slides.
