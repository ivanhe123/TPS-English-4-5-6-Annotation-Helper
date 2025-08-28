import React, { useState, useCallback } from 'react';
import { LoadIcon, NoteIcon } from './Icons';

interface TextEntryProps {
    onTextSubmit: (text: string) => void;
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


export const TextEntry: React.FC<TextEntryProps> = ({ onTextSubmit, onLoadRequest }) => {
    const [text, setText] = useState('');

    const handleSubmit = () => {
        if (text.trim()) {
            onTextSubmit(text);
        }
    };
    
    const triggerLoadInput = () => {
        document.getElementById('load-input')?.click();
    };

    return (
        <div className="max-w-4xl mx-auto text-center">
            <div className="p-8 border rounded-xl bg-white shadow-lg">
                <div className="flex flex-col items-center">
                    <NoteIcon />
                    <h2 className="mt-4 text-2xl font-semibold text-gray-800">Start a New Session</h2>
                    <p className="text-gray-500 mb-4">Paste your text below to begin annotating.</p>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Paste your document text here..."
                        className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-shadow mb-4"
                        aria-label="Text input for annotation"
                    />
                    <button 
                        onClick={handleSubmit} 
                        disabled={!text.trim()}
                        className="cursor-pointer bg-[#28533E] text-white font-semibold px-8 py-3 rounded-lg hover:bg-[#1e3e2e] transition-all shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Start Annotating
                    </button>
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
