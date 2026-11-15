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
    fuelType: "liquid", fuels: "n-heptano, metanol", geometry: "Gota libre ~3 mm (1.5–5 mm)",
    o2: [14, 40], pressure: [7.3, 22], flow: [0, 0], diluents: "CO₂, He, SF₆",
    sensors: "Video a contraluz (diámetro de gota), cámara OH*, radiómetros",
    objective: "Encontrar las concentraciones de diluyente (CO₂, He, SF₆) que extinguen llamas en µg para elegir el supresor de la ISS.",
    finding: "El índice límite de O₂ en µg salió bastante más bajo que en 1g. Además, las gotas grandes de heptano siguieron quemando como llama fría, sin llama visible, después de la extinción radiativa de la llama caliente. Ningún modelo lo había previsto.",
    relevance: { prevention: 2, detection: 1, suppression: 3 },
    earth: "Química de baja temperatura para motores HCCI y supresión por dilución",
    inPsi: true,
    source: "https://ntrs.nasa.gov/citations/20140006750",
  },
  {
    id: "FLEX-2", name: "Flame Extinguishment Experiment-2", family: "MDCA droplets", hardware: "CIR · MDCA",
    fuelType: "liquid", fuels: "n-heptano, n-octano, n-decano, mezclas, sustitutos de combustibles reales, alcoholes", geometry: "Gotas libres, ancladas y arreglos de gotas",
    o2: [10, 40], pressure: [7.3, 44], flow: [0, 5], diluents: "N₂, CO₂, He",
    sensors: "Video a contraluz y color, cámara OH*, radiómetros",
    objective: "Medir la combustión de mezclas, el efecto de flujo lento y la propagación de llama entre gotas.",
    finding: "Midió la combustión de mezclas y sustitutos de combustibles reales, el hollín según el diluyente y la propagación de llama entre gotas vecinas. Esto último importa para un incendio de spray en cabina.",
    relevance: { prevention: 2, detection: 1, suppression: 2 },
    earth: "Mezclas sustitutas para modelar combustible de aviación",
    inPsi: true,
    source: "https://www.nasa.gov/sites/default/files/atoms/files/np-2015-10-034-jsc_combustion_in_reduced_gravity-iss-mini-book-011116-508.pdf",
  },
  {
    id: "CFI", name: "Cool Flames Investigation", family: "MDCA droplets", hardware: "CIR · MDCA",
    fuelType: "liquid", fuels: "n-dodecano, farnesano, mezclas n-dodecano/iso-dodecano", geometry: "Gota libre o anclada en fibra",
    o2: [15, 40], pressure: [14.7, 44], flow: [0, 0], diluents: "N₂, CO₂, He",
    sensors: "Video a contraluz, cámara intensificada, radiómetros",
    objective: "Caracterizar llamas frías (~600 K) en gotas a distintas presiones y niveles de O₂.",
    finding: "Con presión elevada y He en lugar de N₂, las gotas grandes de n-dodecano pasan por varias etapas de llama fría y llama tibia. La llama fría casi no emite luz, ni siquiera para la cámara intensificada. Eso es un problema para la detección óptica.",
    relevance: { prevention: 2, detection: 2, suppression: 1 },
    earth: "Autoignición en motores (knock)",
    inPsi: true,
    source: "https://ntrs.nasa.gov/citations/20190002838",
  },
  {
    id: "ACME-BRE", name: "ACME Burning Rate Emulator", family: "ACME", hardware: "CIR · ACME",
    fuelType: "gas", fuels: "C₂H₄ / CH₄ diluidos con N₂ (emulan un sólido)", geometry: "Quemador poroso plano 25 y 50 mm",
    o2: [21, 40], pressure: [8.3, 14.7], flow: [0, 0],
    sensors: "Flujímetros de calor, termopares, video color",
    objective: "Emular la quema de materiales con combustible gaseoso para medir la inflamabilidad en atmósfera quieta según las propiedades del material.",
    finding: "En aire quieto, las llamas se apagaron solas por debajo de ~25 % O₂. Con 26.5, 34 y 40 % O₂ algunas quemaron varios minutos sin flujo. Armó un mapa de inflamabilidad según el calor de combustión y el de gasificación. Ojo: es combustible gaseoso que emula un sólido, no un material real.",
    relevance: { prevention: 3, detection: 1, suppression: 1 },
    inPsi: true,
    source: "https://ntrs.nasa.gov/citations/20210022542",
  },
  {
    id: "ACME-EFIELD", name: "ACME E-FIELD Flames", family: "ACME", hardware: "CIR · ACME",
    fuelType: "gas", fuels: "CH₄ / C₂H₄ diluidos", geometry: "Llama de chorro o coflujo con malla a alto voltaje (hasta 10 kV)",
    o2: [21, 21], pressure: [14.7, 14.7], flow: [5, 50],
    sensors: "Video color, corriente iónica, termopares",
    objective: "Ver cómo un campo eléctrico actúa sobre los iones de la llama.",
    finding: "La corriente iónica sigue a la luminosidad y a la intensidad de la llama. Campos débiles estabilizan llamas muy diluidas. El viento iónico empuja el gas, algo parecido a la flotación, pero no reproduce la gravedad parcial. Es lo más cercano a un proxy que hay en PSI.",
    relevance: { prevention: 2, detection: 0, suppression: 1 },
    gravityProxy: true,
    inPsi: true,
    source: "https://ntrs.nasa.gov/citations/20210022542",
  },
  {
    id: "ACME-SFLAME", name: "ACME s-Flame", family: "ACME", hardware: "CIR · ACME",
    fuelType: "gas", fuels: "H₂, CH₄ y C₂H₄ diluidos con N₂ o He", geometry: "Quemador esférico poroso",
    o2: [16, 40], pressure: [7.3, 20.6], flow: [0, 0],
    sensors: "Video color, radiómetros, pirometría de filamento fino (TFP), termopares",
    objective: "Estudiar la estructura de llamas de difusión esféricas y su extinción.",
    finding: "Se vieron dos tipos de extinción. Con caudal alto la llama crece y se apaga por pérdida radiativa. Con caudal bajo se apaga por cinética, cerca del quemador. Con He como diluyente los límites se corren.",
    relevance: { prevention: 2, detection: 1, suppression: 2 },
    inPsi: true,
    source: "https://ntrs.nasa.gov/citations/20210022542",
  },
  {
    id: "ACME-FD", name: "ACME Flame Design", family: "ACME", hardware: "CIR · ACME",
    fuelType: "gas", fuels: "C₂H₄ / CH₄ diluidos", geometry: "Quemador esférico, llamas normales (invertidas previstas)",
    o2: [21, 40], pressure: [14.7, 14.7], flow: [0, 0],
    sensors: "Video color, radiómetros, termopares",
    objective: "Diseñar llamas sin hollín controlando la estructura de la llama.",
    finding: "El tamaño de la llama crece con el caudal y baja con más O₂ ambiente. Las llamas grandes crecen hasta apagarse por radiación, con oscilaciones antes de la extinción. Sirve para entender hollín, humo y radiación.",
    relevance: { prevention: 1, detection: 2, suppression: 0 },
    inPsi: false,
    source: "https://ntrs.nasa.gov/citations/20210022542",
  },
  {
    id: "ACME-CLD", name: "ACME Coflow Laminar Diffusion Flame", family: "ACME", hardware: "CIR · ACME",
    fuelType: "gas", fuels: "CH₄ / C₂H₄", geometry: "Llama de coflujo laminar",
    o2: [21, 21], pressure: [7.3, 14.7], flow: [5, 60],
    sensors: "Video color, pirometría de hollín",
    objective: "Medir la estructura y el hollín de llamas de coflujo para validar modelos.",
    finding: "Las llamas con hollín en µg son más altas y anchas, y tienen de 5 a 8 veces más hollín que las equivalentes en 1g. La µg amplía el límite de dilución del combustible.",
    relevance: { prevention: 1, detection: 1, suppression: 0 },
    inPsi: false,
    source: "https://ntrs.nasa.gov/citations/20210022542",
  },
  {
    id: "ACME-CFIG", name: "ACME Cool Flames Investigation with Gases", family: "ACME", hardware: "CIR · ACME",
    fuelType: "gas", fuels: "Etano, propano, n-butano diluidos con N₂", geometry: "Quemador esférico poroso de 6.35 mm, llamas normales e invertidas",
    o2: [12, 85], pressure: [6.7, 44], flow: [0, 0], diluents: "N₂",
    sensors: "Video intensificado, radiómetros, termopares",
    objective: "Producir llamas frías esféricas con combustible gaseoso.",
    finding: "Primeras llamas frías esféricas sostenidas por quemador, solo con n-butano a 2 bar y 39 % O₂ ambiente. El O₂ ambiente llegó a 40 %. El 85 % es O₂ que sale del quemador en llamas invertidas, no la atmósfera. Aun así es el dato de µg más cercano a una fuga de O₂.",
    relevance: { prevention: 3, detection: 1, suppression: 0 },
    inPsi: false,
    source: "https://par.nsf.gov/servlets/purl/10426596",
  },
  {
    id: "BASS", name: "Burning and Suppression of Solids", family: "SPICE duct", hardware: "MSG · ducto SPICE",
    fuelType: "solid", fuels: "PMMA, tela algodón-fibra de vidrio, cera porosa, velas", geometry: "Muestras planas, esferas de PMMA, losas, velas",
    o2: [21, 21], pressure: [14.7, 14.7], flow: [0, 40], diluents: "N₂ (chorro supresor local)",
    sensors: "Video color, termopares, radiómetro",
    objective: "Medir la propagación y la extinción de llama sobre sólidos según el flujo y el O₂.",
    finding: "La llama responde muy rápido a los cambios de flujo. Un chorro local de N₂ puede no apagarla e incluso avivarla, porque arrastra aire fresco hacia la llama.",
    relevance: { prevention: 3, detection: 1, suppression: 2 },
    earth: "Normas de inflamabilidad de materiales, ensayos de cabinas de avión",
    inPsi: true,
    source: "https://www.nasa.gov/sites/default/files/atoms/files/np-2015-10-034-jsc_combustion_in_reduced_gravity-iss-mini-book-011116-508.pdf",
  },
  {
    id: "BASS-II", name: "Burning and Suppression of Solids-II", family: "SPICE duct", hardware: "MSG · ducto SPICE",
    fuelType: "solid", fuels: "PMMA (0.125–5 mm), tela algodón-fibra de vidrio", geometry: "Láminas, barras, sección de esfera, films, tela",
    o2: [14, 21], pressure: [14.7, 14.7], flow: [0, 40], diluents: "N₂ (dilución del volumen del MSG)",
    sensors: "Video color, radiómetro, O₂/CO (CSA-CP) y CO₂ (CDM)",
    objective: "Construir mapas de extinción en función de la velocidad de flujo y del O₂.",
    finding: "Con ventilación baja, algunos materiales quemaron en µg con menos O₂ que en 1g (PMMA: 17 % contra 18 %). El ensayo NASA-STD-6001 Test 1 puede no ser conservador en el espacio. La propagación fue más rápida con un flujo intermedio.",
    relevance: { prevention: 3, detection: 1, suppression: 3 },
    earth: "Diseño de ventilación y corte de flujo como supresión",
    inPsi: true,
    source: "https://doi.org/10.60555/4qc4-de67",
  },
  {
    id: "SPICE", name: "Smoke Point In Co-flow Experiment", family: "SPICE duct", hardware: "MSG · ducto SPICE",
    fuelType: "gas", fuels: "Etileno, propano, propileno, etano, metano", geometry: "Chorro de coflujo, quemadores de 0.41–1.6 mm",
    o2: [21, 21], pressure: [14.7, 14.7], flow: [5, 65],
    sensors: "Video color",
    objective: "Medir el punto de humo (smoke point) de llamas laminares en µg.",
    finding: "Más de 100 puntos de humo medidos en µg. La longitud de llama en el punto de humo crece con el coflujo y baja con el diámetro del quemador. El orden de tendencia a hollín entre etileno y propano se invierte respecto de 1g.",
    relevance: { prevention: 1, detection: 3, suppression: 0 },
    inPsi: true,
    source: "https://drum.lib.umd.edu/handle/1903/13569",
  },
  {
    id: "SLICE", name: "Structure & Liftoff In Combustion Experiment", family: "SPICE duct", hardware: "MSG · ducto SPICE",
    fuelType: "gas", fuels: "Metano puro y diluido con N₂", geometry: "Chorro de coflujo",
    o2: [21, 21], pressure: [14.7, 14.7], flow: [5, 70],
    sensors: "Video color",
    objective: "Medir el despegue (liftoff) y el soplado de llamas de chorro.",
    finding: "En µg las llamas quedan despegadas en más condiciones que en 1g. El caudal de combustible pesa más en la forma de la llama que la dilución. Es relevante para fugas de gas presurizado en cabina.",
    relevance: { prevention: 2, detection: 0, suppression: 1 },
    inPsi: true,
    source: "https://ntrs.nasa.gov/citations/20150002322",
  },
  {
    id: "SAFFIRE-I", name: "Spacecraft Fire Experiment-I", family: "Saffire", hardware: "Cygnus (después de dejar la ISS)",
    fuelType: "solid", fuels: "SIBAL (75 % algodón, 25 % fibra de vidrio) ~94×40 cm", geometry: "Lámina grande, flujo concurrente",
    o2: [21, 21], pressure: [14.7, 14.7], flow: [20, 20],
    sensors: "Video, termopares, radiómetros, O₂/CO₂/CO",
    objective: "Primer incendio a gran escala en un vehículo espacial.",
    finding: "Primer incendio de escala real dentro de una nave. Se midieron la propagación de la llama y los productos de combustión en el volumen de la cabina.",
    relevance: { prevention: 3, detection: 3, suppression: 1 },
    earth: "Validación de modelos de incendio en recintos cerrados",
    inPsi: true,
  },
  {
    id: "SAFFIRE-II", name: "Spacecraft Fire Experiment-II", family: "Saffire", hardware: "Cygnus (después de dejar la ISS)",
    fuelType: "solid", fuels: "9 muestras: SIBAL, silicona, PMMA estructural, PMMA plano, PMMA con Nomex", geometry: "Muestras 5×29 cm, flujo concurrente u opuesto",
    o2: [21, 21], pressure: [14.7, 14.7], flow: [20, 30],
    sensors: "Video, termopares, O₂/CO₂/CO",
    objective: "Ignición e inflamabilidad de materiales de cabina reales.",
    finding: "Compara la inflamabilidad de materiales reales de nave en µg con la de los ensayos en tierra.",
    relevance: { prevention: 3, detection: 2, suppression: 1 },
    inPsi: true,
  },
  {
    id: "SAFFIRE-III", name: "Spacecraft Fire Experiment-III", family: "Saffire", hardware: "Cygnus (después de dejar la ISS)",
    fuelType: "solid", fuels: "SIBAL", geometry: "Lámina grande",
    o2: [21, 21], pressure: [14.7, 14.7], flow: [20, 20],
    sensors: "Video, termopares, O₂/CO₂/CO",
    objective: "Repetir y extender Saffire-I a gran escala.",
    finding: "Segundo ensayo a gran escala sobre tela. Suma datos de propagación y de productos de combustión para dimensionar sensores de CO y CO₂.",
    relevance: { prevention: 3, detection: 3, suppression: 1 },
    inPsi: true,
  },
  {
    id: "SAME", name: "Smoke Aerosol Measurement Experiment", family: "SAME", hardware: "MSG",
    fuelType: "aerosol", fuels: "Teflón, Kapton, caucho de silicona, celulosa, DBP (sobrecalentados, sin llama)", geometry: "Muestras calentadas, cámara de envejecimiento 10–1800 s",
    o2: [21, 21], pressure: [14.7, 14.7], flow: [0, 10],
    sensors: "P-Trak (número), DustTrak (masa), cámara de ionización, muestreo termoforético con TEM",
    objective: "Medir tamaño y cantidad de partículas de humo en µg.",
    finding: "Se esperaba humo de partículas más grandes en µg. Buena parte de las partículas medidas quedó por debajo de 500 nm, y el detector de la ISS ve mejor partículas de más de 1 µm. Los datos sirven para fijar requisitos de detectores futuros.",
    relevance: { prevention: 0, detection: 3, suppression: 0 },
    earth: "Detectores de humo con menos falsas alarmas",
    inPsi: true,
    source: "https://doi.org/10.60555/gd4k-8h62",
  },
  {
    id: "SAME-R", name: "Smoke Aerosol Measurement Experiment Reflight", family: "SAME", hardware: "MSG",
    fuelType: "aerosol", fuels: "Materiales de cabina (pirólisis)", geometry: "Muestras calentadas",
    o2: [21, 21], pressure: [14.7, 14.7], flow: [0, 10],
    sensors: "P-Trak, DustTrak, cámara de ionización, muestreo para TEM",
    objective: "Repetir SAME en la Expedición 24 (2010) con muestras para microscopía.",
    finding: "Sumó datos de forma y tamaño de partícula, con humo fresco y envejecido. Sirven para elegir el tipo y el umbral de los detectores.",
    relevance: { prevention: 0, detection: 3, suppression: 0 },
    earth: "Detección temprana en edificios y minería",
    inPsi: true,
    source: "https://ntrs.nasa.gov/citations/20130000422",
  },
  {
    id: "DAFT", name: "Dust and Aerosol Measurement Feasibility Test (1 y 2)", family: "SAME", hardware: "Cabina ISS",
    fuelType: "aerosol", fuels: "Polvo ambiental (sin combustión)", geometry: "—",
    o2: [21, 21], pressure: [14.7, 14.7], flow: [5, 20],
    sensors: "P-Trak (el mismo instrumento que SAME)",
    objective: "Medir el polvo ambiente de la ISS con el instrumento de humo.",
    finding: "Establece el fondo de polvo que un detector debe ignorar para no dar falsas alarmas. En la Luna, el regolito suma mucho más polvo.",
    relevance: { prevention: 0, detection: 3, suppression: 0 },
    earth: "Discriminación humo/polvo en minería",
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
    note: "Aire a nivel del mar. La ventilación forzada reemplaza a la flotación." },
  { id: "rover", name: "Rover presurizado lunar", kind: "habitat", o2: 30, pressure: 10.2, flow: 5, gravity: 0.16,
    note: "Valores del reto: O₂ ≥ 30 % y presión ≤ 10.2 psi, para reducir el pre-respirado antes de las EVAs." },
  { id: "moonbase", name: "Base lunar (atm. exploración)", kind: "habitat", o2: 34, pressure: 8.2, flow: 5, gravity: 0.16,
    note: "Atmósfera de exploración propuesta por NASA: 8.2 psi y 34 % O₂." },
  { id: "mars", name: "Hábitat en Marte", kind: "habitat", o2: 34, pressure: 8.2, flow: 5, gravity: 0.38,
    note: "Supone la misma atmósfera de exploración, con gravedad de 0.38 g." },
  { id: "suit", name: "Traje espacial", kind: "habitat", o2: 100, pressure: 4.3, flow: 2, gravity: 0,
    note: "100 % O₂ a 4.3 psi." },
  { id: "apollo1", name: "Apollo 1 (1967)", kind: "incident", o2: 100, pressure: 16.7, flow: 0, gravity: 1,
    note: "Ensayo en plataforma con 100 % O₂ sobre la presión ambiente. La causa más probable fue un arco en cableado dañado, que encendió materiales de cabina. Murieron los 3 tripulantes. Después se pasó a una atmósfera N₂/O₂ en el lanzamiento y a controlar los materiales de cabina." },
  { id: "apollo13", name: "Apollo 13 (1970)", kind: "incident", o2: 100, pressure: 5, flow: 0, gravity: 0,
    note: "Cabina con 100 % O₂ a 5 psi. La falla ocurrió dentro de un tanque de O₂ supercrítico, a cientos de psi y fuera de este gráfico: aislamiento de cables dañado y ventilador. El cableado en O₂ puro es una fuente de ignición." },
  { id: "mir", name: "Mir (1997)", kind: "incident", o2: 21, pressure: 14.7, flow: 10, gravity: 0,
    note: "Se incendió un generador químico de O₂ (vela de perclorato de litio). Hubo enriquecimiento local de O₂ y humo denso. Una fuente de O₂ también puede ser fuente de ignición, y el humo no dejaba llegar al foco." },
  { id: "artemis2", name: "Artemis II (alarma de humo)", kind: "incident", o2: 21, pressure: 14.7, flow: 10, gravity: 0,
    note: "Sonó una alarma de humo en Orion durante el vuelo. Si volver a la Tierra lleva días, hay que detectar temprano y sin falsas alarmas." },
];

export const FUEL_LABEL: Record<FuelType, string> = {
  solid: "Sólidos (materiales)",
  liquid: "Líquidos (gotas)",
  gas: "Gases (llamas)",
  aerosol: "Humo / aerosol",
};
