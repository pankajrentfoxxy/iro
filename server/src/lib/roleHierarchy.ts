/** Numeric rank: L1 strongest → L8 volunteer. */
export const ROLE_HIERARCHY: Record<string, number> = {
  L1: 1,
  L2: 2,
  L3: 3,
  L4: 4,
  L5: 5,
  L6: 6,
  L7: 7,
  L8: 8,
};

export function normalizeLevelCode(levelCode: string): string {
  const s = levelCode.trim().toUpperCase();
  const m = s.match(/^L(\d+)$/);
  if (!m) return "";
  const n = Number(m[1]);
  if (n < 1 || n > 8) return "";
  return `L${n}`;
}

/**
 * Roles that `levelCode` may issue hierarchical invites for (strictly lower in hierarchy).
 * L8 may only target L8 (peer volunteer invites).
 */
export function getAllowedReferralLevels(levelCode: string): string[] {
  const code = normalizeLevelCode(levelCode);
  const rank = ROLE_HIERARCHY[code];
  if (!rank) return [];

  if (rank >= 8) {
    return ["L8"];
  }

  const out: string[] = [];
  for (let r = rank + 1; r <= 8; r++) {
    out.push(`L${r}`);
  }
  return out;
}

export function canInviteTargetLevel(inviterLevelCode: string, targetLevelCode: string): boolean {
  const allowed = new Set(getAllowedReferralLevels(inviterLevelCode));
  return allowed.has(normalizeLevelCode(targetLevelCode));
}
