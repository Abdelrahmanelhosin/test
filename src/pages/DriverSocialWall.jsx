import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Heart, MessageSquare, Image, MapPin, MoreHorizontal, User, ShieldCheck } from 'lucide-react';

const INITIAL_POSTS = [
  { id: 1, author: 'Ahmet Kaptan', text: 'Tuzla girişi kaza var, sağ şerit kapalı arkadaşlar. Herkese hayırlı işler!', time: '2 dk önce', likes: 12, comments: 2, badge: '500T' },
  { id: 2, author: 'Mehmet S.', text: 'Pendik sahil yolu açık, akıyor maşallah. Kazasız belasız!', time: '15 dk önce', likes: 8, comments: 0, badge: '11ÜS' },
  { id: 3, author: 'Selim Y.', text: 'Arkadaşlar bugün hava çok yağışlı, duruş mesafesine dikkat edelim.', time: '1 saat önce', likes: 24, comments: 5, badge: '34G' },
];

const DriverSocialWall = () => {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [newPost, setNewPost] = useState('');

  const handlePost = () => {
    if (!newPost.trim()) return;
    const post = {
      id: Date.now(),
      author: 'Mustafa Kaptan',
      text: newPost,
      time: 'Az önce',
      likes: 0,
      comments: 0,
      badge: '500T-12'
    };
    setPosts([post, ...posts]);
    setNewPost('');
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md px-6 py-5 sticky top-0 z-40 border-b border-slate-100 shadow-sm flex justify-between items-center">
        <div>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">KAPTANLAR TOPLULUĞU</p>
          <h1 className="text-xl font-black text-slate-800">Kaptanlar Duvarı</h1>
        </div>
        <div className="bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 flex items-center gap-2">
           <ShieldCheck size={14} className="text-indigo-600" />
           <span className="text-[10px] font-black text-indigo-700 uppercase">Onaylı Kaptan</span>
        </div>
      </header>

      <div className="p-6 space-y-6 pb-32">
        
        {/* CREATE POST CARD */}
        <div className="bg-white p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
           <div className="flex gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-500/20">M</div>
              <textarea 
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Yol durumu bildir veya selam ver..."
                className="flex-1 bg-slate-50 rounded-2xl p-4 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none border-none resize-none h-24"
              />
           </div>
           <div className="flex justify-between items-center pt-2 border-t border-slate-50">
              <div className="flex gap-2">
                 <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"><Image size={18} /></button>
                 <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"><MapPin size={18} /></button>
              </div>
              <button 
                onClick={handlePost}
                disabled={!newPost.trim()}
                className={`px-6 py-2.5 rounded-full font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${
                  newPost.trim() ? 'bg-[#114B36] text-white shadow-xl shadow-emerald-900/20 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                PAYLAŞ <Send size={14} />
              </button>
           </div>
        </div>

        {/* FEED */}
        <div className="space-y-4">
           <AnimatePresence initial={false}>
             {posts.map((post) => (
               <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                layout
                className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group"
               >
                 <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-black text-sm">
                          {post.author[0]}
                       </div>
                       <div>
                          <div className="flex items-center gap-2">
                             <h3 className="text-sm font-black text-slate-800">{post.author}</h3>
                             <span className="bg-slate-50 px-2 py-0.5 rounded-lg text-[8px] font-black text-slate-400 border border-slate-100 uppercase tracking-tighter">
                               {post.badge}
                             </span>
                          </div>
                          <p className="text-[9px] font-bold text-slate-300 uppercase mt-0.5">{post.time}</p>
                       </div>
                    </div>
                    <button className="text-slate-200 group-hover:text-slate-400 transition-colors"><MoreHorizontal size={20} /></button>
                 </div>

                 <p className="text-xs font-bold text-slate-600 leading-relaxed mb-6">
                   {post.text}
                 </p>

                 <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                    <button className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                       <Heart size={18} className="transition-transform active:scale-150" />
                       <span className="text-[11px] font-black">{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-500 transition-colors">
                       <MessageSquare size={18} />
                       <span className="text-[11px] font-black">{post.comments}</span>
                    </button>
                 </div>
               </motion.div>
             ))}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default DriverSocialWall;
