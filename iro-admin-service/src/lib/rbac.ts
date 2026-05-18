const LEVEL: Record<string, number> = {
  L1: 1,
  L2: 2,
  L3: 3,
  L4: 4,
  L5: 5,
  L6: 6,
  L7: 7,
  L8: 8,
};

export function levelRank(code: string | undefined): number {
  if (!code) return 99;
  return LEVEL[code.toUpperCase()] ?? 99;
}

/** Admin panel: L1–L6 only (volunteers / booth workers excluded). */
export function canAccessAdminPanel(levelCode: string | undefined): boolean {
  const r = levelRank(levelCode);
  return r >= 1 && r <= 6;
}

/** Viewer may assign roles strictly junior to their level (numeric rank higher). */
export function canManageLevel(viewerLevel: string | undefined, targetLevel: string): boolean {
  const v = levelRank(viewerLevel);
  const t = levelRank(targetLevel);
  if (v >= 99 || t >= 99) return false;
  return t > v;
}
