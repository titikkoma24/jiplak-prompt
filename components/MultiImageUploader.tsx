import React, { useState, useCallback, ChangeEvent, DragEvent } from 'react';
import toast from 'react-hot-toast';

interface MultiImageUploaderProps {
  onFilesChange: (files: File[]) => void;
  maxFiles: number;
}

const UploadIcon: React.FC = () => (
    <svg className="w-10 h-10 mx-auto text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const MultiImageUploader: React.FC<MultiImageUploaderProps> = ({ onFilesChange, maxFiles }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const processFiles = useCallback((incomingFiles: FileList | null) => {
        if (!incomingFiles) return;

        const newFiles = Array.from(incomingFiles);
        const totalFiles = files.length + newFiles.length;

        if (totalFiles > maxFiles) {
            toast.error(`You can only upload a maximum of ${maxFiles} images.`);
            return;
        }

        const updatedFiles = [...files, ...newFiles];
        setFiles(updatedFiles);
        onFilesChange(updatedFiles);

        newFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });

    }, [files, maxFiles, onFilesChange]);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        processFiles(event.target.files);
        // Reset input value to allow re-uploading the same file
        event.target.value = '';
    };
    
    const handleRemove = (indexToRemove: number) => {
        const updatedFiles = files.filter((_, index) => index !== indexToRemove);
        const updatedPreviews = previews.filter((_, index) => index !== indexToRemove);
        setFiles(updatedFiles);
        setPreviews(updatedPreviews);
        onFilesChange(updatedFiles);
    };
    
    const handleDragEnter = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    };

    return (
        <div className="w-full">
            <label
                htmlFor="multi-file-upload"
                onDragEnter={handleDragEnter}
                onDragOver={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full min-h-[150px] p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300 ${isDragging ? 'border-cyan-500 bg-slate-700' : 'border-gray-600 bg-slate-800/50 hover:border-cyan-500'}`}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadIcon />
                    <p className="mb-2 text-sm text-gray-400">
                        <span className="font-semibold text-cyan-400">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, WEBP (Max {maxFiles} files)</p>
                </div>
                <input id="multi-file-upload" type="file" className="sr-only" multiple accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
            </label>
            {previews.length > 0 && (
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {previews.map((src, index) => (
                        <div key={index} className="relative group aspect-square">
                            <img src={src} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                            <button
                                onClick={() => handleRemove(index)}
                                className="absolute top-1 right-1 bg-red-600/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                aria-label={`Remove image ${index + 1}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MultiImageUploader;