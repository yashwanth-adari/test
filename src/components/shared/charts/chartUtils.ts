export type ColorUtility = 'bg' | 'stroke' | 'fill' | 'text'

export const chartColors = {
  blue: { bg: 'bg-blue-500', stroke: 'stroke-blue-500', fill: 'fill-blue-500', text: 'text-blue-500' },
  emerald: { bg: 'bg-emerald-500', stroke: 'stroke-emerald-500', fill: 'fill-emerald-500', text: 'text-emerald-500' },
  violet: { bg: 'bg-violet-500', stroke: 'stroke-violet-500', fill: 'fill-violet-500', text: 'text-violet-500' },
  amber: { bg: 'bg-amber-500', stroke: 'stroke-amber-500', fill: 'fill-amber-500', text: 'text-amber-500' },
  gray: { bg: 'bg-gray-500', stroke: 'stroke-gray-500', fill: 'fill-gray-500', text: 'text-gray-500' },
  cyan: { bg: 'bg-cyan-500', stroke: 'stroke-cyan-500', fill: 'fill-cyan-500', text: 'text-cyan-500' },
  pink: { bg: 'bg-pink-500', stroke: 'stroke-pink-500', fill: 'fill-pink-500', text: 'text-pink-500' },
  lime: { bg: 'bg-lime-500', stroke: 'stroke-lime-500', fill: 'fill-lime-500', text: 'text-lime-500' },
  fuchsia: { bg: 'bg-fuchsia-500', stroke: 'stroke-fuchsia-500', fill: 'fill-fuchsia-500', text: 'text-fuchsia-500' },
  indigo: { bg: 'bg-indigo-500', stroke: 'stroke-indigo-500', fill: 'fill-indigo-500', text: 'text-indigo-500' },
  red: { bg: 'bg-red-500', stroke: 'stroke-red-500', fill: 'fill-red-500', text: 'text-red-500' },
} as const satisfies Record<string, Record<ColorUtility, string>>

export type AvailableChartColors = keyof typeof chartColors

export function getColorClassName(color: AvailableChartColors, type: ColorUtility): string {
  return chartColors[color]?.[type] ?? chartColors.gray[type]
}

const colorHexMap: Record<AvailableChartColors, string> = {
  blue: '#3b82f6',
  emerald: '#10b981',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  gray: '#6b7280',
  cyan: '#06b6d4',
  pink: '#ec4899',
  lime: '#84cc16',
  fuchsia: '#d946ef',
  indigo: '#6366f1',
  red: '#ef4444',
}

export function getColorHex(color: AvailableChartColors): string {
  return colorHexMap[color] ?? colorHexMap.gray
}
