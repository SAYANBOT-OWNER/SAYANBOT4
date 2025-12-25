import React, { useState } from 'react';
import { PersonaDefinition } from '../types';
import { Bot, Terminal, Feather, Gavel, Plus, X, Check, Youtube } from 'lucide-react';

interface Props {
  currentPersona: PersonaDefinition;
  onSelectPersona: (persona: PersonaDefinition) => void;
  personas: PersonaDefinition[];
  onAddPersona: (persona: PersonaDefinition) => void;
  isOpen: boolean;
  onClose: () => void;
}

const PersonaSelector: React.FC<Props> = ({ 
  currentPersona, 
  onSelectPersona, 
  personas, 
  onAddPersona,
  isOpen,
  onClose
}) => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [newPersona, setNewPersona] = useState({ name: '', description: '', instruction: '' });

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPersona.name && newPersona.instruction) {
      const p: PersonaDefinition = {
        id: `custom-${Date.now()}`,
        name: newPersona.name,
        description: newPersona.description,
        systemInstruction: newPersona.instruction,
        gradient: 'from-gray-700 to-gray-900'
      };
      onAddPersona(p);
      onSelectPersona(p);
      setView('list');
      setNewPersona({ name: '', description: '', instruction: '' });
      onClose();
    }
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'CODEX': return <Terminal size={16} />;
      case 'LUMIÈRE': return <Feather size={16} />;
      case 'MAXIMUS': return <Gavel size={16} />;
      case 'TUBE_GURU': return <Youtube size={16} />;
      default: return <Bot size={16} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-lg bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/50">
          <h2 className="text-sm font-bold tracking-widest uppercase text-white flex items-center gap-2">
            <Bot size={16} className="text-cyan-500" />
            {view === 'list' ? 'Switch Identity' : 'New Identity'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 flex-1">
          {view === 'list' ? (
            <div className="grid gap-3">
              {personas.map((p) => {
                const isActive = currentPersona.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => { onSelectPersona(p); onClose(); }}
                    className={`relative p-4 rounded-xl border text-left transition-all duration-200 group ${
                      isActive 
                        ? 'bg-zinc-800 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                        : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-800 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${p.gradient} text-white shadow-lg`}>
                          {getIcon(p.name)}
                        </div>
                        <div>
                          <h3 className={`font-bold ${isActive ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                            {p.name}
                          </h3>
                          <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{p.description}</p>
                        </div>
                      </div>
                      {isActive && <Check size={18} className="text-cyan-500" />}
                    </div>
                  </button>
                );
              })}
              
              <button 
                onClick={() => setView('create')}
                className="p-4 rounded-xl border border-dashed border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-500 hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Plus size={16} />
                Add New Identity
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-1.5 uppercase">Identity Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., DEBUGBOT" 
                  className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors"
                  value={newPersona.name}
                  onChange={e => setNewPersona({...newPersona, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-1.5 uppercase">Description</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Expert programmer" 
                  className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors"
                  value={newPersona.description}
                  onChange={e => setNewPersona({...newPersona, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-zinc-500 mb-1.5 uppercase">Instructions</label>
                <textarea 
                  required
                  rows={6}
                  placeholder="Define how this persona acts..." 
                  className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors resize-none"
                  value={newPersona.instruction}
                  onChange={e => setNewPersona({...newPersona, instruction: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setView('list')}
                  className="flex-1 py-3 rounded-lg border border-zinc-700 text-zinc-300 text-sm hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium shadow-lg shadow-cyan-500/20 transition-all"
                >
                  Create Identity
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonaSelector;