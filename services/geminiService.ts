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
 * Analyzes an image and generates a single, highly detailed prompt for recreation.
 */
export const generateDetailedPrompt = async (imageFile: File): Promise<string> => {
    try {
        const imagePart = await fileToGenerativePart(imageFile);
        const model = 'gemini-2.5-flash';

        const instructionText = `Analyze the attached image. Your task is to generate a highly detailed, photorealistic master prompt that describes the image in its entirety, so it can be perfectly recreated by an image generation AI. The final recreation will use a different person's face as a reference, which will be provided later.

Therefore, you must describe everything EXCEPT for the facial features. Focus on:
- SCENE & BACKGROUND: Describe the environment, location, time of day, and any objects present.
- SUBJECT(S): Describe their pose, body language, body type, clothing style and details, accessories, and hair style/color.
- COMPOSITION & LIGHTING: Describe the camera angle, shot type (e.g., full-shot, portrait), lighting conditions (e.g., soft light, direct sunlight), and overall mood.

Your entire output must be a single JSON object with one key, "prompt", containing the final generated master prompt. Do not include any details about the face.`;

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
                    },
                    required: ["prompt"]
                }
            }
        });

        const responseText = result.text;
        const responseJson = JSON.parse(responseText) as { prompt: string };
        
        const basePrompt = responseJson.prompt;
        const finalPrompt = `${basePrompt} (do not change facial details, according to the reference photo uploaded) contrast beautifully with a well-lit subject. Maintain the exact facial and hair details of the reference photo uploaded, while maintaining realistic skin texture, natural expressions, and photorealistic quality.`;

        return finalPrompt;

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

    } catch (error) {
        console.error("Error generating with Nano Banana:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during image generation.";
        throw new Error(errorMessage);
    }
};