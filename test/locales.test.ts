import { describe, it, expect } from 'vitest';
import { t } from '../src/locales/index';

describe('Locales', () => {
  it('should have translations for supported languages', () => {
    expect(t).toHaveProperty('en');
    expect(t).toHaveProperty('ar');
    expect(t).toHaveProperty('de');
  });

  it('should contain some basic keys', () => {
    expect(Object.keys(t.en).length).toBeGreaterThan(0);
    expect(Object.keys(t.ar).length).toBeGreaterThan(0);
    expect(Object.keys(t.de).length).toBeGreaterThan(0);
  });
});
