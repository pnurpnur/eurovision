import { initDb, getDb } from './db.js';

// Country code mapping for flag images
const countryCodeMap = {
  'Austria': 'AT', 'France': 'FR', 'Germany': 'DE', 'Italy': 'IT', 'Spain': 'ES',
  'Sweden': 'SE', 'Ukraine': 'UA', 'Netherlands': 'NL', 'Greece': 'GR', 'Portugal': 'PT',
  'Poland': 'PL', 'Norway': 'NO', 'Finland': 'FI', 'Denmark': 'DK', 'Czechia': 'CZ',
  'Romania': 'RO', 'Serbia': 'RS', 'Bulgaria': 'BG', 'Hungary': 'HU', 'Slovenia': 'SI',
  'Lithuania': 'LT', 'Iceland': 'IS', 'Belgium': 'BE', 'United Kingdom': 'GB', 'Australia': 'AU'
};

// Eurovision 2026 - 25 songs (Grand Final participants)
const songs = [
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
