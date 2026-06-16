'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/hooks/useAuth';
import { PredictionCard } from './PredictionCard';
import { SignalTable } from './SignalTable';
import { TradingChart } from './TradingChart';
import type { BotMessage, Prediction } from '@/types';
import { cn } from '@/lib/utils';

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3 bg-surface rounded-2xl rounded-tl-sm w-16">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-muted"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, delay: i * 0.2, repeat: Infinity }}
        />
      ))}
    </div>
  );
}

export function BotChat() {
  const { token } = useAuth();
  const { messages, connectionStatus, sendMessage, connect } = useWebSocket();
  const [inputText, setInputText] = useState('');
  const [showSignals, setShowSignals] = useState<Prediction | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (token) connect(token);
  }, [token, connect]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleOption = (value: string, label: string) => {
    sendMessage({ type: 'user_message', text: label, id: Date.now().toString() });
    sendMessage({ type: 'select', value });
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage({ type: 'user_message', text: inputText, id: Date.now().toString() });
    sendMessage({ type: 'message', text: inputText });
    setInputText('');
  };

  const renderMessage = (msg: BotMessage) => {
    switch (msg.type) {
      case 'bot_message':
        return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center text-bg text-xs font-bold flex-shrink-0 mt-1">
              AI
            </div>
            <div className="bg-surface rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
              <p className="text-sm text-slate-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: (msg.text ?? '').replace(/\*\*(.*?)\*\*/g, '<strong class="text-gold">$1</strong>') }} />
            </div>
          </motion.div>
        );

      case 'user_message':
        return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex justify-end"
          >
            <div className="bg-gold/20 border border-gold/30 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[75%]">
              <p className="text-sm text-gold">{msg.text}</p>
            </div>
          </motion.div>
        );

      case 'options':
        return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2 pl-11"
          >
            {msg.options?.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleOption(opt.value, opt.label)}
                className="flex items-center gap-1.5 px-3 py-2 bg-surface2 hover:bg-surface border border-border hover:border-gold/50 rounded-xl text-sm text-slate-200 transition-all duration-200 hover:text-gold"
              >
                {opt.icon && <span>{opt.icon}</span>}
                <span className="font-medium">{opt.label}</span>
              </button>
            ))}
          </motion.div>
        );

      case 'typing':
        return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center text-bg text-xs font-bold flex-shrink-0">AI</div>
            <TypingIndicator />
          </motion.div>
        );

      case 'analysis_start':
        return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 pl-11 py-1"
          >
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(i => (
                <motion.div
                  key={i}
                  className="w-1 h-5 rounded-full bg-gold"
                  animate={{ scaleY: [1, 2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.8, delay: i * 0.12, repeat: Infinity }}
                />
              ))}
            </div>
            <span className="text-xs text-muted">Analyzing market data...</span>
          </motion.div>
        );

      case 'analysis_complete':
        if (!msg.data) return null;
        return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pl-2 pr-2"
          >
            <PredictionCard prediction={msg.data} />
            {msg.data.chart_data?.length > 0 && (
              <TradingChart
                data={msg.data.chart_data}
                entryPrice={msg.data.entry_price}
                stopLoss={msg.data.stop_loss}
                takeProfit1={msg.data.take_profit_1}
              />
            )}
            <button
              onClick={() => setShowSignals(showSignals ? null : msg.data!)}
              className="w-full py-2.5 text-sm text-muted border border-border rounded-xl hover:border-gold/40 hover:text-gold transition-colors"
            >
              {showSignals ? 'Hide' : 'Show'} Signal Details ({msg.data.signals.length} indicators)
            </button>
            <AnimatePresence>
              {showSignals && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <SignalTable signals={showSignals.signals} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );

      case 'error':
        return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pl-11"
          >
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-sm text-red-400">{msg.message || 'An error occurred'}</p>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Connection status */}
      {connectionStatus === 'error' && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-xs text-red-400 text-center">
          Connection error. Bot unavailable.
        </div>
      )}
      {connectionStatus === 'connecting' && (
        <div className="bg-gold/10 border-b border-gold/20 px-4 py-2 text-xs text-gold text-center">
          Connecting to AI Bot...
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map(msg => renderMessage(msg))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-border bg-bg">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question or type 'new'..."
          className="flex-1 bg-surface2 border border-border rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-muted focus:outline-none focus:border-gold transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim()}
          className="w-10 h-10 rounded-xl bg-gold text-bg flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold-light transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
