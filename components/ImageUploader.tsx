import React, { useState, useCallback, ChangeEvent } from 'react';

interface ImageUploaderProps {
  onImageUpload: (file: File | null) => void;
  isLoading: boolean;
}

const UploadIcon: React.FC = () => (
    <svg className="w-12 h-12 mx-auto text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);


const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, isLoading }) => {
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
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if(fileInput) fileInput.value = '';
    onImageUpload(null);
  }

  return (
    <div className="w-full">
      {!preview ? (
         <div className="mt-1 flex justify-center px-6 pt-10 pb-12 border-2 border-gray-600 border-dashed rounded-lg bg-slate-800/50 hover:border-cyan-500 transition-colors duration-300">
            <div className="space-y-1 text-center">
                <UploadIcon />
                <div className="flex text-sm text-gray-400">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-slate-900 rounded-md font-medium text-cyan-400 hover:text-cyan-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-slate-900 focus-within:ring-cyan-500 px-1">
                        <span>Upload an image</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" disabled={isLoading} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 10MB</p>
            </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
            <div className="relative w-full max-w-lg">
                <img src={preview} alt="Image preview" className="rounded-lg shadow-2xl shadow-cyan-500/10 object-contain max-h-[50vh] mx-auto" />
            </div>
            <button
                onClick={handleClear}
                disabled={isLoading}
                className="mt-6 inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-500 disabled:opacity-50"
            >
                Choose a different image
            </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;