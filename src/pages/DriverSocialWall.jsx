import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Heart, MessageSquare, Image, MapPin, MoreHorizontal, User, ShieldCheck, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const DriverSocialWall = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [user, setUser] = useState(null);
  const [activeShift, setActiveShift] = useState(null);
  const [loading, setLoading] = useState(false);

  // Media / Location Attachment States
  const [photoBase64, setPhotoBase64] = useState(null);
  const [locationText, setLocationText] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchUserAndShift();
    fetchPosts();

    const channel = supabase
      .channel('driver-social-wall')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'social_posts' },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUserAndShift = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);

        // Fetch active shift log
        const { data: shift } = await supabase
          .from('shift_logs')
          .select('*, vehicles(plate_number)')
          .eq('driver_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (shift) {
          setActiveShift(shift);
        }
      }
    } catch (err) {
      console.error('Error fetching user info:', err);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('social_posts')
        .select('*, profiles:driver_id(full_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("Resim boyutu çok büyük (Maksimum 3MB).");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setPhotoBase64(reader.result);
    };
  };

  const handleAttachLocation = () => {
    if (locationText) {
      setLocationText(null);
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationText(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setGpsLoading(false);
      },
      (error) => {
        console.error("GPS error:", error);
        setLocationText("İstanbul, TR");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handlePost = async () => {
    if (!newPost.trim() && !photoBase64) return;
    setLoading(true);

    try {
      const badgeText = activeShift?.vehicles?.plate_number || 'KAPTAN';

      const { error } = await supabase.from('social_posts').insert({
        driver_id: user.id,
        text: newPost.trim(),
        badge: badgeText,
        likes: 0,
        comments: 0,
        image_base64: photoBase64,
        location_text: locationText
      });

      if (error) throw error;
      setNewPost('');
      setPhotoBase64(null);
      setLocationText(null);
    } catch (err) {
      console.error('Error creating post:', err);
      alert('Gönderi paylaşılırken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId, currentLikes) => {
    try {
      const { error } = await supabase
        .from('social_posts')
        .update({ likes: (currentLikes || 0) + 1 })
        .eq('id', postId);

      if (error) throw error;
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const myInitial = user?.email ? user.email[0].toUpperCase() : 'M';

  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white px-6 py-5 border-b border-slate-100 shadow-sm flex justify-between items-center shrink-0">
        <div>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">KAPTANLAR TOPLULUĞU</p>
          <h1 className="text-xl font-black text-slate-800">Kaptanlar Duvarı</h1>
        </div>
        <div className="bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 flex items-center gap-2">
          <ShieldCheck size={14} className="text-indigo-600" />
          <span className="text-[10px] font-black text-indigo-700 uppercase">Onaylı Kaptan</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-40">

        {/* CREATE POST CARD */}
        <div className="bg-white p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-500/20 shrink-0">
              {myInitial}
            </div>
            <div className="flex-1 min-w-0">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Yol durumu bildir veya selam ver..."
                className="w-full bg-slate-50 rounded-2xl p-4 text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none border-none resize-none h-24"
              />

              {/* Photo Attachment Preview */}
              {photoBase64 && (
                <div className="relative w-full h-32 mt-3 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                  <img src={photoBase64} alt="Fotoğraf Önizleme" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setPhotoBase64(null)}
                    className="absolute top-2 right-2 w-8 h-8 bg-slate-900/80 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Location Badge Preview */}
              {locationText && (
                <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-xl text-[10px] font-black uppercase mt-3">
                  <MapPin size={12} /> {locationText}
                  <button onClick={() => setLocationText(null)} className="ml-1 text-indigo-400 hover:text-indigo-600">
                    <X size={10} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-50">
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-xl transition-colors ${photoBase64 ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                <Image size={18} />
              </button>
              <button
                onClick={handleAttachLocation}
                disabled={gpsLoading}
                className={`p-2 rounded-xl transition-colors ${locationText ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                <MapPin size={18} className={gpsLoading ? "animate-bounce" : ""} />
              </button>
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handlePhotoChange}
            />

            <button
              onClick={handlePost}
              disabled={(!newPost.trim() && !photoBase64) || loading}
              className={`px-6 py-2.5 rounded-full font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${(newPost.trim() || photoBase64) && !loading ? 'bg-[#114B36] text-white shadow-xl shadow-emerald-900/20 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
            >
              {loading ? 'PAYLAŞILIYOR...' : 'PAYLAŞ'} <Send size={14} />
            </button>
          </div>
        </div>

        {/* FEED */}
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {posts.map((post) => {
              const authorInit = post.profiles?.full_name ? post.profiles.full_name[0].toUpperCase() : 'K';
              const authorName = post.profiles?.full_name || 'Silinmiş Hesap';
              const timeFormatted = new Date(post.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date(post.created_at).toLocaleDateString('tr-TR');

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  layout
                  className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-black text-sm shrink-0">
                        {authorInit}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-slate-800">{authorName}</h3>
                          <span className="bg-slate-50 px-2 py-0.5 rounded-lg text-[8px] font-black text-slate-400 border border-slate-100 uppercase tracking-tighter shrink-0">
                            {post.badge}
                          </span>
                        </div>
                        <p className="text-[9px] font-bold text-slate-300 uppercase mt-0.5">{timeFormatted}</p>

                        {/* Post Location Badge */}
                        {post.location_text && (
                          <div className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100/50 text-indigo-600 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase mt-1 shrink-0">
                            <MapPin size={10} /> {post.location_text}
                          </div>
                        )}
                      </div>
                    </div>
                    <button className="text-slate-200 group-hover:text-slate-400 transition-colors"><MoreHorizontal size={20} /></button>
                  </div>

                  {/* Post Text */}
                  {post.text && (
                    <p className="text-xs font-bold text-slate-600 leading-relaxed mb-4">
                      {post.text}
                    </p>
                  )}

                  {/* Post Photo */}
                  {post.image_base64 && (
                    <div
                      onClick={() => setSelectedImage(post.image_base64)}
                      className="w-full max-h-64 rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm cursor-zoom-in my-3"
                    >
                      <img src={post.image_base64} alt="Gönderi Görseli" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
                    <button
                      onClick={() => handleLike(post.id, post.likes)}
                      className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Heart size={18} className="transition-transform active:scale-150" />
                      <span className="text-[11px] font-black">{post.likes || 0}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-500 transition-colors">
                      <MessageSquare size={18} />
                      <span className="text-[11px] font-black">{post.comments || 0}</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* FULL IMAGE MODAL */}
      <AnimatePresence>
        {selectedImage && (
          <div
            className="absolute inset-0 z-50 bg-slate-900/95 flex items-center justify-center p-6"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex items-center justify-center">
              <img src={selectedImage} alt="Gönderi Görsel" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md active:scale-90 transition-transform"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DriverSocialWall;
