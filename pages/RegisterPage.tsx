import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAcademic } from '../App';
import { UserRole, Group, Subject } from '../types';
import { groupService, subjectService, userService } from '../services/core';

export default function RegisterPage() {
  const navigate = useNavigate();
  // db is removed from context

  const [role, setRole] = useState<UserRole.STUDENT | UserRole.TEACHER>(UserRole.STUDENT);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Specific fields
  const [groupId, setGroupId] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // We need promotions to display group names nicely
        // Assuming promotionService is exported from core
        const [g, s] = await Promise.all([
          groupService.getAll(),
          subjectService.getAll()
        ]);
        setGroups(g);
        setSubjects(s);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  const handleSubjectToggle = (id: string) => {
    setSelectedSubjects(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation front-end
    if (password.length < 8) {
      return setError("Le mot de passe doit contenir au moins 8 caractères.");
    }

    if (role === UserRole.STUDENT && !groupId) {
      return setError("Veuillez sélectionner un groupe.");
    }

    if (role === UserRole.TEACHER && selectedSubjects.length === 0) {
      return setError("Veuillez sélectionner au moins une matière.");
    }

    setLoading(true);

    try {
      await userService.create({
        firstName,
        lastName,
        email,
        password, // Sent as plain text, hashed on server
        role,
        groupId: role === UserRole.STUDENT ? groupId : undefined,
        subjectIds: role === UserRole.TEACHER ? selectedSubjects : undefined
      });

      alert("Votre compte AcademiaPro a été créé avec succès. Bienvenue !");
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Une erreur est survenue lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 py-20">
      <div className="max-w-2xl w-full bg-white rounded-[40px] shadow-2xl overflow-hidden transition-all animate-in zoom-in-95 duration-300">
        <div className="bg-slate-900 p-10 text-center relative overflow-hidden border-b border-slate-800">
          <div className="relative z-10">
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Inscription AcademiaPro</h1>
            <p className="text-slate-400 font-medium mt-2 italic">Portail d'auto-enregistrement sécurisé</p>
          </div>
          <i className="fa-solid fa-graduation-cap absolute -top-10 -right-10 text-[150px] text-white/5 rotate-12"></i>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          {error && (
            <div className="p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-sm animate-in fade-in slide-in-from-top-2 rounded-r-xl">
              <i className="fa-solid fa-circle-exclamation mr-2"></i> {error}
            </div>
          )}

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Je suis un(e)...</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole(UserRole.STUDENT)}
                className={`py-5 rounded-3xl font-black text-xs uppercase tracking-widest transition-all border-2 ${role === UserRole.STUDENT ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200'
                  }`}
              >
                <i className="fa-solid fa-user-graduate mr-3 text-lg"></i> Étudiant
              </button>
              <button
                type="button"
                onClick={() => setRole(UserRole.TEACHER)}
                className={`py-5 rounded-3xl font-black text-xs uppercase tracking-widest transition-all border-2 ${role === UserRole.TEACHER ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-indigo-200'
                  }`}
              >
                <i className="fa-solid fa-chalkboard-user mr-3 text-lg"></i> Enseignant
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Prénom</label>
              <input required value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold" placeholder="ex: Jean" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nom</label>
              <input required value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold" placeholder="ex: Dupont" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email institutionnel</label>
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold" placeholder="ex: j.dupont@ecole.fr" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Mot de passe de sécurité</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold" placeholder="8 caractères minimum" />
          </div>

          {role === UserRole.STUDENT ? (
            <div className="space-y-2 animate-in slide-in-from-bottom-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Groupe / Promotion</label>
              <select required value={groupId} onChange={e => setGroupId(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold appearance-none">
                <option value="">Sélectionnez votre classe...</option>
                {groups.map((g: Group) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-2 animate-in slide-in-from-bottom-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Vos Spécialités Enseignées</label>
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-3xl">
                {subjects.map((s: Subject) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSubjectToggle(s.id)}
                    className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${selectedSubjects.includes(s.id) ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                      }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-6">
            <div className="p-6 bg-indigo-50 rounded-3xl mb-8 border border-indigo-100 flex items-start gap-4">
              <i className="fa-solid fa-shield-check text-indigo-600 text-xl mt-1"></i>
              <p className="text-[11px] text-indigo-900 font-medium leading-relaxed">
                En vous inscrivant, vous certifiez l'exactitude des informations fournies. Votre compte sera soumis à la politique de sécurité et d'audit de l'établissement.
              </p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-indigo-600 text-white font-black rounded-[28px] shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-user-plus"></i>}
              {loading ? "Traitement sécurisé..." : "Finaliser mon inscription"}
            </button>
            <div className="text-center mt-8">
              <p className="text-sm text-slate-500 font-medium">
                Déjà un compte ?{' '}
                <Link to="/login" className="text-indigo-600 font-black hover:underline">Identifiez-vous ici</Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
