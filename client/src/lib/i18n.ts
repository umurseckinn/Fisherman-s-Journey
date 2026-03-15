
import { useState } from 'react';
import en from './i18n/en.json';
import tr from './i18n/tr.json';
import es from './i18n/es.json';
import zh from './i18n/zh.json';
import ptBr from './i18n/pt-br.json';
import ja from './i18n/ja.json';
import ko from './i18n/ko.json';
import de from './i18n/de.json';
import fr from './i18n/fr.json';
import it from './i18n/it.json';
import ru from './i18n/ru.json';

// Supported languages
export type Language = 'en' | 'tr' | 'es' | 'zh' | 'pt-br' | 'ja' | 'ko' | 'de' | 'fr' | 'it' | 'ru';

const supportedLanguages: Language[] = ['en', 'tr', 'es', 'zh', 'pt-br', 'ja', 'ko', 'de', 'fr', 'it', 'ru'];

function normalizeLanguage(value: string | null): Language | null {
  if (!value) return null;
  return supportedLanguages.includes(value as Language) ? (value as Language) : null;
}

// Current language persisted in localStorage
let currentLanguage: Language = normalizeLanguage(localStorage.getItem('selectedLanguage')) ?? normalizeLanguage(localStorage.getItem('language')) ?? 'en';

// Set lang attribute on html for CSS selectors
document.documentElement.setAttribute('lang', currentLanguage);

// Dictionary mapping
const translations: Record<Language, any> = { en, tr, es, zh, 'pt-br': ptBr, ja, ko, de, fr, it, ru };

document.title = translations[currentLanguage]?.ui?.logo_text ?? document.title;

/**
 * getFontFamily() - Returns the appropriate font family for the current language
 */
export function getFontFamily(type: 'display' | 'body' = 'display'): string {
  if (currentLanguage === 'zh') {
    return type === 'display' ? "'ZCOOL KuaiLe', 'Noto Sans SC', sans-serif" : "'Noto Sans SC', sans-serif";
  }
  if (currentLanguage === 'tr') {
    return type === 'display' ? "'Baloo 2', 'Fredoka', sans-serif" : "'Outfit', sans-serif";
  }
  if (currentLanguage === 'ja') {
    return type === 'display' ? "'Mochiy Pop One', 'Noto Sans JP', sans-serif" : "'Noto Sans JP', sans-serif";
  }
  if (currentLanguage === 'ko') {
    return type === 'display' ? "'Black Han Sans', 'Noto Sans KR', sans-serif" : "'Noto Sans KR', sans-serif";
  }
  if (currentLanguage === 'ru') {
    return type === 'display' ? "'Comfortaa', 'Noto Sans', sans-serif" : "'Noto Sans', sans-serif";
  }
  return type === 'display' ? "'Fredoka', sans-serif" : "'Outfit', sans-serif";
}

/**
 * t() - Translation function
 * Supports nested keys (e.g., 'ui.shop.buy') and variable interpolation (e.g., {score})
 */
export function t(keyPath: string, defaultValue?: any, variables?: Record<string, string | number>): any {
  const keys = keyPath.split('.');
  let result = translations[currentLanguage];
  
  for (const key of keys) {
    if (!result || result[key] === undefined) {
      result = defaultValue !== undefined ? defaultValue : keyPath;
      break;
    }
    result = result[key];
  }
  
  // Handle string interpolation if variables are provided
  if (typeof result === 'string' && variables) {
    let finalString = result;
    Object.entries(variables).forEach(([key, value]) => {
      finalString = finalString.replace(`{${key}}`, String(value));
    });
    return finalString;
  }
  
  return result;
}

/**
 * setLanguage() - Changes the active language and persists it
 */
export function setLanguage(lang: Language) {
  currentLanguage = lang;
  localStorage.setItem('language', lang);
  localStorage.setItem('selectedLanguage', lang);
  document.documentElement.setAttribute('lang', lang);
  document.title = translations[lang]?.ui?.logo_text ?? document.title;
}

/**
 * getLanguage() - Returns the currently active language code
 */
export function getLanguage(): Language {
  return currentLanguage;
}

/**
 * getCanvasFontSize() - Calculates optimal font size for Canvas to fit a container
 */
export function getCanvasFontSize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, startSize: number, fontSuffix?: string): string {
  const suffix = fontSuffix || ` ${getFontFamily()}`;
  let size = startSize;
  ctx.font = `bold ${size}px${suffix}`;
  while (ctx.measureText(text).width > maxWidth && size > 6) {
    size -= 0.5;
    ctx.font = `bold ${size}px${suffix}`;
  }
  return ctx.font;
}

/**
 * useTranslation() - React hook for components that need to react to language changes
 * Note: Since we reload the page on language change for engine stability, 
 * this is mostly used for initial render.
 */
export function useTranslation() {
  const [lang, setLang] = useState<Language>(currentLanguage);

  return {
    t,
    currentLanguage: lang,
    changeLanguage: (newLang: Language) => {
      setLanguage(newLang);
      setLang(newLang);
      window.location.reload(); // Clean state reset
    }
  };
}
