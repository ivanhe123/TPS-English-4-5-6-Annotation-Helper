import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = (file: File): Promise<{ inlineData: { data: string, mimeType: string } }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result !== 'string') {
                return reject(new Error('Failed to read file as base64 string.'));
            }
            const base64Data = reader.result.split(',')[1];
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                }
            });
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

export const extractTextFromImage = async (file: File, onStreamUpdate: (chunk: string) => void): Promise<void> => {
    try {
        const imagePart = await fileToGenerativePart(file);
        const textPart = { text: "Transcribe the text in the attachement. Do not use any markdown formatting. Ignore the page count and illustrations." };

        const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                thinkingConfig: { thinkingBudget: 0 }
            }
        });

        let fullText = '';
        for await (const chunk of responseStream) {
            const chunkText = chunk.text;
            if (chunkText) {
                fullText += chunkText;
                onStreamUpdate(chunkText);
            }
        }

        if (fullText.trim().length === 0) {
            throw new Error("The model did not return any text. The image might be empty or unreadable.");
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to communicate with the AI model.");
    }
};
