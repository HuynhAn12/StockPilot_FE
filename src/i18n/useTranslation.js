import { useUIStore } from '../components/store/uiStore';
import { translations } from './translations';

export function useTranslation() {
  const language = useUIStore((state) => state.language) || 'vi';
  const setLanguage = useUIStore((state) => state.setLanguage);

  const t = (key, fallback) => {
    const dict = translations[language] || translations.vi;
    if (dict && dict[key] !== undefined) {
      return dict[key];
    }
    if (translations.vi && translations.vi[key] !== undefined) {
      return translations.vi[key];
    }
    return fallback !== undefined ? fallback : key;
  };

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  return { t, language, setLanguage, toggleLanguage };
}
