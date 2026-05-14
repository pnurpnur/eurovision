import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db = null;

// Eurovision 2026 - 25 songs
const SONGS_DATA = [
  { number: 1, country: 'Austria', artist: 'Karolina Protsenko', title: 'Hearts on Fire', imageUrl: 'https://flagcdn.com/w200/at.jpg' },
  { number: 2, country: 'France', artist: 'Slimane', title: 'Sentimentale', imageUrl: 'https://flagcdn.com/w200/fr.jpg' },
  { number: 3, country: 'Germany', artist: 'Lord of the Lost', title: 'Blood & Glitter', imageUrl: 'https://flagcdn.com/w200/de.jpg' },
  { number: 4, country: 'Italy', artist: 'Marco Mengoni', title: 'I Feel Good', imageUrl: 'https://flagcdn.com/w200/it.jpg' },
  { number: 5, country: 'Spain', artist: 'Blanca Paloma', title: 'Eaea', imageUrl: 'https://flagcdn.com/w200/es.jpg' },
  { number: 6, country: 'Sweden', artist: 'Marcus & Martinus', title: 'Unforgettable', imageUrl: 'https://flagcdn.com/w200/se.jpg' },
  { number: 7, country: 'Ukraine', artist: 'Kalush Orchestra', title: 'Stefania', imageUrl: 'https://flagcdn.com/w200/ua.jpg' },
  { number: 8, country: 'Netherlands', artist: 'S10', title: 'De Diepte', imageUrl: 'https://flagcdn.com/w200/nl.jpg' },
  { number: 9, country: 'Greece', artist: 'Amanda Georgiadi Hsvila', title: 'Die Together', imageUrl: 'https://flagcdn.com/w200/gr.jpg' },
  { number: 10, country: 'Portugal', artist: 'Mimicat', title: 'Ai Coração', imageUrl: 'https://flagcdn.com/w200/pt.jpg' },
  { number: 11, country: 'Poland', artist: 'Ochman', title: 'River', imageUrl: 'https://flagcdn.com/w200/pl.jpg' },
  { number: 12, country: 'Norway', artist: 'Alessandra', title: 'Dance Alone', imageUrl: 'https://flagcdn.com/w200/no.jpg' },
  { number: 13, country: 'Finland', artist: 'Käärijä', title: 'Spam', imageUrl: 'https://flagcdn.com/w200/fi.jpg' },
  { number: 14, country: 'Denmark', artist: 'Reddi', title: 'The Show', imageUrl: 'https://flagcdn.com/w200/dk.jpg' },
  { number: 15, country: 'Czechia', artist: 'We Are Domi', title: 'Lights Off', imageUrl: 'https://flagcdn.com/w200/cz.jpg' },
  { number: 16, country: 'Romania', artist: 'WRS', title: 'Llámame', imageUrl: 'https://flagcdn.com/w200/ro.jpg' },
  { number: 17, country: 'Serbia', artist: 'Konstrakta', title: 'In Corpore Sano', imageUrl: 'https://flagcdn.com/w200/rs.jpg' },
  { number: 18, country: 'Bulgaria', artist: 'Intelligent Music Project', title: 'Intention', imageUrl: 'https://flagcdn.com/w200/bg.jpg' },
  { number: 19, country: 'Hungary', artist: 'ByeAlex & Gipsy.hu', title: 'Violent Feelings', imageUrl: 'https://flagcdn.com/w200/hu.jpg' },
  { number: 20, country: 'Slovenia', artist: 'TVORCHI', title: 'Heart of Steel', imageUrl: 'https://flagcdn.com/w200/si.jpg' },
  { number: 21, country: 'Lithuania', artist: 'Andromeda', title: 'Discoteque', imageUrl: 'https://flagcdn.com/w200/lt.jpg' },
  { number: 22, country: 'Iceland', artist: 'Dádá Life', title: 'Zorra', imageUrl: 'https://flagcdn.com/w200/is.jpg' },
  { number: 23, country: 'Belgium', artist: 'Gustaph', title: 'In Your Eyes', imageUrl: 'https://flagcdn.com/w200/be.jpg' },
  { number: 24, country: 'United Kingdom', artist: 'Mae Muller', title: 'I Wrote A Song', imageUrl: 'https://flagcdn.com/w200/gb.jpg' },
  { number: 25, country: 'Australia', artist: 'Electric Fields', title: 'Awake and Alive', imageUrl: 'https://flagcdn.com/w200/au.jpg' }
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
