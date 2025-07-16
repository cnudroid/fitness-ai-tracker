import type { NextApiRequest, NextApiResponse } from "next";

// Define the expected request and response types
interface OllamaRequest {
  prompt: string;
  model?: string;
}

interface OllamaResponse {
  response: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OllamaResponse | { error: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, model = "llama3" } = req.body as OllamaRequest;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const ollamaRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt })
    });

    if (!ollamaRes.ok) {
      const err = await ollamaRes.text();
      return res.status(500).json({ error: `Ollama error: ${err}` });
    }

    const data = await ollamaRes.json();
    return res.status(200).json({ response: data.response });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Unknown error" });
  }
}
