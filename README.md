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

## Setup

### Backend
```bash
cd backend
npm install
npm run seed    # Populate database with 25 Eurovision 2026 songs
npm start       # Start server on http://localhost:3001
```

### Frontend
```bash
cd frontend
# Deploy to Vercel, or serve locally during development
```

Set `REACT_APP_API_URL` environment variable to point to your backend API.

## Admin
Bruker med navn "Inge" kan låse resultatene via admin-panelet.
