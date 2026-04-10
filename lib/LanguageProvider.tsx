import { useState } from 'react';
import { LanguageContext, translations } from './i18n';

export default function LanguageProvider({ children }) {
  const [lang, setLang] = useState('es');

  function t(key) {
    return translations[lang][key] || translations['en'][key] || key;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
