import { GoogleGenAI, Type, Part, GenerateContentResponse, Modality } from "@google/genai";

// Helper function to convert File to a Gemini API Part
const fileToGenerativePart = async (file: File): Promise<Part> => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            data: await base64EncodedDataPromise,
            mimeType: file.type,
        },
    };
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * The expected JSON response structure from the Gemini API for prompt generation.
 */
export interface PromptGenerationResponse {
    prompt: string;
    subjectCount: number;
}

/**
 * Analyzes an image and generates a single, highly detailed prompt for recreation.
 * Also identifies the number of human subjects.
 */
export const generateDetailedPrompt = async (imageFile: File): Promise<PromptGenerationResponse> => {
    try {
        const imagePart = await fileToGenerativePart(imageFile);
        const model = 'gemini-2.5-flash';

        const instructionText = `Analyze the attached image. Your task is to generate a highly detailed, photorealistic master prompt that describes the image in its entirety, so it can be perfectly recreated by an image generation AI. The final recreation will use different people's faces as references, which will be provided later.

Therefore, you must describe everything EXCEPT for the facial features.

Key requirements:
1.  **Count Subjects**: First, identify and count the number of distinct human subjects in the image.
2.  **Describe Individually**: If there is more than one person, describe each person separately and clearly to avoid ambiguity. Use identifiers like "person on the left," "person in the center," "person wearing the red dress," etc.
3.  **Detailed Descriptions**: For each person, describe their pose, body language, body type, clothing style and details, accessories, and hair style/color. DO NOT describe their face.
4.  **Scene Details**: Describe the overall scene, background, environment, lighting, and composition.

Your entire output must be a single JSON object with two keys:
- "prompt": A string containing the final generated master prompt.
- "subjectCount": An integer representing the number of distinct people you identified.

Example for a two-person image: { "prompt": "A photorealistic shot of two people. The person on the left is a woman with long blonde hair, wearing a blue denim jacket... The person on the right is a man with short brown hair, wearing a white t-shirt...", "subjectCount": 2 }`;

        const contents = {
            parts: [
                imagePart,
                { text: instructionText }
            ],
        };

        const result: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: contents,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        prompt: { type: Type.STRING, description: "A single, highly detailed and descriptive prompt based on the provided scene and image subjects." },
                        subjectCount: { type: Type.INTEGER, description: "The number of distinct human subjects identified in the image." }
                    },
                    required: ["prompt", "subjectCount"]
                }
            }
        });

        const responseText = result.text;
        const responseJson = JSON.parse(responseText) as PromptGenerationResponse;
        
        // Basic validation
        if (typeof responseJson.prompt !== 'string' || typeof responseJson.subjectCount !== 'number') {
            throw new Error("Invalid JSON structure received from the AI.");
        }
        
        return responseJson;

    } catch (error) {
        console.error("Error generating detailed prompt:", error);
        throw new Error("Failed to generate a detailed prompt. Please check the console for more details.");
    }
};


/**
 * Translates a given text to the target language.
 */
export const translateText = async (text: string, targetLanguage: 'Indonesian' | 'English'): Promise<string> => {
    try {
        const model = 'gemini-2.5-flash';
        const prompt = `Translate the following text to ${targetLanguage}. Only return the translated text, without any additional explanation or formatting: "${text}"`;
        
        const result = await ai.models.generateContent({
            model: model,
            contents: prompt
        });

        return result.text.trim();

    } catch (error) {
        console.error(`Error translating text to ${targetLanguage}:`, error);
        throw new Error(`Failed to translate text. Please try again.`);
    }
};

export interface NanoResult {
    type: 'text' | 'image';
    content: string;
}

/**
 * Edits images using a prompt with the Nano Banana model.
 */
export const generateWithNanoBanana = async (imageFiles: File[], prompt: string): Promise<NanoResult[]> => {
    try {
        const imageParts = await Promise.all(imageFiles.map(fileToGenerativePart));
        const textPart = { text: prompt };

        const result: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [...imageParts, textPart],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const responseParts = result.candidates?.[0]?.content?.parts || [];
        if (responseParts.length === 0) {
            throw new Error("The model did not return any content. The request may have been blocked.");
        }
        
        const output: NanoResult[] = [];
        for (const part of responseParts) {
            if (part.text) {
                output.push({ type: 'text', content: part.text });
            } else if (part.inlineData?.data && part.inlineData?.mimeType) {
                const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                output.push({ type: 'image', content: imageUrl });
            }
        }
        return output;

// FIX: Added a missing opening curly brace for the catch block to fix a syntax error.
    } catch (error) {
        console.error("Error generating with Nano Banana:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during image generation.";
        throw new Error(errorMessage);
    }
};