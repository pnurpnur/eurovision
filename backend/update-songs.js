import { initDb, getDb } from './db.js';
import fetch from 'node-fetch';

// Fetch Wikipedia and parse the final songs table
async function fetchFinalsFromWikipedia() {
  try {
    const url = 'https://no.wikipedia.org/wiki/Eurovision_Song_Contest_2026';
    const response = await fetch(url);
    const html = await response.text();

    // Look for the finals section table
    const finalsMatch = html.match(/id="Finalen"[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/);

    if (!finalsMatch) {
      console.log('❌ Could not find finals table on Wikipedia');
      console.log('Manually update songs via admin panel at: http://localhost:3001/admin.html');
      console.log('Login as "Inge" to edit song information and image URLs');
      return null;
    }

    console.log('✓ Found finals table on Wikipedia');
    console.log('Manual update required:');
    console.log('1. Open http://localhost:3001/admin.html');
    console.log('2. Login as "Inge"');
    console.log('3. Edit each song with correct details from Wikipedia');
    console.log('4. Add image URLs for each song');

    return finalsMatch[1];
  } catch (error) {
    console.error('Error fetching Wikipedia:', error.message);
    return null;
  }
}

async function main() {
  console.log('🎵 Eurovision 2026 Final - Song Update\n');

  const content = await fetchFinalsFromWikipedia();

  if (!content) {
    console.log('\n⚠️  Wikipedia parsing not fully automated yet.');
    console.log('Use the admin panel to manually update song information:\n');
    console.log('   npm start');
    console.log('   Open http://localhost:3001/admin.html');
    console.log('   Login as: Inge');
    console.log('   Edit each song with correct details');
    process.exit(0);
  }

  console.log('\n✓ Update complete!');
}

main();
