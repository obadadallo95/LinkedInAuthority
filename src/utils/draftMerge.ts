export type DraftMergeResult = {
  content: string;
  hasConflicts: boolean;
};

/**
 * Conservative line-level three-way merge for draft conflicts.
 * Unchanged lines are taken from the side that changed them; genuinely
 * divergent lines receive explicit markers so the reviewer can resolve them
 * in the editor before saving. This never silently discards either version.
 */
export function mergeDraftVersions(base: string, local: string, server: string): DraftMergeResult {
  if (local === server) return { content: local, hasConflicts: false };
  if (local === base) return { content: server, hasConflicts: false };
  if (server === base) return { content: local, hasConflicts: false };

  const baseLines = base.split('\n');
  const localLines = local.split('\n');
  const serverLines = server.split('\n');
  const merged: string[] = [];
  let hasConflicts = false;

  for (let index = 0; index < Math.max(baseLines.length, localLines.length, serverLines.length); index++) {
    const baseLine = baseLines[index] ?? '';
    const localLine = localLines[index] ?? '';
    const serverLine = serverLines[index] ?? '';
    if (localLine === serverLine) {
      merged.push(localLine);
    } else if (localLine === baseLine) {
      merged.push(serverLine);
    } else if (serverLine === baseLine) {
      merged.push(localLine);
    } else {
      hasConflicts = true;
      merged.push('<<<<<<< YOUR EDITS', localLine, '=======', serverLine, '>>>>>>> LATEST SAVED VERSION');
    }
  }

  return { content: merged.join('\n'), hasConflicts };
}
