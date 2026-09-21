import { describe, expect, it } from 'vitest';
import { getSafeAuthErrorMessage, getSafeGithubConnectionMessage } from '../../src/utils/authError';

describe('auth error messages', () => {
  it('does not expose provider error details', () => {
    const message = getSafeAuthErrorMessage({ code: 'auth/internal-error', message: 'secret firebase detail' } as any, 'Google');

    expect(message).toContain('تعذر تسجيل الدخول');
    expect(message).not.toContain('secret firebase detail');
  });

  it('keeps expected account-conflict guidance actionable', () => {
    const message = getSafeAuthErrorMessage({ code: 'auth/account-exists-with-different-credential' }, 'GitHub');

    expect(message).toContain('الإعدادات');
    expect(message).toContain('Settings');
  });

  it('does not interrupt the user for a deliberately closed popup', () => {
    expect(getSafeAuthErrorMessage({ code: 'auth/popup-closed-by-user' }, 'GitHub')).toBeNull();
  });

  it('explains how to recover from a secured-connection failure', () => {
    expect(getSafeGithubConnectionMessage()).toContain('الإعدادات');
  });
});
