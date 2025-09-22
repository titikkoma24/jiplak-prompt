import { GoogleGenAI, Type, Part, GenerateContentResponse } from "@google/genai";

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

        const instructionText = `Analyze the people in the attached image, focusing on their clothing and appearance. Then, generate a single, highly detailed, photorealistic master prompt for an image generation AI by placing them in the following scene.
SCENE DESCRIPTION:
Make the two people look as if they met in an alley in a shabby rented house in the afternoon, there are clotheslines and several trash cans.
COMPOSITION:
Make the view from below (low angle) showing them both squatting with their faces looking at the camera with a surprised expression. Make them far apart.
SUBJECT DETAILS:
The adult man/woman wears the clothes and shoes from the provided photo reference. The child wears a plain white t-shirt, cream-colored shorts and flip-flops, and is holding a toy car made of an orange peel. The adult's hand is holding the child's lollipop.
STYLE & QUALITY:
Follow these instructions precisely for the final prompt: (do not change the face from the attached reference photo). The scene must have 'very contrast with the bright subject'. Maintain the exact facial and hair details of the uploaded reference photo, maintain realistic skin texture, natural expressions, and photorealistic quality.

Your entire output must be a single JSON object with one key, "prompt", containing the final generated master prompt.`;

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
        const finalPrompt = `${basePrompt} *don't change the face that I attached, make sure it's 100% similar`;

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