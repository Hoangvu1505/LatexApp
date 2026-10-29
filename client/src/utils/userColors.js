export const COLLABORATOR_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#84cc16', // Lime
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

export function getColorForEmail(email = '') {
  if (!email) return COLLABORATOR_COLORS[0];
  const hash = Math.abs(email.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
  return COLLABORATOR_COLORS[hash % COLLABORATOR_COLORS.length];
}
