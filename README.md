# 🇮🇳 India Explorer — Interactive State Map

A production-grade interactive map of India built with **React + Vite + Leaflet**.

## Features
- 31 states/UTs as GeoJSON polygons on Leaflet
- Hover tooltip following mouse (name, capital, population, area, language, est. year)
- Click to pin a detailed info panel (mobile tap supported)
- Zoom + pan via Leaflet controls
- Smooth CSS animations (tooltip fade-in, panel spring)
- Dark editorial theme — CARTO basemap, custom styled controls

## Quick Start
```bash
npm install
npm run dev        # → http://localhost:5173
npm run build      # Production build → dist/
npm run preview    # Preview production build
```

## Deploy to Vercel
```bash
npm i -g vercel
vercel --prod
```

## Deploy to Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

## Project Structure
```
india-map/
├── public/india-states.geojson   # GeoJSON polygons
├── src/
│   ├── App.jsx                   # Map + tooltip + info panel
│   ├── App.css                   # Dark theme styles
│   ├── stateData.js              # Capital, population, area data
│   └── main.jsx
└── index.html
```

## Customise State Data
Edit `src/stateData.js` — each entry is:
```js
"State Name": { capital, population, area, language, established }
```
