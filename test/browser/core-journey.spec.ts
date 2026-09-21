import { test, expect } from '@playwright/test';

test('browser receives the versioned PWA shell contract', async ({ page }) => {
  const serviceWorkerResponse = await page.request.get('/sw.js');
  expect(serviceWorkerResponse.ok()).toBeTruthy();
  const serviceWorkerText = await serviceWorkerResponse.text();
  expect(serviceWorkerText).toContain('linkedin-authority-shell-v2');
  expect(serviceWorkerText).toContain('self.clients.claim');
  expect(serviceWorkerText).toContain("url.pathname.startsWith('/api/')");
  expect(serviceWorkerText).not.toContain('registration.unregister');
  
  const manifestResponse = await page.request.get('/manifest.json');
  expect(manifestResponse.ok()).toBeTruthy();
  const manifest = await manifestResponse.json();
  expect(manifest.display).toBe('standalone');
  expect(manifest.name).toBe('LinkedIn Authority');
  expect(manifest.description).toContain('Evidence-backed technical draft workspace');

  const indexResponse = await page.request.get('/');
  const indexHtml = await indexResponse.text();
  expect(indexHtml).toContain('Something went wrong while loading LinkedIn Authority');
  expect(indexHtml).not.toContain("e.message + '<br>'");
  expect(indexHtml).not.toContain('e.error.stack');

  await page.goto('/');
  await expect.poll(async () => page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration('/');
    return registration?.active?.scriptURL || '';
  }), { timeout: 5000 }).toContain('/sw.js');

  // The first navigation registers the worker; reload once online so the
  // worker controls the page and caches the hashed assets before offline use.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText('LinkedIn Authority');
  await page.context().setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText('LinkedIn Authority');
  const apiOfflineResult = await page.evaluate(async () => {
    try {
      await fetch('/api/health');
      return { reachedApi: true };
    } catch {
      return { reachedApi: false };
    }
  });
  expect(apiOfflineResult.reachedApi).toBe(false);
  await page.context().setOffline(false);
});

test('public demo turns a repository into an evidence-aware draft', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'en', exact: true }).click();

  await page.getByPlaceholder('https://github.com/facebook/react').fill('https://github.com/expressjs/express');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByText('Choose best angle automatically', { exact: true }).click();
  await page.getByRole('button', { name: 'Generate Post', exact: true }).click();

  await expect(page.getByText('Browser E2E fixture repository', { exact: true })).toBeVisible();
  await expect(page.getByText('The browser journey completed with a reviewable draft.', { exact: false })).toBeVisible();
  await expect(page.getByText('Review the evidence before copying this draft to LinkedIn.', { exact: true })).toBeVisible();
});

