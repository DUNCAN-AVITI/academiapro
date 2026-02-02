import React, { useState, useEffect, useMemo } from 'react';
import { useAcademic } from '../App';
import { UserRole, Promotion, Group, User, Subject, SubmissionStatus } from '../types';
import { userService, promotionService, groupService, subjectService } from '../services/core';
import { assignmentService, submissionService } from '../services/academic';

export default function AdminPanel() {
  const { currentUser, refreshState } = useAcademic();
  const [activeTab, setActiveTab] = useState<'USERS' | 'STRUCT' | 'SUBJECTS' | 'STATISTICS'>('USERS');
  const [structSubTab, setStructSubTab] = useState<'PROMOS' | 'GROUPS'>('PROMOS');

  const [users, setUsers] = useState<User[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);

  // Form states...
  const [uEmail, setUEmail] = useState('');
  const [uFirstName, setUFirstName] = useState('');
  const [uLastName, setULastName] = useState('');
  const [uRole, setURole] = useState<UserRole>(UserRole.STUDENT);

  const [pName, setPName] = useState('');
  const [pYear, setPYear] = useState(new Date().getFullYear());

  const [gName, setGName] = useState('');
  const [gPromoId, setGPromoId] = useState('');

  const [sName, setSName] = useState('');
  const [sCode, setSCode] = useState('');

  // Editing States
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUEmail, setEditUEmail] = useState('');
  const [editURole, setEditURole] = useState<UserRole>(UserRole.STUDENT);
  const [editUStatus, setEditUStatus] = useState(true);

  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [editPName, setEditPName] = useState('');
  const [editPYear, setEditPYear] = useState(new Date().getFullYear());

  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editGName, setEditGName] = useState('');
  const [editGPromoId, setEditGPromoId] = useState('');

  const fetchData = async () => {
    try {
      const [u, p, g, s, a, sub] = await Promise.all([
        userService.getAll(),
        promotionService.getAll(),
        groupService.getAll(),
        subjectService.getAll(),
        assignmentService.getAll(),
        submissionService.getAll()
      ]);
      setUsers(u); setPromotions(p); setGroups(g); setSubjects(s); setAssignments(a); setSubmissions(sub);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  // --- Statistics Logic ---
  const stats = useMemo(() => {
    return subjects.map((sub: Subject) => {
      const subAssignments = assignments.filter((a: any) => a.subjectId === sub.id);
      const subSubmissions = submissions.filter((s: any) =>
        subAssignments.some(a => a.id === s.assignmentId) && s.status === SubmissionStatus.GRADED
      );

      const totalGrades = subSubmissions.reduce((acc: number, curr: any) => acc + (curr.grade || 0), 0);
      const average = subSubmissions.length > 0 ? totalGrades / subSubmissions.length : 0;

      return {
        id: sub.id,
        name: sub.name,
        code: sub.code,
        average: parseFloat(average.toFixed(2)),
        count: subSubmissions.length,
        assignmentsCount: subAssignments.length
      };
    });
  }, [subjects, assignments, submissions]);

  const globalAverage = useMemo(() => {
    const validStats = stats.filter(s => s.count > 0);
    if (validStats.length === 0) return 0;
    return (validStats.reduce((acc, curr) => acc + curr.average, 0) / validStats.length).toFixed(2);
  }, [stats]);

  // --- Handlers ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userService.create({ email: uEmail, password: 'ChangeMe123!', firstName: uFirstName, lastName: uLastName, role: uRole });
      setUEmail(''); setUFirstName(''); setULastName(''); refreshState(); fetchData();
      alert(`Compte ${uRole} créé avec succès.`);
    } catch (err: any) { alert(err.message); }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await userService.update(editingUser.id, { email: editUEmail, role: editURole, isActive: editUStatus });
      setEditingUser(null); refreshState(); fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) return alert("Auto-suppression interdite.");
    if (window.confirm("Supprimer l'utilisateur ?")) {
      try { await userService.delete(userId); refreshState(); fetchData(); } catch (e) { alert("Erreur suppression"); }
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await promotionService.create({ name: pName, year: pYear });
      setPName(''); setPYear(new Date().getFullYear());
      await fetchData();
      alert('Promotion créée !');
    } catch (err: any) { alert(err.message); }
  };

  const handleUpdatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo) return;
    try {
      await promotionService.update(editingPromo.id, { name: editPName, year: editPYear });
      setEditingPromo(null);
      await fetchData();
      alert('Promotion mise à jour !');
    } catch (err: any) { alert(err.message); }
  };

  const handleDeletePromo = async (id: string) => {
    if (window.confirm("Supprimer la promotion ?")) {
      try { await promotionService.delete(id); await fetchData(); } catch (e) { alert("Erreur suppression"); }
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await groupService.create({ name: gName, promotionId: gPromoId });
      setGName(''); setGPromoId('');
      await fetchData();
      alert('Groupe créé !');
    } catch (err: any) { alert(err.message); }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    try {
      await groupService.update(editingGroup.id, { name: editGName, promotionId: editGPromoId });
      setEditingGroup(null);
      await fetchData();
      alert('Groupe mis à jour !');
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteGroup = async (id: string) => {
    if (window.confirm("Supprimer le groupe ?")) {
      try { await groupService.delete(id); await fetchData(); } catch (e) { alert("Erreur suppression"); }
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await subjectService.create({ name: sName, code: sCode });
      setSName(''); setSCode('');
      await fetchData();
      alert('Matière créée !');
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteSubject = async (id: string) => {
    if (window.confirm("Supprimer la matière ?")) {
      try { await subjectService.delete(id); await fetchData(); } catch (e) { alert("Erreur suppression"); }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 p-4 md:p-10 space-y-8">
      <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Console d'Administration</h2>
          <p className="text-slate-500 font-medium">Gestion et analyse de la performance académique.</p>
        </div>
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl shrink-0 overflow-x-auto max-w-full">
          {(['USERS', 'STRUCT', 'SUBJECTS', 'STATISTICS'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {tab === 'USERS' ? 'Utilisateurs' : tab === 'STRUCT' ? 'Structure' : tab === 'SUBJECTS' ? 'Matières' : 'Statistiques'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {activeTab === 'STRUCT' && (
            <div className="flex gap-4">
              <button onClick={() => setStructSubTab('PROMOS')} className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${structSubTab === 'PROMOS' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}>Promotions</button>
              <button onClick={() => setStructSubTab('GROUPS')} className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${structSubTab === 'GROUPS' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}>Groupes</button>
            </div>
          )}

          {activeTab === 'STATISTICS' ? (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Moyenne Globale</p>
                  <p className="text-4xl font-black">{globalAverage}<span className="text-sm opacity-50 ml-1">/20</span></p>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Matières</p>
                  <p className="text-4xl font-black text-slate-800">{stats.length}</p>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Copies Notées</p>
                  <p className="text-4xl font-black text-slate-800">{stats.reduce((acc, curr) => acc + curr.count, 0)}</p>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm">
                <h3 className="text-xl font-black text-slate-800 mb-10 tracking-tight">Performance par Matière</h3>

                <div className="space-y-12">
                  {stats.map((s) => (
                    <div key={s.id} className="group">
                      <div className="flex justify-between items-end mb-4">
                        <div>
                          <p className="text-lg font-black text-slate-800">{s.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{s.code} • {s.assignmentsCount} Devoirs</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-2xl font-black ${s.average >= 10 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {s.count > 0 ? `${s.average}/20` : 'N/A'}
                          </span>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{s.count} Soumissions</p>
                        </div>
                      </div>
                      <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                        <div
                          className={`h-full transition-all duration-1000 ease-out rounded-full ${s.average >= 10 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          style={{ width: s.count > 0 ? `${(s.average / 20) * 100}%` : '0%' }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    {activeTab === 'USERS' && (
                      <>
                        <th className="px-8 py-5">Identité</th>
                        <th className="px-8 py-5">Rôle</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </>
                    )}
                    {activeTab === 'STRUCT' && structSubTab === 'PROMOS' && (
                      <>
                        <th className="px-8 py-5">Nom Promotion</th>
                        <th className="px-8 py-5">Année</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </>
                    )}
                    {activeTab === 'STRUCT' && structSubTab === 'GROUPS' && (
                      <>
                        <th className="px-8 py-5">Nom Groupe</th>
                        <th className="px-8 py-5">Promotion</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </>
                    )}
                    {activeTab === 'SUBJECTS' && (
                      <>
                        <th className="px-8 py-5">Intitulé</th>
                        <th className="px-8 py-5">Code</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activeTab === 'USERS' && users.map((u: User) => (
                    <tr key={u.id} className="hover:bg-indigo-50/20 transition-colors">
                      <td className="px-8 py-5">
                        <p className="text-sm font-black text-slate-800">{u.firstName} {u.lastName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{u.email}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase border ${u.role === UserRole.ADMIN ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          u.role === UserRole.TEACHER ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                          }`}>{u.role}</span>
                      </td>
                      <td className="px-8 py-5 text-right space-x-2">
                        <button onClick={() => { setEditingUser(u); setEditUEmail(u.email); setEditURole(u.role); setEditUStatus(u.isActive); }} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:text-indigo-600 transition-all"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                        <button onClick={() => handleDeleteUser(u.id)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:text-rose-600 transition-all"><i className="fa-solid fa-trash text-xs"></i></button>
                      </td>
                    </tr>
                  ))}
                  {activeTab === 'STRUCT' && structSubTab === 'PROMOS' && promotions.map((p: Promotion) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5 font-black text-slate-800">{p.name}</td>
                      <td className="px-8 py-5 text-sm font-bold text-slate-600">{p.year}</td>
                      <td className="px-8 py-5 text-right space-x-2">
                        <button onClick={() => { setEditingPromo(p); setEditPName(p.name); setEditPYear(p.year); }} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:text-indigo-600 transition-all"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                        <button onClick={() => handleDeletePromo(p.id)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:text-rose-600 transition-all"><i className="fa-solid fa-trash text-xs"></i></button>
                      </td>
                    </tr>
                  ))}
                  {activeTab === 'STRUCT' && structSubTab === 'GROUPS' && groups.map((g: Group) => {
                    const promo = promotions.find((p: any) => p.id === g.promotionId);
                    return (
                      <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5 font-black text-slate-800">{g.name}</td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-500">{promo?.name || 'Inconnue'}</td>
                        <td className="px-8 py-5 text-right space-x-2">
                          <button onClick={() => { setEditingGroup(g); setEditGName(g.name); setEditGPromoId(g.promotionId); }} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:text-indigo-600 transition-all"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                          <button onClick={() => handleDeleteGroup(g.id)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:text-rose-600 transition-all"><i className="fa-solid fa-trash text-xs"></i></button>
                        </td>
                      </tr>
                    );
                  })}
                  {activeTab === 'SUBJECTS' && subjects.map((s: Subject) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5 font-black text-slate-800">{s.name}</td>
                      <td className="px-8 py-5"><span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg">{s.code}</span></td>
                      <td className="px-8 py-5 text-right">
                        <button onClick={() => handleDeleteSubject(s.id)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:text-rose-600 transition-all"><i className="fa-solid fa-trash text-xs"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden h-fit">
            <h3 className="text-xl font-black mb-8 uppercase tracking-widest text-indigo-400">Ajouter</h3>
            {activeTab === 'USERS' && (
              <form onSubmit={handleCreateUser} className="space-y-5">
                <input value={uFirstName} onChange={e => setUFirstName(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Prénom" />
                <input value={uLastName} onChange={e => setULastName(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Nom" />
                <input value={uEmail} onChange={e => setUEmail(e.target.value)} required type="email" className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Email" />
                <select value={uRole} onChange={e => setURole(e.target.value as any)} className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold outline-none">
                  <option value={UserRole.STUDENT}>Étudiant</option>
                  <option value={UserRole.TEACHER}>Enseignant</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
                <button className="w-full py-5 bg-indigo-600 font-black rounded-2xl hover:bg-indigo-500 shadow-xl transition-all uppercase text-[10px] tracking-widest">Créer Compte</button>
              </form>
            )}
            {activeTab === 'STRUCT' && structSubTab === 'PROMOS' && (
              <form onSubmit={handleCreatePromo} className="space-y-5">
                <input value={pName} onChange={e => setPName(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold" placeholder="Nom Promotion" />
                <input type="number" value={pYear} onChange={e => setPYear(parseInt(e.target.value))} required className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold" />
                <button className="w-full py-5 bg-indigo-600 font-black rounded-2xl shadow-xl transition-all uppercase text-[10px] tracking-widest">Ajouter Promo</button>
              </form>
            )}
            {activeTab === 'STRUCT' && structSubTab === 'GROUPS' && (
              <form onSubmit={handleCreateGroup} className="space-y-5">
                <input value={gName} onChange={e => setGName(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold" placeholder="Nom Groupe" />
                <select value={gPromoId} onChange={e => setGPromoId(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold outline-none">
                  <option value="">Promo...</option>
                  {promotions.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button className="w-full py-5 bg-indigo-600 font-black rounded-2xl shadow-xl transition-all uppercase text-[10px] tracking-widest">Créer Groupe</button>
              </form>
            )}
            {activeTab === 'SUBJECTS' && (
              <form onSubmit={handleCreateSubject} className="space-y-5">
                <input value={sName} onChange={e => setSName(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold" placeholder="Matière" />
                <input value={sCode} onChange={e => setSCode(e.target.value)} required className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-sm font-bold" placeholder="Code" />
                <button className="w-full py-5 bg-indigo-600 font-black rounded-2xl shadow-xl transition-all uppercase text-[10px] tracking-widest">Ajouter Matière</button>
              </form>
            )}
            {activeTab === 'STATISTICS' && (
              <div className="text-center py-10">
                <i className="fa-solid fa-chart-pie text-6xl opacity-20 mb-6"></i>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-relaxed">Les statistiques sont mises à jour en temps réel à chaque nouvelle notation validée.</p>
              </div>
            )}
            <i className="fa-solid fa-shield-halved absolute -bottom-10 -right-10 text-[180px] text-white/5 rotate-12"></i>
          </div>
        </div>
      </div>

      {
        activeTab === 'USERS' && editingUser && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-10 bg-indigo-600 text-white flex justify-between items-center">
                <h3 className="text-2xl font-black">Modifier Utilisateur</h3>
                <button onClick={() => setEditingUser(null)}><i className="fa-solid fa-xmark text-2xl"></i></button>
              </div>
              <form onSubmit={handleUpdateUser} className="p-10 space-y-6">
                <input required value={editUEmail} onChange={e => setEditUEmail(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                <div className="grid grid-cols-2 gap-4">
                  <select value={editURole} onChange={e => setEditURole(e.target.value as any)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold">
                    <option value={UserRole.STUDENT}>Étudiant</option>
                    <option value={UserRole.TEACHER}>Enseignant</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                  </select>
                  <select value={editUStatus ? 'true' : 'false'} onChange={e => setEditUStatus(e.target.value === 'true')} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold">
                    <option value="true">Actif</option>
                    <option value="false">Inactif</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl">Annuler</button>
                  <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl uppercase text-[10px] tracking-widest">Sauvegarder</button>
                </div>
              </form>
            </div>
          </div>
        )
      }
      {/* ... Other modals (Promo, Group) logic is embedded in handlers above, but JSX similar to user modal needed if we want editing UI. logic included in my rewrite above uses inline handlers for create, editing modals logic is similar to users */}
      {
        editingPromo && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-10 bg-indigo-600 text-white flex justify-between items-center">
                <h3 className="text-2xl font-black">Modifier Promotion</h3>
                <button onClick={() => setEditingPromo(null)}><i className="fa-solid fa-xmark text-2xl"></i></button>
              </div>
              <form onSubmit={handleUpdatePromo} className="p-10 space-y-6">
                <input required value={editPName} onChange={e => setEditPName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                <input type="number" required value={editPYear} onChange={e => setEditPYear(parseInt(e.target.value))} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setEditingPromo(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl">Annuler</button>
                  <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl uppercase text-[10px] tracking-widest">Sauvegarder</button>
                </div>
              </form>
            </div>
          </div>
        )
      }
      {
        editingGroup && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-10 bg-indigo-600 text-white flex justify-between items-center">
                <h3 className="text-2xl font-black">Modifier Groupe</h3>
                <button onClick={() => setEditingGroup(null)}><i className="fa-solid fa-xmark text-2xl"></i></button>
              </div>
              <form onSubmit={handleUpdateGroup} className="p-10 space-y-6">
                <input required value={editGName} onChange={e => setEditGName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" />
                <select value={editGPromoId} onChange={e => setEditGPromoId(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none">
                  {promotions.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setEditingGroup(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl">Annuler</button>
                  <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl uppercase text-[10px] tracking-widest">Sauvegarder</button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </div >
  );
}
