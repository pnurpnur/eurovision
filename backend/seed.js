import { initDb, getDb } from './db.js';

// Eurovision 2026 - 25 songs (Grand Final participants)
const songs = [
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

function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID });
    });
  });
}

function dbAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function seedDatabase() {
  try {
    const db = await initDb();

    // Clear existing songs
    await dbRun(db, 'DELETE FROM songs');

    // Insert songs
    for (const song of songs) {
      await dbRun(db,
        'INSERT INTO songs (number, country, artist, title, imageUrl) VALUES (?, ?, ?, ?, ?)',
        [song.number, song.country, song.artist, song.title, song.imageUrl]
      );
    }

    console.log(`✓ Seeded ${songs.length} songs into database!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
