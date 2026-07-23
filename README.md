# Bridge Network — Live Dashboard

Interactive live operations dashboard for monitoring Bridge Network nodes across the map.

## Features

- Full interactive map (Leaflet) with clickable bridge nodes
- Live-updating metrics: throughput, latency, alerts, packet rate
- Status filters (online / degraded / offline)
- Streaming activity feed with node focus
- Selected-node detail panel with live stats

## Quick start

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
