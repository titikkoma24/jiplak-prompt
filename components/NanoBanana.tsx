import React, { useState, useCallback } from 'react';
import MultiImageUploader from './MultiImageUploader';
import { generateWithNanoBanana, NanoResult, translateText } from '../services/geminiService';
import toast from 'react-hot-toast';
import Loader from './Loader';
import LanguageToggle from './LanguageToggle';

const NanoBanana: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [prompt, setPrompt] = useState<string>('');
    const [resolution, setResolution] = useState<string>('Default');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isTranslating, setIsTranslating] = useState<boolean>(false);
    const [targetLang, setTargetLang] = useState<'ID' | 'EN'>('ID');
    const [error, setError] = useState<string | null>(null);

    // State for undo/redo
    const [history, setHistory] = useState<NanoResult[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const currentResults = history[historyIndex] ?? [];
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;


    const handleFilesChange = useCallback((newFiles: File[]) => {
        setFiles(newFiles);
    }, []);
    
    const handleDownload = (dataUrl: string, filename: string) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Image saved!');
    };

    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPrompt(e.target.value);
    };

    const handleTranslate = async () => {
        if (!prompt.trim() || isTranslating) return;
        setIsTranslating(true);
        try {
            const langToTranslate = targetLang === 'ID' ? 'Indonesian' : 'English';
            const translated = await translateText(prompt, langToTranslate);
            setPrompt(translated);
            toast.success(`Translated to ${langToTranslate}!`);
        } catch (err) {
            toast.error(`Translation to ${targetLang} failed.`);
        } finally {
            setIsTranslating(false);
        }
    };

    const handleSubmit = async () => {
        if (files.length === 0) {
            toast.error('Please upload at least one image.');
            return;
        }
        if (!prompt.trim()) {
            toast.error('Please enter a prompt to describe your edit.');
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            const promptText = prompt.trim();
            let finalPrompt = promptText;
            const resolutionTextMap: { [key: string]: string } = {
                'HD': 'HD, 1080p, high quality',
                '4K': '4K resolution, photorealistic, ultra-detailed',
                '8K': '8K resolution, masterpiece, photorealistic, ultra-detailed',
            };

            if (resolution !== 'Default' && resolutionTextMap[resolution]) {
                finalPrompt = `${promptText}, ${resolutionTextMap[resolution]}`;
            }

            const generatedResults = await generateWithNanoBanana(files, finalPrompt);
            const newHistory = [...history.slice(0, historyIndex + 1), generatedResults];
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
            
            toast.success('Edit generated successfully!');
        } catch (err: any) {
            const rawMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            let friendlyErrorMessage = rawMessage;

            if (rawMessage.includes('RESOURCE_EXHAUSTED') || rawMessage.toLowerCase().includes('quota')) {
                friendlyErrorMessage = 'Anda telah melebihi batas penggunaan gratis untuk fitur ini. Silakan coba lagi nanti atau periksa paket dan tagihan Anda di Google AI Studio.';
            }

            setError(friendlyErrorMessage);
            toast.error(friendlyErrorMessage, { duration: 6000 });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleUndo = () => {
        if (canUndo) {
            setHistoryIndex(prev => prev - 1);
        }
    };
    
    const handleRedo = () => {
        if (canRedo) {
            setHistoryIndex(prev => prev + 1);
        }
    };

    const resolutionOptions = ['Default', 'HD', '4K', '8K'];
    const TranslateLoader: React.FC = () => <div className="w-5 h-5 border-2 border-slate-500 border-t-cyan-400 rounded-full animate-spin"></div>;

    return (
        <div className="flex flex-col gap-8 animate-fade-in">
            <div>
                <h2 className="text-2xl font-bold text-slate-100">Nano Banana Studio</h2>
                <p className="text-slate-400 mt-1">Upload one or more images and describe the edits you'd like to make.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                    <label className="text-base font-medium text-slate-300">Upload Photos (up to 20)</label>
                    <MultiImageUploader onFilesChange={handleFilesChange} maxFiles={20} />
                </div>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label htmlFor="nano-prompt" className="text-base font-medium text-slate-300">Input Prompt</label>
                        </div>
                        <textarea
                            id="nano-prompt"
                            value={prompt}
                            onChange={handlePromptChange}
                            disabled={isLoading || isTranslating}
                            placeholder="e.g., 'add a birthday hat on the person' or 'change the background to a beach'"
                            className="w-full h-full min-h-[150px] text-slate-300 leading-relaxed text-sm bg-slate-900/50 p-4 rounded-md resize-y border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                        />
                         <div className="flex items-center justify-end gap-3 mt-1">
                            <LanguageToggle
                                selectedLanguage={targetLang}
                                onLanguageChange={setTargetLang}
                                disabled={isTranslating || isLoading}
                            />
                            <button
                                onClick={handleTranslate}
                                disabled={isLoading || isTranslating || !prompt.trim()}
                                className="flex items-center justify-center min-w-[90px] px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 bg-slate-700 text-slate-300 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 disabled:opacity-50"
                            >
                                {isTranslating ? <TranslateLoader /> : 'Translate'}
                            </button>
                        </div>
                    </div>
                     <div className="flex flex-col gap-2">
                        <label className="text-base font-medium text-slate-300">Output Resolution</label>
                         <div className="flex flex-wrap gap-2" role="group" aria-label="Output Resolution">
                            {resolutionOptions.map(res => (
                                <button
                                    key={res}
                                    type="button"
                                    onClick={() => setResolution(res)}
                                    disabled={isLoading || isTranslating}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed ${
                                        resolution === res
                                        ? 'bg-cyan-500 text-white focus:ring-cyan-400'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600 focus:ring-cyan-500'
                                    }`}
                                >
                                    {res}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="text-center">
                <button
                    onClick={handleSubmit}
                    disabled={isLoading || isTranslating}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:from-cyan-400 hover:to-indigo-500 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Generating...' : (isTranslating ? 'Translating...' : 'Generate')}
                </button>
            </div>

            {isLoading && <Loader />}
            
            {error && (
                 <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-center">
                    <p className="text-red-400 font-semibold">{error}</p>
                </div>
            )}

            {currentResults.length > 0 && (
                <div className="space-y-6 border-t border-slate-700 pt-6">
                    <div className="flex justify-center items-center gap-6">
                        <h3 className="text-xl font-bold text-center text-slate-100">Results</h3>
                        <div className="flex items-center gap-2 bg-slate-700/50 p-1 rounded-md">
                             <button onClick={handleUndo} disabled={!canUndo} title="Undo" aria-label="Undo" className="p-1.5 rounded-md text-slate-300 hover:bg-slate-600 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                            <button onClick={handleRedo} disabled={!canRedo} title="Redo" aria-label="Redo" className="p-1.5 rounded-md text-slate-300 hover:bg-slate-600 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg space-y-4">
                        {currentResults.map((result, index) => {
                            if (result.type === 'image') {
                                return (
                                    <div key={index} className="relative group">
                                        <img src={result.content} alt={`Generated image ${index + 1}`} className="rounded-lg shadow-lg mx-auto max-w-full" />
                                         <button
                                            onClick={() => handleDownload(result.content, `jiplak-nano-result-${index + 1}.png`)}
                                            className="absolute bottom-4 right-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-800/80 backdrop-blur-sm border border-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700/90 transition-all duration-200 transform opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            aria-label="Save image"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            <span>Save</span>
                                        </button>
                                    </div>
                                );
                            }
                            return <p key={index} className="text-slate-300 whitespace-pre-wrap">{result.content}</p>;
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NanoBanana;