import React, { useState, useEffect } from 'react';
import { useAcademic } from '../App';
import { emailService } from '../services/messaging';

export default function MailboxPage() {
  const { currentUser } = useAcademic();
  const [emails, setEmails] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);

  const fetchEmails = async () => {
    try {
      const data = await emailService.getAll();
      setEmails(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleSelectEmail = async (email: any) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      try {
        await emailService.markAsRead(email.id);
        fetchEmails();
      } catch (e) { console.error(e); }
    }
  };

  const unreadCount = emails.filter(e => !e.isRead).length;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-t-[40px] border-x border-t border-slate-100 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
            <i className="fa-solid fa-inbox text-2xl"></i>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Boîte de Réception Système</h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest font-black">Notifications Académiques</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <div className="px-4 py-2 bg-rose-500 text-white rounded-2xl font-black text-sm">
            {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="flex-1 bg-white border border-slate-100 flex overflow-hidden rounded-b-[40px] shadow-sm">
        {/* Email List */}
        <aside className="w-96 border-r border-slate-100 flex flex-col bg-slate-50/30 overflow-y-auto">
          {emails.length === 0 ? (
            <div className="py-20 text-center text-slate-300 px-6">
              <p className="text-xs font-black uppercase tracking-widest mb-2 opacity-30">Aucun email</p>
              <p className="text-[10px] font-medium leading-relaxed">Vous recevrez ici les notifications système.</p>
            </div>
          ) : emails.map(email => (
            <button
              key={email.id}
              onClick={() => handleSelectEmail(email)}
              className={`p-6 border-b border-slate-100 text-left hover:bg-white transition-all ${selectedEmail?.id === email.id ? 'bg-white border-l-4 border-l-indigo-600' : ''} ${!email.isRead ? 'bg-indigo-50/50' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <p className={`text-sm ${!email.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-600'}`}>{email.from}</p>
                <span className="text-[9px] text-slate-400 font-bold uppercase">{new Date(email.sentAt).toLocaleDateString()}</span>
              </div>
              <p className={`text-xs ${!email.isRead ? 'font-bold text-slate-800' : 'text-slate-500'} mb-1`}>{email.subject}</p>
              <p className="text-[11px] text-slate-400 line-clamp-2">{email.body}</p>
              {!email.isRead && <span className="inline-block mt-2 px-2 py-1 bg-indigo-600 text-white text-[8px] font-black rounded-full uppercase">Nouveau</span>}
            </button>
          ))}
        </aside>

        {/* Email Content */}
        <div className="flex-1 flex flex-col">
          {selectedEmail ? (
            <div className="flex-1 overflow-y-auto p-10">
              <div className="max-w-3xl mx-auto">
                <div className="mb-8 pb-8 border-b border-slate-100">
                  <h1 className="text-3xl font-black text-slate-900 mb-4">{selectedEmail.subject}</h1>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-user-circle text-lg"></i>
                      <span className="font-bold">De: {selectedEmail.from}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-calendar text-sm"></i>
                      <span>{new Date(selectedEmail.sentAt).toLocaleString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
                <div className="prose max-w-none">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedEmail.body}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 p-20 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mb-6">
                <i className="fa-solid fa-envelope-open text-4xl opacity-20"></i>
              </div>
              <h3 className="text-xl font-black text-slate-400 tracking-tight">Sélectionnez un email</h3>
              <p className="text-sm font-medium mt-2 max-w-xs leading-relaxed text-slate-300">Choisissez un message dans la liste pour le lire.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
