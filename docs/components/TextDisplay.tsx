import React, { useMemo, useState, useRef } from 'react';
import type { Annotation, SelectionRange, AnnotationType, AnnotationValue, ConnectionType } from '../types';
import { AnnotationColor, AnnotationSymbol } from '../types';
import type { QuickToolbarState, AnnotationActionToolbarState } from '../App';

interface TextDisplayProps {
    text: string;
    annotations: Annotation[];
    onTextSelect: (range: SelectionRange | null, rect: DOMRect | null) => void;
    activeAnnotationId: string | null;
    onAnnotationClick: (id: string, element: HTMLElement) => void;
    hoveredAnnotationId: string | null;
    onAnnotationHoverChange: (id: string | null) => void;
    quickToolbar: QuickToolbarState | null;
    onAddAnnotation: (type: AnnotationType, value: AnnotationValue) => void;
    connectionState: { from: string | null; type: string | null };
    annotationActionToolbar: AnnotationActionToolbarState | null;
    connectionTypes: ConnectionType[];
    onStartConnection: (fromId: string, type: string) => void;
}

const colorMap: Record<AnnotationColor, string> = {
    [AnnotationColor.Pink]: 'bg-pink-200 border-pink-400',
    [AnnotationColor.Blue]: 'bg-blue-200 border-blue-400',
    [AnnotationColor.Green]: 'bg-green-200 border-green-400',
    [AnnotationColor.Yellow]: 'bg-yellow-200 border-yellow-400',
};

const symbolMap: Record<string, string> = {
    '?': 'bg-gray-200 border-gray-400 text-gray-800',
    '!': 'bg-red-200 border-red-400 text-red-800',
    'O': 'bg-purple-200 border-purple-400 text-purple-800',
    '*': 'bg-indigo-200 border-indigo-400 text-indigo-800',
};

const symbolIndicatorColorMap: Record<string, string> = {
    '?': 'text-gray-800',
    '!': 'text-red-800',
    'O': 'text-purple-800',
    '*': 'text-indigo-800',
};

const AnnotationActionToolbar: React.FC<{
    toolbarState: AnnotationActionToolbarState;
    connectionTypes: ConnectionType[];
    onStartConnection: (fromId: string, type: string) => void;
}> = ({ toolbarState, connectionTypes, onStartConnection }) => {
    const toolbarStyle: React.CSSProperties = {
        position: 'absolute',
        top: `${toolbarState.top}px`,
        left: `${toolbarState.left}px`,
        transform: 'translateX(-50%)',
        zIndex: 10,
    };

    return (
        <div style={toolbarStyle} className="bg-white shadow-2xl rounded-lg p-1.5 flex items-center space-x-2 border border-gray-200" onMouseDown={(e) => e.preventDefault()}>
            <span className="text-xs font-semibold text-gray-500 pl-2 pr-1">Connect with:</span>
            {connectionTypes.map(type => (
                <button
                    key={type.id}
                    onClick={() => onStartConnection(toolbarState.annotationId, type.label)}
                    title={`Connect with '${type.label}'`}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
                >
                    {type.label}
                </button>
            ))}
        </div>
    );
};

