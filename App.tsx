
import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { TextDisplay } from './components/TextDisplay';
import { AnnotationSidebar } from './components/AnnotationSidebar';
import { extractTextFromImage } from './services/geminiService';
import type { Annotation, AnnotationType, AnnotationValue, SelectionRange } from './types';
import { LoadingSpinner, ErrorIcon } from './components/Icons';

const App: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [extractedText, setExtractedText] = useState<string>('');
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [selection, setSelection] = useState<SelectionRange | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);

    const handleFileSelect = async (selectedFile: File) => {
        setFile(selectedFile);
        setExtractedText('');
        setAnnotations([]);
        setError(null);
        setIsLoading(true);
        try {
            await extractTextFromImage(selectedFile, (chunk) => {
                setExtractedText(prev => prev + chunk);
            });
        } catch (err) {
            console.error(err);
            setError('Failed to extract text from the file. Please try another image.');
            setExtractedText(''); // Clear partial text on error
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddAnnotation = useCallback((type: AnnotationType, value: AnnotationValue) => {
        if (!selection || selection.start === selection.end) return;

        const newAnnotation: Annotation = {
            id: `ann-${Date.now()}-${Math.random()}`,
            start: selection.start,
            end: selection.end,
            text: extractedText.substring(selection.start, selection.end),
            type,
            value,
            note: '',
        };

        // Prevent overlapping annotations for simplicity
        const isOverlapping = annotations.some(ann => 
            (newAnnotation.start < ann.end && newAnnotation.end > ann.start)
        );

        if (isOverlapping) {
             // A more user-friendly approach would be a toast notification
            alert("Annotations cannot overlap.");
            return;
        }

        setAnnotations(prev => [...prev, newAnnotation].sort((a, b) => a.start - b.start));
        setSelection(null); // Clear selection after annotating
    }, [selection, extractedText, annotations]);

    const handleUpdateAnnotationNote = (id: string, note: string) => {
        setAnnotations(prev =>
            prev.map(ann => (ann.id === id ? { ...ann, note } : ann))
        );
    };
    
    const handleDeleteAnnotation = (id: string) => {
        setAnnotations(prev => prev.filter(ann => ann.id !== id));
        if (activeAnnotationId === id) {
            setActiveAnnotationId(null);
        }
    };
    
    const handleSaveAnnotations = () => {
        if (annotations.length === 0) return;
        const data = JSON.stringify({ text: extractedText, annotations }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = file?.name.split('.')[0] || 'annotations';
        a.download = `${fileName}-annotations.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleLoadAnnotations = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = e.target?.result;
                if (typeof result === 'string') {
                    const data = JSON.parse(result);
                    if (data.text && Array.isArray(data.annotations)) {
                        setExtractedText(data.text);
                        setAnnotations(data.annotations.sort((a:Annotation, b:Annotation) => a.start - b.start));
                        setFile(null); // Reset file as we are loading from JSON
                    } else {
                        throw new Error("Invalid annotation file format.");
                    }
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load or parse the annotation file.");
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    };

    const resetState = () => {
        setFile(null);
        setExtractedText('');
        setAnnotations([]);
        setSelection(null);
        setIsLoading(false);
        setError(null);
        setActiveAnnotationId(null);
    };
    
    const showFileUpload = !file && !extractedText && !error;
    const showMainView = (file || extractedText) && !error;

    return (
        <div className="bg-[#F8F9FA] min-h-screen text-[#212529]">
            <header className="bg-white shadow-sm sticky top-0 z-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                    <h1 className="text-3xl font-handwritten text-[#28533E] font-bold">Guide to Annotation AI</h1>
                    {(file || extractedText || error) && (
                        <button 
                            onClick={resetState}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold shadow"
                        >
                            Start Over
                        </button>
                    )}
                </div>
            </header>
            
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                {showFileUpload && (
                    <FileUpload onFileSelect={handleFileSelect} onLoadRequest={handleLoadAnnotations} />
                )}

                {error && (
                    <div className="flex flex-col items-center justify-center h-96 bg-red-50 border border-red-200 rounded-lg p-8">
                        <ErrorIcon />
                        <p className="mt-4 text-lg text-red-700 font-semibold">An Error Occurred</p>
                        <p className="text-gray-600 text-center max-w-md">{error}</p>
                        <button
                            onClick={resetState}
                            className="mt-6 bg-[#28533E] text-white px-6 py-2 rounded-lg hover:bg-[#1e3e2e] transition-colors font-semibold"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {showMainView && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                             <TextDisplay 
                                text={extractedText} 
                                annotations={annotations} 
                                onTextSelect={setSelection}
                                activeAnnotationId={activeAnnotationId}
                                onAnnotationClick={setActiveAnnotationId}
                                isLoading={isLoading}
                             />
                        </div>
                        <div>
                             <AnnotationSidebar 
                                onAddAnnotation={handleAddAnnotation}
                                annotations={annotations}
                                onSave={handleSaveAnnotations}
                                onLoad={handleLoadAnnotations}
                                selectionActive={!!selection && selection.start !== selection.end}
                                activeAnnotationId={activeAnnotationId}
                                onAnnotationSelect={setActiveAnnotationId}
                                onNoteChange={handleUpdateAnnotationNote}
                                onDelete={handleDeleteAnnotation}
                                isStreaming={isLoading}
                             />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
