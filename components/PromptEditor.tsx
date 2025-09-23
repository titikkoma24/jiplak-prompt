import React, { useState, useEffect, FC } from 'react';
import { translateText } from '../services/geminiService';
import toast from 'react-hot-toast';
import LanguageToggle from './LanguageToggle';

interface PromptEditorProps {
  label: string;
  prompt: string;
  onPromptChange: (newPrompt: string) => void;
  isLoading: boolean;
}

const CopyIcon: FC<{copied: boolean}> = ({ copied }) => {
    if(copied) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        )
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    );
};

const TranslateLoader: FC = () => (
    <div className="w-5 h-5 border-2 border-slate-500 border-t-cyan-400 rounded-full animate-spin"></div>
);

const PromptEditor: React.FC<PromptEditorProps> = ({ label, prompt, onPromptChange, isLoading }) => {
  const [currentPrompt, setCurrentPrompt] = useState(prompt);
  const [copied, setCopied] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [targetLang, setTargetLang] = useState<'ID' | 'EN'>('ID');

  useEffect(() => {
    setCurrentPrompt(prompt);
  }, [prompt]);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentPrompt);
    setCopied(true);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setCurrentPrompt(newValue);
    onPromptChange(newValue);
  };
  
  const handleTranslate = async () => {
    if (!currentPrompt.trim() || isTranslating) return;

    setIsTranslating(true);
    try {
        const langToTranslate = targetLang === 'ID' ? 'Indonesian' : 'English';
        const translated = await translateText(currentPrompt, langToTranslate);
        setCurrentPrompt(translated);
        onPromptChange(translated);
        toast.success(`Translated to ${langToTranslate}!`);
    } catch (err) {
        toast.error(`Translation to ${targetLang} failed.`);
    } finally {
        setIsTranslating(false);
    }
  };


  return (
    <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-slate-100">{label}</h3>
          <button
              onClick={handleCopy}
              disabled={isLoading || isTranslating}
              className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 ${
              copied
                  ? 'bg-green-600 text-white focus:ring-green-500'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600 focus:ring-cyan-500'
              }`}
          >
              <CopyIcon copied={copied} />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
        <textarea
          value={currentPrompt}
          onChange={handleTextChange}
          disabled={isLoading || isTranslating}
          className="w-full h-32 text-slate-300 leading-relaxed font-mono text-sm bg-slate-900/50 p-4 rounded-md resize-y border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
          aria-label={`Editable prompt for ${label}`}
        />
        <div className="flex items-center justify-end gap-3 mt-2">
            <LanguageToggle
                selectedLanguage={targetLang}
                onLanguageChange={setTargetLang}
                disabled={isTranslating || isLoading}
            />
            <button
                onClick={handleTranslate}
                disabled={isLoading || isTranslating || !currentPrompt.trim()}
                className="flex items-center justify-center min-w-[90px] px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 bg-slate-700 text-slate-300 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 disabled:opacity-50"
            >
                {isTranslating ? <TranslateLoader /> : 'Translate'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default PromptEditor;
