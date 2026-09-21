type AuthErrorLike = {
  code?: string;
};

/**
 * Keep provider/Firebase internals out of user-facing authentication errors.
 * The code is intentionally small and deterministic so it can be shared by
 * popup flows without making another network request.
 */
export function getSafeAuthErrorMessage(error: AuthErrorLike, provider: 'Google' | 'GitHub'): string | null {
  const code = error?.code || '';

  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return null;
  }

  if (code === 'auth/account-exists-with-different-credential') {
    return 'يوجد حساب بهذا البريد الإلكتروني. سجّل الدخول بالطريقة الأصلية ثم اربط GitHub من الإعدادات.\n\nAn account already exists for this email. Sign in with the original provider, then connect GitHub from Settings.';
  }

  const providerLabel = provider === 'GitHub' ? 'GitHub' : 'Google';
  return `تعذر تسجيل الدخول عبر ${providerLabel} حالياً. حاول مرة أخرى أو استخدم طريقة دخول أخرى.\n\nCould not sign in with ${providerLabel} right now. Try again or use another sign-in method.`;
}

export function getSafeGithubConnectionMessage(): string {
  return 'تم تسجيل الدخول، لكن تعذر تأمين اتصال GitHub. يمكنك إعادة المحاولة من الإعدادات.\n\nYou are signed in, but the GitHub connection could not be secured. You can retry from Settings.';
}
