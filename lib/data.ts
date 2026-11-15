export type FuelType = "solid" | "liquid" | "gas" | "aerosol";
export type Range = [number, number];

export type Investigation = {
  id: string;
  name: string;
  family: string;
  hardware: string;
  fuelType: FuelType;
  fuels: string;
  geometry: string;
  o2: Range;
  pressure: Range;
  flow: Range;
  diluents?: string;
  sensors: string;
  objective: string;
  finding: string;
  relevance: { prevention: number; detection: number; suppression: number };
  earth?: string;
  gravityProxy?: boolean;
  inPsi: boolean;
  source?: string;
};

export const INVESTIGATIONS: Investigation[] = [
  {
    id: "FLEX", name: "Flame Extinguishment Experiment", family: "MDCA droplets", hardware: "CIR · MDCA",
    fuelType: "liquid", fuels: "n-heptane, methanol", geometry: "Free droplet ~3 mm (1.5–5 mm)",
    o2: [14, 40], pressure: [7.3, 22], flow: [0, 0], diluents: "CO₂, He, SF₆",
    sensors: "Backlit video (droplet diameter), OH* camera, radiometers",
    objective: "Find the diluent concentrations (CO₂, He, SF₆) that extinguish flames in µg, to choose the ISS suppressant.",
    finding: "The limiting oxygen index in µg came out well below the 1g value. Large heptane droplets also kept burning as cool flames, with no visible flame, after radiative extinction of the hot flame. No model had predicted this.",
    relevance: { prevention: 2, detection: 1, suppression: 3 },
    earth: "Low-temperature chemistry for HCCI engines and suppression by dilution",
    inPsi: true,
    source: "https://ntrs.nasa.gov/citations/20140006750",
  },
  {
    id: "FLEX-2", name: "Flame Extinguishment Experiment-2", family: "MDCA droplets", hardware: "CIR · MDCA",
    fuelType: "liquid", fuels: "n-heptane, n-octane, n-decane, blends, real-fuel surrogates, alcohols", geometry: "Free droplets, tethered droplets and droplet arrays",
    o2: [10, 40], pressure: [7.3, 44], flow: [0, 5], diluents: "N₂, CO₂, He",
    sensors: "Backlit and color video, OH* camera, radiometers",
    objective: "Measure blend combustion, the effect of slow flow and flame spread between droplets.",
    finding: "Measured combustion of blends and real-fuel surrogates, soot as a function of diluent, and flame spread between neighboring droplets. The last one matters for a spray fire in a cabin.",
    relevance: { prevention: 2, detection: 1, suppression: 2 },
    earth: "Surrogate blends for modeling aviation fuel",
    inPsi: true,
    source: "https://www.nasa.gov/sites/default/files/atoms/files/np-2015-10-034-jsc_combustion_in_reduced_gravity-iss-mini-book-011116-508.pdf",
  },
  {
    id: "CFI", name: "Cool Flames Investigation", family: "MDCA droplets", hardware: "CIR · MDCA",
    fuelType: "liquid", fuels: "n-dodecane, farnesane, n-dodecane/iso-dodecane blends", geometry: "Free droplet or fiber-tethered droplet",
    o2: [15, 40], pressure: [14.7, 44], flow: [0, 0], diluents: "N₂, CO₂, He",
    sensors: "Backlit video, intensified camera, radiometers",
    objective: "Characterize cool flames (~600 K) on droplets at different pressures and O₂ levels.",
    finding: "At elevated pressure and with He instead of N₂, large n-dodecane droplets go through several stages of cool and warm flame. The cool flame emits almost no light, even for the intensified camera. That is a problem for optical detection.",
    relevance: { prevention: 2, detection: 2, suppression: 1 },
    earth: "Engine autoignition (knock)",
    inPsi: true,
    source: "https://ntrs.nasa.gov/citations/20190002838",
  },
  {
    id: "ACME-BRE", name: "ACME Burning Rate Emulator", family: "ACME", hardware: "CIR · ACME",
    fuelType: "gas", fuels: "C₂H₄ / CH₄ diluted with N₂ (emulating a solid)", geometry: "Flat porous burner, 25 and 50 mm",
    o2: [21, 40], pressure: [8.3, 14.7], flow: [0, 0],
    sensors: "Heat flux gauges, thermocouples, color video",
    objective: "Emulate burning materials with gaseous fuel to measure flammability in quiescent atmosphere as a function of material properties.",
    finding: "In quiescent air, flames self-extinguished below ~25 % O₂. At 26.5, 34 and 40 % O₂ some burned for several minutes with no flow. It produced a flammability map in terms of heat of combustion and heat of gasification. Note that this is a gaseous fuel emulating a solid, not a real material.",
    relevance: { prevention: 3, detection: 1, suppression: 1 },
    inPsi: true,
    source: "https://ntrs.nasa.gov/citations/20210022542",
  },
  {
    id: "ACME-EFIELD", name: "ACME E-FIELD Flames", family: "ACME", hardware: "CIR · ACME",
    fuelType: "gas", fuels: "Diluted CH₄ / C₂H₄", geometry: "Jet or coflow flame with high-voltage mesh (up to 10 kV)",
    o2: [21, 21], pressure: [14.7, 14.7], flow: [5, 50],
    sensors: "Color video, ion current, thermocouples",
    objective: "See how an electric field acts on the ions in the flame.",
    finding: "Ion current tracks flame luminosity and intensity. Weak fields stabilize highly diluted flames. The ionic wind pushes the gas in a way similar to buoyancy, but it does not reproduce partial gravity. It is the closest thing to a proxy in PSI.",
    relevance: { prevention: 2, detection: 0, suppression: 1 },
    gravityProxy: true,
    inPsi: true,
    source: "https://ntrs.nasa.gov/citations/20210022542",
  },
  {
    id: "ACME-SFLAME", name: "ACME s-Flame", family: "ACME", hardware: "CIR · ACME",
    fuelType: "gas", fuels: "H₂, CH₄ and C₂H₄ diluted with N₂ or He", geometry: "Spherical porous burner",
    o2: [16, 40], pressure: [7.3, 20.6], flow: [0, 0],
    sensors: "Color video, radiometers, thin filament pyrometry (TFP), thermocouples",
    objective: "Study the structure and extinction of spherical diffusion flames.",
    finding: "Two extinction modes were observed. At high flow rate the flame grows and goes out by radiative loss. At low flow rate it goes out by kinetics, close to the burner. With He as diluent the limits shift.",
    relevance: { prevention: 2, detection: 1, suppression: 2 },
    inPsi: true,
    source: "https://ntrs.nasa.gov/citations/20210022542",
  },
  {
    id: "ACME-FD", name: "ACME Flame Design", family: "ACME", hardware: "CIR · ACME",
    fuelType: "gas", fuels: "Diluted C₂H₄ / CH₄", geometry: "Spherical burner, normal flames (inverse flames planned)",
    o2: [21, 40], pressure: [14.7, 14.7], flow: [0, 0],
    sensors: "Color video, radiometers, thermocouples",
    objective: "Design soot-free flames by controlling flame structure.",
    finding: "Flame size grows with flow rate and shrinks with more ambient O₂. Large flames grow until they go out by radiation, with oscillations before extinction. Useful for understanding soot, smoke and radiation.",
    relevance: { prevention: 1, detection: 2, suppression: 0 },
    inPsi: false,
    source: "https://ntrs.nasa.gov/citations/20210022542",
  },
  {
    id: "ACME-CLD", name: "ACME Coflow Laminar Diffusion Flame", family: "ACME", hardware: "CIR · ACME",
    fuelType: "gas", fuels: "CH₄ / C₂H₄", geometry: "Laminar coflow flame",
    o2: [21, 21], pressure: [7.3, 14.7], flow: [5, 60],
    sensors: "Color video, soot pyrometry",
    objective: "Measure the structure and soot of coflow flames to validate models.",
    finding: "Sooting flames in µg are taller and wider, and carry 5 to 8 times more soot than equivalent flames in 1g. µg extends the fuel dilution limit.",
    relevance: { prevention: 1, detection: 1, suppression: 0 },
    inPsi: false,
    source: "https://ntrs.nasa.gov/citations/20210022542",
  },
  {
    id: "ACME-CFIG", name: "ACME Cool Flames Investigation with Gases", family: "ACME", hardware: "CIR · ACME",
    fuelType: "gas", fuels: "Ethane, propane, n-butane diluted with N₂", geometry: "6.35 mm spherical porous burner, normal and inverse flames",
    o2: [12, 85], pressure: [6.7, 44], flow: [0, 0], diluents: "N₂",
    sensors: "Intensified video, radiometers, thermocouples",
    objective: "Produce spherical cool flames with gaseous fuel.",
    finding: "First burner-supported spherical cool flames, only with n-butane at 2 bar and 39 % ambient O₂. Ambient O₂ went up to 40 %. The 85 % figure is O₂ issuing from the burner in inverse flames, not the atmosphere. Even so, it is the µg data point closest to an O₂ leak.",
    relevance: { prevention: 3, detection: 1, suppression: 0 },
    inPsi: false,
    source: "https://par.nsf.gov/servlets/purl/10426596",
  },
  {
    id: "BASS", name: "Burning and Suppression of Solids", family: "SPICE duct", hardware: "MSG · SPICE duct",
    fuelType: "solid", fuels: "PMMA, cotton-fiberglass fabric, porous wax, candles", geometry: "Flat samples, PMMA spheres, slabs, candles",
    o2: [21, 21], pressure: [14.7, 14.7], flow: [0, 40], diluents: "N₂ (local suppression jet)",
    sensors: "Color video, thermocouples, radiometer",
    objective: "Measure flame spread and extinction over solids as a function of flow and O₂.",
    finding: "The flame responds very quickly to changes in flow. A local N₂ jet may fail to extinguish it and can even intensify it, because it entrains fresh air toward the flame.",
    relevance: { prevention: 3, detection: 1, suppression: 2 },
    earth: "Material flammability standards, aircraft cabin testing",
    inPsi: true,
    source: "https://www.nasa.gov/sites/default/files/atoms/files/np-2015-10-034-jsc_combustion_in_reduced_gravity-iss-mini-book-011116-508.pdf",
  },
  {
    id: "BASS-II", name: "Burning and Suppression of Solids-II", family: "SPICE duct", hardware: "MSG · SPICE duct",
    fuelType: "solid", fuels: "PMMA (0.125–5 mm), cotton-fiberglass fabric", geometry: "Sheets, rods, spherical sections, films, fabric",
    o2: [14, 21], pressure: [14.7, 14.7], flow: [0, 40], diluents: "N₂ (dilution of the MSG volume)",
    sensors: "Color video, radiometer, O₂/CO (CSA-CP) and CO₂ (CDM)",
    objective: "Build extinction maps as a function of flow velocity and O₂.",
    finding: "At low ventilation, some materials burned in µg at lower O₂ than in 1g (PMMA 17 % vs 18 %). The NASA-STD-6001 Test 1 may not be conservative in space. Flame spread was fastest at an intermediate flow.",
    relevance: { prevention: 3, detection: 1, suppression: 3 },
    earth: "Ventilation design and flow shutoff as suppression",
    inPsi: true,
    source: "https://doi.org/10.60555/4qc4-de67",
  },
  {
    id: "SPICE", name: "Smoke Point In Co-flow Experiment", family: "SPICE duct", hardware: "MSG · SPICE duct",
    fuelType: "gas", fuels: "Ethylene, propane, propylene, ethane, methane", geometry: "Coflow jet, 0.41–1.6 mm burners",
    o2: [21, 21], pressure: [14.7, 14.7], flow: [5, 65],
    sensors: "Color video",
    objective: "Measure the smoke point of laminar flames in µg.",
    finding: "More than 100 smoke points measured in µg. Flame length at the smoke point grows with coflow and drops with burner diameter. The sooting tendency ranking of ethylene and propane is reversed relative to 1g.",
    relevance: { prevention: 1, detection: 3, suppression: 0 },
    inPsi: true,
    source: "https://drum.lib.umd.edu/handle/1903/13569",
  },
  {
    id: "SLICE", name: "Structure & Liftoff In Combustion Experiment", family: "SPICE duct", hardware: "MSG · SPICE duct",
    fuelType: "gas", fuels: "Pure methane and methane diluted with N₂", geometry: "Coflow jet",
    o2: [21, 21], pressure: [14.7, 14.7], flow: [5, 70],
    sensors: "Color video",
    objective: "Measure liftoff and blowoff of jet flames.",
    finding: "In µg flames stay lifted over a wider range of conditions than in 1g. Fuel flow rate has more effect on flame shape than dilution does. This is relevant to pressurized gas leaks in a cabin.",
    relevance: { prevention: 2, detection: 0, suppression: 1 },
    inPsi: true,
    source: "https://ntrs.nasa.gov/citations/20150002322",
  },
  {
    id: "SAFFIRE-I", name: "Spacecraft Fire Experiment-I", family: "Saffire", hardware: "Cygnus (after leaving the ISS)",
    fuelType: "solid", fuels: "SIBAL (75 % cotton, 25 % fiberglass) ~94×40 cm", geometry: "Large sheet, concurrent flow",
    o2: [21, 21], pressure: [14.7, 14.7], flow: [20, 20],
    sensors: "Video, thermocouples, radiometers, O₂/CO₂/CO",
    objective: "First large-scale fire in a spacecraft.",
    finding: "First full-scale fire inside a spacecraft. Flame spread and combustion products were measured across the cabin volume.",
    relevance: { prevention: 3, detection: 3, suppression: 1 },
    earth: "Validation of fire models for enclosed spaces",
    inPsi: true,
  },
  {
    id: "SAFFIRE-II", name: "Spacecraft Fire Experiment-II", family: "Saffire", hardware: "Cygnus (after leaving the ISS)",
    fuelType: "solid", fuels: "9 samples: SIBAL, silicone, structural PMMA, flat PMMA, PMMA with Nomex", geometry: "5×29 cm samples, concurrent or opposed flow",
    o2: [21, 21], pressure: [14.7, 14.7], flow: [20, 30],
    sensors: "Video, thermocouples, O₂/CO₂/CO",
    objective: "Ignition and flammability of real cabin materials.",
    finding: "Compares the flammability of real spacecraft materials in µg with ground test results.",
    relevance: { prevention: 3, detection: 2, suppression: 1 },
    inPsi: true,
  },
  {
    id: "SAFFIRE-III", name: "Spacecraft Fire Experiment-III", family: "Saffire", hardware: "Cygnus (after leaving the ISS)",
    fuelType: "solid", fuels: "SIBAL", geometry: "Large sheet",
    o2: [21, 21], pressure: [14.7, 14.7], flow: [20, 20],
    sensors: "Video, thermocouples, O₂/CO₂/CO",
    objective: "Repeat and extend Saffire-I at large scale.",
    finding: "Second large-scale test on fabric. Adds flame spread and combustion product data for sizing CO and CO₂ sensors.",
    relevance: { prevention: 3, detection: 3, suppression: 1 },
    inPsi: true,
  },
  {
    id: "SAME", name: "Smoke Aerosol Measurement Experiment", family: "SAME", hardware: "MSG",
    fuelType: "aerosol", fuels: "Teflon, Kapton, silicone rubber, cellulose, DBP (overheated, no flame)", geometry: "Heated samples, aging chamber 10–1800 s",
    o2: [21, 21], pressure: [14.7, 14.7], flow: [0, 10],
    sensors: "P-Trak (number), DustTrak (mass), ionization chamber, thermophoretic sampling for TEM",
    objective: "Measure smoke particle size and number in µg.",
    finding: "Smoke particles were expected to be larger in µg. A large share of the measured particles were below 500 nm, while the ISS detector is most sensitive to particles above 1 µm. The data help set requirements for future detectors.",
    relevance: { prevention: 0, detection: 3, suppression: 0 },
    earth: "Smoke detectors with fewer false alarms",
    inPsi: true,
    source: "https://doi.org/10.60555/gd4k-8h62",
  },
  {
    id: "SAME-R", name: "Smoke Aerosol Measurement Experiment Reflight", family: "SAME", hardware: "MSG",
    fuelType: "aerosol", fuels: "Cabin materials (pyrolysis)", geometry: "Heated samples",
    o2: [21, 21], pressure: [14.7, 14.7], flow: [0, 10],
    sensors: "P-Trak, DustTrak, ionization chamber, TEM sampling",
    objective: "Repeat SAME on Expedition 24 (2010) with samples for microscopy.",
    finding: "Added particle shape and size data for fresh and aged smoke. The data help choose detector type and threshold.",
    relevance: { prevention: 0, detection: 3, suppression: 0 },
    earth: "Early detection in buildings and mining",
    inPsi: true,
    source: "https://ntrs.nasa.gov/citations/20130000422",
  },
  {
    id: "DAFT", name: "Dust and Aerosol Measurement Feasibility Test (1 and 2)", family: "SAME", hardware: "ISS cabin",
    fuelType: "aerosol", fuels: "Ambient dust (no combustion)", geometry: "—",
    o2: [21, 21], pressure: [14.7, 14.7], flow: [5, 20],
    sensors: "P-Trak (same instrument as SAME)",
    objective: "Measure ambient dust on the ISS with the smoke instrument.",
    finding: "Sets the dust background a detector has to ignore to avoid false alarms. On the Moon, regolith adds much more dust.",
    relevance: { prevention: 0, detection: 3, suppression: 0 },
    earth: "Smoke/dust discrimination in mining",
    inPsi: true,
  },
];

