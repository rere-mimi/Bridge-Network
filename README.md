# Bridge Network — Live BIS Platform

Interactive Bridge Information System (BIS) for New Zealand bridge assets.

## Purpose

**Short term:** integrate bridge inventory, inspection records, condition data, risk models, and digital twin visualisation.

**Longer term:** with sufficient data, support lifecycle forecasting, maintenance planning, and unified operational + strategic decision-making.

## Modules

| Module | Role |
| --- | --- |
| Live map | Network overview with risk-coloured bridge markers |
| Inventory | Structures, ownership, geometry, coded elements |
| Inspection | Full 7-step BIS inspection workflow |
| Condition | Condition States 1–4 by element |
| Risk models | Composite risk factors and ranking |
| Digital twin | Structure visualisation linked to element inventory |
| Lifecycle & planning | Longer-term forecasting / programme (data-gated) |

## Inspection process (7 steps)

1. Divide the bridge into coded elements
2. Calculate the total quantity of each element
3. Enter the element data into BIS
4. Inspect each element and complete the report:
   - A. Environment Category (Low / Moderate / Severe)
   - B. Quantity or % in each Condition State (1–4)
   - C. Verify quantities / percentages total correctly
   - D. Record maintenance actions (activity number + description)
   - E. Record inspector comments
5. Submit to the Bridge Maintenance Planner (BMP)
6. Enter the inspection data into BIS
7. Generate required bridge inspection reports from BIS

## Run on GitHub

1. Merge to `main`
2. Repo **Settings → Pages → Source → GitHub Actions**
3. Open **https://rere-mimi.github.io/Bridge-Network/**

## Local

```bash
npm install
npm run dev
```

## Stack

React 19 · TypeScript · Vite · Leaflet / react-leaflet
