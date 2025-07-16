import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

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
    let workouts: any[] = [];
    try {
      const data = await fs.readFile(WORKOUTS_FILE, 'utf8');
      workouts = JSON.parse(data);
    } catch (err) {
      // File may not exist yet
      workouts = [];
    }
    const history = workouts.filter(w => w.username === username);
    return res.status(200).json({ history });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch workout history', details: err.message });
  }
}
