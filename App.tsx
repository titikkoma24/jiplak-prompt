
import React, { useState, useCallback, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import Loader from './components/Loader';
import PromptEditor from './components/PromptEditor';
import AspectRatioSelector from './components/AspectRatioSelector';
import { generateDetailedPrompt } from './services/geminiService';
import toast, { Toaster } from 'react-hot-toast';

const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [detailedPrompt, setDetailedPrompt] = useState<string | null>(null);
    const [finalPrompt, setFinalPrompt] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<string>('1:1');

    const resetState = () => {
        setIsLoading(false);
        setImageFile(null);
        setImagePreview(null);
        setDetailedPrompt(null);
        setFinalPrompt('');
        setError(null);
    };

    const handleImageUpload = useCallback(async (file: File | null) => {
        if (!file) {
            resetState();
            return;
        }

        setIsLoading(true);
        setError(null);
        setDetailedPrompt(null);
        setFinalPrompt('');
        setImageFile(file);
        
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
        
        try {
            const generatedPrompt = await generateDetailedPrompt(file);
            setDetailedPrompt(generatedPrompt);
            toast.success('Scene prompt generated!');
        } catch (err: any) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            toast.error(errorMessage);
            setImagePreview(null);
            setImageFile(null);
        } finally {
            setIsLoading(false);
        }
    }, []);
    
    useEffect(() => {
        if (!detailedPrompt) {
            setFinalPrompt('');
            return;
        }
        
        const final = `${detailedPrompt} --ar ${aspectRatio}`;
        setFinalPrompt(final.trim());

    }, [detailedPrompt, aspectRatio]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center gap-4">
                    {imagePreview && <img src={imagePreview} alt="Processing..." className="rounded-lg max-h-60 w-auto animate-pulse" />}
                    <Loader />
                </div>
            );
        }

        if (error) {
             return (
                <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-center">
                    <p className="text-red-400 font-semibold mb-4">{error}</p>
                    <button onClick={resetState} className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-500">
                        Try Again
                    </button>
                </div>
            );
        }

        if (detailedPrompt && imagePreview) {
            return (
                <div className="flex flex-col gap-8 animate-fade-in">
                     <div>
                        <img src={imagePreview} alt="Image preview" className="rounded-lg shadow-lg" />
                        <button onClick={() => handleImageUpload(null)} className="mt-4 text-sm text-slate-400 hover:text-white transition-colors duration-200">
                            &#8592; Use a different image
                        </button>
                    </div>

                    <div className="space-y-3">
                        <label className="text-base font-medium text-slate-300">Aspect Ratio</label>
                        <AspectRatioSelector selectedRatio={aspectRatio} onSelectRatio={setAspectRatio} disabled={isLoading} />
                    </div>

                    <div className="space-y-6">
                        <PromptEditor
                            label="Final Detailed Prompt"
                            prompt={finalPrompt}
                            onPromptChange={(newPrompt) => setFinalPrompt(newPrompt)}
                            isLoading={isLoading}
                        />
                    </div>

                     <div className="mt-2 text-center border-t border-slate-700 pt-6">
                        <p className="text-sm text-slate-400 mb-3">
                            Copy the prompt and use it in your favorite image generator!
                        </p>
                        <a 
                            href="https://gemini.google.com/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:from-cyan-400 hover:to-indigo-500 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500"
                        >
                            <span>Open Gemini App</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                </div>
            );
        }
        
        return <ImageUploader onImageUpload={handleImageUpload} isLoading={isLoading} />;
    };
    
    return (
        <div className="bg-slate-900 min-h-screen text-white font-sans">
            <Toaster position="top-center" toastOptions={{
                className: '',
                style: {
                    border: '1px solid #334155',
                    padding: '16px',
                    color: '#e2e8f0',
                    background: '#1e293b'
                },
            }} />
            <header className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 sm:text-5xl md:text-6xl">
                        JIPLAK_PROMPT 2.0
                    </h1>
                    <p className="mt-4 max-w-3xl mx-auto text-lg text-slate-400">
                       Create ultra-detailed prompts from any image.
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <div className="w-full max-w-3xl mx-auto bg-slate-800/50 rounded-2xl shadow-2xl shadow-cyan-500/10 border border-slate-700 p-6 md:p-8">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default App;
