# NASA Space Apps 2026 · Project submission texts

Copy each block into the matching field of the Project page.

---

## Project Name

Flame in Freefall: Fire Atlas for Artemis Habitats

---

## High-Level Project Summary

Flame in Freefall is a web dashboard that answers one question for people designing Moon and Mars habitats: do we know how fire behaves in the air we are going to breathe there? Artemis habitats will use more oxygen and less pressure than Earth (about 34 % O₂ at 8.2 psi), which makes materials easier to ignite. We organized 19 NASA microgravity combustion investigations from the PSI repository by oxygen, pressure, airflow and fuel type, ranked them for each habitat, and showed where data is missing. The main gap: in PSI, no solid material was ever burned above 21 % O₂. We also trained our own model on NASA ISS data that predicts whether a cabin material keeps burning, and validated it on 16 partial-gravity tests it never saw (error of 0.16 points of O₂). It shows that cutting ventilation can smother a fire on the ISS but not on the Moon, where gravity keeps the air moving. An AI copilot explains the results in plain language and cites each investigation.

---

## Link to Project Demo

<!-- 7-slide deck (PDF in the GitHub repo, or Google Drive with "anyone with the link") -->
TODO: export the deck as PDF, save it as docs/demo-slides.pdf in the repo and paste: https://github.com/bvgori/flame-in-freefall/blob/main/docs/demo-slides.pdf

---

## Link to Final Project

https://flame-in-freefall-flax.vercel.app

Code, data and the ML notebook: https://github.com/bvgori/flame-in-freefall

---

## Detailed Project Description

**What it does**

Flame in Freefall walks the user through six steps:

1. **Where will you live?** Pick a habitat (ISS, lunar rover, lunar base, Mars habitat, spacesuit) or a past incident (Apollo 1, Apollo 13, Mir, Artemis II). Each one sets oxygen, pressure, ventilation and gravity.
2. **How does fire behave there?** An animated flame changes with the conditions: a sphere in microgravity, stretched upward with gravity. Three plain sentences explain why.
3. **Would something ignite?** Our model predicts the probability that a burning cabin material (PMMA, acrylic) keeps burning, the minimum oxygen needed for that, the margin of the habitat above that limit, and what happens if the ventilation is turned off. Each number has a 95 % interval.
4. **Does NASA have data for this?** For four fuel types (materials, liquids, gases, smoke) the dashboard says whether PSI has experiments near that atmosphere. A coverage map places every investigation by oxygen and pressure, next to the habitats.
5. **Which experiments matter most?** A ranking of the 19 investigations by closeness of test conditions and relevance to prevention, detection or suppression, with the official PSI record of each one (objective, hypothesis, DOI, publications).
6. **Ask.** A copilot answers free questions using the closest investigations and our model, and cites them by ID.

**Key findings**

- In the public PSI repository, every test with real solid materials ran at 21 % O₂ or less. The lunar base plans 34 %. NASA has run tests closer to those conditions (Saffire-V, Saffire-VI, SoFIE), but that data is not in PSI yet.
- In microgravity the most dangerous airflow is about 3.3 cm/s. On the Moon, gravity alone moves the air at about 3.2 cm/s, so a lunar habitat sits at the worst point of the curve. Partial-gravity tests confirm the minimum is near lunar gravity.
- Cutting ventilation drops the chance that a PMMA fire keeps burning to 36 % on the ISS, but it stays at 100 % on the Moon.
- To make PMMA non-flammable on the Moon, oxygen would have to drop below 13.8 %, which at 8.2 psi is about 7.8 kPa of O₂, less than half of what people breathe. Fire safety has to come from material choice, early detection and suppression.

**How the model works**

- Training data: NASA's published flammability boundary and 51 BASS-II tests on the ISS (Olson and Ferkul 2017).
- Exploratory analysis showed the tests are run right at the edge of the limit and are noisy: 11 nearly identical pairs have opposite outcomes, and even NASA's own curve classifies only 55 % of single tests correctly. So we predict the limit, not each test.
- Model: a physics-based boundary, limiting O₂ = A + B/u + C·u (radiative extinction at low flow, blowoff at high flow), plus a gravity term for the airflow that buoyancy creates. The gravity exponent was calibrated with leave-one-gravity-level-out cross-validation. A logistic link gives probabilities and Monte Carlo sampling gives intervals.
- External validation: 16 centrifuge tests at 0.04 to 1 g from a different study (Olson et al. 2024). Limit error 0.16 points of O₂, 13 of 16 tests classified correctly (XGBoost: 69 %, majority class: 56 %). At 1 g the model predicts 14.9 % O₂ against 15.0 to 15.4 % in the literature.
- We compared it with logistic regression and XGBoost. With this little and noisy data, the physics model with four parameters wins: XGBoost memorizes the noise and cannot extrapolate to 34 % O₂.

