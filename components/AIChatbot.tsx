import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { YearData, User } from '../types';
import { formatMoney, generateFinancialSummary } from '../utils';
import { MessageSquare, Send, X, Bot, Sparkles, Loader2 } from 'lucide-react';

interface AIChatbotProps {
  yearData: YearData;
  user: User;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export const AIChatbot: React.FC<AIChatbotProps> = ({ yearData, user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'welcome', 
      role: 'model', 
      text: `Bonjour ${user.name} ! Je suis votre assistant FinanceFlow. Je peux analyser vos finances de ${yearData.year}, calculer des ratios ou vous donner des conseils d'optimisation. Que voulez-vous savoir ?` 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Initialize Chat Session with Context
  useEffect(() => {
    if (isOpen) {
      const summary = generateFinancialSummary(yearData, user);
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      chatSessionRef.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: `Tu es un expert en finances personnelles pour l'application FinanceFlow.
          
          Voici les données financières ACTUELLES de l'utilisateur (${user.name}) pour l'année ${yearData.year} :
          ${summary}

          Tes objectifs :
          1. Répondre aux questions sur ces données (totaux, soldes, détails).
          2. Identifier les anomalies (dépenses trop élevées, manque d'investissement).
          3. Donner des conseils bienveillants et concrets pour optimiser le budget.
          4. Être concis et utiliser un formatage clair (listes à puces si besoin).
          
          Si l'utilisateur pose une question hors sujet (non financier), ramène poliment la conversation aux finances.
          Ne pas inventer de données non présentes dans le résumé ci-dessus.`,
        },
      });
    }
  }, [isOpen, yearData, user]); // Re-init chat if data changes drastically or window opens

  const handleSend = async () => {
    if (!input.trim() || !chatSessionRef.current) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response: GenerateContentResponse = await chatSessionRef.current.sendMessage({ 
        message: userMsg.text 
      });

      const text = response.text || "Désolé, je n'ai pas pu générer de réponse.";
      
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: text 
      }]);
    } catch (error) {
      console.error("Erreur IA:", error);
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: "Une erreur est survenue lors de la communication avec l'IA. Vérifiez votre connexion ou la clé API." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all z-50 flex items-center gap-2 group"
      >
        <Sparkles size={24} className="group-hover:animate-pulse" />
        <span className="font-semibold hidden group-hover:block transition-all">Assistant IA</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500 rounded-lg">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm">FinanceFlow AI</h3>
            <p className="text-[10px] text-slate-300">Assistant Personnel</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] rounded-2xl p-3 text-sm whitespace-pre-wrap ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-700 border border-slate-200 shadow-sm rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 shadow-sm flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-blue-600" />
              <span className="text-xs text-slate-400">Analyse en cours...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Posez une question sur vos finances..."
          disabled={isLoading}
          className="flex-1 bg-slate-100 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button 
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
