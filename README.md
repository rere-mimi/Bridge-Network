# Bridge Network — Live Dashboard

Interactive live operations dashboard for monitoring Bridge Network nodes across the map.

## Features

- Full interactive map (Leaflet) with clickable bridge nodes
- Live-updating metrics: throughput, latency, alerts, packet rate
- Status filters (online / degraded / offline)
- Streaming activity feed with node focus
- Selected-node detail panel with live stats

## Run on GitHub (no install needed)

After this is merged to `main` and Pages is enabled:

1. Open the repo on GitHub → **Settings** → **Pages**
2. Under **Build and deployment** → **Source**, choose **GitHub Actions**
3. Wait for the **Deploy to GitHub Pages** workflow to finish (Actions tab)
4. Open: **https://rere-mimi.github.io/Bridge-Network/**

## Quick start (local)

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Start development server |
| `npm run build`| Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run oxlint               |

## Stack

React 19 · TypeScript · Vite · Leaflet / react-leaflet