test('authenticated reviewer can generate, edit, save, and reload a draft', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('linkedin-e2e-mode', 'true');
    // Keep this long-form authenticated journey deterministic in English;
    // locale coverage is exercised by the dedicated locale tests below.
    window.localStorage.setItem('linkedin_auth_lang', 'en');
  });
  await page.route('**/api/analyze-repo', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        analysisToken: 'e2e-analysis-token',
        angles: [{ id: 'evidence-story', title: 'Evidence-backed engineering story', angleSummary: 'Explain the concrete repository change and why it matters.', requiresHumanContext: false }],
      }),
    });
  });
  await page.route('**/api/generate-post', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        post: 'We shipped an evidence-backed repository intelligence update. The draft is grounded in a concrete engineering change.',
        suggestedComment: 'Review the implementation: https://github.com/e2e-user/authority-fixture',
        evidence: [{ fact: 'Repository intelligence update', source: 'src/intelligence.ts' }],
        claimAudit: { passed: true, claims: [], warnings: [] },
      }),
    });
  });

  await page.goto('/repositories');
  await expect(page.getByText('authority-fixture', { exact: true }).first()).toBeVisible();
  await page.getByText('authority-fixture', { exact: true }).first().click();
  await expect(page.getByRole('button', { name: /Repository Evidence|أدلة المستودع/ })).toBeVisible();
  await page.getByRole('button', { name: 'Write Tutorial or Announcement' }).click();
  await expect(page.getByText('Select Narrative Angle:', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Evidence-backed engineering story/ }).click();
  await page.getByRole('button', { name: 'Generate Post Now' }).click();

  const postEditor = page.getByLabel('Draft post');
  await expect(postEditor).toHaveValue(/evidence-backed repository intelligence update/);
  await expect(page.getByText(/ملاحظة روابط اختيارية|Optional Link Note/, { exact: true })).toBeVisible();
  await expect(page.getByText(/تحويل لثريد تويتر|Convert to X Thread|Adapt to Medium|Interactive Tech Quiz/, { exact: false })).toHaveCount(0);
  await postEditor.fill('Edited by the reviewer after checking the evidence pack.');
  await page.getByRole('button', { name: 'Save to Content Library' }).click();

  await page.goto('/drafts');
  await expect(page.getByText('Edited by the reviewer after checking the evidence pack.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Edit' }).click();
  const savedDraftEditor = page.locator('textarea').last();
  await savedDraftEditor.fill('Second edit after reopening the saved draft.');
  await page.waitForTimeout(1500);
  await page.reload();
  await expect(page.getByText('Second edit after reopening the saved draft.', { exact: false })).toBeVisible();
  await expect(page.getByText(/characters/, { exact: false }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('button', { name: 'Clean preview', exact: true }).click();
  await expect(page.getByLabel('Clean preview', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Hide preview', exact: true }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export', exact: true }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.txt$/);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'History' }).click();
  await expect(page.getByText('Revision 2', { exact: true })).toBeVisible();
  page.once('dialog', async dialog => {
    expect(dialog.message()).toContain('review');
    await dialog.accept();
  });
  await page.getByRole('button', { name: 'Copy', exact: true }).click();
});

test('public landing renders the supported Arabic, English, and German locales', async ({ page }) => {
  for (const locale of [
    { name: 'ar', direction: 'rtl' },
    { name: 'en', direction: 'ltr' },
    { name: 'de', direction: 'ltr' },
  ]) {
    await page.goto('/');
    await page.getByRole('button', { name: locale.name, exact: true }).click();
    await expect(page.locator('h1').first()).toBeVisible();
    await expect.poll(() => page.locator('[dir]').first().getAttribute('dir')).toBe(locale.direction);
  }
});

