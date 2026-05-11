export const NULL_DISPLAY = '—'

export function formatCompact(n: number, prefix = ''): string {
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(0)}K`
  return `${prefix}${n.toLocaleString()}`
}

export function formatPct(rate: number | null): string {
  if (rate === null) return NULL_DISPLAY
  return `${(rate * 100).toFixed(0)}%`
}

export function formatCurrency(n: number | null): string {
  if (n === null) return NULL_DISPLAY
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `€${Math.round(n / 1_000)}K`
  return `€${Math.round(n)}`
}

export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return ((current - previous) / previous) * 100
}
