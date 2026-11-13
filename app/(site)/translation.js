// Helpers for the Translate button. The list of languages comes from the server (whatever the translation service
// supports), so readers can pick any of them; nothing here is a fixed list.
const LANG_KEY = 'letters-lang';

export const savedLang = () => { try { return localStorage.getItem(LANG_KEY) || ''; } catch { return ''; } };
export const saveLang = code => { try { localStorage.setItem(LANG_KEY, code); } catch {} };

const baseOf = code => String(code || '').toLowerCase().split(/[-_]/)[0];

// Name of a language in another language (default English): "Japanese", or "日本語" when asked in Japanese.
export function langName(code, inLang = 'en') {
  try { return new Intl.DisplayNames([inLang], { type: 'language' }).of(code) || code; } catch { return code; }
}

// The language to translate into when the reader hasn't picked one yet: their browser's language.
export const browserLang = () => (typeof navigator !== 'undefined' && navigator.language) || 'en';
export const guessLang = () => savedLang() || baseOf(browserLang());

// Choose the entry of the server's list that best matches what the reader wants.
export function pickLang(list, wanted = guessLang()) {
  const w = String(wanted).toLowerCase();
  return list.find(c => c.toLowerCase() === w) || list.find(c => baseOf(c) === baseOf(w))
    || list.find(c => baseOf(c) === 'en') || list[0];
}
