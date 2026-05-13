# Finance Movements Dashboard

Internal Finance KPI dashboard for deepset.ai. Displays ACV movement KPIs as a Looker-style pivot table, sourced from the `business-intelligence` Dataform project.

## Quick Reference

- **Stack**: Next.js 15, React 19, shadcn/ui v4 (base-ui, NOT Radix), Tailwind CSS 4, React Query, Recharts
- **Runtime**: Cloud Run (europe-west4), Docker, Node.js 20
- **Data**: BigQuery `data-warehouse-deepset.raw_data` — tables built by Dataform in the `business-intelligence` repo
- **Auth**: IAP (Identity-Aware Proxy) — Google SSO, `@deepset.ai` domain
- **CI/CD**: GitHub Actions → push to main auto-deploys

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Dev server (localhost:3000)
npm run build        # Production build
npx tsc --noEmit     # Type check (run before committing)
```

## Local Dev

Requires `.env.local`:
```
GOOGLE_CLOUD_PROJECT=gtm-agents-deepset
```

And ADC configured:
```bash
gcloud auth application-default login
gcloud auth application-default set-quota-project gtm-agents-deepset
```

## Architecture

```
src/
├── app/
│   ├── (dashboards)/finance/     # Finance dashboard route (single page, no tabs)
│   ├── api/
│   │   ├── health/               # Liveness probe
│   │   └── finance/
│   │       ├── pivot/            # Main pivot data (GET: startMonth, endMonth, segment, fiscalQuarter)
│   │       │   └── detail/       # Drill-down by kpiType + month + segment
│   │       └── filter-options/   # Segments + fiscal quarters + min/max month
│   └── layout.tsx
├── components/
│   ├── layout/                   # AppShell, Sidebar, TopBar
│   ├── shared/                   # KpiCard, ErrorFallback, charts
│   └── ui/                       # shadcn/ui primitives
├── dashboards/finance/
│   ├── components/
│   │   └── pivot/
│   │       ├── finance-pivot-tab.tsx   # Main container: filters, headline tiles, table, chart
│   │       ├── pivot-table.tsx         # Pivot table with sticky KPI column + fiscal quarter headers
│   │       ├── drill-down-drawer.tsx   # Slide-over drawer: account-level detail for clicked cell
│   │       ├── export-menu.tsx         # CSV download + print-to-PDF
│   │       └── pivot-chart.tsx         # Stacked bar chart (New Logo, Upsell, Churn, Downgrade)
│   └── hooks/
│       └── use-filters.tsx       # Shared filter context (startMonth, endMonth, segment, fiscalQuarter)
├── hooks/
│   └── use-sidebar-collapsed.ts
└── lib/shared/
    ├── bigquery.ts               # runQuery<T> helper
    ├── api.ts                    # apiFetch client helper
    ├── constants.ts              # ACV_MOVEMENT_TABLE ref
    ├── format.ts                 # formatCurrency, formatPct, etc.
    └── types.ts                  # FinanceFilters, PivotDataRow, AcvDetailRow, FilterOptionsResponse
```

## BigQuery Table

| Table | Description |
|---|---|
| `data-warehouse-deepset.raw_data.acv_booking_movement_kpis` | UNION of ACV movement KPIs + bookings. kpi_types: Bookings, New Logo, Upsell, New ACV, Churn, Downgrade, Net New ACV, ACV (EoP) |

Built by Dataform (`business-intelligence` repo). Combines:
- `acv_movement_kpis` — first-of-month dates
- `booking_monthly` — last-of-month dates

All queries use `DATE_TRUNC(month, MONTH)` to normalise both into the same calendar month bucket.

## Dashboard Features

- **Pivot table** — rows = kpi_type (ordered by `kpi_order`), columns = months grouped by fiscal quarter. Sticky first column, alternating quarter shading, row icons + tooltips, left border accents per KPI.
- **Cell click → drill-down drawer** — slide-over showing account_name + value for that kpi_type/month/segment. All kpi_types (including Bookings) query `acv_booking_movement_kpis`.
- **Headline KPI tiles** — ACV (EoP) and Net New ACV with MoM % change.
- **Period preset pills** — 6M / 12M / 24M shortcuts.
- **Stacked bar chart** — New Logo, Upsell, Churn, Downgrade per month.
- **Export** — CSV download + print-to-PDF.

## Filters

- `startMonth` / `endMonth` — YYYY-MM-01 format
- `segment` — 'All' or specific segment string
- `fiscalQuarter` — 'All' or "FY'26 Q3" style
- Default: endMonth = first of (current month − 1), startMonth = 5 months prior (6 months visible)

## Fiscal Calendar

deepset fiscal year runs Feb–Jan:
- Q1 = Feb–Apr, Q2 = May–Jul, Q3 = Aug–Oct, Q4 = Nov–Jan

## GCP Setup (new deployment)

Before deploying, create the Artifact Registry repo:
```bash
gcloud artifacts repositories create finance-movements \
  --repository-format=docker \
  --location=europe-west4 \
  --project=gtm-agents-deepset
```

Then deploy the Cloud Run service with IAP:
```bash
# Deploy (see scripts/deploy.sh for full flow)
./scripts/deploy.sh

# After first push, deploy to Cloud Run:
gcloud run deploy finance-movements \
  --image=europe-west4-docker.pkg.dev/gtm-agents-deepset/finance-movements/finance-movements:latest \
  --region=europe-west4 \
  --project=gtm-agents-deepset \
  --service-account=dashboard-runner@gtm-agents-deepset.iam.gserviceaccount.com \
  --no-allow-unauthenticated
```

## shadcn/ui v4 Gotchas

Uses base-ui, NOT Radix:
- No `asChild`
- `onValueChange` receives `string | null`, not `string`
- `SelectValue` doesn't auto-resolve labels — render labels explicitly in trigger
