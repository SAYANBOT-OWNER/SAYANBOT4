
import { GoogleGenAI, Type, FunctionDeclaration, Tool } from "@google/genai";
import { ToolCallResponse, StreamChunk, GroundingMetadata } from '../types';

const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("NETWORK_TIMEOUT");
  return new GoogleGenAI({ apiKey });
};

const VISUAL_GENERATION_PROTOCOL = `
**VISUAL GENERATION PROTOCOL:**
If the user requests an image, drawing, or visual representation, you MUST activate Visual Mode.
1. Call \`generate_image_prompt\`.
2. Provide a professional and creative response about the visualization you are creating.
`;

const generateImagePromptTool: FunctionDeclaration = {
  name: "generate_image_prompt",
  description: "Generate a detailed image prompt for the visualization engine.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      enhanced_prompt: { type: Type.STRING, description: "Detailed visual description for the image engine." },
      commentary: { type: Type.STRING, description: "A message to the user about the visual creation." }
    },
    required: ["enhanced_prompt", "commentary"]
  }
};

// Fix: "Only tools: googleSearch is permitted. Do not use it with other tools."
// Since the application logic depends on function calling for image generation prompts, 
// googleSearch must be removed when other tools are present.
const tools: Tool[] = [
  { functionDeclarations: [generateImagePromptTool] }
];

export async function* streamMessageToGemini(
  history: { role: string; parts: { text: string }[] }[],
  lastUserMessage: string,
  personaInstruction: string
): AsyncGenerator<StreamChunk> {
  const ai = getAIInstance();
  const finalSystemInstruction = `STRICT IDENTITY ENFORCEMENT: ${personaInstruction}\n\n${VISUAL_GENERATION_PROTOCOL}`;

  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: finalSystemInstruction,
      tools,
      temperature: 0.7,
    },
    history
  });

  const result = await chat.sendMessageStream({ message: lastUserMessage });

  for await (const chunk of result) {
    if (chunk.functionCalls?.length) {
      const call = chunk.functionCalls[0];
      if (call.name === 'generate_image_prompt') {
        yield { type: 'tool', call: call.args as unknown as ToolCallResponse };
        return; 
      }
    }

    if (chunk.groundingMetadata) {
      const metadata: GroundingMetadata = {
        groundingChunks: (chunk.groundingMetadata.groundingChunks || [])
          .map(c => ({ web: c.web ? { uri: c.web.uri || '', title: c.web.title || '' } : undefined }))
          .filter(c => c.web)
      };
      if (metadata.groundingChunks.length > 0) yield { type: 'grounding', metadata };
    }

    if (chunk.text) {
      yield { type: 'text', content: chunk.text };
    }
  }
}

export const generateImageFromPrompt = async (prompt: string): Promise<string | null> => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] }
    });
    
    // Fix: Iterating through parts to correctly identify the image part (inlineData) as per model output rules.
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (part && part.inlineData) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
    return null;
  } catch (err) {
    console.error("Image Engine Error:", err);
    return null;
  }
};