test('public demo exposes a recoverable API failure', async ({ page }) => {
  await page.route('**/api/demo/analyze', async route => {
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Fixture service unavailable' }) });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'en', exact: true }).click();
  await page.getByPlaceholder('https://github.com/facebook/react').fill('https://github.com/example/unavailable');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Generate Post', exact: true }).click();
  await expect(page.getByText('The demo is temporarily unavailable', { exact: false })).toBeVisible();
});

test('authenticated product pages render as a coherent draft-first workspace', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('linkedin-e2e-mode', 'true'));

  await page.goto('/repositories');
  await expect(page.locator('main').getByText(/Repositories|المستودعات/, { exact: true }).first()).toBeVisible();

  await page.goto('/drafts');
  await expect(page.locator('main').getByText(/Drafts & Content|المسودات والمحتوى/, { exact: true }).first()).toBeVisible();

  await page.goto('/automations');
  await expect(page.locator('main').getByText(/Weekly Automations|السلسلة الأسبوعية/, { exact: true }).first()).toBeVisible();
  await expect(page.locator('main').getByText(/دون نشر تلقائي|never publish automatically/, { exact: false }).first()).toBeVisible();
  await expect(page.locator('aside button').nth(3)).toHaveClass(/bg-indigo-500\/10/);

  await page.goto('/templates');
  await expect(page.locator('main').getByText(/Smart Templates Library|Vorlagen-Bibliothek|مكتبة القوالب الذكية/, { exact: true }).first()).toBeVisible();

  await page.goto('/settings');
  await expect(page.locator('main').getByText(/Account, Integration & Security|إعدادات الحساب والربط والأمان/, { exact: true }).first()).toBeVisible();
  await expect(page.locator('main').getByText(/دليل الوصول|Access Guides/, { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: /سياسة الخصوصية 🛡️|Privacy Policy 🛡️/ }).click();
  await expect(page.getByText(/مركز الخصوصية والاتفاقات القانونية|Privacy & Legal Center/, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'الأسئلة الشائعة', exact: true }).click();
  await expect(page.getByText(/هل تقومون بتخزين الكود الخاص بي؟|Do you store my code\?/, { exact: true })).toBeVisible();
});

test('unknown authenticated routes remain useful and recoverable', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('linkedin-e2e-mode', 'true');
    window.localStorage.setItem('linkedin_auth_lang', 'en');
  });

  await page.goto('/workspace/does-not-exist');
  await expect(page.getByRole('heading', { name: 'This page could not be found', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to repositories', exact: true }).click();
  await expect(page).toHaveURL(/\/repositories$/);
  await expect(page.locator('main').getByText('Repositories', { exact: true }).first()).toBeVisible();
});

test('authenticated workspace keeps its primary page contracts across locales', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('linkedin-e2e-mode', 'true'));

  const locales = [
    { code: 'ar', drafts: 'المسودات والمحتوى', settings: 'إعدادات الحساب والربط والأمان', automations: 'السلسلة الأسبوعية' },
    { code: 'en', drafts: 'Drafts & Content', settings: 'Account, Integration & Security', automations: 'Weekly Automations' },
    { code: 'de', drafts: 'Entwürfe & Inhalte', settings: 'Konto, Integrationen & Sicherheit', automations: 'Wöchentliche Automatisierungen' },
  ];

  for (const locale of locales) {
    await page.goto('/repositories');
    await page.evaluate((code) => localStorage.setItem('linkedin_auth_lang', code), locale.code);
    await page.reload();

    await page.goto('/drafts');
    await expect(page.locator('main').getByText(locale.drafts, { exact: true })).toBeVisible();
    await page.goto('/settings');
    await expect(page.locator('main').getByText(locale.settings, { exact: true })).toBeVisible();
    await page.goto('/automations');
    await expect(page.locator('main').getByText(locale.automations, { exact: true })).toBeVisible();
    if (locale.code === 'de') {
      await page.goto('/settings');
      await expect(page.getByText('GitHub-OAuth-Verbindung', { exact: true })).toBeVisible();
      await expect(page.getByText('Grenze für LinkedIn-Freigabe', { exact: true })).toBeVisible();
      await expect(page.getByText('Verbunden ✓', { exact: true })).toBeVisible();
      await expect(page.getByText('Meine Daten exportieren', { exact: true })).toBeVisible();
      await expect(page.getByText('Datenschutz 🛡️', { exact: true })).toBeVisible();
    }
  }
});

