export enum AnnotationColor {
    Pink = 'pink',
    Blue = 'blue',
    Green = 'green',
    Yellow = 'yellow',
}

export enum AnnotationSymbol {
    Question = '?',
    Important = '!',
    Character = 'O',
    Device = '*',
}

export type AnnotationType = 'highlight' | 'symbol';
export type AnnotationValue = AnnotationColor | AnnotationSymbol;

export interface Annotation {
    id: string;
    start: number;
    end: number;
    text: string;
    type: AnnotationType;
    value: AnnotationValue;
    note: string;
}

export interface SelectionRange {
    start: number;
    end: number;
}

export interface ConnectionType {
    id: string;
    label: string;
}

export interface Connection {
    id: string;
    from: string; // Annotation ID
    to: string;   // Annotation ID
    type: string; // Corresponds to ConnectionType label
}
