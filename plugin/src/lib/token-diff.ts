/**
 * Token Diff Engine
 *
 * Compares two token snapshots and returns a structured diff:
 * - added:   tokens that exist now but didn't before
 * - removed: tokens that existed before but don't now
 * - changed: tokens whose light or dark value changed
 *
 * Snapshots are persisted in Figma shared plugin data between sessions.
 */

import type { ResolvedToken } from "./types";

const PLUGIN_NAMESPACE = "figma_handoff";
const SNAPSHOT_KEY     = "token-snapshot";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenSnapshot {
  [cssVar: string]: { light: string; dark?: string };
}

export type ChangeType = "added" | "removed" | "changed";

export interface TokenChange {
  cssVar:  string;
  type:    ChangeType;
  before?: { light: string; dark?: string };
  after?:  { light: string; dark?: string };
}

export interface TokenDiff {
  changes:    TokenChange[];
  hasChanges: boolean;
  added:      number;
  removed:    number;
  changed:    number;
}

// ─── Snapshot helpers ─────────────────────────────────────────────────────────

export function tokensToSnapshot(tokens: ResolvedToken[]): TokenSnapshot {
  const snapshot: TokenSnapshot = {};
  for (const t of tokens) {
    snapshot[t.cssVar] = { light: t.light, ...(t.dark ? { dark: t.dark } : {}) };
  }
  return snapshot;
}

export function saveSnapshot(tokens: ResolvedToken[]): void {
  const snapshot = tokensToSnapshot(tokens);
  figma.root.setSharedPluginData(PLUGIN_NAMESPACE, SNAPSHOT_KEY, JSON.stringify(snapshot));
}

export function loadSnapshot(): TokenSnapshot | null {
  const raw = figma.root.getSharedPluginData(PLUGIN_NAMESPACE, SNAPSHOT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TokenSnapshot;
  } catch {
    return null;
  }
}

// ─── Diff engine ──────────────────────────────────────────────────────────────

export function diffTokens(
  previous: TokenSnapshot | null,
  current: TokenSnapshot
): TokenDiff {
  const changes: TokenChange[] = [];

  if (!previous) {
    // No previous snapshot — treat everything as a first export (no diff)
    return { changes: [], hasChanges: false, added: 0, removed: 0, changed: 0 };
  }

  const allKeys = new Set([...Object.keys(previous), ...Object.keys(current)]);

  for (const cssVar of allKeys) {
    const before = previous[cssVar];
    const after  = current[cssVar];

    if (!before && after) {
      changes.push({ cssVar, type: "added", after });
    } else if (before && !after) {
      changes.push({ cssVar, type: "removed", before });
    } else if (before && after) {
      if (before.light !== after.light || before.dark !== after.dark) {
        changes.push({ cssVar, type: "changed", before, after });
      }
    }
  }

  // Sort: changed first, then added, then removed
  const order: Record<ChangeType, number> = { changed: 0, added: 1, removed: 2 };
  changes.sort((a, b) => order[a.type] - order[b.type]);

  return {
    changes,
    hasChanges: changes.length > 0,
    added:   changes.filter(c => c.type === "added").length,
    removed: changes.filter(c => c.type === "removed").length,
    changed: changes.filter(c => c.type === "changed").length,
  };
}

// ─── CSS patch generator ──────────────────────────────────────────────────────

/** Generate a minimal CSS patch showing only what changed */
export function generatePatch(diff: TokenDiff): string {
  if (!diff.hasChanges) return "";

  const lines: string[] = [];

  const changed = diff.changes.filter(c => c.type === "changed" || c.type === "added");
  const removed = diff.changes.filter(c => c.type === "removed");

  if (changed.length > 0) {
    lines.push("/* Updated/Added tokens */");
    lines.push(":root {");
    for (const c of changed) {
      if (c.type === "changed" && c.before) {
        lines.push(`  /* was: ${c.before.light} */`);
      }
      lines.push(`  ${c.cssVar}: ${c.after!.light};`);
    }
    lines.push("}");

    const darkChanged = changed.filter(c => c.after?.dark);
    if (darkChanged.length > 0) {
      lines.push('\n[data-theme="dark"] {');
      for (const c of darkChanged) {
        if (c.type === "changed" && c.before?.dark) {
          lines.push(`  /* was: ${c.before.dark} */`);
        }
        lines.push(`  ${c.cssVar}: ${c.after!.dark};`);
      }
      lines.push("}");
    }
  }

  if (removed.length > 0) {
    lines.push("\n/* Removed tokens — delete these from your globals.css */");
    for (const c of removed) {
      lines.push(`/* ${c.cssVar}: ${c.before!.light}; */`);
    }
  }

  return lines.join("\n");
}
