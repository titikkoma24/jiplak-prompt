import React, { useState, useCallback, ChangeEvent } from 'react';

interface ReferenceImageUploaderProps {
  label: string;
  onImageUpload: (file: File | null) => void;
  isLoading: boolean;
  id: string;
}

const ReferenceImageUploader: React.FC<ReferenceImageUploaderProps> = ({ label, onImageUpload, isLoading, id }) => {
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageUpload(file);
    }
  }, [onImageUpload]);

  const handleClear = () => {
    setPreview(null);
    onImageUpload(null);
    const fileInput = document.getElementById(id) as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      {preview ? (
        <div className="relative group w-full aspect-square">
          <img src={preview} alt={`${label} preview`} className="rounded-md object-cover h-full w-full" />
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
            <button onClick={handleClear} disabled={isLoading} className="text-white bg-red-600/80 rounded-full p-1.5 hover:bg-red-500 disabled:opacity-50" aria-label={`Remove ${label}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <label htmlFor={id} className="relative cursor-pointer flex justify-center items-center w-full aspect-square p-2 border-2 border-slate-600 border-dashed rounded-md bg-slate-700/50 hover:border-cyan-500 hover:bg-slate-700 transition-colors">
          <div className="space-y-1 text-center">
            <svg className="mx-auto h-8 w-8 text-slate-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <div className="flex text-xs text-slate-400">
              <span className="font-medium text-cyan-400">
                Upload
              </span>
            </div>
          </div>
          <input id={id} name={id} type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" disabled={isLoading} />
        </label>
      )}
    </div>
  );
};

export default ReferenceImageUploader;