import React, { useState, useCallback, useEffect, useRef } from 'react';
import { TextEntry } from './components/TextEntry';
import { TextDisplay } from './components/TextDisplay';
import { AnnotationSidebar } from './components/AnnotationSidebar';
import { MindGraphView } from './components/MindGraphView';
import type { Annotation, AnnotationType, AnnotationValue, SelectionRange, Connection, ConnectionType } from './types';
import { ErrorIcon, BrainIcon } from './components/Icons';

export interface QuickToolbarState {
    top: number;
    left: number;
    width: number;
}

export interface AnnotationActionToolbarState {
    top: number;
    left: number;
    annotationId: string;
}

const App: React.FC = () => {
    const [extractedText, setExtractedText] = useState<string>('');
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [selection, setSelection] = useState<SelectionRange | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);
    const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null);
    const [quickToolbar, setQuickToolbar] = useState<QuickToolbarState | null>(null);
    const [annotationActionToolbar, setAnnotationActionToolbar] = useState<AnnotationActionToolbarState | null>(null);
    const mainContainerRef = useRef<HTMLElement>(null);
    
    // New state for connections and mind graph
    const [connections, setConnections] = useState<Connection[]>([]);
    const [connectionTypes, setConnectionTypes] = useState<ConnectionType[]>([
        { id: 'ct-settings', label: 'settings' },
        { id: 'ct-description', label: 'description' },
        { id: 'ct-relationship', label: 'relationship' },
        { id: 'ct-cause', label: 'cause' },
        { id: 'ct-effect', label: 'effect' },
    ]);
    const [connectionState, setConnectionState] = useState<{ from: string | null; type: string | null }>({ from: null, type: null });
    const [showMindGraph, setShowMindGraph] = useState<boolean>(false);


    const handleTextSubmit = (text: string) => {
        resetState(false);
        setExtractedText(text);
    };
    
    const onTextSelect = useCallback((range: SelectionRange | null, rect: DOMRect | null) => {
        setSelection(range);
        setAnnotationActionToolbar(null); // Hide action toolbar on new selection
        if (range && range.start !== range.end && rect) {
             const containerRect = mainContainerRef.current?.getBoundingClientRect();
             const top = rect.top - (containerRect?.top ?? 0) - 50;
             const left = rect.left - (containerRect?.left ?? 0) + rect.width / 2;
             setQuickToolbar({ top, left, width: rect.width });
        } else {
            setQuickToolbar(null);
        }
    }, []);

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

        setAnnotations(prev => [...prev, newAnnotation].sort((a, b) => a.start - b.start));
        setSelection(null);
        setQuickToolbar(null);
    }, [selection, extractedText]);

    const handleUpdateAnnotationNote = (id: string, note: string) => {
        setAnnotations(prev =>
            prev.map(ann => (ann.id === id ? { ...ann, note } : ann))
        );
    };
    
    const handleDeleteAnnotation = useCallback((id: string) => {
        setAnnotations(prev => prev.filter(ann => ann.id !== id));
        setConnections(prev => prev.filter(conn => conn.from !== id && conn.to !== id));
        if (activeAnnotationId === id) {
            setActiveAnnotationId(null);
        }
    }, [activeAnnotationId]);
    
    // Connection Handlers
    const handleStartConnection = (fromId: string, type: string) => {
        setConnectionState({ from: fromId, type });
        setActiveAnnotationId(fromId); // Keep the source annotation active
        setAnnotationActionToolbar(null);
    };

    const handleCompleteConnection = (toId: string) => {
        if (!connectionState.from || !connectionState.type || connectionState.from === toId) return;

        // Prevent duplicate connections
        const exists = connections.some(c => 
            (c.from === connectionState.from && c.to === toId) ||
            (c.from === toId && c.to === connectionState.from)
        );

        if (exists) {
            alert("A connection between these two annotations already exists.");
            handleCancelConnection();
            return;
        }

        const newConnection: Connection = {
            id: `conn-${Date.now()}`,
            from: connectionState.from,
            to: toId,
            type: connectionState.type,
        };
        setConnections(prev => [...prev, newConnection]);
        handleCancelConnection();
    };

    const handleAnnotationClick = (id: string, element: HTMLElement) => {
        if (connectionState.from) {
            handleCompleteConnection(id);
            return;
        }
        
        // Toggle behavior
        if (activeAnnotationId === id && annotationActionToolbar) {
            setActiveAnnotationId(null);
            setAnnotationActionToolbar(null);
        } else {
            setActiveAnnotationId(id);
            const containerRect = mainContainerRef.current?.getBoundingClientRect();
            if (!containerRect) return;

            const elementRect = element.getBoundingClientRect();
            // Position toolbar above the annotation
            const top = elementRect.top - containerRect.top - 60;
            const left = elementRect.left - containerRect.left + elementRect.width / 2;
            setAnnotationActionToolbar({ top, left, annotationId: id });
            setQuickToolbar(null); // Close quick toolbar
        }
    };

    const handleCancelConnection = () => {
        setConnectionState({ from: null, type: null });
    };

    const handleUpdateConnectionTypes = (updatedTypes: ConnectionType[]) => {
        setConnectionTypes(updatedTypes);
    };

    const handleDeleteConnectionType = (idToDelete: string) => {
        const typeToDelete = connectionTypes.find(t => t.id === idToDelete);
        if (!typeToDelete) return;

        setConnectionTypes(prev => prev.filter(t => t.id !== idToDelete));
        setConnections(prev => prev.filter(c => c.type !== typeToDelete.label));
    };
     
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (activeAnnotationId && (event.key === 'Delete' || event.key === 'Backspace')) {
                const target = event.target as HTMLElement;
                if (['textarea', 'input'].includes(target.tagName.toLowerCase())) {
                    return;
                }
                event.preventDefault();
                handleDeleteAnnotation(activeAnnotationId);
            }
            if (event.key === 'Escape') {
                if (connectionState.from) {
                    handleCancelConnection();
                } else if (quickToolbar || annotationActionToolbar) {
                    setQuickToolbar(null);
                    setAnnotationActionToolbar(null);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [activeAnnotationId, handleDeleteAnnotation, connectionState.from, quickToolbar, annotationActionToolbar]);

    const handleSaveAnnotations = () => {
        if (annotations.length === 0) return;
        const data = JSON.stringify({ text: extractedText, annotations, connections, connectionTypes }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `annotations-session.json`;
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
                        setConnections(data.connections || []);
                        setConnectionTypes(data.connectionTypes || [
                             { id: 'ct-settings', label: 'settings' },
                            { id: 'ct-description', label: 'description' },
                            { id: 'ct-relationship', label: 'relationship' },
                            { id: 'ct-cause', label: 'cause' },
                            { id: 'ct-effect', label: 'effect' },
                        ]);
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

    const resetState = (fullReset = true) => {
        if (fullReset) {
            setExtractedText('');
        }
        setAnnotations([]);
        setConnections([]);
        setSelection(null);
        setError(null);
        setActiveAnnotationId(null);
        setQuickToolbar(null);
        setAnnotationActionToolbar(null);
        setShowMindGraph(false);
        setConnectionState({from: null, type: null});
    };
    
    const showTextEntry = !extractedText && !error;
    const showMainView = extractedText && !error;

    return (
        <div className="bg-[#F8F9FA] min-h-screen text-[#212529]">
            <header className="bg-white shadow-sm sticky top-0 z-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                    <h1 className="text-3xl font-handwritten text-[#28533E] font-bold">Annotation Guide</h1>
                    <div className="flex items-center space-x-4">
                        {showMainView && (
                             <button 
                                onClick={() => setShowMindGraph(s => !s)}
                                title={showMindGraph ? "Show Text View" : "Show Mind Graph"}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-semibold shadow ${showMindGraph ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                <BrainIcon />
                                <span>{showMindGraph ? "Text View" : "Mind Graph"}</span>
                            </button>
                        )}
                        {(extractedText || error) && (
                            <button 
                                onClick={() => resetState(true)}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold shadow"
                            >
                                Start Over
                            </button>
                        )}
                    </div>
                </div>
            </header>
            
            <main ref={mainContainerRef} className="container mx-auto p-4 sm:p-6 lg:p-8">
                {showTextEntry && (
                    <TextEntry onTextSubmit={handleTextSubmit} onLoadRequest={handleLoadAnnotations} />
                )}

                {error && (
                    <div className="flex flex-col items-center justify-center h-96 bg-red-50 border border-red-200 rounded-lg p-8">
                        <ErrorIcon />
                        <p className="mt-4 text-lg text-red-700 font-semibold">An Error Occurred</p>
                        <p className="text-gray-600 text-center max-w-md">{error}</p>
                        <button
                            onClick={() => resetState(true)}
                            className="mt-6 bg-[#28533E] text-white px-6 py-2 rounded-lg hover:bg-[#1e3e2e] transition-colors font-semibold"
                        >
                            Try Again
                        </button>
                    </div>
                )}
                
                {showMainView && showMindGraph && (
                    <MindGraphView annotations={annotations} connections={connections} />
                )}

                {showMainView && !showMindGraph && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                             <TextDisplay 
                                text={extractedText} 
                                annotations={annotations} 
                                onTextSelect={onTextSelect}
                                activeAnnotationId={activeAnnotationId}
                                onAnnotationClick={handleAnnotationClick}
                                hoveredAnnotationId={hoveredAnnotationId}
                                onAnnotationHoverChange={setHoveredAnnotationId}
                                quickToolbar={quickToolbar}
                                onAddAnnotation={handleAddAnnotation}
                                connectionState={connectionState}
                                annotationActionToolbar={annotationActionToolbar}
                                connectionTypes={connectionTypes}
                                onStartConnection={handleStartConnection}
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
                                connectionState={connectionState}
                                connectionTypes={connectionTypes}
                                onCancelConnection={handleCancelConnection}
                                onUpdateConnectionTypes={handleUpdateConnectionTypes}
                                onDeleteConnectionType={handleDeleteConnectionType}
                             />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
