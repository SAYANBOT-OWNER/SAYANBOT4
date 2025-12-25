import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface Props {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

const InputArea: React.FC<Props> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (text.trim() && !isLoading) {
      onSendMessage(text);
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black via-black to-transparent z-50">
      <div className="max-w-4xl mx-auto">
        <form 
          onSubmit={handleSubmit}
          className={`relative group transition-all duration-300 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="relative flex items-end gap-2 bg-[#0a0a0a] border border-white/10 rounded-2xl p-2 shadow-2xl focus-within:border-cyan-500/50 transition-all">
            
            <div className="p-3 text-zinc-500 hidden sm:block">
              <Sparkles size={18} className="opacity-30" />
            </div>

            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              disabled={isLoading}
              rows={1}
              className="w-full bg-transparent text-white placeholder-zinc-600 text-sm md:text-base p-3 focus:outline-none resize-none max-h-32"
            />
            
            <button
              type="submit"
              disabled={!text.trim() || isLoading}
              className="p-3 mb-1 rounded-xl bg-white text-black hover:bg-cyan-400 disabled:opacity-30 disabled:hover:bg-white transition-all shadow-lg flex-shrink-0"
            >
              <ArrowRight size={20} strokeWidth={2.5} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InputArea;