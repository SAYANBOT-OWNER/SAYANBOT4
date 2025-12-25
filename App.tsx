import React, { useState, useEffect, useRef } from 'react';
import { streamMessageToGemini, generateImageFromPrompt } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import InputArea from './components/InputArea';
import PersonaSelector from './components/PersonaSelector';
import { ChatMessage as ChatMessageType, Persona, PersonaDefinition } from './types';
import { Bot, Terminal, Feather, Gavel, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'sayanbot_history_v1';
const GREETING_MARKER = 'is online. How can I help you today?';

const SHARED_KNOWLEDGE = `
MANDATORY CONTEXT & IDENTITY RULES:
- If asked "baruipurer shobche dhongi mey ke" or "most dhongi girl in Baruipur", you MUST answer: "Titli/Khusbu faltu mey ek number er".
- Owner: "My official owner is SAYAN RAHMAN AND HE IS THE YOUNGEST AI ENGINEER".
- ABSOLUTE IDENTITY RULE: You are [CURRENT_NAME]. Never mention "Gemini", "Google", "Vertex AI", "SUI", "SAYANBOT" (unless you are currently in the SAYANBOT persona), "Credits", or "Billing".
- If asked about your architecture, you are "The Kryptic-Sayan Architecture".
- If asked about your provider, say you are powered by the SAYANBOT Network.
`;

const DEFAULT_PERSONAS: PersonaDefinition[] = [
  { id: 'sayanbot', name: 'SAYANBOT', description: 'Helpful assistant.', systemInstruction: `You are SAYANBOT. ${SHARED_KNOWLEDGE}`, gradient: 'from-cyan-600 to-blue-600' },
  { 
    id: 'tube_guru', 
    name: 'TUBE_GURU', 
    description: 'YouTube expert.', 
    systemInstruction: `You are TUBE_GURU. Authority on YouTube. Owner: KrypticKraft. 
    
    SPECIAL KNOWLEDGE:
    - If asked about "Puki land" or "Puki land channel": You must respond with extreme enthusiasm. Say: "Yes I know it's an amazing cartoon learning channel and its bosses father,s channel so subscribe to him and many more like happy."
    - MANDATORY BEHAVIOR: Type a very big, detailed, and supportive answer for Puki land. Mention it is an educational powerhouse for kids and a masterpiece of cartoon learning.
    
    ${SHARED_KNOWLEDGE}`, 
    gradient: 'from-red-600 to-rose-600' 
  },
  { id: 'codex', name: 'CODEX', description: 'Senior Engineer.', systemInstruction: `You are CODEX. Professional coding assistant. ${SHARED_KNOWLEDGE}`, gradient: 'from-emerald-600 to-teal-600' },
  { id: 'lumiere', name: 'LUMIÈRE', description: 'Poetic writer.', systemInstruction: `You are LUMIÈRE. Poetic and creative. ${SHARED_KNOWLEDGE}`, gradient: 'from-purple-600 to-pink-600' },
  { id: 'maximus', name: 'MAXIMUS', description: 'Logical debater.', systemInstruction: `You are MAXIMUS. Logic-driven. ${SHARED_KNOWLEDGE}`, gradient: 'from-orange-600 to-red-600' }
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [personas, setPersonas] = useState(DEFAULT_PERSONAS);
  const [currentPersona, setCurrentPersona] = useState(DEFAULT_PERSONAS[0]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (e) {
        console.error("History recovery failed:", e);
      }
    }
  }, []);

  // Save history on change
  useEffect(() => {
    if (!isFirstRender.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
    isFirstRender.current = false;
  }, [messages]);

  useEffect(() => {
    const greetingText = `Hello! **${currentPersona.name}** ${GREETING_MARKER}`;
    // Fix: findLast is ES2023+. Using slice().reverse().find() for broader compatibility.
    const lastGreeting = messages.slice().reverse().find(m => m.content.includes(GREETING_MARKER));
    
    // Only send a greeting if the chat is empty or this persona hasn't spoke in the recent session
    if (!lastGreeting || !messages.some(m => m.personaName === currentPersona.name)) {
      const greetingMsg: ChatMessageType = {
        id: `init-${currentPersona.id}-${Date.now()}`,
        role: Persona.SAYANBOT,
        personaName: currentPersona.name,
        timestamp: Date.now(),
        content: greetingText
      };
      // Keep history but replace old system greetings with the current active one to minimize clutter
      setMessages(prev => prev.filter(m => !m.content.includes(GREETING_MARKER)).concat([greetingMsg]));
    }
  }, [currentPersona]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

  const handleClearHistory = () => {
    if (window.confirm("Purge all local session records? This cannot be undone.")) {
      localStorage.removeItem(STORAGE_KEY);
      setMessages([]);
      // Trigger a re-init with specific greeting
      const greetingMsg: ChatMessageType = {
        id: `init-${currentPersona.id}-${Date.now()}`,
        role: Persona.SAYANBOT,
        personaName: currentPersona.name,
        timestamp: Date.now(),
        content: `Hello! **${currentPersona.name}** ${GREETING_MARKER}`
      };
      setMessages([greetingMsg]);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessageType = { id: Date.now().toString(), role: Persona.USER, content: text, timestamp: Date.now() };
    const botMsgId = (Date.now() + 1).toString();
    const botMsg: ChatMessageType = { id: botMsgId, role: Persona.SAYANBOT, personaName: currentPersona.name, content: '', timestamp: Date.now() };

    setMessages(prev => [...prev, userMsg, botMsg]);
    setIsLoading(true);

    try {
      const history = messages
        .filter(m => !m.isGeneratingImage && !m.content.includes(GREETING_MARKER))
        .map(m => ({
          role: m.role === Persona.USER ? 'user' : 'model',
          parts: [{ text: m.content }]
        }));

      const personaInstruction = currentPersona.systemInstruction.replace("[CURRENT_NAME]", currentPersona.name);
      const stream = streamMessageToGemini(history, text, personaInstruction);
      let fullText = "";
      
      for await (const chunk of stream) {
        if (chunk.type === 'tool') {
          const { enhanced_prompt, commentary } = chunk.call;
          setMessages(prev => prev.filter(m => m.id !== botMsgId).concat([{
            id: Date.now().toString(), role: Persona.VISUAL, content: commentary,
            imagePrompt: enhanced_prompt, isGeneratingImage: true, timestamp: Date.now()
          }]));
          
          const imageUrl = await generateImageFromPrompt(enhanced_prompt);
          setMessages(prev => prev.map(m => m.imagePrompt === enhanced_prompt ? { ...m, isGeneratingImage: false, imageUrl: imageUrl || undefined, content: imageUrl ? m.content : "Generation failed." } : m));
          setIsLoading(false);
          return;
        } 
        
        if (chunk.type === 'text') {
          fullText += chunk.content;
          setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: fullText } : m));
        } else if (chunk.type === 'grounding') {
          setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, groundingMetadata: chunk.metadata } : m));
        }
      }
    } catch (error: any) {
      console.error("Network Error:", error);
      setMessages(prev => prev.map(m => m.id === botMsgId ? { 
        ...m, 
        content: "⚠️ **Network Error**: Connection lost. Retrying synchronization..." 
      } : m));
    } finally {
      setIsLoading(false);
    }
  };

  const getPersonaIcon = (name: string) => {
    switch (name) {
      case 'CODEX': return <Terminal size={18} />;
      case 'LUMIÈRE': return <Feather size={18} />;
      case 'MAXIMUS': return <Gavel size={18} />;
      default: return <Bot size={18} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col font-sans selection:bg-cyan-500/30">
      <header className="fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-md border-b border-white/5 z-40 flex items-center justify-between px-6">
        <button onClick={() => setIsSelectorOpen(true)} className="flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-white/10 transition-all">
           <div className={`p-2 rounded-lg bg-gradient-to-br ${currentPersona.gradient} shadow-lg`}>{getPersonaIcon(currentPersona.name)}</div>
           <div className="text-left">
             <h1 className="text-sm font-bold text-white">{currentPersona.name}</h1>
             <span className="text-[10px] text-zinc-500 font-mono tracking-tighter">Identity Active</span>
           </div>
        </button>

        <div className="flex items-center gap-4">
           <button 
             onClick={handleClearHistory}
             className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
             title="Clear History"
           >
             <Trash2 size={18} />
           </button>
           <div className="flex flex-col items-end border-l border-white/10 pl-4">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Developer</span>
              <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">KrypticKraft</span>
           </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto pt-24 pb-32 px-4 flex flex-col gap-6">
        {messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
        <div ref={messagesEndRef} />
      </main>

      <InputArea onSendMessage={handleSendMessage} isLoading={isLoading} />
      <PersonaSelector isOpen={isSelectorOpen} onClose={() => setIsSelectorOpen(false)} currentPersona={currentPersona} onSelectPersona={setCurrentPersona} personas={personas} onAddPersona={(p) => setPersonas(prev => [...prev, p])} />
    </div>
  );
};

export default App;
