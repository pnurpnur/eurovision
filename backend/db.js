import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db = null;

export function initDb() {
  if (db) return;

  db = new Database(path.join(__dirname, 'eurovision.db'));
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      sessionId TEXT UNIQUE NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number INTEGER UNIQUE NOT NULL,
      country TEXT NOT NULL,
      artist TEXT NOT NULL,
      title TEXT NOT NULL,
      imageUrl TEXT
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      songId INTEGER NOT NULL,
      score REAL NOT NULL,
      scoreMethod TEXT DEFAULT '1-10',
      notes TEXT,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(songId) REFERENCES songs(id),
      UNIQUE(userId, songId)
    );

    CREATE TABLE IF NOT EXISTS finalRankings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER UNIQUE NOT NULL,
      rankedSongIds TEXT NOT NULL,
      submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS appState (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    INSERT OR IGNORE INTO appState (key, value) VALUES ('resultsLocked', 'false');
  `);
}

export function getDb() {
  return db;
}
