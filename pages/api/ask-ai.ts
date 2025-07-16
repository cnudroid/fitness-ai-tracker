import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const provider = process.env.AI_PROVIDER || 'ollama';

  try {
    if (provider === 'huggingface') {
      // Hugging Face Inference API
      const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
      if (!HF_API_KEY) {
        return res.status(500).json({ error: 'Hugging Face API key not set' });
      }
      // Example: Use meta-llama/Llama-2-7b-chat-hf (or any other text-generation model)
      const HF_MODEL = process.env.HUGGINGFACE_MODEL || 'meta-llama/Llama-2-7b-chat-hf';
      const hfRes = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: prompt }),
      });
      if (!hfRes.ok) {
        const error = await hfRes.text();
        return res.status(500).json({ error: 'Hugging Face API error', details: error });
      }
      const data = await hfRes.json();
      // Hugging Face returns [{ generated_text: ... }] or similar
      const aiMessage = Array.isArray(data) && data[0]?.generated_text ? data[0].generated_text.trim() : JSON.stringify(data);
      return res.status(200).json({ response: aiMessage });
    } else {
      // Default: Ollama (local)
      const ollamaRes = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama2', prompt, stream: false }),
      });
      if (!ollamaRes.ok) {
        const error = await ollamaRes.text();
        return res.status(500).json({ error: 'Ollama API error', details: error });
      }
      const data = await ollamaRes.json();
      const aiMessage = data.response?.trim();
      return res.status(200).json({ response: aiMessage });
    }
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to get AI response', details: err.message });
  }
}

