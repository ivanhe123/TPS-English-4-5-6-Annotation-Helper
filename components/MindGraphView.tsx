
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Annotation, Connection } from '../types';

interface Node {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    width: number;
    height: number;
    annotation: Annotation;
}

interface Link {
    source: Node;
    target: Node;
    type: string;
}

const AnnotationIndicator: React.FC<{ annotation: Annotation }> = ({ annotation }) => {
    if (annotation.type === 'highlight') {
        const colorClass = {
            'pink': 'bg-pink-400',
            'blue': 'bg-blue-400',
            'green': 'bg-green-400',
            'yellow': 'bg-yellow-400',
        }[annotation.value] || 'bg-gray-400';
        return <div className={`w-4 h-4 rounded-full border-2 border-white ${colorClass}`} title={`Highlight: ${annotation.value}`}></div>;
    }

    if (annotation.type === 'symbol') {
        const symbolColorClass = {
            '?': 'text-gray-700 bg-gray-200',
            '!': 'text-red-700 bg-red-200',
            'O': 'text-purple-700 bg-purple-200',
            '*': 'text-indigo-700 bg-indigo-200',
        }[annotation.value] || 'text-gray-700 bg-gray-200';
        return (
            <div 
                className={`w-5 h-5 rounded-full border-2 border-white flex items-center justify-center font-bold text-xs ${symbolColorClass}`} 
                title={`Symbol: ${annotation.value}`}
            >
                <span>{annotation.value}</span>
            </div>
        );
    }
    return null;
};

const getNodeDimensions = (text: string) => {
    const baseWidth = 160;
    const baseHeight = 90;
    const extraLines = Math.max(0, Math.ceil(text.length / 25) - 2);
    return { width: baseWidth, height: baseHeight + extraLines * 20 };
};

