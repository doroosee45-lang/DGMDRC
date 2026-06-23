import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from '../locales/fr.json';
import en from '../locales/en.json';

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: localStorage.getItem('dgm-lang') ?? 'fr',
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});

export const changeLang = (lang: string) => {
  i18n.changeLanguage(lang);
  localStorage.setItem('dgm-lang', lang);
};

export default i18n;
