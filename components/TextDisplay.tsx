
import React, { useMemo } from 'react';
import type { Annotation, SelectionRange } from '../types';
import { AnnotationColor } from '../types';
import { LoadingSpinner } from './Icons';

interface TextDisplayProps {
    text: string;
    annotations: Annotation[];
    onTextSelect: (range: SelectionRange | null) => void;
    activeAnnotationId: string | null;
    onAnnotationClick: (id: string) => void;
    isLoading: boolean;
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

export const TextDisplay: React.FC<TextDisplayProps> = ({ text, annotations, onTextSelect, activeAnnotationId, onAnnotationClick, isLoading }) => {
    
    const handleMouseUp = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const textContentDiv = document.getElementById('text-content');
            if (!textContentDiv || !textContentDiv.contains(range.startContainer) || !textContentDiv.contains(range.endContainer)) {
                onTextSelect(null);
                return;
            }

            const preSelectionRange = document.createRange();
            preSelectionRange.selectNodeContents(textContentDiv);
            preSelectionRange.setEnd(range.startContainer, range.startOffset);
            const start = preSelectionRange.toString().length;

            preSelectionRange.setEnd(range.endContainer, range.endOffset);
            const end = preSelectionRange.toString().length;

            if (start !== end) {
                onTextSelect({ start, end });
            } else {
                 onTextSelect(null);
            }
        } else {
             onTextSelect(null);
        }
    };

    const renderedContent = useMemo(() => {
        if (annotations.length === 0) {
            return text;
        }

        const parts = [];
        let lastIndex = 0;

        annotations.forEach(ann => {
            if (ann.start > lastIndex) {
                parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, ann.start)}</span>);
            }
            
            let className = 'px-1 rounded-md cursor-pointer transition-all border-b-2 ';
            if (ann.type === 'highlight') {
                className += colorMap[ann.value as AnnotationColor];
            } else {
                className += symbolMap[ann.value];
            }

            if (ann.id === activeAnnotationId) {
                className += ' ring-2 ring-offset-2 ring-teal-500';
            } else {
                className += ' hover:brightness-95';
            }

            parts.push(
                <mark
                    key={ann.id}
                    className={className}
                    onClick={(e) => {
                        e.stopPropagation();
                        onAnnotationClick(ann.id)
                    }}
                >
                    {ann.text}
                </mark>
            );
            lastIndex = ann.end;
        });

        if (lastIndex < text.length) {
            parts.push(<span key={`text-${lastIndex}-end`}>{text.substring(lastIndex)}</span>);
        }

        return parts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [text, annotations, activeAnnotationId]);
    
    if (isLoading && !text) {
        return (
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 flex flex-col items-center justify-center min-h-[300px]">
                <LoadingSpinner />
                <p className="mt-4 text-lg text-[#28533E]">Transcription in progress...</p>
                <p className="text-sm text-gray-500">Text will appear here in real-time.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200">
             <h2 className="text-2xl font-handwritten text-[#28533E] mb-4">Document Text</h2>
            <div
                id="text-content"
                onMouseUp={handleMouseUp}
                onDoubleClick={handleMouseUp}
                className="whitespace-pre-wrap text-lg leading-relaxed text-gray-800"
            >
                {renderedContent}
            </div>
        </div>
    );
};