**Benefits**

Engineers and students can see in one place what NASA has measured, how close it is to a planned habitat, and where new experiments are needed (for example LUCI and FM2). It turns scattered PSI records into ranked, cited answers.

**What we hope to achieve**

That future PSI uploads (partial-gravity and high-oxygen tests) can be dropped into the same atlas and model, so the gaps close as data arrives. On Earth, the same approach applies to oxygen-enriched settings such as hospitals, submarines and aircraft.

**Tools**

Next.js 15, React 19 and TypeScript for the web app (hand-made SVG charts and canvas animations, no chart libraries), deployed on Vercel. Python with pandas, NumPy, SciPy, scikit-learn, XGBoost, matplotlib and Jupyter for the model. Google Gemini through an OpenAI-compatible API for the copilot, with an offline mode that works without it.

---

## Use of Super Intelligence (SI)

Yes. We used an AI coding assistant (Claude) to help write the web app and the analysis code, and to locate and extract published data points from public NASA papers. The team chose the challenge, the idea and the approach, reviewed the code and checked the data against the sources. The copilot inside the dashboard uses Google Gemini to turn our results and NASA records into plain-language answers; it is labeled in the app. The flammability prediction is our own physics-based model fit to NASA data, not an LLM. No AI-generated images, video or audio were used; the flame and planet visuals are drawn by our own code. This is also stated in the app footer and the README.

---

## NASA Data

- **NASA Physical Sciences Informatics (PSI), Combustion Science**: official investigation records (ISA-Tab metadata: objectives, hypotheses, approach, hardware, DOIs, publication lists) for BASS (PSI-26), BASS-II (PSI-25), FLEX (PSI-69), FLEX-2 (PSI-68), CFI (PSI-39), ACME BRE (PSI-20), ACME E-FIELD Flames (PSI-22), ACME s-Flame (PSI-23), SPICE (PSI-107), SLICE (PSI-106), SAFFIRE-I (PSI-98), SAFFIRE-II (PSI-99), SAME (PSI-102), DAFT/DAFT-2 (PSI-47) and the BASS modeling study PSI-62.
- **BASS-II flight data**: NASA/TM-20210011385, BASS-II Summary Report (flammability boundary and 51 microgravity tests on PMMA rods; SIBAL fabric tests).
- **A Researcher's Guide to International Space Station Combustion Science** (NASA, 2015) and NASA Combustion Science pages, for test conditions of each investigation.
- **NASA Technical Reports Server (NTRS)** papers for ACME, FLEX, SAME and Saffire.
- Challenge resources: Apollo 1, Apollo 13 and Mir fire histories; NASA spinoffs (fire detector, firefighter air tanks and clothing, water mist).

---

## Space Agency Partner Data and Other References

**Data and papers**
- Olson S.L., Ferkul P.V. "Microgravity flammability boundary for PMMA rods in axial stagnation flow." Combustion and Flame 180 (2017) 217-229. doi:10.1016/j.combustflame.2017.03.001
- Olson S.L., Ferkul P.V. et al. BASS-II Summary Report, NASA/TM-20210011385 (2021).
- Olson S.L. et al. Partial-gravity flammability of PMMA rods in centrifuge tests, Fire Safety Journal (2024).
- Hirsch D. et al., ASTM STP 1454 (2003); Halli Y., T'ien J.S., NBS-GCR-86-507 (1986): normal-gravity PMMA limits.
- NASA Exploration Atmospheres Working Group: 8.2 psi / 34 % O₂ exploration atmosphere.
- No Space Agency Partner datasets were used.

**Software and services**
- Next.js, React, TypeScript, Vercel (hosting).
- Python, pandas, NumPy, SciPy, scikit-learn, XGBoost, matplotlib, Jupyter, jupytext.
- Google Gemini API (copilot answers).
- Fonts: Unbounded, Inter, JetBrains Mono (Google Fonts, Open Font License).
- AI coding assistant: Claude (Anthropic).
