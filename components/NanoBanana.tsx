import React, { useState, useCallback } from 'react';
import MultiImageUploader from './MultiImageUploader';
import { generateWithNanoBanana, NanoResult } from '../services/geminiService';
import toast from 'react-hot-toast';
import Loader from './Loader';

const NanoBanana: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [prompt, setPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [results, setResults] = useState<NanoResult[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleFilesChange = useCallback((newFiles: File[]) => {
        setFiles(newFiles);
    }, []);

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
        setResults([]);
        
        try {
            const generatedResults = await generateWithNanoBanana(files, prompt);
            setResults(generatedResults);
            toast.success('Edit generated successfully!');
        } catch (err: any) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

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
                <div className="flex flex-col gap-2">
                    <label htmlFor="nano-prompt" className="text-base font-medium text-slate-300">Input Prompt</label>
                    <textarea
                        id="nano-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={isLoading}
                        placeholder="e.g., 'add a birthday hat on the person' or 'change the background to a beach'"
                        className="w-full h-full min-h-[150px] text-slate-300 leading-relaxed text-sm bg-slate-900/50 p-4 rounded-md resize-y border border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    />
                </div>
            </div>

            <div className="text-center">
                <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:from-cyan-400 hover:to-indigo-500 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Generating...' : 'Generate'}
                </button>
            </div>

            {isLoading && <Loader />}
            
            {error && (
                 <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-center">
                    <p className="text-red-400 font-semibold">{error}</p>
                </div>
            )}

            {results.length > 0 && (
                <div className="space-y-6 border-t border-slate-700 pt-6">
                    <h3 className="text-xl font-bold text-center text-slate-100">Results</h3>
                    <div className="bg-slate-900/50 p-4 rounded-lg space-y-4">
                        {results.map((result, index) => {
                            if (result.type === 'image') {
                                return <img key={index} src={result.content} alt={`Generated image ${index + 1}`} className="rounded-lg shadow-lg mx-auto max-w-full" />;
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
