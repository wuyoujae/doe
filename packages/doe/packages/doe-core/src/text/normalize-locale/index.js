// Origin: public/yrkie-doe/core/semantic-text-layout.js:33


export function normalizeLocale(locale, text) {
    if (locale && locale !== "auto") return locale;
    if (/\p{Script=Hiragana}|\p{Script=Katakana}/u.test(text)) return "ja-JP";
    if (/\p{Script=Han}/u.test(text)) return "zh-CN";
    return "en-US";
  }
