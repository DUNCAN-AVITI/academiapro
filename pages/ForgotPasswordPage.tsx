
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAcademic } from '../App';

export default function ForgotPasswordPage() {
  const { db } = useAcademic();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Request, 2: Reset
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoCode, setDemoCode] = useState('');

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const generatedCode = db.requestPasswordReset(email);
      setDemoCode(generatedCode); // For demo purposes, we show the code directly
      setStep(2);
      setSuccess("Un e-mail de réinitialisation a été envoyé (Virtuellement).");
    } catch (err: any) {
      setError(err.message || "Erreur lors de la demande.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setError("Les mots de passe ne correspondent pas.");
    }
    setLoading(true);
    setError('');
    
    try {
      db.resetPassword(email, token, newPassword);
      alert("Mot de passe réinitialisé avec succès !");
      navigate('/login');
    } catch (err: any) {
      setError(err.message || "Erreur lors de la réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-indigo-600 p-10 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Récupération</h1>
            <p className="text-indigo-100 font-medium mt-2">Réinitialisez votre accès sécurisé</p>
          </div>
          <i className="fa-solid fa-key absolute -top-8 -right-8 text-[120px] text-white/10 rotate-12"></i>
        </div>

        <div className="p-10 space-y-8">
          {error && (
            <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-sm">
              <i className="fa-solid fa-circle-exclamation mr-2"></i> {error}
            </div>
          )}

          {success && step === 2 && (
            <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-sm">
              <i className="fa-solid fa-circle-check mr-2"></i> {success}
              <div className="mt-2 p-2 bg-white rounded border border-emerald-100 font-black text-center text-lg">
                CODE DÉMO : {demoCode}
              </div>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequest} className="space-y-6">
              <p className="text-sm text-slate-500 leading-relaxed">
                Entrez votre adresse e-mail institutionnelle pour recevoir un code de réinitialisation.
              </p>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email</label>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold" 
                  placeholder="nom@ecole.fr" 
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-indigo-600 text-white font-black rounded-[28px] shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Envoyer le code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Code de sécurité (6 chiffres)</label>
                <input 
                  type="text" 
                  required 
                  maxLength={6}
                  value={token} 
                  onChange={e => setToken(e.target.value)} 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-black text-center text-xl tracking-[0.5em]" 
                  placeholder="000000" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nouveau mot de passe</label>
                <input 
                  type="password" 
                  required 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Confirmer le mot de passe</label>
                <input 
                  type="password" 
                  required 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold" 
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-5 bg-indigo-600 text-white font-black rounded-[28px] shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : "Réinitialiser mon accès"}
              </button>
              <button type="button" onClick={() => setStep(1)} className="w-full text-xs text-slate-400 font-bold hover:text-indigo-600 transition-colors">
                Retour à l'étape précédente
              </button>
            </form>
          )}

          <div className="text-center pt-4 border-t border-slate-50">
             <Link to="/login" className="text-sm text-indigo-600 font-black hover:underline">Retour à la connexion</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
