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

        const contents = {
            parts: [
                imagePart,
                { text: "Analyze this image and generate a master prompt for image generation AI. The prompt must be extremely detailed and photorealistic, focusing on recreating the image with perfect fidelity. Describe: 1. Subject(s): clothing, pose, action. 2. Setting: environment, background details. 3. Composition: camera angle, shot type (e.g., close-up, wide shot), lens (e.g., 35mm), aperture. 4. Lighting: style (e.g., cinematic, soft), direction, and color of light. 5. Style: overall aesthetic (e.g., hyperrealistic, cinematic photo). CRITICAL: Do not describe the faces of any subjects. The goal is a professional-grade prompt for generating an identical scene. Return as a JSON object with a single key 'prompt'." }
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
                        prompt: { type: Type.STRING, description: "A single, highly detailed and descriptive prompt to recreate the image scene without describing faces." },
                    },
                    required: ["prompt"]
                }
            }
        });

        const responseText = result.text;
        const responseJson = JSON.parse(responseText) as { prompt: string };
        
        const basePrompt = responseJson.prompt;
        const qualityEnhancer = 'very contrasting with the bright subject. Maintain the exact facial and hair details of the uploaded reference photo, maintain realistic skin texture, natural expressions, and photorealistic quality';
        const faceInstruction = "*don't change the face that I attached, make sure it's 100% similar";
        
        const finalPrompt = `${basePrompt}, ${qualityEnhancer}, ${faceInstruction}`;

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