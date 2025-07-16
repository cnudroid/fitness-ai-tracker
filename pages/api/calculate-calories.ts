import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { username, workout, duration } = req.body;
  if (!username || !workout || !duration) {
    return res.status(400).json({ error: 'Workout and duration are required' });
  }

  try {
    const prompt = `Estimate the number of calories burned for this workout: ${workout}, duration: ${duration} minutes. Respond with only the number.`;
    const provider = req.headers['x-ai-provider']?.toString() || process.env.AI_PROVIDER || 'ollama';

    let aiMessage = '';
    if (provider === 'huggingface') {
      const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
      if (!HF_API_KEY) {
        return res.status(500).json({ error: 'Hugging Face API key not set' });
      }
      const HF_MODEL = process.env.HUGGINGFACE_MODEL || 'meta-llama/Llama-2-7b-chat-hf';
      const hfRes = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`,
        {
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
      aiMessage = Array.isArray(data) && data[0]?.generated_text ? data[0].generated_text.trim() : JSON.stringify(data);
    } else {
      const ollamaRes = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama2',
          prompt,
          stream: false
        }),
      });
      if (!ollamaRes.ok) {
        const error = await ollamaRes.text();
        return res.status(500).json({ error: 'Ollama API error', details: error });
      }
      const data = await ollamaRes.json();
      aiMessage = data.response?.trim();
    }
    const calories = aiMessage?.match(/\d+/)?.[0];
    // Save workout to file
    const workoutEntry = {
      username,
      workout,
      duration,
      calories: calories ? Number(calories) : aiMessage,
      timestamp: Date.now(),
    };
    const fs = await import('fs/promises');
    const path = await import('path');
    const WORKOUTS_FILE = path.join(process.cwd(), 'workouts.json');
    let workouts: any[] = [];
    try {
      const data = await fs.readFile(WORKOUTS_FILE, 'utf8');
      workouts = JSON.parse(data);
    } catch (err) {
      // File may not exist yet
      workouts = [];
    }
    workouts.push(workoutEntry);
    await fs.writeFile(WORKOUTS_FILE, JSON.stringify(workouts, null, 2), 'utf8');
    return res.status(200).json(workoutEntry);
  } catch (err: unknown) {
    if (err instanceof Error) {
      return res.status(500).json({ error: 'Failed to estimate calories', details: err.message });
    }
    return res.status(500).json({ error: 'Failed to estimate calories', details: String(err) });
  }
}
