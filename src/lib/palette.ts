/** Warm, storybook spine colours assigned to new books so a shelf stays lively. */
export const SPINE_COLORS = [
  '#c94f3d', // tomato
  '#e08a2e', // marmalade
  '#d8b13a', // honey
  '#5a9e4b', // leaf
  '#2f8f79', // teal
  '#3f6fb5', // cornflower
  '#8256a8', // plum
  '#c05c8e', // berry
]

export const SHELF_ACCENTS = ['#2f8f79', '#5a9e4b', '#3a9a86', '#6aab3f', '#28806c']

export function pickSpineColor(seedIndex: number): string {
  return SPINE_COLORS[seedIndex % SPINE_COLORS.length]
}

export function pickAccent(seedIndex: number): string {
  return SHELF_ACCENTS[seedIndex % SHELF_ACCENTS.length]
}
