import { NextRequest, NextResponse } from "next/server";

interface LabelsResult {
  description: string;
  score: number;
}

interface AnalysisResult {
  tipo: "bache" | "basura";
  severidad?: "alto" | "medio" | "bajo";
  volumen?: "grande" | "mediano" | "pequeño";
  descripcion: string;
  riesgo: string;
  recomendacion: string;
}

const BACHE_NEGATIVE = new Set([
  "pothole", "crack", "damage", "hole", "broken", "uneven",
  "depression", "crater", "erosion", "deterioration", "rut",
  "fissure", "pit", "dent", "hazard", "rough", "worn",
  "bache", "grieta", "roto", "hundido", "desnivel", "agrietado",
  "deterioro", "hoyo", "zanja", "hundimiento", "fisura",
]);
const BACHE_RELEVANT = new Set([
  "road", "asphalt", "street", "pavement", "ground", "concrete",
  "tarmac", "infrastructure", "road surface", "lane", "highway",
  "parking", "alley", "driveway", "sidewalk",
  "calle", "carretera", "pavimento", "asfalto", "suelo",
  "via", "banqueta", "camino",
]);

const BASURA_LABELS = new Set([
  "waste", "garbage", "trash", "rubbish", "litter", "debris",
  "plastic", "bag", "bottle", "dump", "pile",
  "basura", "residuos", "desperdicios", "plastico", "bolsa", "monton",
]);

function analyzeBache(labels: LabelsResult[]): AnalysisResult {
  const negativeScore = labels
    .filter((l) => BACHE_NEGATIVE.has(l.description.toLowerCase()))
    .reduce((sum, l) => sum + l.score, 0);

  const relevantScore = labels
    .filter((l) => BACHE_RELEVANT.has(l.description.toLowerCase()))
    .reduce((sum, l) => sum + l.score, 0);

  let severidad: "alto" | "medio" | "bajo";
  let descripcion: string;
  let riesgo: string;
  let recomendacion: string;

  if (negativeScore >= 0.15 || relevantScore >= 0.5) {
    severidad = "alto";
    descripcion = "Se identificaron danos en el pavimento. El bache requiere atencion.";
    riesgo = "Riesgo de danos a vehiculos, accidentes viales y lesiones a peatones.";
    recomendacion = "Se recomienda intervencion urgente de Obra Publica. Senalizar la zona mientras se atiende.";
  } else {
    severidad = "bajo";
    descripcion = "Se observan imperfecciones leves en la superficie. No se detecta un bache profundo.";
    riesgo = "Riesgo bajo. Molestia menor para conductores.";
    recomendacion = "Incluir en el programa de mantenimiento regular de vialidades.";
  }

  return { tipo: "bache", severidad, descripcion, riesgo, recomendacion };
}

function analyzeBasura(labels: LabelsResult[]): AnalysisResult {
  const trashScore = labels
    .filter((l) => BASURA_LABELS.has(l.description.toLowerCase()))
    .reduce((sum, l) => sum + l.score, 0);

  let volumen: "grande" | "mediano" | "pequeño";
  let descripcion: string;
  let riesgo: string;
  let recomendacion: string;

  if (trashScore > 2.5) {
    volumen = "grande";
    descripcion = "Gran acumulación de residuos detectada. Se identifican múltiples tipos de desechos incluyendo bolsas, plásticos y posiblemente residuos orgánicos.";
    riesgo = "Riesgo sanitario alto. Posible proliferación de plagas, malos olores y contaminación.";
    recomendacion = "Se recomienda recolección inmediata por Servicios Públicos. Evaluar necesidad de contenedores adicionales en la zona.";
  } else if (trashScore > 1.2) {
    volumen = "mediano";
    descripcion = "Acumulación moderada de basura. Se detectan bolsas y residuos dispersos en la vía pública.";
    riesgo = "Riesgo sanitario moderado. Puede obstruir el paso peatonal y generar fauna nociva.";
    recomendacion = "Programar recolección en la próxima ruta de Servicios Públicos. Notificar a vecinos sobre horarios de recolección.";
  } else {
    volumen = "pequeño";
    descripcion = "Residuos menores detectados. Basura dispersa de bajo volumen.";
    riesgo = "Riesgo bajo. Principalmente estético y de imagen urbana.";
    recomendacion = "Incluir en la ruta regular de limpieza. Colocar un contenedor cercano si no existe.";
  }

  return { tipo: "basura", volumen, descripcion, riesgo, recomendacion };
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key no configurada" }, { status: 500 });
    }

    const form = await req.formData();
    const foto = form.get("foto");
    const tipo = String(form.get("tipo") ?? "");

    if (!(foto instanceof File) || foto.size === 0) {
      return NextResponse.json({ error: "No se recibió evidencia" }, { status: 400 });
    }

    if (tipo !== "bache" && tipo !== "basura") {
      return NextResponse.json({ error: "Tipo no soportado para análisis" }, { status: 400 });
    }

    const bytes = await foto.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64 },
              features: [
                { type: "LABEL_DETECTION", maxResults: 25 },
                { type: "OBJECT_LOCALIZATION", maxResults: 10 },
              ],
            },
          ],
        }),
      }
    );

    if (!visionRes.ok) {
      const err = await visionRes.text();
      console.error("Cloud Vision error:", err);
      return NextResponse.json({ error: "Error al analizar la imagen" }, { status: 502 });
    }

    const visionData = await visionRes.json();
    const annotations = visionData.responses?.[0]?.labelAnnotations ?? [];
    const labels: LabelsResult[] = annotations.map(
      (a: { description: string; score: number }) => ({
        description: a.description,
        score: a.score,
      })
    );

    if (tipo === "bache") {
      const negativeScore = labels
        .filter((l) => BACHE_NEGATIVE.has(l.description.toLowerCase()))
        .reduce((sum, l) => sum + l.score, 0);
      const relevantScore = labels
        .filter((l) => BACHE_RELEVANT.has(l.description.toLowerCase()))
        .reduce((sum, l) => sum + l.score, 0);

      if (negativeScore < 0.15 && relevantScore < 0.35) {
        return NextResponse.json(
          {
            rechazada: true,
            mensaje:
              "La imagen no muestra evidencia clara de un bache o daño en pavimento. Toma una foto más cercana del problema en la vialidad.",
          },
          { status: 400 }
        );
      }
    } else {
      const trashScore = labels
        .filter((l) => BASURA_LABELS.has(l.description.toLowerCase()))
        .reduce((sum, l) => sum + l.score, 0);

      if (trashScore < 0.4) {
        return NextResponse.json(
          {
            rechazada: true,
            mensaje:
              "La imagen no muestra evidencia clara de basura o residuos. Toma una foto donde se aprecien los desechos acumulados.",
          },
          { status: 400 }
        );
      }
    }

    let result: AnalysisResult;
    if (tipo === "bache") {
      result = analyzeBache(labels);
    } else {
      result = analyzeBasura(labels);
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error interno" },
      { status: 500 }
    );
  }
}
