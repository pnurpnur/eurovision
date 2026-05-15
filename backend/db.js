import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db = null;

// Eurovision 2026 - 25 songs
const SONGS_DATA = [
  { number: 1, country: 'Østerrike', artist: 'Karolina Protsenko', title: 'Hearts on Fire', imageUrl: '' },
  { number: 2, country: 'Frankrike', artist: 'Slimane', title: 'Sentimentale', imageUrl: '' },
  { number: 3, country: 'Tyskland', artist: 'Lord of the Lost', title: 'Blood & Glitter', imageUrl: '' },
  { number: 4, country: 'Italia', artist: 'Marco Mengoni', title: 'I Feel Good', imageUrl: '' },
  { number: 5, country: 'Spania', artist: 'Blanca Paloma', title: 'Eaea', imageUrl: '' },
  { number: 6, country: 'Sverige', artist: 'Marcus & Martinus', title: 'Unforgettable', imageUrl: '' },
  { number: 7, country: 'Ukraina', artist: 'Kalush Orchestra', title: 'Stefania', imageUrl: '' },
  { number: 8, country: 'Nederland', artist: 'S10', title: 'De Diepte', imageUrl: '' },
  { number: 9, country: 'Hellas', artist: 'Amanda Georgiadi Hsvila', title: 'Die Together', imageUrl: '' },
  { number: 10, country: 'Portugal', artist: 'Mimicat', title: 'Ai Coração', imageUrl: '' },
  { number: 11, country: 'Polen', artist: 'Ochman', title: 'River', imageUrl: '' },
  { number: 12, country: 'Norge', artist: 'Alessandra', title: 'Dance Alone', imageUrl: '' },
  { number: 13, country: 'Finland', artist: 'Käärijä', title: 'Spam', imageUrl: '' },
  { number: 14, country: 'Danmark', artist: 'Reddi', title: 'The Show', imageUrl: '' },
  { number: 15, country: 'Tsjekkia', artist: 'We Are Domi', title: 'Lights Off', imageUrl: '' },
  { number: 16, country: 'Romania', artist: 'WRS', title: 'Llámame', imageUrl: '' },
  { number: 17, country: 'Serbia', artist: 'Konstrakta', title: 'In Corpore Sano', imageUrl: '' },
  { number: 18, country: 'Bulgaria', artist: 'Intelligent Music Project', title: 'Intention', imageUrl: '' },
  { number: 19, country: 'Ungarn', artist: 'ByeAlex & Gipsy.hu', title: 'Violent Feelings', imageUrl: '' },
  { number: 20, country: 'Slovenia', artist: 'TVORCHI', title: 'Heart of Steel', imageUrl: '' },
  { number: 21, country: 'Litauen', artist: 'Andromeda', title: 'Discoteque', imageUrl: '' },
  { number: 22, country: 'Island', artist: 'Dádá Life', title: 'Zorra', imageUrl: '' },
  { number: 23, country: 'Belgia', artist: 'Gustaph', title: 'In Your Eyes', imageUrl: '' },
  { number: 24, country: 'Storbritannia', artist: 'Mae Muller', title: 'I Wrote A Song', imageUrl: '' },
  { number: 25, country: 'Australia', artist: 'Electric Fields', title: 'Awake and Alive', imageUrl: '' }
];

async function checkAndSeed(database) {
  try {
    const songCount = await new Promise((resolve, reject) => {
      database.get('SELECT COUNT(*) as count FROM songs', (err, row) => {
        if (err) reject(err);
        else resolve(row?.count || 0);
      });
    });

    if (songCount === 0) {
      console.log(`[DB SEED] No songs found, seeding ${SONGS_DATA.length} songs...`);
      for (const song of SONGS_DATA) {
        await runAsync(database,
          'INSERT INTO songs (number, country, artist, title, imageUrl) VALUES (?, ?, ?, ?, ?)',
          [song.number, song.country, song.artist, song.title, song.imageUrl]
        );
      }
      console.log(`[DB SEED] ✓ Successfully seeded ${SONGS_DATA.length} songs`);
    }
  } catch (error) {
    console.error(`[DB SEED ERROR] ${error.message}`, error);
  }
}

export function initDb() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    // Use persistent volume on Railway, or local backend directory
    const baseDir = process.env.NODE_ENV === 'production' ? '/data' : __dirname;
    const dbPath = path.join(baseDir, 'eurovision.db');
    console.log(`[DB INIT] Initializing database at: ${dbPath}`);
    console.log(`[DB INIT] NODE_ENV: ${process.env.NODE_ENV}`);

    db = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        console.error(`[DB INIT ERROR] Failed to open database:`, err);
        reject(err);
        return;
      }

      console.log(`[DB INIT] Database opened successfully`);
      try {
        // Create tables one by one
        await runAsync(db, `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          sessionId TEXT UNIQUE NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        await runAsync(db, `CREATE TABLE IF NOT EXISTS songs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          number INTEGER UNIQUE NOT NULL,
          country TEXT NOT NULL,
          artist TEXT NOT NULL,
          title TEXT NOT NULL,
          imageUrl TEXT
        )`);

        await runAsync(db, `CREATE TABLE IF NOT EXISTS ratings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          songId INTEGER NOT NULL,
          score REAL NOT NULL,
          scoreMethod TEXT DEFAULT '1-10',
          notes TEXT,
          FOREIGN KEY(userId) REFERENCES users(id),
          FOREIGN KEY(songId) REFERENCES songs(id),
          UNIQUE(userId, songId)
        )`);

        await runAsync(db, `CREATE TABLE IF NOT EXISTS finalRankings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER UNIQUE NOT NULL,
          rankedSongIds TEXT NOT NULL,
          submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(userId) REFERENCES users(id)
        )`);

        await runAsync(db, `CREATE TABLE IF NOT EXISTS appState (
          key TEXT PRIMARY KEY,
          value TEXT
        )`);

        await runAsync(db, "INSERT OR IGNORE INTO appState (key, value) VALUES ('resultsLocked', 'false')");

        // Auto-seed if no songs exist
        await checkAndSeed(db);

        console.log(`[DB INIT] Database initialization complete`);
        resolve(db);
      } catch (err) {
        reject(err);
      }
    });
  });
}

function runAsync(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID });
    });
  });
}

export function getDb() {
  return db;
}
