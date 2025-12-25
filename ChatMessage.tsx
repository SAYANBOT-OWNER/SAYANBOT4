
import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Sparkles, Terminal, Feather, Gavel, Loader2, Youtube, ExternalLink, Globe } from 'lucide-react';
import { ChatMessage as ChatMessageType, Persona } from '../types';

interface Props {
  message: ChatMessageType;
}

const getPersonaIcon = (name?: string) => {
  switch (name) {
    case 'CODEX': return <Terminal size={20} className="text-white" />;
    case 'LUMIÈRE': return <Feather size={20} className="text-white" />;
    case 'MAXIMUS': return <Gavel size={20} className="text-white" />;
    case 'TUBE_GURU': return <Youtube size={20} className="text-white" />;
    default: return <Bot size={20} className="text-white" />;
  }
};

const ChatMessage: React.FC<Props> = memo(({ message }) => {
  const isUser = message.role === Persona.USER;
  const isVisual = message.role === Persona.VISUAL;

  const containerClass = isUser ? "flex-row-reverse" : "flex-row";

  const bubbleClass = isUser
    ? "bg-zinc-800 text-white border-zinc-700"
    : isVisual
      ? "bg-gradient-to-br from-cyan-900/40 via-blue-900/20 to-black border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
      : "bg-zinc-900/80 border-zinc-800 text-zinc-100 shadow-sm";

  const iconContainerClass = isUser
    ? "bg-zinc-700"
    : isVisual
      ? "bg-cyan-600 shadow-lg shadow-cyan-500/50"
      : "bg-zinc-800 border border-zinc-700";

  return (
    <div className={`flex w-full gap-4 p-4 ${containerClass} animate-fade-in group`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconContainerClass}`}>
        {isUser ? (
          <User size={20} className="text-white" />
        ) : isVisual ? (
          <Sparkles size={20} className="text-white animate-pulse" />
        ) : (
          getPersonaIcon(message.personaName)
        )}
      </div>

      <div className={`flex flex-col max-w-[85%] md:max-w-[75%] rounded-2xl p-5 border backdrop-blur-sm ${bubbleClass}`}>
        {!isUser && (
          <div className={`text-[10px] font-bold tracking-widest mb-2 uppercase flex items-center gap-2 ${isVisual ? "text-cyan-400" : "text-zinc-500"}`}>
             {isVisual ? (
               <>
                 <Sparkles size={12} /> CREATIVE VISUAL MODE
               </>
             ) : (
               <>{message.personaName || "SAYANBOT"}</>
             )}
          </div>
        )}

        <div className={`prose prose-invert max-w-none text-sm leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-strong:text-white prose-headings:text-white`}>
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {isVisual && message.isGeneratingImage && (
           <div className="mt-4 p-4 rounded-xl border border-cyan-500/30 bg-black/40 flex items-center gap-3">
              <Loader2 className="animate-spin text-cyan-500" size={24} />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-cyan-300">Generating Visualization...</span>
                <span className="text-xs text-cyan-500/70 truncate max-w-[200px] md:max-w-[300px]">{message.imagePrompt}</span>
              </div>
           </div>
        )}

        {message.imageUrl && (
          <div className="mt-4 rounded-xl overflow-hidden border border-white/10 shadow-2xl group-hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all duration-500">
             <img 
               src={message.imageUrl} 
               alt="Visualization" 
               className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700 ease-out"
               loading="lazy"
             />
          </div>
        )}

        {message.groundingMetadata && message.groundingMetadata.groundingChunks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500 mb-2">
              <Globe size={12} /> VERIFIED SOURCES
            </div>
            <div className="grid grid-cols-1 gap-2">
              {message.groundingMetadata.groundingChunks.map((chunk, idx) => {
                if (!chunk.web) return null;
                return (
                  <a 
                    key={idx} 
                    href={chunk.web.uri} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group/link"
                  >
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-medium text-cyan-300 truncate pr-2 group-hover/link:underline">
                        {chunk.web.title}
                      </span>
                    </div>
                    <ExternalLink size={12} className="text-zinc-500 group-hover/link:text-cyan-300 flex-shrink-0" />
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default ChatMessage;