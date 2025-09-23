import React from 'react';

type Language = 'ID' | 'EN';

interface LanguageToggleProps {
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  disabled?: boolean;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ selectedLanguage, onLanguageChange, disabled }) => {
  return (
    <div className="flex items-center bg-slate-700 rounded-md p-0.5">
      {(['ID', 'EN'] as Language[]).map(lang => (
        <button
          key={lang}
          type="button"
          onClick={() => onLanguageChange(lang)}
          disabled={disabled}
          className={`px-3 py-1 text-xs font-bold rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
            selectedLanguage === lang
              ? 'bg-cyan-500 text-white'
              : 'text-slate-300 hover:bg-slate-600'
          }`}
          aria-pressed={selectedLanguage === lang}
        >
          {lang}
        </button>
      ))}
    </div>
  );
};

export default LanguageToggle;
