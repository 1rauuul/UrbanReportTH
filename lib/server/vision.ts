export type FotoVerificacion = "verificada" | "con_dudas" | "no_corresponde";

const LABELS_BACHE = [
  "pothole",
  "road",
  "asphalt",
  "pavement",
  "road surface",
  "crack",
  "highway",
  "lane",
  "street",
  "infrastructure",
  "tarmac",
  "macadam",
];

const LABELS_BASURA = [
  "waste",
  "garbage",
  "litter",
  "trash",
  "rubbish",
  "dumpster",
  "landfill",
  "pollution",
  "plastic",
  "debris",
  "junk",
  "refuse",
];

interface VisionLabel {
  description: string;
  score: number;
}

interface VisionResponse {
  responses: Array<{
    labelAnnotations?: VisionLabel[];
    error?: { message: string };
  }>;
}

export async function verificarImagenConVision(
  file: File,
  tipo: "bache" | "basura"
): Promise<FotoVerificacion> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    console.warn("[vision] GOOGLE_VISION_API_KEY no definida — omitiendo análisis");
    throw new Error("API key no configurada");
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: "LABEL_DETECTION", maxResults: 20 }],
          },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    }
  );

  if (!response.ok) {
    throw new Error(`Vision API error ${response.status}`);
  }

  const data = (await response.json()) as VisionResponse;
  const labels = data.responses[0]?.labelAnnotations ?? [];

  const targetLabels = tipo === "bache" ? LABELS_BACHE : LABELS_BASURA;

  let maxScore = 0;
  for (const label of labels) {
    const desc = label.description.toLowerCase();
    if (targetLabels.some((t) => desc.includes(t) || t.includes(desc))) {
      if (label.score > maxScore) maxScore = label.score;
    }
  }

  if (maxScore >= 0.65) return "verificada";
  if (maxScore >= 0.35) return "con_dudas";
  return "no_corresponde";
}
