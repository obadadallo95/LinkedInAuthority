import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  performDeepScan, 
  synthesizeDeepContext, 
  generateDeepPost, 
  extractVerifiedLinks, 
  classifyUrl, 
  selectCallToAction,
  ProductProfile,
  SynthesizedContext
} from '../../server/services/deepIntelligence';
import * as geminiModule from '../../server/services/repositoryIntelligence/gemini';

describe('Deep Intelligence - Verified Links, ProductProfile & CTA Selection Matrix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(geminiModule, 'getGeminiClient').mockReturnValue({} as any);
  });

  describe('1. Deterministic Verified Link Extraction & Classification', () => {
    it('accurately classifies Mac App Store, Microsoft Store, Chrome Web Store, and Homepage URLs', () => {
      expect(classifyUrl('https://apps.apple.com/us/app/keyfixer/id6740060596?mt=12')).toBe('mac_app_store');
      expect(classifyUrl('https://apps.microsoft.com/detail/9n8v...')).toBe('microsoft_store');
      expect(classifyUrl('https://chromewebstore.google.com/detail/keyfixer/...')).toBe('chrome_web_store');
      expect(classifyUrl('https://github.com/obadadallo95/keyfixer/releases')).toBe('github_releases');
      expect(classifyUrl('https://github.com/obadadallo95/keyfixer')).toBe('github_repo');
      expect(classifyUrl('https://keyfixer.app', 'Official Website')).toBe('homepage');
      expect(classifyUrl('https://app.keyfixer.com', 'Web App')).toBe('web_app');
    });

    it('extracts verified links deterministically from README markdown without hallucination', () => {
      const readme = `
# KeyFixer
Fix Arabic ↔ English mistyped text seamlessly on macOS, Windows, Chrome, and Web.

[![Mac App Store](https://img.shields.io/badge/Mac_App_Store-Download-blue)](https://apps.apple.com/app/keyfixer/id6740060596)
[![Microsoft Store](https://img.shields.io/badge/Microsoft_Store-Get-blue)](https://apps.microsoft.com/detail/9n8v)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-green)](https://chromewebstore.google.com/detail/keyfixer/abc)

Official Website: [keyfixer.app](https://keyfixer.app)
Web App version: [Try Online](https://web.keyfixer.app)
`;

      const links = extractVerifiedLinks('obadadallo95', 'keyfixer', 'https://keyfixer.app', readme);

      expect(links.some(l => l.type === 'homepage' && l.url === 'https://keyfixer.app')).toBe(true);
      expect(links.some(l => l.type === 'mac_app_store' && l.url === 'https://apps.apple.com/app/keyfixer/id6740060596')).toBe(true);
      expect(links.some(l => l.type === 'microsoft_store' && l.url === 'https://apps.microsoft.com/detail/9n8v')).toBe(true);
      expect(links.some(l => l.type === 'chrome_web_store' && l.url === 'https://chromewebstore.google.com/detail/keyfixer/abc')).toBe(true);
      expect(links.some(l => l.type === 'web_app' && l.url === 'https://web.keyfixer.app')).toBe(true);
      expect(links.some(l => l.type === 'github_repo' && l.url === 'https://github.com/obadadallo95/keyfixer')).toBe(true);

      // Asserts no fake badge URLs were classified
      expect(links.some(l => l.url.includes('img.shields.io'))).toBe(false);
    });
  });

  describe('2. Deterministic CTA Selection Matrix', () => {
    const mockProfileWithHomepage: ProductProfile = {
      name: 'KeyFixer',
      oneSentencePurpose: 'Fix mistyped keyboard layout text instantly.',
      targetUsers: ['Mac & Windows users', 'Bilingual writers'],
      primaryBenefits: ['Saves time', '100% offline'],
      majorCapabilities: ['Native instant fix', 'Offline layout switching'],
      platforms: ['macOS', 'Windows', 'Chrome Web Store', 'Web/PWA'],
      privacyCharacteristics: ['100% Offline', 'No telemetry'],
      distributionChannels: ['Mac App Store', 'Microsoft Store', 'Chrome Web Store'],
      homepageUrl: 'https://keyfixer.app',
      repositoryUrl: 'https://github.com/obadadallo95/keyfixer',
      verifiedLinks: [
        { type: 'homepage', url: 'https://keyfixer.app', label: 'Official Website' },
        { type: 'mac_app_store', url: 'https://apps.apple.com/app/keyfixer/id6740060596', label: 'Mac App Store' },
        { type: 'github_repo', url: 'https://github.com/obadadallo95/keyfixer', label: 'GitHub' }
      ]
    };

    const mockProfileWithoutHomepage: ProductProfile = {
      ...mockProfileWithHomepage,
      homepageUrl: undefined,
      verifiedLinks: [
        { type: 'mac_app_store', url: 'https://apps.apple.com/app/keyfixer/id6740060596', label: 'Mac App Store' },
        { type: 'github_repo', url: 'https://github.com/obadadallo95/keyfixer', label: 'GitHub' }
      ]
    };

    const mockProfileRepoOnly: ProductProfile = {
      ...mockProfileWithHomepage,
      homepageUrl: undefined,
      verifiedLinks: [
        { type: 'github_repo', url: 'https://github.com/obadadallo95/keyfixer', label: 'GitHub' }
      ]
    };

    it('selects homepage for Project Launch + General Public when homepage exists', () => {
      const cta = selectCallToAction(mockProfileWithHomepage, 'project', 'General Public');
      expect(cta.type).toBe('homepage');
      expect(cta.url).toBe('https://keyfixer.app');
    });

    it('gracefully falls back to official store destination when homepage is missing for General Public', () => {
      const cta = selectCallToAction(mockProfileWithoutHomepage, 'project', 'General Public');
      expect(cta.type).toBe('mac_app_store');
      expect(cta.url).toBe('https://apps.apple.com/app/keyfixer/id6740060596');
    });

    it('falls back to GitHub repository when no homepage or store destination exists', () => {
      const cta = selectCallToAction(mockProfileRepoOnly, 'project', 'General Public');
      expect(cta.type).toBe('github_repo');
      expect(cta.url).toBe('https://github.com/obadadallo95/keyfixer');
    });

    it('selects GitHub repository or release notes for Progress Update intent', () => {
      const profileWithReleases: ProductProfile = {
        ...mockProfileWithHomepage,
        verifiedLinks: [
          ...mockProfileWithHomepage.verifiedLinks,
          { type: 'github_releases', url: 'https://github.com/obadadallo95/keyfixer/releases', label: 'Releases' }
        ]
      };
      const cta = selectCallToAction(profileWithReleases, 'weekly_progress', 'Software Engineers');
      expect(cta.type).toBe('github_releases');
      expect(cta.url).toBe('https://github.com/obadadallo95/keyfixer/releases');
    });
  });

  describe('3. Grounded Synthesis & Product Profile Pipeline', () => {
    it('synthesizes context and returns grounded ProductProfile', async () => {
      vi.spyOn(geminiModule, 'callGeminiWithRetry').mockResolvedValueOnce({
        hasMeaningfulContent: true,
        productProfile: {
          name: 'KeyFixer',
          oneSentencePurpose: 'Fix mistyped keyboard layout text without retyping.',
          problemSolved: 'Accidentally typing Arabic in English layout or vice versa.',
          targetUsers: ['Bilingual typists', 'Mac users'],
          primaryBenefits: ['Instant fix in-place', '100% Offline'],
          majorCapabilities: ['NSServices instant fix', 'Offline translation dictionary'],
          platforms: ['macOS', 'Windows', 'Chrome Extension', 'Web/PWA'],
          privacyCharacteristics: ['100% Offline', 'No telemetry'],
          distributionChannels: ['Mac App Store', 'Microsoft Store', 'Chrome Web Store'],
          releaseStatus: 'v1.3.2 Available'
        },
        technicalDecisions: ['MainActor-isolated concurrency'],
        challengesSolved: ['Eliminated StoreKit semaphore bridges'],
        newFeatures: ['Instant Fix shortcut Option+Command+K'],
        summary: 'Prepared and launched v1.3.2 on Mac App Store.'
      });

      const mockGroundedContext = {
        owner: 'obadadallo95',
        repo: 'keyfixer',
        repoIdentity: {
          name: 'KeyFixer',
          description: 'Fix mistyped keyboard layout text instantly',
          readmeText: 'Full KeyFixer README',
          manifestData: '',
          languages: { Swift: 90, TypeScript: 10 },
          topics: ['macos', 'productivity'],
          homepageUrl: 'https://keyfixer.app'
        },
        verifiedLinks: [
          { type: 'homepage' as const, url: 'https://keyfixer.app', label: 'Official Website' },
          { type: 'mac_app_store' as const, url: 'https://apps.apple.com/app/keyfixer/id6740060596', label: 'Mac App Store' }
        ],
        commits: [{ message: 'fix: storekit concurrency', date: '2026-08-16', author: 'obada' }],
        pullRequests: [],
        issues: []
      };

      const result = await synthesizeDeepContext(mockGroundedContext);

      expect(result.productProfile).toBeDefined();
      expect(result.productProfile?.name).toBe('KeyFixer');
      expect(result.productProfile?.homepageUrl).toBe('https://keyfixer.app');
      expect(result.productProfile?.platforms).toContain('macOS');
      expect(result.productProfile?.platforms).toContain('Windows');
      expect(result.productProfile?.privacyCharacteristics).toContain('100% Offline');
      expect(result.productProfile?.verifiedLinks.length).toBe(2);
    });
  });

  describe('4. Deep Post Generation - Intent-Aware Prompting & Verification', () => {
    it('passes ProductProfile as primary evidence and injects verified CTA URL for Project Launch', async () => {
      const mockSynthesizedContext: SynthesizedContext = {
        hasMeaningfulContent: true,
        productProfile: {
          name: 'KeyFixer',
          oneSentencePurpose: 'Fix mistyped keyboard layout text instantly.',
          problemSolved: 'Typing full sentences in wrong language layout.',
          targetUsers: ['Bilingual writers', 'Mac users'],
          primaryBenefits: ['Zero friction', '100% privacy'],
          majorCapabilities: ['Native in-place text transformation', 'Global shortcut'],
          platforms: ['macOS', 'Windows', 'Chrome Web Store', 'Web/PWA'],
          privacyCharacteristics: ['100% Offline', 'Zero telemetry'],
          distributionChannels: ['Mac App Store', 'Microsoft Store', 'Chrome Web Store'],
          homepageUrl: 'https://keyfixer.app',
          repositoryUrl: 'https://github.com/obadadallo95/keyfixer',
          verifiedLinks: [
            { type: 'homepage', url: 'https://keyfixer.app', label: 'Official Website' }
          ]
        },
        technicalDecisions: ['MainActor StoreKit flow'],
        challengesSolved: ['Deadlocks resolved'],
        newFeatures: ['v1.3.2 Release'],
        summary: 'Shipped KeyFixer across platforms.'
      };

      let capturedPrompt = '';
      vi.spyOn(geminiModule, 'callGeminiWithRetry').mockImplementationOnce(async (_client, prompt) => {
        capturedPrompt = prompt;
        return {
          post: 'كم مرة كتبت جملة كاملة بالعربي لتكتشف أن الكيبورد كان بالإنجليزية؟ تطبيق KeyFixer يحل هذه المشكلة بضغطة زر واحدة.',
          suggestedComment: 'يمكنكم تجربة KeyFixer عبر الموقع الرسمي: https://keyfixer.app'
        };
      });

      const generated = await generateDeepPost(
        mockSynthesizedContext, 
        'https://github.com/obadadallo95/keyfixer', 
        'ar', 
        { intent: 'project', targetAudience: 'General Public' }
      );

      // Verify prompt construction priorities
      expect(capturedPrompt).toContain('PRIMARY CONTEXT (VERIFIED PRODUCT PROFILE)');
      expect(capturedPrompt).toContain('Product Name: KeyFixer');
      expect(capturedPrompt).toContain('macOS, Windows, Chrome Web Store, Web/PWA');
      expect(capturedPrompt).toContain('100% Offline, Zero telemetry');
      expect(capturedPrompt).toContain('EXACT CTA URL: https://keyfixer.app');
      expect(capturedPrompt).toContain('TARGET AUDIENCE: GENERAL PUBLIC & BROAD AUDIENCE');

      // Verify output
      expect(generated.post).toContain('KeyFixer');
      expect(generated.suggestedComment).toContain('https://keyfixer.app');
    });

    it('passes Engineering Deltas as primary evidence for Progress Update', async () => {
      const mockSynthesizedContext: SynthesizedContext = {
        hasMeaningfulContent: true,
        productProfile: {
          name: 'KeyFixer',
          targetUsers: [],
          primaryBenefits: [],
          majorCapabilities: [],
          platforms: [],
          privacyCharacteristics: [],
          distributionChannels: [],
          repositoryUrl: 'https://github.com/obadadallo95/keyfixer',
          verifiedLinks: []
        },
        technicalDecisions: ['Eliminated StoreKit semaphore bridges in favor of Swift Concurrency'],
        challengesSolved: ['Resolved UI Thread deadlocks during In-App Purchases'],
        newFeatures: ['Added MainActor-isolated transaction listener'],
        summary: 'Refactored StoreKit payment pipeline.'
      };

      let capturedPrompt = '';
      vi.spyOn(geminiModule, 'callGeminiWithRetry').mockImplementationOnce(async (_client, prompt) => {
        capturedPrompt = prompt;
        return {
          post: 'Refactoring StoreKit concurrency in KeyFixer.',
          suggestedComment: 'Check out the commit on GitHub: https://github.com/obadadallo95/keyfixer'
        };
      });

      const generated = await generateDeepPost(
        mockSynthesizedContext, 
        'https://github.com/obadadallo95/keyfixer', 
        'en', 
        { intent: 'weekly_progress', targetAudience: 'Software Engineers' }
      );

      // Verify prompt construction priorities
      expect(capturedPrompt).toContain('PRIMARY CONTEXT (SYNTHESIZED ENGINEERING DELTAS)');
      expect(capturedPrompt).toContain('Eliminated StoreKit semaphore bridges');
      expect(capturedPrompt).toContain('TARGET AUDIENCE: EXPERIENCED SOFTWARE ENGINEERS & PEERS');
      expect(generated.suggestedComment).toContain('https://github.com/obadadallo95/keyfixer');
    });
  });
});