export type Scenario = {
  id: string;
  name: string;
  kind: "habitat" | "incident";
  o2: number;
  pressure: number;
  flow: number;
  gravity: number;
  note: string;
};

export const SCENARIOS: Scenario[] = [
  { id: "iss", name: "ISS / Orion", kind: "habitat", o2: 21, pressure: 14.7, flow: 10, gravity: 0,
    note: "Sea-level air. Forced ventilation takes the place of buoyancy." },
  { id: "rover", name: "Pressurized lunar rover", kind: "habitat", o2: 30, pressure: 10.2, flow: 5, gravity: 0.16,
    note: "Challenge values of O₂ ≥ 30 % and pressure ≤ 10.2 psi, to shorten prebreathe before EVAs." },
  { id: "moonbase", name: "Lunar base (exploration atm.)", kind: "habitat", o2: 34, pressure: 8.2, flow: 5, gravity: 0.16,
    note: "Exploration atmosphere proposed by NASA, 8.2 psi and 34 % O₂." },
  { id: "mars", name: "Mars habitat", kind: "habitat", o2: 34, pressure: 8.2, flow: 5, gravity: 0.38,
    note: "Assumes the same exploration atmosphere, with 0.38 g gravity." },
  { id: "suit", name: "Spacesuit", kind: "habitat", o2: 100, pressure: 4.3, flow: 2, gravity: 0,
    note: "100 % O₂ a 4.3 psi." },
  { id: "apollo1", name: "Apollo 1 (1967)", kind: "incident", o2: 100, pressure: 16.7, flow: 0, gravity: 1,
    note: "Pad test with 100 % O₂ above ambient pressure. The most likely cause was an arc in damaged wiring that ignited cabin materials. All 3 crew members died. Afterward NASA moved to an N₂/O₂ atmosphere at launch and to controlled cabin materials." },
  { id: "apollo13", name: "Apollo 13 (1970)", kind: "incident", o2: 100, pressure: 5, flow: 0, gravity: 0,
    note: "Cabin at 100 % O₂ and 5 psi. The failure happened inside a supercritical O₂ tank, at hundreds of psi and outside this chart, from damaged wire insulation and a fan. Wiring in pure O₂ is an ignition source." },
  { id: "mir", name: "Mir (1997)", kind: "incident", o2: 21, pressure: 14.7, flow: 10, gravity: 0,
    note: "A chemical O₂ generator (lithium perchlorate candle) caught fire. There was local O₂ enrichment and dense smoke. An O₂ source can also be an ignition source, and the smoke kept the crew from reaching the fire." },
  { id: "artemis2", name: "Artemis II (smoke alarm)", kind: "incident", o2: 21, pressure: 14.7, flow: 10, gravity: 0,
    note: "A smoke alarm went off on Orion during the flight. When returning to Earth takes days, detection has to be early and free of false alarms." },
];

export const FUEL_LABEL: Record<FuelType, string> = {
  solid: "Solids (materials)",
  liquid: "Liquids (droplets)",
  gas: "Gases (flames)",
  aerosol: "Smoke / aerosol",
};
