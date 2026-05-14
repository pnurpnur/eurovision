import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { initDb, getDb } from './db.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(join(__dirname, '../frontend')));

// Helper: promisify db.run
function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Helper: promisify db.get
function dbGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Helper: promisify db.all
function dbAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Initialize DB on startup
let db;
console.log('[SERVER] Starting Eurovision backend server...');
await initDb().then(d => {
  db = d;
  console.log('[SERVER] Database initialized');
}).catch(err => {
  console.error('[SERVER] Failed to initialize database:', err);
  process.exit(1);
});

// Helper: normalize score to 0-10
function normalizeScore(score, method) {
  if (method === '1-10') return parseFloat(score);
  if (method === 'dice') return (parseFloat(score) / 6) * 10;
  if (method === 'scale') {
    const val = parseFloat(score);
    return ((val + 2) / 4) * 10;
  }
  return 0;
}

// POST /api/users - register or login user
app.post('/api/users', async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name required' });
  }

  const sessionId = uuidv4();
  const trimmedName = name.trim();

  try {
    console.log(`[LOGIN] User "${trimmedName}" attempting login with sessionId: ${sessionId}`);

    // Check if user already exists
    const existingUser = await dbGet(db, 'SELECT id FROM users WHERE name = ?', [trimmedName]);

    if (existingUser) {
      // User exists - update sessionId
      console.log(`[LOGIN] User exists, updating sessionId`);
      await dbRun(db,
        'UPDATE users SET sessionId = ? WHERE name = ?',
        [sessionId, trimmedName]
      );
      res.json({ userId: existingUser.id, sessionId, name: trimmedName });
    } else {
      // New user - create entry
      console.log(`[LOGIN] Creating new user`);
      const info = await dbRun(db,
        'INSERT INTO users (name, sessionId) VALUES (?, ?)',
        [trimmedName, sessionId]
      );
      res.json({ userId: info.lastID, sessionId, name: trimmedName });
    }
  } catch (err) {
    console.error(`[LOGIN ERROR] ${err.message}`, err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/songs - list all songs
app.get('/api/songs', async (req, res) => {
  try {
    const songs = await dbAll(db, 'SELECT * FROM songs ORDER BY number');
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ratings - save rating
app.post('/api/ratings', async (req, res) => {
  const { sessionId, songId, score, scoreMethod, notes } = req.body;

  try {
    const user = await dbGet(db, 'SELECT id FROM users WHERE sessionId = ?', [sessionId]);
    if (!user) return res.status(401).json({ error: 'Invalid session' });

    const normalizedScore = normalizeScore(score, scoreMethod);

    await dbRun(db,
      `INSERT INTO ratings (userId, songId, score, scoreMethod, notes)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(userId, songId) DO UPDATE SET
       score = excluded.score, scoreMethod = excluded.scoreMethod, notes = excluded.notes`,
      [user.id, songId, normalizedScore, scoreMethod, notes || '']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/my-ratings - get user's ratings
app.get('/api/my-ratings', async (req, res) => {
  const { sessionId } = req.query;

  try {
    console.log(`[RATINGS] Checking sessionId: ${sessionId}`);
    const user = await dbGet(db, 'SELECT id FROM users WHERE sessionId = ?', [sessionId]);

    if (!user) {
      console.log(`[RATINGS ERROR] No user found for sessionId: ${sessionId}`);
      // Debug: list all users in database
      const allUsers = await dbAll(db, 'SELECT id, name, sessionId FROM users');
      console.log(`[RATINGS DEBUG] Users in database:`, allUsers);
      return res.status(401).json({ error: 'Invalid session' });
    }

    console.log(`[RATINGS] Found user ${user.id}, fetching ratings`);
    const ratings = await dbAll(db,
      `SELECT r.*, s.number, s.country, s.title, s.artist
       FROM ratings r
       JOIN songs s ON r.songId = s.id
       WHERE r.userId = ?
       ORDER BY s.number`,
      [user.id]
    );

    res.json(ratings);
  } catch (err) {
    console.error(`[RATINGS ERROR] ${err.message}`, err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/rankings - submit final ranking
app.post('/api/rankings', async (req, res) => {
  const { sessionId, rankedSongIds } = req.body;

  try {
    const user = await dbGet(db, 'SELECT id FROM users WHERE sessionId = ?', [sessionId]);
    if (!user) return res.status(401).json({ error: 'Invalid session' });

    await dbRun(db,
      `INSERT INTO finalRankings (userId, rankedSongIds)
       VALUES (?, ?)
       ON CONFLICT(userId) DO UPDATE SET
       rankedSongIds = excluded.rankedSongIds, submittedAt = CURRENT_TIMESTAMP`,
      [user.id, JSON.stringify(rankedSongIds)]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/my-ranking - get user's submitted ranking
app.get('/api/my-ranking', async (req, res) => {
  const { sessionId } = req.query;

  try {
    const user = await dbGet(db, 'SELECT id FROM users WHERE sessionId = ?', [sessionId]);
    if (!user) return res.status(401).json({ error: 'Invalid session' });

    const ranking = await dbGet(db,
      'SELECT rankedSongIds FROM finalRankings WHERE userId = ?',
      [user.id]
    );

    res.json(ranking ? JSON.parse(ranking.rankedSongIds) : null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/results - aggregated results
app.get('/api/results', async (req, res) => {
  try {
    const appState = await dbGet(db, "SELECT value FROM appState WHERE key = 'resultsLocked'");
    const resultsLocked = appState?.value === 'true';

    const rankings = await dbAll(db,
      `SELECT u.name, fr.rankedSongIds FROM finalRankings fr
       JOIN users u ON fr.userId = u.id`
    );

    // Calculate points: 12, 10, 8, 7, 6, 5, 4, 3, 2, 1
    const pointsArray = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];
    const results = {};

    rankings.forEach(row => {
      const songIds = JSON.parse(row.rankedSongIds);
      songIds.slice(0, 10).forEach((songId, idx) => {
        if (!results[songId]) results[songId] = { points: 0, voters: [] };
        results[songId].points += pointsArray[idx];
        results[songId].voters.push({ name: row.name, points: pointsArray[idx] });
      });
    });

    // Get song details
    const songs = await dbAll(db, 'SELECT id, number, country, title, artist FROM songs');
    const songMap = Object.fromEntries(songs.map(s => [s.id, s]));

    const output = Object.entries(results)
      .map(([songId, data]) => ({
        ...songMap[songId],
        points: data.points,
        voters: data.voters.sort((a, b) => b.points - a.points)
      }))
      .sort((a, b) => b.points - a.points);

    res.json({ results: output, resultsLocked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/lock-results - admin lock
app.post('/api/admin/lock-results', async (req, res) => {
  const { name } = req.body;

  if (name !== 'Inge') {
    return res.status(403).json({ error: 'Admin only' });
  }

  try {
    await dbRun(db,
      "UPDATE appState SET value = 'true' WHERE key = 'resultsLocked'"
    );

    res.json({ success: true, locked: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/songs/:id - update song
app.put('/api/admin/songs/:id', async (req, res) => {
  const { name } = req.body;

  if (name !== 'Inge') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { id } = req.params;
  const { country, artist, title, imageUrl } = req.body;

  try {
    await dbRun(db,
      `UPDATE songs SET country = ?, artist = ?, title = ?, imageUrl = ? WHERE id = ?`,
      [country, artist, title, imageUrl, id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback for SPA routing
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🎵 Eurovision app running on http://localhost:${PORT}`);
});
