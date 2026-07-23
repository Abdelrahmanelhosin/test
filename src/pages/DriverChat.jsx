import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Image, X, ShieldAlert, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DriverChat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [myId, setMyId] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Play message notification tone
  const playMsgTone = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      
      setTimeout(() => {
        try {
          osc.stop();
          audioCtx.close();
        } catch(e){}
      }, 150);
    } catch(e){}
  };

  useEffect(() => {
    initChat();
  }, []);

  useEffect(() => {
    if (myId) {
      const channel = supabase.channel(`chat-driver-${myId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chat_messages',
          filter: `driver_id=eq.${myId}`
        }, (payload) => {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          if (payload.new.sender_role === 'admin') {
            playMsgTone();
          }
        })
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [myId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setMyId(user.id);

    // Fetch message logs
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('driver_id', user.id)
      .order('created_at', { ascending: true });

    if (data) setMessages(data);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() && !photoBase64) return;
    setLoading(true);

    try {
      const { error } = await supabase.from('chat_messages').insert({
        sender_id: myId,
        sender_role: 'driver',
        driver_id: myId,
        content: newMessage,
        image_url: photoBase64
      });

      if (!error) {
        setNewMessage('');
        setPhotoBase64(null);
        // Force re-fetch just in case realtime delay
        const { data } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('driver_id', myId)
          .order('created_at', { ascending: true });
        if (data) setMessages(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-50 font-sans pb-[140px] overflow-hidden">
      
      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar pb-10">
        
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center text-slate-400">
            <MessageSquare size={36} className="text-slate-300 mb-2" />
            <p className="text-xs font-bold">Merkez ile mesajlaşma geçmişi bulunmuyor.</p>
            <p className="text-[10px] opacity-70 mt-1">İletişime geçmek için aşağıdan bir mesaj yazın.</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_role === 'driver';
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-[1.5rem] px-4 py-3 shadow-sm border ${
                  isMe
                    ? 'bg-emerald-600 border-emerald-500 text-white rounded-br-none'
                    : 'bg-white border-slate-100 text-slate-800 rounded-bl-none'
                }`}
              >
                {msg.image_url && (
                  <img
                    src={msg.image_url}
                    alt="Uploaded"
                    className="rounded-xl max-w-full h-auto mb-2 border border-black/5"
                  />
                )}
                {msg.content && (
                  <p className="text-[12px] font-bold leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                )}
                <span
                  className={`text-[8px] block text-right mt-1 font-black ${
                    isMe ? 'text-emerald-100/70' : 'text-slate-400'
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input box */}
      <div className="p-3 bg-white border-t border-slate-100 flex flex-col gap-2 z-50 shrink-0">
        
        {/* Photo preview */}
        {photoBase64 && (
          <div className="flex items-center justify-between bg-slate-50 border border-slate-100 p-2 rounded-xl">
            <div className="flex items-center gap-2">
              <img src={photoBase64} className="w-10 h-10 object-cover rounded-lg border" alt="Preview" />
              <span className="text-[9px] font-black text-slate-500 uppercase">Görsel Seçildi</span>
            </div>
            <button onClick={() => setPhotoBase64(null)} className="p-1 text-rose-500 rounded-full hover:bg-rose-50">
              <X size={14} />
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2">
          <label className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer active:scale-95 transition-all">
            <Image size={18} />
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
          </label>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Merkeze mesaj yazın..."
            className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />

          <button
            type="submit"
            disabled={loading || (!newMessage.trim() && !photoBase64)}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
