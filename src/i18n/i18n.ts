/**
 * i18n - Internationalization service for Codexian
 *
 * Provides translation functionality for all UI strings.
 * Supports 10 locales with English as the default fallback.
 */

import * as en from './locales/en.json';
import * as zhCN from './locales/zh-CN.json';
import type { Locale, TranslationKey, UserLanguagePreference } from './types';

const translations: Record<Locale, Record<string, unknown>> = {
  en,
  'zh-CN': zhCN,
};

const DEFAULT_LOCALE: Locale = 'en';
let currentLocale: Locale = DEFAULT_LOCALE;

const USER_LANGUAGE_OPTIONS: Array<{ value: UserLanguagePreference; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'en', label: 'English' },
  { value: 'zh-CN', label: '简体中文' },
];

function getNestedTranslation(dict: Record<string, unknown>, key: TranslationKey): unknown {
  const keys = key.split('.');
  let value: unknown = dict;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }

  return value;
}

function interpolateTranslation(
  value: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (_, param) => {
    return params[param]?.toString() ?? `{${param}}`;
  });
}

export function isUserLanguagePreference(value: unknown): value is UserLanguagePreference {
  return value === 'auto' || value === 'en' || value === 'zh-CN';
}

export function normalizeLanguagePreference(value: unknown): UserLanguagePreference {
  return isUserLanguagePreference(value) ? value : 'auto';
}

export function resolveLocalePreference(
  preference: unknown,
  obsidianLocale?: string,
): Locale {
  const normalized = normalizeLanguagePreference(preference);
  if (normalized === 'en' || normalized === 'zh-CN') {
    return normalized;
  }

  return obsidianLocale?.toLowerCase().startsWith('zh') ? 'zh-CN' : DEFAULT_LOCALE;
}

export function getUserLanguageOptions(): Array<{ value: UserLanguagePreference; label: string }> {
  return [...USER_LANGUAGE_OPTIONS];
}

/**
 * Get a translation by key with optional parameters
 */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const dict = translations[currentLocale];
  const value = getNestedTranslation(dict, key);

  if (typeof value !== 'string') {
    if (currentLocale !== DEFAULT_LOCALE) {
      return tFallback(key, params);
    }
    return key;
  }

  return interpolateTranslation(value, params);
}

function tFallback(key: TranslationKey, params?: Record<string, string | number>): string {
  const dict = translations[DEFAULT_LOCALE];
  const value = getNestedTranslation(dict, key);

  if (typeof value !== 'string') {
    return key;
  }

  return interpolateTranslation(value, params);
}

/**
 * Set the current locale
 * @returns true if locale was set successfully, false if locale is invalid
 */
export function setLocale(locale: Locale): boolean {
  if (!translations[locale]) {
    return false;
  }
  currentLocale = locale;
  return true;
}

/**
 * Get the current locale
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Get all available locales
 */
export function getAvailableLocales(): Locale[] {
  return Object.keys(translations) as Locale[];
}

/**
 * Get display name for a locale
 */
export function getLocaleDisplayName(locale: Locale): string {
  const names: Record<Locale, string> = {
    'en': 'English',
    'zh-CN': '简体中文',
  };
  return names[locale] || locale;
}
