import React, { useState } from 'react';
import type { Annotation, AnnotationType, AnnotationValue, Connection, ConnectionType } from '../types';
import { AnnotationColor, AnnotationSymbol } from '../types';
import { SaveIcon, LoadIcon, NoteIcon, DeleteIcon } from './Icons';

interface AnnotationSidebarProps {
    onAddAnnotation: (type: AnnotationType, value: AnnotationValue) => void;
    annotations: Annotation[];
    onSave: () => void;
    onLoad: (event: React.ChangeEvent<HTMLInputElement>) => void;
    selectionActive: boolean;
    activeAnnotationId: string | null;
    onAnnotationSelect: (id: string | null) => void;
    onNoteChange: (id: string, note: string) => void;
    onDelete: (id: string) => void;
    // Connection props
    connectionState: { from: string | null; type: string | null };
    connectionTypes: ConnectionType[];
    onCancelConnection: () => void;
    onUpdateConnectionTypes: (types: ConnectionType[]) => void;
    onDeleteConnectionType: (id: string) => void;
}

const ToolButton: React.FC<{ onClick: () => void, disabled: boolean, className: string, children: React.ReactNode, title: string }> = ({ onClick, disabled, className, children, title }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        aria-label={title}
        className={`w-full text-left p-3 rounded-lg flex items-center transition-all duration-200 text-sm ${className} ${
            disabled ? 'cursor-not-allowed bg-gray-200 text-gray-400' : 'hover:shadow-md hover:-translate-y-0.5'
        }`}
    >
        {children}
    </button>
);