const QuickAnnotationToolbar: React.FC<{ 
    toolbarState: QuickToolbarState;
    onAddAnnotation: (type: AnnotationType, value: AnnotationValue) => void;
}> = ({ toolbarState, onAddAnnotation }) => {
    
    const toolbarStyle: React.CSSProperties = {
        position: 'absolute',
        top: `${toolbarState.top}px`,
        left: `${toolbarState.left}px`,
        transform: 'translateX(-50%)',
        zIndex: 10,
    };

    const handleAdd = (type: AnnotationType, value: AnnotationValue) => {
        onAddAnnotation(type, value);
    };

    return (
        <div style={toolbarStyle} className="bg-white shadow-2xl rounded-lg p-1.5 flex items-center space-x-1 border border-gray-200" onMouseDown={(e) => e.preventDefault()}>
            <button onClick={() => handleAdd('highlight', AnnotationColor.Pink)} title="Pink: names and places" className="w-6 h-6 rounded-full bg-pink-400 hover:ring-2 ring-pink-300 transition-all"></button>
            <button onClick={() => handleAdd('highlight', AnnotationColor.Blue)} title="Blue: thematic passages" className="w-6 h-6 rounded-full bg-blue-400 hover:ring-2 ring-blue-300 transition-all"></button>
            <button onClick={() => handleAdd('highlight', AnnotationColor.Green)} title="Green: Literary Devices" className="w-6 h-6 rounded-full bg-green-400 hover:ring-2 ring-green-300 transition-all"></button>
            <button onClick={() => handleAdd('highlight', AnnotationColor.Yellow)} title="Yellow: questions/to discuss" className="w-6 h-6 rounded-full bg-yellow-400 hover:ring-2 ring-yellow-300 transition-all"></button>
            <div className="border-l h-5 mx-1.5 border-gray-300"></div>
            <button onClick={() => handleAdd('symbol', AnnotationSymbol.Question)} title="Question" className="w-6 h-6 flex items-center justify-center text-gray-700 font-bold text-lg hover:bg-gray-200 rounded-md transition-colors">?</button>
            <button onClick={() => handleAdd('symbol', AnnotationSymbol.Important)} title="Important" className="w-6 h-6 flex items-center justify-center text-red-700 font-bold text-lg hover:bg-red-200 rounded-md transition-colors">!</button>
            <button onClick={() => handleAdd('symbol', AnnotationSymbol.Character)} title="Character/Setting" className="w-6 h-6 flex items-center justify-center text-purple-700 font-bold text-lg hover:bg-purple-200 rounded-md transition-colors">O</button>
            <button onClick={() => handleAdd('symbol', AnnotationSymbol.Device)} title="Literary Device" className="w-6 h-6 flex items-center justify-center text-indigo-700 font-bold text-lg hover:bg-indigo-200 rounded-md transition-colors">*</button>
        </div>
    );
};


