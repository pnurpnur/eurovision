import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { initDb, getDb } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize DB on startup
initDb();
const db = getDb();

// Helper: normalize score to 0-10
function normalizeScore(score, method) {
  if (method === '1-10') return parseFloat(score);
  if (method === 'dice') return (parseFloat(score) / 6) * 10; // 1-6 → 0-10
  if (method === 'scale') {
    // -2, -1, 0, 1, 2 → -10, -5, 0, 5, 10 (map to 0-10 as 0, 2.5, 5, 7.5, 10)
    const val = parseFloat(score);
    return ((val + 2) / 4) * 10; // -2..2 → 0..10
  }
  return 0;
}

// Helper: denormalize from 0-10 to target method
function denormalizeScore(normalizedScore, targetMethod) {
  const score = parseFloat(normalizedScore);
  if (targetMethod === '1-10') return Math.round(score);
  if (targetMethod === 'dice') return Math.round((score / 10) * 6);
  if (targetMethod === 'scale') {
    // 0-10 → -2..2
    return Math.round((score / 10) * 4 - 2);
  }
  return 0;
}

// POST /api/users - register user
app.post('/api/users', (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name required' });
  }

  const sessionId = uuidv4();
  try {
    const stmt = db.prepare(
      'INSERT INTO users (name, sessionId) VALUES (?, ?)'
    );
    const info = stmt.run(name.trim(), sessionId);
    res.json({ userId: info.lastInsertRowid, sessionId });
  } catch (err) {
    res.status(400).json({ error: 'Name already taken' });
  }
});

// GET /api/songs - list all songs
app.get('/api/songs', (req, res) => {
  const stmt = db.prepare('SELECT * FROM songs ORDER BY number');
  const songs = stmt.all();
  res.json(songs);
});

// POST /api/ratings - save rating
app.post('/api/ratings', (req, res) => {
  const { sessionId, songId, score, scoreMethod, notes } = req.body;

  const userStmt = db.prepare('SELECT id FROM users WHERE sessionId = ?');
  const user = userStmt.get(sessionId);
  if (!user) return res.status(401).json({ error: 'Invalid session' });

  const normalizedScore = normalizeScore(score, scoreMethod);

  try {
    const stmt = db.prepare(
      `INSERT INTO ratings (userId, songId, score, scoreMethod, notes)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(userId, songId) DO UPDATE SET
       score = excluded.score, scoreMethod = excluded.scoreMethod, notes = excluded.notes`
    );
    stmt.run(user.id, songId, normalizedScore, scoreMethod, notes || '');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/my-ratings - get user's ratings
app.get('/api/my-ratings', (req, res) => {
  const { sessionId } = req.query;

  const userStmt = db.prepare('SELECT id FROM users WHERE sessionId = ?');
  const user = userStmt.get(sessionId);
  if (!user) return res.status(401).json({ error: 'Invalid session' });

  const stmt = db.prepare(
    `SELECT r.*, s.number, s.country, s.title, s.artist
     FROM ratings r
     JOIN songs s ON r.songId = s.id
     WHERE r.userId = ?
     ORDER BY s.number`
  );
  const ratings = stmt.all(user.id);

  res.json(ratings);
});

// POST /api/rankings - submit final ranking
app.post('/api/rankings', (req, res) => {
  const { sessionId, rankedSongIds } = req.body;

  const userStmt = db.prepare('SELECT id FROM users WHERE sessionId = ?');
  const user = userStmt.get(sessionId);
  if (!user) return res.status(401).json({ error: 'Invalid session' });

  try {
    const stmt = db.prepare(
      `INSERT INTO finalRankings (userId, rankedSongIds)
       VALUES (?, ?)
       ON CONFLICT(userId) DO UPDATE SET
       rankedSongIds = excluded.rankedSongIds, submittedAt = CURRENT_TIMESTAMP`
    );
    stmt.run(user.id, JSON.stringify(rankedSongIds));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/my-ranking - get user's submitted ranking
app.get('/api/my-ranking', (req, res) => {
  const { sessionId } = req.query;

  const userStmt = db.prepare('SELECT id FROM users WHERE sessionId = ?');
  const user = userStmt.get(sessionId);
  if (!user) return res.status(401).json({ error: 'Invalid session' });

  const stmt = db.prepare(
    'SELECT rankedSongIds FROM finalRankings WHERE userId = ?'
  );
  const ranking = stmt.get(user.id);

  res.json(ranking ? JSON.parse(ranking.rankedSongIds) : null);
});

// GET /api/results - aggregated results
app.get('/api/results', (req, res) => {
  const stateStmt = db.prepare("SELECT value FROM appState WHERE key = 'resultsLocked'");
  const appState = stateStmt.get();
  const resultsLocked = appState?.value === 'true';

  const rankingStmt = db.prepare(
    `SELECT u.name, fr.rankedSongIds FROM finalRankings fr
     JOIN users u ON fr.userId = u.id`
  );
  const rankings = rankingStmt.all();

  // Calculate points: 12, 10, 8, 7, 6, 5, 4, 3, 2, 1
  const pointsArray = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];
  const results = {};

  rankings.forEach(row => {
    const songIds = JSON.parse(row.rankedSongIds);
    songIds.slice(0, 10).forEach((songId, idx) => {
      if (!results[songId]) results[songId] = 0;
      results[songId] += pointsArray[idx];
    });
  });

  // Get song details
  const songStmt = db.prepare('SELECT id, number, country, title, artist FROM songs');
  const songs = songStmt.all();
  const songMap = Object.fromEntries(songs.map(s => [s.id, s]));

  const output = Object.entries(results)
    .map(([songId, points]) => ({
      ...songMap[songId],
      points
    }))
    .sort((a, b) => b.points - a.points);

  res.json({ results: output, resultsLocked });
});

// POST /api/admin/lock-results - admin lock
app.post('/api/admin/lock-results', (req, res) => {
  const { name } = req.body;

  if (name !== 'Inge') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const stmt = db.prepare(
    "UPDATE appState SET value = 'true' WHERE key = 'resultsLocked'"
  );
  stmt.run();

  res.json({ success: true, locked: true });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🎵 Eurovision backend running on http://localhost:${PORT}`);
});
