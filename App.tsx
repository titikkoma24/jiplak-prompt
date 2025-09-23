import React, { useState, useCallback, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import Loader from './components/Loader';
import PromptEditor from './components/PromptEditor';
import AspectRatioSelector from './components/AspectRatioSelector';
import NanoBanana from './components/NanoBanana';
import PinAuth from './components/PinAuth';
import { generateDetailedPrompt } from './services/geminiService';
import toast, { Toaster } from 'react-hot-toast';

type Tab = 'jiplak' | 'nano';
type AuthStatus = 'unauthenticated' | 'limited' | 'full';

const App: React.FC = () => {
    // Auth state
    const [authStatus, setAuthStatus] = useState<AuthStatus>('unauthenticated');
    const [pinError, setPinError] = useState<string | null>(null);
    
    const [activeTab, setActiveTab] = useState<Tab>('jiplak');

    // State for JIPLAK_PROMPT feature
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [detailedPrompt, setDetailedPrompt] = useState<string | null>(null);
    const [finalPrompt, setFinalPrompt] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<string>('Original');
    const [originalAspectRatio, setOriginalAspectRatio] = useState<string | null>(null);
    const [useFaceReference, setUseFaceReference] = useState<boolean>(true);
    
    // Helper to calculate greatest common divisor for aspect ratio
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

    const handleLogout = useCallback(() => {
        sessionStorage.removeItem('authStatus');
        sessionStorage.removeItem('sessionExpiry');
        setAuthStatus('unauthenticated');
    }, []);

    useEffect(() => {
        const storedStatus = sessionStorage.getItem('authStatus') as AuthStatus | null;
        const storedExpiry = sessionStorage.getItem('sessionExpiry');
        const now = Date.now();

        if (storedStatus) {
            if (storedStatus === 'limited' && storedExpiry) {
                const expiryTime = parseInt(storedExpiry, 10);
                if (now < expiryTime) {
                    setAuthStatus('limited');
                    const timeout = expiryTime - now;
                    const timerId = setTimeout(handleLogout, timeout);
                    return () => clearTimeout(timerId);
                } else {
                    handleLogout(); // Session expired
                }
            } else if (storedStatus === 'full') {
                setAuthStatus('full');
            }
        }
    }, [handleLogout]);

    useEffect(() => {
        if (authStatus === 'limited' && activeTab === 'nano') {
            setActiveTab('jiplak');
        }
    }, [authStatus, activeTab]);

    const handlePinSubmit = (pin: string) => {
        if (pin === '69') {
            const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes
            sessionStorage.setItem('authStatus', 'limited');
            sessionStorage.setItem('sessionExpiry', expiry.toString());
            setAuthStatus('limited');
            setActiveTab('jiplak');
            setPinError(null);
            setTimeout(handleLogout, 15 * 60 * 1000);
            toast.success('Limited access granted for 15 minutes.');
        } else if (pin === '24') {
            sessionStorage.setItem('authStatus', 'full');
            sessionStorage.removeItem('sessionExpiry'); // Ensure no expiry for full access
            setAuthStatus('full');
            setPinError(null);
            toast.success('Full access granted!');
        } else {
            setPinError('Invalid PIN. Please try again.');
        }
    };

    const resetState = () => {
        setIsLoading(false);
        setImageFile(null);
        setImagePreview(null);
        setDetailedPrompt(null);
        setFinalPrompt('');
        setError(null);
        setAspectRatio('Original');
        setOriginalAspectRatio(null);
        setUseFaceReference(true);
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
        reader.onloadend = () => {
            const resultStr = reader.result as string;
            setImagePreview(resultStr);

            // Calculate original aspect ratio
            const img = new Image();
            img.onload = () => {
                const commonDivisor = gcd(img.width, img.height);
                const ar = `${img.width / commonDivisor}:${img.height / commonDivisor}`;
                setOriginalAspectRatio(ar);
                setAspectRatio('Original');
            };
            img.src = resultStr;
        };
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
        
        let currentPrompt = detailedPrompt;
        if (useFaceReference) {
            currentPrompt = `${detailedPrompt} (do not change facial details, according to the reference photo uploaded) contrast beautifully with a well-lit subject. Maintain the exact facial and hair details of the reference photo uploaded, while maintaining realistic skin texture, natural expressions, and photorealistic quality.`;
        }

        const currentAr = aspectRatio === 'Original' ? originalAspectRatio : aspectRatio;

        if (currentAr && currentAr !== 'Original') {
            const final = `${currentPrompt} --ar ${currentAr}`;
            setFinalPrompt(final.trim());
        } else {
            setFinalPrompt(currentPrompt.trim());
        }

    }, [detailedPrompt, aspectRatio, originalAspectRatio, useFaceReference]);

    const renderJiplakContent = () => {
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

                    <div className="space-y-5">
                        <div className="flex items-center space-x-3 bg-slate-700/50 p-3 rounded-lg">
                            <input
                                type="checkbox"
                                id="faceReference"
                                checked={useFaceReference}
                                onChange={(e) => setUseFaceReference(e.target.checked)}
                                className="h-5 w-5 rounded border-slate-500 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-700"
                                aria-describedby="faceReference-description"
                            />
                            <div className="flex flex-col">
                                <label htmlFor="faceReference" className="text-sm font-medium text-slate-300 select-none cursor-pointer">
                                    Append prompt for face reference
                                </label>
                                <p id="faceReference-description" className="text-xs text-slate-400">
                                    Check this if you plan to use a face reference photo.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-base font-medium text-slate-300">Aspect Ratio</label>
                            <AspectRatioSelector selectedRatio={aspectRatio} onSelectRatio={setAspectRatio} disabled={isLoading} />
                        </div>
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
    
    const TabButton: React.FC<{tabId: Tab; title: string; disabled?: boolean;}> = ({ tabId, title, disabled = false }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            role="tab"
            aria-selected={activeTab === tabId}
            disabled={disabled}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed ${
                activeTab === tabId
                ? 'bg-cyan-500 text-white focus:ring-cyan-400'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600 focus:ring-cyan-500'
            }`}
        >
            {title}
        </button>
    );

    if (authStatus === 'unauthenticated') {
        return <PinAuth onPinSubmit={handlePinSubmit} error={pinError} />;
    }

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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center">
                        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500 sm:text-5xl md:text-6xl">
                            JIPLAK_PROMPT 2.0
                        </h1>
                        <p className="mt-4 max-w-3xl mx-auto text-lg text-slate-400">
                        Create ultra-detailed prompts or edit images with AI.
                        </p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="absolute top-1/2 right-4 -translate-y-1/2 sm:right-6 lg:right-8 text-slate-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1.5"
                        aria-label="Logout"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <div className="flex justify-center mb-6 gap-2" role="tablist" aria-label="App features">
                    <TabButton tabId="jiplak" title="JIPLAK_PROMPT" />
                    <TabButton tabId="nano" title="NANO BANANA" disabled={authStatus === 'limited'} />
                </div>
                <div className="w-full max-w-3xl mx-auto bg-slate-800/50 rounded-2xl shadow-2xl shadow-cyan-500/10 border border-slate-700 p-6 md:p-8">
                    {activeTab === 'jiplak' ? renderJiplakContent() : <NanoBanana />}
                </div>
            </main>
        </div>
    );
};

export default App;