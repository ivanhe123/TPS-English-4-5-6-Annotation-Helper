
import React, { useState, useCallback } from 'react';
import { UploadIcon, LoadIcon } from './Icons';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    onLoadRequest: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const WelcomeGuide: React.FC = () => (
    <div className="mt-10 text-left space-y-6 text-gray-700">
        <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-handwritten text-2xl text-[#28533E]">What should you be annotating?</h3>
            <ul className="list-disc list-inside mt-2 space-y-1.5 pl-2">
                <li>Major Themes</li>
                <li>Use of literary devices</li>
                <li>Setting, Characters/Characterizations, Major Plot Points</li>
                <li>Questions (written out, not just a question mark)</li>
            </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                <h3 className="font-handwritten text-2xl text-[#28533E]">Color Code:</h3>
                <p className="text-sm text-gray-500 mb-3">Use colors to mark different elements.</p>
                <ul className="space-y-1.5">
                    <li><strong className="text-pink-600">Pink:</strong> names and places</li>
                    <li><strong className="text-blue-600">Blue:</strong> thematic passages</li>
                    <li><strong className="text-green-600">Green:</strong> Literary Devices</li>
                    <li><strong className="text-yellow-600">Yellow:</strong> questions or topics for discussion</li>
                </ul>
            </div>
            <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                 <h3 className="font-handwritten text-2xl text-[#28533E]">Symbols:</h3>
                 <p className="text-sm text-gray-500 mb-3">Use symbols for quick notes.</p>
                 <ul className="space-y-1.5">
                    <li><strong className="text-lg text-gray-700">?</strong> to indicate a question</li>
                    <li><strong className="text-lg text-red-700">!</strong> to indicate an important passage</li>
                    <li><strong className="text-lg text-purple-700">O</strong> to indicate a character/setting</li>
                    <li><strong className="text-lg text-indigo-700">*</strong> to indicate a literary device</li>
                </ul>
            </div>
        </div>
    </div>
);


export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, onLoadRequest }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            if (files[0].type.startsWith('image/')) {
                onFileSelect(files[0]);
            } else {
                alert("Please drop an image file.");
            }
        }
    }, [onFileSelect]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onFileSelect(files[0]);
        }
    };
    
    const triggerLoadInput = () => {
        document.getElementById('load-input')?.click();
    };

    return (
        <div className="max-w-4xl mx-auto text-center">
            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`p-10 border-2 border-dashed rounded-xl transition-colors ${
                    isDragging ? 'border-[#28533E] bg-[#eaf2ed]' : 'border-gray-300 bg-white'
                }`}
            >
                <div className="flex flex-col items-center">
                    <UploadIcon />
                    <p className="mt-4 text-xl font-semibold text-gray-700">Drag & drop your document here</p>
                    <p className="text-gray-500">or</p>
                    <label htmlFor="file-upload" className="mt-2 cursor-pointer bg-[#28533E] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#1e3e2e] transition-all shadow-md">
                        Browse for File
                    </label>
                    <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    <p className="mt-4 text-xs text-gray-400">Supports PNG, JPG, WEBP, etc.</p>
                </div>
            </div>
            <div className="mt-6 flex items-center justify-center">
                <span className="text-gray-500">Have a saved session?</span>
                 <button onClick={triggerLoadInput} className="ml-2 flex items-center text-[#28533E] font-semibold hover:underline">
                    <LoadIcon />
                    <span className="ml-1">Load Annotations</span>
                </button>
                <input id="load-input" type="file" className="hidden" accept=".json" onChange={onLoadRequest} />
            </div>
            <WelcomeGuide />
        </div>
    );
};
