import { initDb } from './db.js';
import fs from 'fs';
import path from 'path';

async function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

async function updateImages() {
  try {
    const db = await initDb();
    const filePath = path.join(process.cwd(), 'images.txt');

    if (!fs.existsSync(filePath)) {
      console.log('❌ images.txt ikke funnet');
      console.log('Opprett en fil med format:');
      console.log('Bulgaria\thttps://image.url/bulgaria.jpg');
      console.log('Azerbaijan\thttps://image.url/azerbaijan.jpg');
      process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.trim());

    let updated = 0;
    let notFound = 0;

    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length < 2) continue;

      const country = parts[0].trim();
      const imageUrl = parts[1].trim();

      const result = await dbRun(db,
        'UPDATE songs SET imageUrl = ? WHERE country = ?',
        [imageUrl, country]
      );

      if (result.changes > 0) {
        console.log(`✓ ${country}: bildet oppdatert`);
        updated++;
      } else {
        console.log(`⚠️  ${country}: ikke funnet i databasen`);
        notFound++;
      }
    }

    console.log(`\n✓ Oppdatert ${updated} sanger`);
    if (notFound > 0) console.log(`⚠️  ${notFound} land ikke funnet`);
    process.exit(0);
  } catch (error) {
    console.error('Feil:', error.message);
    process.exit(1);
  }
}

updateImages();
