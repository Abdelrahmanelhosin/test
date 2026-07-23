import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Send, Image, X, ChevronLeft, MessageSquare, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminChat() {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [myId, setMyId] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initAdminChat();
  }, []);

  // Listen to global chat inserts to refresh the threads list or the active chat
  useEffect(() => {
    const channel = supabase.channel('admin-global-chat')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages'
      }, (payload) => {
        // If it belongs to currently selected driver, append
        if (selectedDriver && payload.new.driver_id === selectedDriver.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          // Mark as read
          markAsRead(payload.new.id);
        }
        // Refresh drivers/threads list
        fetchDriversList();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [selectedDriver]);

  useEffect(() => {
    if (selectedDriver) {
      fetchActiveChat(selectedDriver.id);
    }
  }, [selectedDriver]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initAdminChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setMyId(user.id);
    await fetchDriversList();
  };

  const fetchDriversList = async () => {
    // 1. Fetch all drivers
    const { data: driverData } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'driver')
      .order('full_name', { ascending: true });

    if (!driverData) return;

    // 2. Fetch last messages to show snippets and unread badge
    const { data: lastMsgs } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false });

    const driversWithChats = driverData.map(d => {
      const threadMsgs = lastMsgs?.filter(m => m.driver_id === d.id) || [];
      const lastMsg = threadMsgs[0];
      const unreadCount = threadMsgs.filter(m => m.sender_role === 'driver' && !m.is_read).length;

      return {
        ...d,
        lastMsgText: lastMsg ? (lastMsg.image_url ? '📷 Fotoğraf' : lastMsg.content) : 'Sohbet yok',
        lastMsgTime: lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        unreadCount
      };
    });

    setDrivers(driversWithChats);
  };

  const fetchActiveChat = async (driverId) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
      // Mark all these messages as read
      const unreadIds = data.filter(m => m.sender_role === 'driver' && !m.is_read).map(m => m.id);
      if (unreadIds.length > 0) {
        await supabase
          .from('chat_messages')
          .update({ is_read: true })
          .in('id', unreadIds);
      }
    }
  };

  const markAsRead = async (msgId) => {
    await supabase.from('chat_messages').update({ is_read: true }).eq('id', msgId);
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
    if (!selectedDriver) return;
    setLoading(true);

    try {
      const { error } = await supabase.from('chat_messages').insert({
        sender_id: myId,
        sender_role: 'admin',
        driver_id: selectedDriver.id,
        content: newMessage,
        image_url: photoBase64
      });

      if (!error) {
        setNewMessage('');
        setPhotoBase64(null);
        await fetchActiveChat(selectedDriver.id);
        fetchDriversList();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-50 font-sans pb-[140px] overflow-hidden">
      
      <AnimatePresence mode="wait">
        {!selectedDriver ? (
          
          /* THREADS LIST VIEW */
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex-1 flex flex-col overflow-y-auto no-scrollbar"
          >
            <div className="p-5 border-b border-slate-100 bg-white shrink-0">
              <span className="text-[8px] font-black text-indigo-600 tracking-widest uppercase">CANLI DESTEK</span>
              <h2 className="text-base font-black text-slate-800">Kaptan Sohbetleri</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {drivers.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-bold">Yükleniyor...</div>
              ) : (
                drivers.map(driver => (
                  <button
                    key={driver.id}
                    onClick={() => setSelectedDriver(driver)}
                    className="w-full bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center text-left active:scale-[0.98] hover:border-indigo-100 transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-black text-sm uppercase shrink-0">
                        {driver.full_name[0]}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-slate-800 truncate">{driver.full_name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5">{driver.lastMsgText}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-[8px] font-bold text-slate-400">{driver.lastMsgTime}</span>
                      {driver.unreadCount > 0 && (
                        <span className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white text-[9px] font-black animate-pulse">
                          {driver.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        ) : (
          
          /* ACTIVE CHAT WINDOW VIEW */
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-[#1e1b4b] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedDriver(null)}
                  className="p-1.5 hover:bg-white/10 rounded-xl transition-colors active:scale-90"
                >
                  <ChevronLeft size={20} />
                </button>
                <div>
                  <span className="text-[8px] font-black text-indigo-300 uppercase tracking-widest leading-none mb-0.5 block">SOHBET EDİLİYOR</span>
                  <h3 className="text-sm font-black truncate max-w-[150px]">{selectedDriver.full_name}</h3>
                </div>
              </div>
              <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-white font-black text-xs uppercase">
                {selectedDriver.full_name[0]}
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar pb-10">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center text-slate-400">
                  <MessageSquare size={36} className="text-slate-300 mb-2 animate-bounce" />
                  <p className="text-xs font-bold">Kaptan ile henüz bir konuşma geçmişi yok.</p>
                  <p className="text-[10px] opacity-70 mt-1">İlk mesajı göndererek canlı sohbeti başlatın.</p>
                </div>
              )}
              {messages.map(msg => {
                const isMe = msg.sender_role === 'admin';
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-[1.5rem] px-4 py-3 shadow-sm border ${
                      isMe 
                        ? 'bg-indigo-600 border-indigo-500 text-white rounded-br-none'
                        : 'bg-white border-slate-100 text-slate-800 rounded-bl-none'
                    }`}>
                      {msg.image_url && (
                        <img src={msg.image_url} alt="Uploaded" className="rounded-xl max-w-full h-auto mb-2 border border-black/5" />
                      )}
                      {msg.content && (
                        <p className="text-[12px] font-bold leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      )}
                      <span className={`text-[8px] block text-right mt-1 font-black ${isMe ? 'text-indigo-100/70' : 'text-slate-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <div className="p-3 bg-white border-t border-slate-100 flex flex-col gap-2 z-50">
              
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
                  placeholder="Kaptana mesaj yazın..."
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />

                <button
                  type="submit"
                  disabled={loading || (!newMessage.trim() && !photoBase64)}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
