import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db = null;

export function initDb() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const dbPath = path.join(__dirname, 'eurovision.db');
    db = new sqlite3.Database(dbPath, async (err) => {
      if (err) {
        reject(err);
        return;
      }

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
