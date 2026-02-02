import React, { useState, useEffect, useRef } from 'react';
import { useAcademic } from '../App';
import { User, UserRole } from '../types';
import { messagingService } from '../services/messaging';
import { userService } from '../services/core';

export default function MessagingPage() {
   const { currentUser, refreshState } = useAcademic();
   const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
   const [showCompose, setShowCompose] = useState(false);
   const [toId, setToId] = useState('');
   const [subject, setSubject] = useState('');
   const [content, setContent] = useState('');
   const [chatInput, setChatInput] = useState('');

   const [allMessages, setAllMessages] = useState<any[]>([]);
   const [users, setUsers] = useState<User[]>([]);
   const [conversation, setConversation] = useState<any[]>([]);

   const scrollRef = useRef<HTMLDivElement>(null);

   // Auto-scroll to bottom of chat
   useEffect(() => {
      if (scrollRef.current) {
         scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
   }, [conversation]);

   const fetchData = async () => {
      try {
         const [msgs, usrs] = await Promise.all([
            messagingService.getAll(),
            userService.getAll()
         ]);
         setAllMessages(msgs);
         setUsers(usrs.filter((u: User) => u.id !== currentUser?.id));
      } catch (e) { console.error(e); }
   };

   useEffect(() => {
      fetchData();
   }, [currentUser]);

   useEffect(() => {
      if (activePartnerId) {
         messagingService.getConversation(activePartnerId)
            .then(setConversation)
            .catch(console.error);
      }
   }, [activePartnerId, allMessages]);

   // Identify unique partners
   const partnersMap = new Map<string, User>();
   allMessages.forEach(m => {
      const partnerId = m.senderId === currentUser?.id ? m.receiverId : m.senderId;
      const partner = users.find(u => u.id === partnerId);
      if (partner) partnersMap.set(partnerId, partner);
   });
   const conversationPartners = Array.from(partnersMap.values());

   const handleSendNew = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser || !toId) return;
      try {
         await messagingService.send({ receiverId: toId, subject, content });
         setShowCompose(false);
         setActivePartnerId(toId);
         setSubject(''); setContent(''); setToId('');
         fetchData();
         alert("Message envoyé !");
      } catch (e) { alert("Erreur envoi"); }
   };

   const handleSendChat = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser || !activePartnerId || !chatInput.trim()) return;
      try {
         await messagingService.send({ receiverId: activePartnerId, subject: "Chat Message", content: chatInput });
         setChatInput('');
         fetchData();
      } catch (e) { alert("Erreur envoi"); }
   };

   const handleSelectPartner = async (id: string) => {
      setActivePartnerId(id);
      try {
         await messagingService.markAllAsRead(id);
         fetchData();
      } catch (e) { console.error(e); }
   };

   const activePartner = activePartnerId ? users.find(u => u.id === activePartnerId) : null;

   return (
      <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-500">
         <div className="flex justify-between items-center bg-white p-6 rounded-t-[40px] border-x border-t border-slate-100 shrink-0 shadow-sm">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                  <i className="fa-solid fa-comments text-2xl"></i>
               </div>
               <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Espace Discussion</h2>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-widest font-black">Messagerie Sécurisée AcademiaPro</p>
               </div>
            </div>
            <button onClick={() => setShowCompose(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all flex items-center gap-2">
               <i className="fa-solid fa-plus-circle"></i> Nouveau Contact
            </button>
         </div>

         <div className="flex-1 bg-white border border-slate-100 flex overflow-hidden rounded-b-[40px] shadow-sm">
            {/* Sidebar: Conversations List */}
            <aside className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/30">
               <div className="p-4 border-b border-slate-100 bg-white">
                  <div className="relative">
                     <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                     <input className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Rechercher un échange..." />
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-3 space-y-1">
                  {conversationPartners.length === 0 ? (
                     <div className="py-20 text-center text-slate-300 px-6">
                        <p className="text-xs font-black uppercase tracking-widest mb-2 opacity-30">Aucun contact</p>
                        <p className="text-[10px] font-medium leading-relaxed">Initiez une discussion avec un enseignant ou un camarade.</p>
                     </div>
                  ) : conversationPartners.map(p => {
                     const lastMsg = allMessages.filter(m => m.senderId === p.id || m.receiverId === p.id).pop();
                     const unreadCount = allMessages.filter(m => m.senderId === p.id && m.receiverId === currentUser?.id && !m.isRead).length;

                     return (
                        <button
                           key={p.id}
                           onClick={() => handleSelectPartner(p.id)}
                           className={`w-full p-4 flex items-center gap-4 rounded-3xl transition-all border ${activePartnerId === p.id ? 'bg-white border-indigo-200 shadow-md ring-4 ring-indigo-50' : 'border-transparent hover:bg-white hover:border-slate-200'}`}
                        >
                           <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center font-black text-indigo-500 shrink-0 text-lg">
                              {p.firstName[0]}{p.lastName[0]}
                           </div>
                           <div className="flex-1 text-left min-w-0">
                              <div className="flex justify-between items-baseline mb-0.5">
                                 <p className="text-sm font-black text-slate-800 truncate">{p.firstName} {p.lastName}</p>
                                 {lastMsg && <span className="text-[9px] font-black text-slate-400 uppercase">{new Date(lastMsg.createdAt).toLocaleDateString()}</span>}
                              </div>
                              <div className="flex justify-between items-center">
                                 <p className="text-[11px] text-slate-500 truncate italic">
                                    {lastMsg?.senderId === currentUser?.id ? 'Vous: ' : ''}{lastMsg?.content}
                                 </p>
                                 {unreadCount > 0 && <span className="w-5 h-5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg shadow-rose-500/30">{unreadCount}</span>}
                              </div>
                           </div>
                        </button>
                     );
                  })}
               </div>
            </aside>

            {/* Main: Chat View */}
            <div className="flex-1 flex flex-col bg-slate-50/10">
               {activePartner ? (
                  <>
                     {/* Chat Header */}
                     <div className="p-6 border-b border-slate-100 bg-white/80 backdrop-blur-md flex justify-between items-center z-10">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-xs">
                              {activePartner.firstName[0]}{activePartner.lastName[0]}
                           </div>
                           <div>
                              <p className="font-black text-slate-800">{activePartner.firstName} {activePartner.lastName}</p>
                              <div className="flex items-center gap-2">
                                 <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                 <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{activePartner.role}</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Messages Stream */}
                     <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6">
                        {conversation.map((m: any) => {
                           const isMine = m.senderId === currentUser?.id;
                           return (
                              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                 <div className={`max-w-[70%] group`}>
                                    <div className={`px-6 py-4 rounded-[32px] shadow-sm text-sm leading-relaxed ${isMine
                                          ? 'bg-indigo-600 text-white rounded-tr-none'
                                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                       }`}>
                                       {m.subject !== "Chat Message" && <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Objet: {m.subject}</p>}
                                       <p className="font-medium">{m.content}</p>
                                    </div>
                                    <p className={`text-[9px] font-black text-slate-400 uppercase mt-2 ${isMine ? 'text-right' : 'text-left'}`}>
                                       {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                       {isMine && (m.isRead ? <i className="fa-solid fa-check-double text-indigo-500 ml-2"></i> : <i className="fa-solid fa-check ml-2"></i>)}
                                    </p>
                                 </div>
                              </div>
                           );
                        })}
                     </div>

                     {/* Chat Input */}
                     <div className="p-6 bg-white border-t border-slate-100">
                        <form onSubmit={handleSendChat} className="flex gap-4">
                           <div className="flex-1 relative">
                              <input
                                 value={chatInput}
                                 onChange={e => setChatInput(e.target.value)}
                                 className="w-full h-12 px-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                 placeholder="Écrivez votre message ici..."
                              />
                           </div>
                           <button type="submit" disabled={!chatInput.trim()} className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-95">
                              <i className="fa-solid fa-paper-plane"></i>
                           </button>
                        </form>
                     </div>
                  </>
               ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 p-20 text-center">
                     <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mb-6">
                        <i className="fa-solid fa-comment-dots text-4xl opacity-20"></i>
                     </div>
                     <h3 className="text-xl font-black text-slate-400 tracking-tight">Aucune conversation active</h3>
                     <p className="text-sm font-medium mt-2 max-w-xs leading-relaxed text-slate-300">Sélectionnez un contact dans la liste de gauche ou démarrez une nouvelle discussion.</p>
                  </div>
               )}
            </div>
         </div>

         {/* New Contact Modal */}
         {showCompose && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[200] p-4">
               <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
                     <div>
                        <h3 className="text-2xl font-black uppercase tracking-widest">Nouveau Contact</h3>
                        <p className="text-slate-400 text-xs font-bold mt-1">SÉLECTIONNEZ UN MEMBRE DE L'ÉTABLISSEMENT</p>
                     </div>
                     <button onClick={() => setShowCompose(false)} className="w-12 h-12 bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors flex items-center justify-center"><i className="fa-solid fa-xmark text-xl"></i></button>
                  </div>
                  <form onSubmit={handleSendNew} className="p-10 space-y-6">
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-4">Destinataire</label>
                        <select required value={toId} onChange={e => setToId(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl outline-none font-bold">
                           <option value="">Chercher un membre...</option>
                           {users.map((u: User) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.role})</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-4">Objet du premier message</label>
                        <input required value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl outline-none font-bold" placeholder="ex: Question sur le projet final" />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-4">Message d'introduction</label>
                        <textarea rows={5} required value={content} onChange={e => setContent(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl outline-none font-medium" placeholder="Écrivez ici..." />
                     </div>
                     <div className="flex gap-4 pt-4">
                        <button type="submit" className="flex-[2] py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
                           <i className="fa-solid fa-paper-plane"></i> Initier la discussion
                        </button>
                        <button type="button" onClick={() => setShowCompose(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black rounded-3xl hover:bg-slate-200 transition-all">Annuler</button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
}
