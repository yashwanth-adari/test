# Finance Movements Dashboard

Internal Finance KPI dashboard for deepset.ai. Displays ACV movement KPIs and ARR trends from the `business-intelligence` Dataform project. Follows the same architecture as `revops-dashboards`.

## Quick Reference

- **Stack**: Next.js 15, React 19, shadcn/ui v4 (base-ui, NOT Radix), Tailwind CSS 4, React Query, Recharts
- **Runtime**: Cloud Run (europe-west3), Docker, Node.js 20
- **Data**: BigQuery `data-warehouse-deepset.raw_salesforce` — tables built by Dataform in the `business-intelligence` repo
- **Auth**: IAP (Identity-Aware Proxy) — Google SSO, `@deepset.ai` domain
- **CI/CD**: GitHub Actions → push to main auto-deploys (same pattern as revops-dashboards)

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
│   ├── (dashboards)/finance/     # Finance dashboard route
│   ├── api/
│   │   ├── health/               # Liveness probe
│   │   └── finance/
│   │       ├── acv-movement/     # ACV movement KPIs
│   │       ├── arr/              # ARR by month/segment
│   │       └── filter-options/   # Segments + fiscal years
│   └── layout.tsx
├── components/
│   ├── layout/                   # AppShell, Sidebar, TopBar
│   ├── shared/                   # KpiCard, ErrorFallback, charts
│   └── ui/                       # shadcn/ui primitives
├── dashboards/finance/
│   ├── components/
│   │   ├── acv-movement/         # ACV Movement tab
│   │   └── arr/                  # ARR tab
│   └── hooks/
│       └── use-filters.tsx       # Shared filter context
├── hooks/
│   └── use-sidebar-collapsed.ts
└── lib/shared/
    ├── bigquery.ts               # runQuery<T> helper
    ├── api.ts                    # apiFetch client helper
    ├── constants.ts              # Table refs, granularity options
    ├── format.ts                 # formatCurrency, formatPct, etc.
    └── types.ts                  # FinanceFilters, AcvMovementRow, ArrRow
```

## BigQuery Tables

| Table | Description |
|---|---|
| `data-warehouse-deepset.raw_salesforce.mart_sf_acv_booking_movement_kpis` | ACV movement KPIs: New Logo, Upsell, Churn, Downgrade, Net New ACV, ACV EoP |
| `data-warehouse-deepset.raw_salesforce.mart_sf_arr_by_customer_monthly` | ARR by customer and segment, monthly |

Tables are built by Dataform in the `business-intelligence` repo.

## Dashboard Tabs

- **ACV Movement** — Stacked bar chart of movement components (New Logo, Upsell, Churn, Downgrade). Filters: granularity (monthly/quarterly/yearly), segment, fiscal year.
- **ARR** — Area chart of ARR trend over time. ARR by segment stacked view.

## GCP Setup (new deployment)

Before deploying, create the Artifact Registry repo:
```bash
gcloud artifacts repositories create finance-movements \
  --repository-format=docker \
  --location=europe-west3 \
  --project=gtm-agents-deepset
```

Then deploy the Cloud Run service with IAP:
```bash
# Deploy (see scripts/deploy.sh for full flow)
./scripts/deploy.sh

# After first push, deploy to Cloud Run:
gcloud run deploy finance-movements \
  --image=europe-west3-docker.pkg.dev/gtm-agents-deepset/finance-movements/finance-movements:latest \
  --region=europe-west3 \
  --project=gtm-agents-deepset \
  --service-account=dashboard-runner@gtm-agents-deepset.iam.gserviceaccount.com \
  --no-allow-unauthenticated
```

## shadcn/ui v4 Gotchas

Same as revops-dashboards — uses base-ui, NOT Radix:
- No `asChild`
- `onValueChange` receives `string | null`, not `string`
- `SelectValue` doesn't auto-resolve labels — render labels explicitly in trigger
