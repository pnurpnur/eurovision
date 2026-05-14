# Eurovision Voting App 🎵

En enkel og lettvekt voting-app for Eurovision med 10 deltakere.

## Features
- Brukerregistrering (navn + session)
- Scoring av 25 sanger med 3 metoder (terningkast, ±±/middel, 1-10)
- Drag-drop final ranking
- Poengfordeling (12-10-8-7-...-1 til top 10)
- Samlet resultat fra alle deltakere
- Admin-lock (bruker "Inge" kan lukke avstemningen)

## Stack
- **Backend**: Node.js + Express + SQLite
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Hosting**: Railway (backend), Vercel (frontend)

## Local Development

```bash
# Install dependencies
cd backend
npm install
npm run seed    # Populate database with 25 Eurovision 2026 songs
npm start       # Start server on http://localhost:3001
```

Then open `http://localhost:3001` in your browser. Frontend is served from the same Express server.

## Deployment on Railway

Both backend and frontend are served from the same Node.js app on Railway.

### Steps:
1. Create a Railway project: https://railway.app
2. Connect your GitHub repo
3. Add environment variables if needed
4. Deploy!

Railway will automatically:
- Install dependencies (`npm install`)
- Run the start script (`npm start`)
- Serve frontend + backend from the same app

**Database:** SQLite file is persisted on Railway's volume storage (one time setup required).

### First deployment checklist:
- [ ] Push code to GitHub
- [ ] Railway connected to repo
- [ ] Server starts with `npm start`
- [ ] API endpoint works: `/api/songs`
- [ ] Frontend loads at root: `/`

## Admin
Bruker med navn "Inge" kan låse resultatene via admin-panelet.