const ConnectionTypeManager: React.FC<{
    types: ConnectionType[],
    onUpdate: (types: ConnectionType[]) => void,
    onDelete: (id: string) => void
}> = ({ types, onUpdate, onDelete }) => {
    const [newTypeLabel, setNewTypeLabel] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingLabel, setEditingLabel] = useState('');

    const handleAdd = () => {
        if (newTypeLabel.trim() && !types.some(t => t.label.toLowerCase() === newTypeLabel.trim().toLowerCase())) {
            const newType = { id: `ct-${Date.now()}`, label: newTypeLabel.trim() };
            onUpdate([...types, newType]);
            setNewTypeLabel('');
        }
    };

    const handleEdit = (type: ConnectionType) => {
        setEditingId(type.id);
        setEditingLabel(type.label);
    };

    const handleSaveEdit = () => {
        if (!editingId || !editingLabel.trim()) return;
        const updatedTypes = types.map(t => t.id === editingId ? { ...t, label: editingLabel.trim() } : t);
        onUpdate(updatedTypes);
        setEditingId(null);
        setEditingLabel('');
    };

    return (
        <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200 space-y-4">
            <h3 className="text-xl font-handwritten text-[#28533E]">Connection Types</h3>
            <div className="space-y-2">
                {types.map(type => (
                    <div key={type.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        {editingId === type.id ? (
                            <input
                                type="text"
                                value={editingLabel}
                                onChange={(e) => setEditingLabel(e.target.value)}
                                onBlur={handleSaveEdit}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                className="flex-grow p-1 border rounded mr-2"
                                autoFocus
                            />
                        ) : (
                            <span className="flex-grow">{type.label}</span>
                        )}
                        <div className="flex space-x-1">
                            <button onClick={() => editingId === type.id ? handleSaveEdit() : handleEdit(type)} className="p-1 text-gray-500 hover:text-blue-600">
                                {editingId === type.id ? 'Save' : 'Edit'}
                            </button>
                            <button onClick={() => onDelete(type.id)} className="p-1 text-gray-500 hover:text-red-600">Del</button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex space-x-2">
                <input
                    type="text"
                    value={newTypeLabel}
                    onChange={(e) => setNewTypeLabel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="New connection type..."
                    className="flex-grow p-2 border rounded-lg"
                />
                <button onClick={handleAdd} className="px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Add</button>
            </div>
        </div>
    );
};


export const AnnotationSidebar: React.FC<AnnotationSidebarProps> = ({ 
    onAddAnnotation, 
    annotations, 
    onSave, 
    onLoad, 
    selectionActive, 
    activeAnnotationId,
    onAnnotationSelect,
    onNoteChange,
    onDelete,
    connectionState,
    connectionTypes,
    onCancelConnection,
    onUpdateConnectionTypes,
    onDeleteConnectionType
}) => {
    
    const triggerLoadInput = () => {
        document.getElementById('load-input-sidebar')?.click();
    };

    const activeAnnotation = annotations.find(ann => ann.id === activeAnnotationId);
    
    const getStatusMessage = () => {
        if (connectionState.from) {
             return { text: 'Select annotation to connect', className: 'bg-blue-100 text-blue-800 animate-pulse' };
        }
        if (selectionActive) {
            return { text: 'Select a tool to annotate', className: 'bg-teal-100 text-teal-800' };
        }
        return { text: 'Highlight text to begin', className: 'bg-gray-100 text-gray-500' };
    };

    const status = getStatusMessage();
    const isDisabled = !selectionActive || !!connectionState.from;

    return (
        <div className="sticky top-24">
            <div className="space-y-6 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
                <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200">
                    <h3 className="text-xl font-handwritten text-[#28533E] mb-3">Annotation Tools</h3>

                    <p className={`text-sm mb-4 text-center p-2 rounded-md ${status.className}`}>
                        {status.text}
                        {connectionState.from && (
                            <button onClick={onCancelConnection} className="ml-2 text-xs font-semibold text-red-600 hover:underline">(Cancel)</button>
                        )}
                    </p>
                    <div className="space-y-3">
                        <p className="font-semibold text-gray-600">Color Code:</p>
                        <ToolButton onClick={() => onAddAnnotation('highlight', AnnotationColor.Pink)} disabled={isDisabled} className="bg-pink-100 text-pink-800" title="Names and places"><span className="w-4 h-4 rounded-full bg-pink-400 mr-3"></span><span><span className="font-semibold">Pink:</span> names and places</span></ToolButton>
                        <ToolButton onClick={() => onAddAnnotation('highlight', AnnotationColor.Blue)} disabled={isDisabled} className="bg-blue-100 text-blue-800" title="Thematic passages"><span className="w-4 h-4 rounded-full bg-blue-400 mr-3"></span><span><span className="font-semibold">Blue:</span> thematic passages</span></ToolButton>
                        <ToolButton onClick={() => onAddAnnotation('highlight', AnnotationColor.Green)} disabled={isDisabled} className="bg-green-100 text-green-800" title="Literary Devices"><span className="w-4 h-4 rounded-full bg-green-400 mr-3"></span><span><span className="font-semibold">Green:</span> Literary Devices</span></ToolButton>
                        <ToolButton onClick={() => onAddAnnotation('highlight', AnnotationColor.Yellow)} disabled={isDisabled} className="bg-yellow-100 text-yellow-800" title="Questions/to discuss"><span className="w-4 h-4 rounded-full bg-yellow-400 mr-3"></span><span><span className="font-semibold">Yellow:</span> questions/to discuss</span></ToolButton>
                        
                        <p className="font-semibold text-gray-600 pt-3">Symbols:</p>
                        <ToolButton onClick={() => onAddAnnotation('symbol', AnnotationSymbol.Question)} disabled={isDisabled} className="bg-gray-200 text-gray-800" title="Indicate a question"><span className="font-bold text-lg w-6 text-center mr-2">?</span><span>to indicate a question</span></ToolButton>
                        <ToolButton onClick={() => onAddAnnotation('symbol', AnnotationSymbol.Important)} disabled={isDisabled} className="bg-red-200 text-red-800" title="Important thematic passage"><span className="font-bold text-lg w-6 text-center mr-2">!</span><span>to indicate an important passage</span></ToolButton>
                        <ToolButton onClick={() => onAddAnnotation('symbol', AnnotationSymbol.Character)} disabled={isDisabled} className="bg-purple-200 text-purple-800" title="Character/setting"><span className="font-bold text-lg w-6 text-center mr-2">O</span><span>to indicate a character/setting</span></ToolButton>
                        <ToolButton onClick={() => onAddAnnotation('symbol', AnnotationSymbol.Device)} disabled={isDisabled} className="bg-indigo-200 text-indigo-800" title="Literary device"><span className="font-bold text-lg w-6 text-center mr-2">*</span><span>to indicate a literary device</span></ToolButton>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-handwritten text-[#28533E]">Annotation Details</h3>
                        {activeAnnotation && (
                            <button 
                                onClick={() => onDelete(activeAnnotationId!)} 
                                title="Delete annotation" 
                                aria-label="Delete annotation"
                                className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-100 transition-colors"
                            >
                                <DeleteIcon />
                            </button>
                        )}
                    </div>
                    {activeAnnotation ? (
                        <div className="space-y-4">
                            <blockquote className="text-sm text-gray-600 italic p-3 border-l-4 border-gray-300 bg-gray-50 rounded-r-md">
                                "{activeAnnotation.text}"
                            </blockquote>
                            <textarea
                                value={activeAnnotation.note}
                                onChange={(e) => onNoteChange(activeAnnotation.id, e.target.value)}
                                placeholder="Add a note... (optional)"
                                aria-label="Annotation note"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow"
                                rows={4}
                            />
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-6">
                            <NoteIcon />
                            <p className="mt-2 text-sm">Click an annotation to see details or add a note.</p>
                        </div>
                    )}
                </div>

                <ConnectionTypeManager types={connectionTypes} onUpdate={onUpdateConnectionTypes} onDelete={onDeleteConnectionType} />

                <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200">
                    <h3 className="text-xl font-handwritten text-[#28533E] mb-3">Session</h3>
                    <div className="flex space-x-3">
                        <button onClick={onSave} disabled={annotations.length === 0} className="flex-1 flex items-center justify-center p-3 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow">
                            <SaveIcon /> <span className="ml-2">Save</span>
                        </button>
                        <button onClick={triggerLoadInput} className="flex-1 flex items-center justify-center p-3 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-colors shadow">
                            <LoadIcon /> <span className="ml-2">Load</span>
                        </button>
                        <input id="load-input-sidebar" type="file" className="hidden" accept=".json" onChange={onLoad} />
                    </div>
                </div>
            </div>
        </div>
    );
};
