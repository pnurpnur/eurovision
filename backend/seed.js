import { initDb, getDb } from './db.js';

// Eurovision 2026 - 25 songs (Grand Final participants)
const songs = [
  { number: 1, country: 'Austria', artist: 'Karolina Protsenko', title: 'Hearts on Fire', imageUrl: 'https://via.placeholder.com/200?text=Austria' },
  { number: 2, country: 'France', artist: 'Slimane', title: 'Sentimentale', imageUrl: 'https://via.placeholder.com/200?text=France' },
  { number: 3, country: 'Germany', artist: 'Lord of the Lost', title: 'Blood & Glitter', imageUrl: 'https://via.placeholder.com/200?text=Germany' },
  { number: 4, country: 'Italy', artist: 'Marco Mengoni', title: 'I Feel Good', imageUrl: 'https://via.placeholder.com/200?text=Italy' },
  { number: 5, country: 'Spain', artist: 'Blanca Paloma', title: 'Eaea', imageUrl: 'https://via.placeholder.com/200?text=Spain' },
  { number: 6, country: 'Sweden', artist: 'Marcus & Martinus', title: 'Unforgettable', imageUrl: 'https://via.placeholder.com/200?text=Sweden' },
  { number: 7, country: 'Ukraine', artist: 'Kalush Orchestra', title: 'Stefania', imageUrl: 'https://via.placeholder.com/200?text=Ukraine' },
  { number: 8, country: 'Netherlands', artist: 'S10', title: 'De Diepte', imageUrl: 'https://via.placeholder.com/200?text=Netherlands' },
  { number: 9, country: 'Greece', artist: 'Amanda Georgiadi Hsvila', title: 'Die Together', imageUrl: 'https://via.placeholder.com/200?text=Greece' },
  { number: 10, country: 'Portugal', artist: 'Mimicat', title: 'Ai Coração', imageUrl: 'https://via.placeholder.com/200?text=Portugal' },
  { number: 11, country: 'Poland', artist: 'Ochman', title: 'River', imageUrl: 'https://via.placeholder.com/200?text=Poland' },
  { number: 12, country: 'Norway', artist: 'Alessandra', title: 'Dance Alone', imageUrl: 'https://via.placeholder.com/200?text=Norway' },
  { number: 13, country: 'Finland', artist: 'Käärijä', title: 'Spam', imageUrl: 'https://via.placeholder.com/200?text=Finland' },
  { number: 14, country: 'Denmark', artist: 'Reddi', title: 'The Show', imageUrl: 'https://via.placeholder.com/200?text=Denmark' },
  { number: 15, country: 'Czechia', artist: 'We Are Domi', title: 'Lights Off', imageUrl: 'https://via.placeholder.com/200?text=Czechia' },
  { number: 16, country: 'Romania', artist: 'WRS', title: 'Llámame', imageUrl: 'https://via.placeholder.com/200?text=Romania' },
  { number: 17, country: 'Serbia', artist: 'Konstrakta', title: 'In Corpore Sano', imageUrl: 'https://via.placeholder.com/200?text=Serbia' },
  { number: 18, country: 'Bulgaria', artist: 'Intelligent Music Project', title: 'Intention', imageUrl: 'https://via.placeholder.com/200?text=Bulgaria' },
  { number: 19, country: 'Hungary', artist: 'ByeAlex & Gipsy.hu', title: 'Violent Feelings', imageUrl: 'https://via.placeholder.com/200?text=Hungary' },
  { number: 20, country: 'Czechia', artist: 'TVORCHI', title: 'Heart of Steel', imageUrl: 'https://via.placeholder.com/200?text=TVORCHI' },
  { number: 21, country: 'Lithuania', artist: 'Andromeda', title: 'Discoteque', imageUrl: 'https://via.placeholder.com/200?text=Lithuania' },
  { number: 22, country: 'Iceland', artist: 'Dádá Life', title: 'Zorra', imageUrl: 'https://via.placeholder.com/200?text=Iceland' },
  { number: 23, country: 'Belgium', artist: 'Gustaph', title: 'In Your Eyes', imageUrl: 'https://via.placeholder.com/200?text=Belgium' },
  { number: 24, country: 'United Kingdom', artist: 'Mae Muller', title: 'I Wrote A Song', imageUrl: 'https://via.placeholder.com/200?text=UK' },
  { number: 25, country: 'Australia', artist: 'Electric Fields', title: 'Awake and Alive', imageUrl: 'https://via.placeholder.com/200?text=Australia' }
];

async function seedDatabase() {
  try {
    initDb();
    const db = getDb();

    // Clear existing songs
    db.prepare('DELETE FROM songs').run();

    // Insert songs
    const stmt = db.prepare(
      'INSERT INTO songs (number, country, artist, title, imageUrl) VALUES (?, ?, ?, ?, ?)'
    );

    songs.forEach(song => {
      stmt.run(song.number, song.country, song.artist, song.title, song.imageUrl);
    });

    console.log(`✓ Seeded ${songs.length} songs into database!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