export const TextDisplay: React.FC<TextDisplayProps> = ({ 
    text, 
    annotations, 
    onTextSelect, 
    activeAnnotationId, 
    onAnnotationClick, 
    hoveredAnnotationId,
    onAnnotationHoverChange,
    quickToolbar,
    onAddAnnotation,
    connectionState,
    annotationActionToolbar,
    connectionTypes,
    onStartConnection
}) => {
    
    const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isConnecting = !!connectionState.from;

    const hoveredAnnotation = useMemo(() => {
        if (!hoveredAnnotationId) return null;
        return annotations.find(ann => ann.id === hoveredAnnotationId);
    }, [hoveredAnnotationId, annotations]);

    const handleMouseUp = () => {
        if (isConnecting) return; // Disable text selection while connecting
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            const textContentDiv = document.getElementById('text-content');
            
            if (!textContentDiv || !textContentDiv.contains(range.startContainer) || !textContentDiv.contains(range.endContainer)) {
                onTextSelect(null, null);
                return;
            }

            const getOffset = (container: Node, boundaryNode: Node, boundaryOffset: number): number => {
                let offset = 0;
                const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
                
                let currentNode;
                while ((currentNode = walker.nextNode())) {
                    const isSymbolNode = currentNode.parentElement?.closest('[data-symbol-indicator="true"]');

                    if (currentNode === boundaryNode) {
                        if (!isSymbolNode) {
                            offset += boundaryOffset;
                        }
                        break;
                    } else {
                        if (!isSymbolNode) {
                            offset += currentNode.textContent?.length || 0;
                        }
                    }
                }
                return offset;
            };

            const start = getOffset(textContentDiv, range.startContainer, range.startOffset);
            const end = getOffset(textContentDiv, range.endContainer, range.endOffset);
            
            if (start < end) {
                const rect = range.getBoundingClientRect();
                onTextSelect({ start, end }, rect);
            } else {
                 onTextSelect(null, null);
            }
        } else {
            onTextSelect(null, null);
        }
    };
    
    const renderedContent = useMemo(() => {
        if (!text) return null;

        const points = new Set<number>([0, text.length]);
        annotations.forEach(ann => {
            points.add(ann.start);
            points.add(ann.end);
        });

        const sortedPoints = Array.from(points).sort((a, b) => a - b);

        return sortedPoints.map((start, i) => {
            if (i === sortedPoints.length - 1) return null;
            const end = sortedPoints[i + 1];
            if (start >= end) return null;

            const relevantAnnotations = annotations
                .filter(ann => ann.start < end && ann.end > start)
                .sort((a, b) => (a.end - a.start) - (b.end - b.start));

            let segmentContent: React.ReactNode = text.substring(start, end);

            relevantAnnotations.forEach(ann => {
                let className = 'relative px-1 rounded-sm cursor-pointer transition-all border-b-2 ';
                if (ann.type === 'highlight') {
                    className += colorMap[ann.value as AnnotationColor] ?? '';
                } else {
                    className += symbolMap[ann.value] ?? '';
                }

                if (ann.id === activeAnnotationId) {
                    className += ' ring-2 ring-offset-2 ring-teal-500';
                } else if (isConnecting && ann.id !== connectionState.from) {
                    className += ' hover:ring-2 ring-offset-2 ring-blue-500';
                } else if (!isConnecting) {
                    className += ' hover:brightness-95';
                }
                
                const symbolIndicator = ann.type === 'symbol' ? (
                    <span
                        aria-hidden="true"
                        data-symbol-indicator="true"
                        className={`absolute -top-2 -left-1 text-sm font-bold z-10 ${symbolIndicatorColorMap[ann.value] ?? 'text-gray-800'}`}
                    >
                        {ann.value}
                    </span>
                ) : null;

                segmentContent = (
                    <mark
                        key={ann.id}
                        className={className}
                        onClick={(e) => {
                            e.stopPropagation();
                            onAnnotationClick(ann.id, e.currentTarget);
                        }}
                         onMouseEnter={() => {
                            if (ann.note) onAnnotationHoverChange(ann.id);
                        }}
                        onMouseLeave={() => {
                            onAnnotationHoverChange(null);
                        }}
                        onMouseMove={(e) => {
                            if (ann.note && containerRef.current) {
                                const rect = containerRef.current.getBoundingClientRect();
                                setTooltipPosition({ top: e.clientY - rect.top + 15, left: e.clientX - rect.left + 15 });
                            }
                        }}
                    >
                        {symbolIndicator}
                        {segmentContent}
                    </mark>
                );
            });

            return <React.Fragment key={start}>{segmentContent}</React.Fragment>;
        }).filter(Boolean);

    }, [text, annotations, activeAnnotationId, onAnnotationClick, onAnnotationHoverChange, isConnecting, connectionState.from]);

    return (
        <div ref={containerRef} className="relative bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200">
             {quickToolbar && <QuickAnnotationToolbar toolbarState={quickToolbar} onAddAnnotation={onAddAnnotation} />}
             {annotationActionToolbar && <AnnotationActionToolbar toolbarState={annotationActionToolbar} connectionTypes={connectionTypes} onStartConnection={onStartConnection} />}
             <h2 className="text-2xl font-handwritten text-[#28533E] mb-4">Document Text</h2>
            <div
                id="text-content"
                onMouseUp={handleMouseUp}
                className={`whitespace-pre-wrap text-lg leading-relaxed text-gray-800 ${isConnecting ? 'select-none' : ''}`}
            >
                {renderedContent}
            </div>
            {hoveredAnnotation && hoveredAnnotation.note && tooltipPosition && (
                <div 
                    className="absolute z-30 p-2 text-sm bg-gray-800 bg-opacity-90 text-white rounded-md shadow-lg max-w-xs whitespace-pre-wrap pointer-events-none"
                    style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
                    role="tooltip"
                >
                    {hoveredAnnotation.note}
                </div>
            )}
        </div>
    );
};
