import { useState, useEffect } from 'react';
import { LanguageContext, getLanguage, setLanguage, t as translate, T } from './i18n';

export default function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(getLanguage());

  function setLang(newLang) {
    setLanguage(newLang);
    setLangState(newLang);
  }

  function t(key) {
    return T[lang]?.[key] || T['en']?.[key] || key;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