export const MindGraphView: React.FC<{ annotations: Annotation[], connections: Connection[] }> = ({ annotations, connections }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [nodes, setNodes] = useState<Node[]>([]);
    
    const [viewTransform, setViewTransform] = useState({ scale: 1, translateX: 0, translateY: 0 });
    const [draggedNodeInfo, setDraggedNodeInfo] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    const links: Link[] = useMemo(() => {
        return connections.map(conn => {
            const source = nodes.find(n => n.id === conn.from);
            const target = nodes.find(n => n.id === conn.to);
            if (source && target) {
                return { source, target, type: conn.type };
            }
            return null;
        }).filter((l): l is Link => l !== null);
    }, [connections, nodes]);

    useEffect(() => {
        if (!containerRef.current || annotations.length === 0) return;

        // 1. Find the main node (most connected)
        const connectionCounts = new Map<string, number>();
        connections.forEach(conn => {
            connectionCounts.set(conn.from, (connectionCounts.get(conn.from) || 0) + 1);
            connectionCounts.set(conn.to, (connectionCounts.get(conn.to) || 0) + 1);
        });

        let mainNodeId: string | null = annotations[0]?.id || null;
        let maxConnections = -1;

        for (const [nodeId, count] of connectionCounts.entries()) {
            if (count > maxConnections) {
                maxConnections = count;
                mainNodeId = nodeId;
            }
        }

        // 2. Arrange nodes in a radial layout
        const mainNodeAnn = annotations.find(ann => ann.id === mainNodeId);
        const subNodeAnns = annotations.filter(ann => ann.id !== mainNodeId);

        // A more adaptive radius calculation for a tighter layout
        const nodeSpacing = getNodeDimensions('').width + 40; // Avg node width + padding
        const circumference = subNodeAnns.length * nodeSpacing;
        let radius = circumference / (2 * Math.PI);
        radius = Math.max(350, radius); // Ensure a minimum radius for clarity

        const angleStep = subNodeAnns.length > 0 ? (2 * Math.PI) / subNodeAnns.length : 0;

        const newNodes: Node[] = [];

        if (mainNodeAnn) {
            const dims = getNodeDimensions(mainNodeAnn.text);
            newNodes.push({
                id: mainNodeAnn.id,
                x: 0,
                y: 0,
                vx: 0, vy: 0,
                width: dims.width,
                height: dims.height,
                annotation: mainNodeAnn,
            });
        }

        subNodeAnns.forEach((ann, index) => {
            const angle = index * angleStep;
            const dims = getNodeDimensions(ann.text);
            newNodes.push({
                id: ann.id,
                x: radius * Math.cos(angle),
                y: radius * Math.sin(angle),
                vx: 0, vy: 0,
                width: dims.width,
                height: dims.height,
                annotation: ann,
            });
        });

        setNodes(newNodes);

        // 3. Auto-center and zoom the view to fit the graph
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
            const graphDiameter = (radius * 2) + nodeSpacing; // Diameter + avg node size
            const scaleX = width / graphDiameter;
            const scaleY = height / graphDiameter;
            const newScale = Math.min(scaleX, scaleY) * 0.9; // Fit with a 10% margin
            
            setViewTransform({
                scale: Math.max(0.1, Math.min(1, newScale)), // Clamp scale
                translateX: width / 2,
                translateY: height / 2
            });
        }
    }, [annotations, connections]);
    
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const { scale, translateX, translateY } = viewTransform;

        const zoomFactor = 1.1;
        const newScale = e.deltaY < 0 ? scale * zoomFactor : scale / zoomFactor;
        const clampedScale = Math.max(0.1, Math.min(3, newScale));

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const newTranslateX = mouseX - (mouseX - translateX) * (clampedScale / scale);
        const newTranslateY = mouseY - (mouseY - translateY) * (clampedScale / scale);

        setViewTransform({ scale: clampedScale, translateX: newTranslateX, translateY: newTranslateY });
    }, [viewTransform]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        const nodeElement = (e.target as HTMLElement).closest('[data-node-id]');
        if (nodeElement) {
            e.preventDefault();
            const nodeId = nodeElement.getAttribute('data-node-id');
            const node = nodes.find(n => n.id === nodeId);
            if (node && containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const mouseWorldX = (e.clientX - rect.left - viewTransform.translateX) / viewTransform.scale;
                const mouseWorldY = (e.clientY - rect.top - viewTransform.translateY) / viewTransform.scale;
                const offsetX = mouseWorldX - node.x;
                const offsetY = mouseWorldY - node.y;
                setDraggedNodeInfo({ id: nodeId!, offsetX, offsetY });
            }
        } else {
            setIsPanning(true);
            setPanStart({ x: e.clientX - viewTransform.translateX, y: e.clientY - viewTransform.translateY });
        }
    }, [nodes, viewTransform]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (draggedNodeInfo && containerRef.current) {
            e.preventDefault();
            const rect = containerRef.current.getBoundingClientRect();
            const mouseWorldX = (e.clientX - rect.left - viewTransform.translateX) / viewTransform.scale;
            const mouseWorldY = (e.clientY - rect.top - viewTransform.translateY) / viewTransform.scale;
            const newX = mouseWorldX - draggedNodeInfo.offsetX;
            const newY = mouseWorldY - draggedNodeInfo.offsetY;

            setNodes(prevNodes => prevNodes.map(n => 
                n.id === draggedNodeInfo.id ? { ...n, x: newX, y: newY, vx: 0, vy: 0 } : n
            ));
        } else if (isPanning) {
            e.preventDefault();
            const newTranslateX = e.clientX - panStart.x;
            const newTranslateY = e.clientY - panStart.y;
            setViewTransform(prev => ({ ...prev, translateX: newTranslateX, translateY: newTranslateY }));
        }
    }, [draggedNodeInfo, isPanning, panStart, viewTransform]);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        if (draggedNodeInfo) {
            e.preventDefault();
            setDraggedNodeInfo(null);
        }
        if (isPanning) {
            setIsPanning(false);
        }
    }, [draggedNodeInfo, isPanning]);

    if (annotations.length === 0) {
        return (
            <div className="text-center p-10 bg-white rounded-lg shadow-lg border">
                <h2 className="text-2xl font-bold text-gray-700">Mind Graph is Empty</h2>
                <p className="text-gray-500 mt-2">Create some annotations and connect them to see your mind graph here.</p>
            </div>
        )
    }

    return (
        <div 
            ref={containerRef} 
            className="w-full h-[70vh] bg-white rounded-xl shadow-lg border border-gray-200 relative overflow-hidden select-none"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        >
            <div
                className="absolute top-0 left-0"
                style={{
                    transform: `translate(${viewTransform.translateX}px, ${viewTransform.translateY}px) scale(${viewTransform.scale})`,
                    transformOrigin: '0 0',
                }}
            >
                <svg className="absolute top-0 left-0" style={{ overflow: 'visible' }}>
                    <defs>
                        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" />
                        </marker>
                    </defs>
                    {links.map(link => {
                        const dx = link.target.x - link.source.x;
                        const dy = link.target.y - link.source.y;
                        const midX = link.source.x + dx / 2;
                        const midY = link.source.y + dy / 2;
                        const isVerticalish = Math.abs(dy) > Math.abs(dx) * 0.8;
                        const offset = 25;
                        const textProps = {
                            x: isVerticalish ? midX + offset : midX,
                            y: isVerticalish ? midY : midY - offset,
                            textAnchor: (isVerticalish ? 'start' : 'middle') as 'start' | 'middle',
                        };

                        return (
                            <g key={`${link.source.id}-${link.target.id}`}>
                                <line
                                    x1={link.source.x} y1={link.source.y}
                                    x2={link.target.x} y2={link.target.y}
                                    stroke="#9ca3af" strokeWidth="2"
                                    markerEnd="url(#arrow)"
                                />
                                <text
                                    {...textProps}
                                    fill="#4b5563" fontSize="12"
                                    className="font-semibold pointer-events-none"
                                    style={{paintOrder: 'stroke', stroke: '#ffffff', strokeWidth: '6px', strokeLinejoin: 'round'}}
                                >
                                    {link.type}
                                </text>
                            </g>
                        );
                    })}
                </svg>
                {nodes.map(node => (
                    <div
                        key={node.id}
                        data-node-id={node.id}
                        className={`absolute px-4 pt-6 pb-4 rounded-lg shadow-xl border-2 border-teal-500 bg-white transition-transform duration-200 ease-out flex flex-col items-center ${draggedNodeInfo?.id === node.id ? 'cursor-grabbing' : 'cursor-grab'}`}
                        style={{
                            width: `${node.width}px`,
                            height: `${node.height}px`,
                            transform: `translate(${node.x - node.width/2}px, ${node.y - node.height/2}px)`,
                            zIndex: draggedNodeInfo?.id === node.id ? 10 : 1,
                        }}
                    >
                        <div className="absolute top-2 left-2">
                            <AnnotationIndicator annotation={node.annotation} />
                        </div>
                        <p className="text-sm text-gray-800 text-center leading-snug line-clamp-3 pointer-events-none">
                            {node.annotation.text}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};
