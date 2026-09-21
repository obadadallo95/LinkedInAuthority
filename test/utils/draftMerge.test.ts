import { describe, expect, it } from 'vitest';
import { mergeDraftVersions } from '../../src/utils/draftMerge';

describe('draft three-way merge', () => {
  it('keeps a local-only edit when the server kept the base line', () => {
    const result = mergeDraftVersions('one\ntwo', 'one\nlocal', 'one\ntwo');
    expect(result).toEqual({ content: 'one\nlocal', hasConflicts: false });
  });

  it('keeps a server-only edit when the local side kept the base line', () => {
    const result = mergeDraftVersions('one\ntwo', 'one\ntwo', 'one\nserver');
    expect(result).toEqual({ content: 'one\nserver', hasConflicts: false });
  });

  it('marks genuinely divergent lines instead of silently choosing one', () => {
    const result = mergeDraftVersions('one\ntwo', 'one\nlocal', 'one\nserver');
    expect(result.hasConflicts).toBe(true);
    expect(result.content).toContain('<<<<<<< YOUR EDITS');
    expect(result.content).toContain('local');
    expect(result.content).toContain('server');
  });
});
