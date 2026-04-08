"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, type TranslationKey, type Language } from "./translations";

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "th",
  setLang: () => {},
  t: (key) => translations[key]?.th || key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("th");

  useEffect(() => {
    const stored = localStorage.getItem("khongbeng_lang") as Language | null;
    if (stored && (stored === "th" || stored === "en")) {
      setLangState(stored);
    }
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("khongbeng_lang", newLang);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[key]?.[lang] || key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useT() {
  const { t } = useContext(LanguageContext);
  return t;
}
