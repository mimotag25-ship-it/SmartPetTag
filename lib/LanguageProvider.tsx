import { useState } from 'react';
import { LanguageContext, T, t as globalT, setLanguage, getLanguage } from './i18n';

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
