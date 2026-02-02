
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAcademic } from '../App';

export default function LoginPage() {
  const { login } = useAcademic();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      if (!success) setError('Identifiants invalides ou compte inactif.');
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden transition-all">
        <div className="bg-indigo-600 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
            <i className="fa-solid fa-graduation-cap text-3xl text-white"></i>
          </div>
          <h1 className="text-2xl font-bold text-white">Bienvenue sur AcademiaPro</h1>
          <p className="text-indigo-100 text-sm mt-2">Accès sécurisé à votre espace pédagogique</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
              <i className="fa-solid fa-circle-exclamation mr-2"></i> {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Adresse Email</label>
            <div className="relative">
              <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="nom@ecole.fr"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-slate-700">Mot de passe</label>
              <Link to="/forgot-password" size="sm" className="text-xs text-indigo-600 font-bold hover:underline">Mot de passe oublié ?</Link>
            </div>
            <div className="relative">
              <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : "Se connecter"}
          </button>

          <div className="text-center pt-4">
            <p className="text-sm text-slate-600">
              Vous n'avez pas de compte ?{' '}
              <Link to="/register" className="text-indigo-600 font-bold hover:underline">Inscrivez-vous</Link>
            </p>
          </div>


        </form>
      </div>
    </div>
  );
}
