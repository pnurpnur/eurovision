export async function fetchFinalsFromWikipedia() {
  try {
    const url = 'https://no.wikipedia.org/wiki/Eurovision_Song_Contest_2026';
    const response = await fetch(url);
    const html = await response.text();

    // Look for the finals section table
    const finalsMatch = html.match(/id="Finalen"[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/);

    if (!finalsMatch) {
      throw new Error('Could not find finals table on Wikipedia');
    }

    const tableHtml = finalsMatch[1];
    const rows = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/g) || [];

    const songs = [];
    let number = 1;

    for (const row of rows) {
      const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [];

      if (cells.length >= 3) {
        const extractText = (html) => {
          return html
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .trim();
        };

        const country = extractText(cells[0]);
        const artist = extractText(cells[1]);
        const title = extractText(cells[2]);

        if (country && artist && title) {
          songs.push({
            number: number++,
            country,
            artist,
            title,
            imageUrl: ''
          });
        }
      }
    }

    if (songs.length === 0) {
      throw new Error('No songs found in table');
    }

    return songs;
  } catch (error) {
    throw new Error(`Wikipedia fetch error: ${error.message}`);
  }
}
