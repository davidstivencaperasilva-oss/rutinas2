import cors from "cors";
// ...
app.use(cors()); // Permite peticiones desde cualquier origen (ideal para pruebas).

import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); // para principiantes: deja todos los orígenes. Luego puedes restringirlo.

// Helper: construir prompts
function buildPrompts(body) {
  const { estatura, peso, sexo, objetivo, dias, horas } = body;
  const system = `Eres un entrenador personal certificado.
Devuelve SOLO un JSON válido con esta forma:
[
  { "dia": "Día 1", "objetivoDelDia": "Upper/Full/Cardio/etc",
    "ejercicios": [
      { "nombre": "Sentadillas", "series": 4, "reps": "10-12", "descanso": "60-90s" },
      { "nombre": "Plancha", "duracion": "3 x 45s", "descanso": "45s" }
    ],
    "recomendaciones": "5-10 min de calentamiento + estiramientos finales"
  }
]
Reglas: adapta volumen a las horas diarias y al nivel implícito por peso/talla; alterna grupos musculares; incluye calentamiento y estiramientos; sugiere progresión ligera; incluye variantes sin equipamiento si aplica.`;

  const user = `Datos de la persona:
${JSON.stringify({ estatura_cm: estatura, peso_kg: peso, sexo, objetivo, dias_por_semana: dias, horas_diarias: horas }, null, 2)}`;

  return { system, user };
}

// Endpoint principal
app.post("/api/rutina", async (req, res) => {
  try {
    const required = ["estatura", "peso", "sexo", "objetivo", "dias", "horas"];
    for (const k of required) if (req.body[k] === undefined) {
      return res.status(400).json({ error: `Falta el campo: ${k}` });
    }

    const { system, user } = buildPrompts(req.body);

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      })
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return res.status(500).json({ error: "OpenAI error", details: txt });
    }
    const data = await resp.json();
    let content = data.choices?.[0]?.message?.content || "[]";
    // Limpieza si vienen backticks
    content = content.replace(/```json|```/g, "").trim();

    // Intentar parsear; si falla, igual devolvemos la cadena
    let rutina;
    try { rutina = JSON.parse(content); } catch { rutina = content; }

    return res.json({ rutina });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error generando la rutina" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend escuchando en puerto ${PORT}`));
