# Calcolatrice Finanziaria — Vite + React + Tailwind

## Dev
```bash
npm i
npm run dev
```

## Build
```bash
npm run build
```

## Netlify
- Create a new site from Git (Repo root).
- Build command: `npm run build`
- Publish directory: `dist`
- Alternatively use `netlify deploy` CLI.


## PWA
- Manifest: `public/manifest.webmanifest`
- Service worker: `public/sw.js` (cache-first per asset statici)
- Icone: `public/icons/*`
- Registration: in `src/main.jsx`

Su Netlify non serve configurazione extra.


## Calcolo rapido
- Campo espressione con parser sicuro (niente `eval`).
- Supporta `+ - * / ( )`, virgola o punto come decimale, `=` iniziale opzionale.
