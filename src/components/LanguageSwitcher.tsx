import { useLanguage } from '@/contexts/LanguageContext';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => setLanguage('el')}
        className={`px-2 py-1 rounded transition-colors ${
          language === 'el'
            ? 'bg-primary text-primary-foreground font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        EL
      </button>
      <span className="text-muted-foreground">|</span>
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 rounded transition-colors ${
          language === 'en'
            ? 'bg-primary text-primary-foreground font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