test('German repository details expose the evidence-first generation workspace', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('linkedin-e2e-mode', 'true');
    window.localStorage.setItem('linkedin_auth_lang', 'de');
  });

  await page.goto('/repositories/e2e-user/authority-fixture');
  await expect(page.locator('aside').getByRole('button', { name: 'Entwürfe', exact: true })).toBeVisible();
  await expect(page.locator('aside').getByRole('button', { name: 'Einstellungen', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Repository-Nachweise', exact: true })).toBeVisible();
  await expect(page.getByText('KI-Engine-Konfiguration', { exact: true })).toBeVisible();
  await expect(page.getByText('Evidenzbasierter Repository-Scan', { exact: true })).toBeVisible();
  await expect(page.getByText('Aus letzten Commits generieren', { exact: true })).toBeVisible();
  await expect(page.getByText('Tutorial oder Ankündigung schreiben', { exact: true })).toBeVisible();
  await expect(page.getByText('CTOs / Tech Leads', { exact: true })).toBeVisible();
});

test('authenticated repositories page offers a local no-API demo when GitHub is disconnected', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('linkedin-e2e-mode', 'true');
    window.localStorage.setItem('linkedin-e2e-settings', JSON.stringify({
      githubUsername: '',
      githubProfile: null,
      onboardingSkipped: true,
    }));
    window.localStorage.setItem('linkedin_auth_lang', 'en');
  });

  await page.goto('/repositories');
  await expect(page.getByText('GitHub Not Connected', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Demo Mode', exact: true }).click();
  await expect(page.getByText('authority-fixture', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: /Open repository authority-fixture/ }).click();
  await expect(page.getByRole('button', { name: 'Repository Evidence' })).toBeVisible();
});

test('onboarding can continue with public repositories without OAuth', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('linkedin-e2e-mode', 'true');
    window.localStorage.setItem('linkedin_auth_lang', 'en');
    window.localStorage.setItem('linkedin-e2e-settings', JSON.stringify({
      githubUsername: '',
      githubProfile: null,
      githubPermissions: 'public',
      onboardingSkipped: false,
    }));
  });

  await page.goto('/repositories');
  await expect(page.getByRole('button', { name: 'Get Started', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Get Started', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Continue with public repositories', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue with public repositories', exact: true }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('linkedin-e2e-settings') || '{}').onboardingSkipped)).toBe(true);
});

test('authenticated workspace remains usable on a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => window.localStorage.setItem('linkedin-e2e-mode', 'true'));

  await page.goto('/repositories');
  await expect(page.locator('main').getByText(/Repositories|المستودعات/, { exact: true }).first()).toBeVisible();
  await expect(page.locator('div.fixed.bottom-0').last()).toBeVisible();

  await page.goto('/drafts');
  await expect(page.locator('main').getByText(/Drafts & Content|المسودات والمحتوى/, { exact: true }).first()).toBeVisible();

  await page.goto('/settings');
  await expect(page.locator('main').getByText(/Account, Integration & Security|إعدادات الحساب والربط والأمان/, { exact: true }).first()).toBeVisible();
});

test('template library creates a reviewable draft instead of a no-op', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('linkedin-e2e-mode', 'true'));

  await page.goto('/templates');
  await page.getByRole('button', { name: 'استخدام القالب وإنشاء مسودة', exact: true }).click();
  await expect(page).toHaveURL(/\/drafts$/);
  await expect(page.getByText('المسودات والمحتوى', { exact: true })).toBeVisible();
  await expect(page.getByText('تحديث موثق من مشروع', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'سجل النسخ', exact: true }).click();
  await expect(page.getByText('النسخة الأصلية المولّدة', { exact: true })).toBeVisible();
});

test('automation pause and resume remains usable without external API calls', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('linkedin-e2e-mode', 'true');
    window.localStorage.setItem('linkedin-e2e-projects', JSON.stringify([{
      id: 'e2e-user_authority-fixture',
      owner: 'e2e-user',
      repo: 'authority-fixture',
      fullName: 'e2e-user/authority-fixture',
      description: 'Local automation fixture',
      language: 'TypeScript',
      monitoringEnabled: true,
      monitoringConfig: {
        intent: 'weekly_progress',
        targetAudience: 'tech_community',
        contentLanguage: 'en',
        timezone: 'UTC',
        monitorCommits: true,
        monitorIssues: false,
        monitorPullRequests: false,
        scheduleDay: 'Fri',
        scheduleTime: '09:00',
      },
    }]));
    window.localStorage.setItem('linkedin_auth_lang', 'en');
  });

  await page.goto('/automations');
  await expect(page.getByText('authority-fixture', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Pause automation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Resume automation', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Resume automation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause automation', exact: true })).toBeVisible();
});
