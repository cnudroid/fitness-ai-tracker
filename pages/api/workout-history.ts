import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

type WorkoutEntry = {
  username: string;
  workout: string;
  duration: string;
  calories: number | string;
  timestamp: number;
};

const WORKOUTS_FILE = path.join(process.cwd(), 'workouts.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { username } = req.query;
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' });
  }
  try {
    let workouts: WorkoutEntry[] = [];
    try {
      const data = await fs.readFile(WORKOUTS_FILE, 'utf8');
      workouts = JSON.parse(data) as WorkoutEntry[];
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error reading workouts file:', err.message);
      } else {
        console.error('Unknown error reading workouts file:', String(err));
      }
      // File may not exist yet
      workouts = [];
    }
    const history = workouts.filter(w => w.username === username);
    return res.status(200).json({ history });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return res.status(500).json({ error: 'Failed to fetch workout history', details: err.message });
    }
    return res.status(500).json({ error: 'Failed to fetch workout history', details: String(err) });
  }
}
