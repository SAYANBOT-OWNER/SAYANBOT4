
export enum Persona {
  SAYANBOT = 'SAYANBOT',
  VISUAL = 'VISUAL',
  USER = 'USER',
  CUSTOM = 'CUSTOM'
}

export interface PersonaDefinition {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  gradient: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface GroundingMetadata {
  groundingChunks: GroundingChunk[];
}

export interface ChatMessage {
  id: string;
  role: Persona;
  personaName?: string;
  content: string;
  imagePrompt?: string;
  imageUrl?: string;
  isGeneratingImage?: boolean;
  timestamp: number;
  groundingMetadata?: GroundingMetadata;
}

export interface ToolCallResponse {
  enhanced_prompt: string;
  commentary: string;
}

export type StreamChunk = 
  | { type: 'text'; content: string }
  | { type: 'tool'; call: ToolCallResponse }
  | { type: 'grounding'; metadata: GroundingMetadata };