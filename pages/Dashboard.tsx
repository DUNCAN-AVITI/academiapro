import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAcademic } from '../App';
import { UserRole, SubmissionStatus, Assignment, Submission, AuditLog } from '../types';
import { userService, promotionService, coreService, subjectService } from '../services/core';
import { assignmentService, submissionService } from '../services/academic';

export default function Dashboard() {
  const { currentUser } = useAcademic();
  const [stats, setStats] = useState<any[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(null); // Extended User object has student info
  const [globalAverage, setGlobalAverage] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Extend User type locally to include student/teacher relation if needed, 
  // but currentUser coming from authService.me() should now include it.
  const extendedUser = currentUser as any;

  const isStudent = currentUser?.role === UserRole.STUDENT;
  const isTeacher = currentUser?.role === UserRole.TEACHER;
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Parallel data fetching based on role
        if (isAdmin) {
          const [users, promotions, logs] = await Promise.all([
            userService.getAll(),
            promotionService.getAll(),
            coreService.getAuditLogs()
          ]);

          console.log('Admin dashboard data:', { users: users.length, promotions: promotions.length, logs: logs.length });

          setStats([
            { label: 'Utilisateurs', val: users.length, icon: 'fa-users', col: 'bg-indigo-500' },
            { label: 'Critiques', val: logs.filter(l => l.severity === 'CRITICAL').length, icon: 'fa-shield-virus', col: 'bg-rose-600' },
            { label: 'Logs Erreurs', val: logs.filter(l => l.severity === 'WARN').length, icon: 'fa-bug', col: 'bg-amber-600' },
            { label: 'Promos Actives', val: promotions.filter(p => !p.isArchived).length, icon: 'fa-folder-tree', col: 'bg-emerald-500' },
          ]);
          setRecentLogs(logs.slice(0, 6));
        }
        else if (isTeacher) {
          const [subs, asgs] = await Promise.all([
            submissionService.getAll(),
            assignmentService.getAll()
          ]);

          const teacherId = extendedUser.teacher?.id;
          const myAsgs = asgs.filter(a => a.teacherId === teacherId);
          const mySubs = subs; // getAll returns only relevant submissions for teacher usually? 

          console.log('Teacher dashboard data:', { 
            teacherId, 
            assignments: myAsgs.length, 
            submissions: mySubs.length,
            subjects: extendedUser.teacher?.subjects?.length || 0,
            plagiarismScores: mySubs.map(s => s.plagiarismScore)
          });

          const plagiarismAlerts = mySubs.filter(s => (s.plagiarismScore || 0) > 20).length;

          setStats([
            { label: 'Mes Cours', val: extendedUser.teacher?.subjects?.length || 0, icon: 'fa-book-open', col: 'bg-amber-500' },
            { label: 'Copies Reçues', val: mySubs.length, icon: 'fa-list-check', col: 'bg-indigo-500' },
            { label: 'Alertes Plagiat', val: plagiarismAlerts, icon: 'fa-radiation', col: 'bg-rose-500' },
          ]);
          setSubmissions(mySubs);
        }
        else if (isStudent) {
          const [asgs, subs, allSubjects] = await Promise.all([
            assignmentService.getAll(),
            submissionService.getAll(), // Should return student's submissions
            subjectService.getAll()
          ]);

          console.log('Student dashboard data:', { 
            assignments: asgs.length, 
            submissions: subs.length, 
            subjects: allSubjects.length,
            grades: subs.map(s => s.grade)
          });

          setSubmissions(subs);
          setSubjects(allSubjects);

          // Calculate Average (Simplistic)
          const graded = subs.filter(s => s.status === SubmissionStatus.GRADED && s.grade !== null);
          const totalPoints = graded.reduce((acc, curr) => acc + (curr.grade || 0), 0);
          const avg = graded.length > 0 ? (totalPoints / graded.length).toFixed(2) : '--';
          setGlobalAverage(avg);

          setStats([
            { label: 'Moyenne Générale', val: avg, icon: 'fa-chart-line', col: 'bg-indigo-600' },
            { label: 'Soumissions v2+', val: subs.filter(s => s.version > 1).length, icon: 'fa-code-branch', col: 'bg-blue-500' },
            { label: 'Notes Reçues', val: graded.length, icon: 'fa-star', col: 'bg-amber-500' },
            { label: 'Heures d\'Appel', val: '--', icon: 'fa-clock', col: 'bg-emerald-500' },
          ]);

          // Filter upcoming
          const upcoming = asgs
            .filter(a => new Date(a.deadline) > new Date())
            .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
            .slice(0, 3);
          setUpcomingAssignments(upcoming);
        }
      } catch (e) {
        console.error("Dashboard fetch error", e);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) fetchData();
  }, [currentUser, isAdmin, isTeacher, isStudent]);

  if (loading) return <div className="p-10 text-center"><i className="fa-solid fa-circle-notch fa-spin text-4xl text-indigo-600"></i></div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="z-10">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">
            Bonjour, {currentUser?.firstName} <span className="text-indigo-600">.</span>
          </h2>
          <p className="text-slate-500 mt-2 font-medium">
            {isStudent
              ? `Votre semestre est en cours. Accédez à votre relevé de notes en un clic.`
              : isTeacher
                ? `Session de correction active. Système anti-plagiat opérationnel.`
                : "Interface administrateur : Audit et sécurité globale."}
          </p>
        </div>
        <div className="flex items-center gap-3 z-10">
          {isStudent && (
            <Link to="/transcript" className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center gap-2">
              <i className="fa-solid fa-file-invoice"></i> Voir mon relevé
            </Link>
          )}
          <div className="px-6 py-4 bg-slate-900 text-white rounded-3xl flex items-center gap-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Session</p>
            <p className="text-xs font-bold">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
        <i className="fa-solid fa-shield-halved absolute -bottom-10 -right-10 text-[200px] text-slate-50 opacity-[0.03]"></i>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
            <div className={`${stat.col} w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg mb-6 group-hover:scale-110 transition-transform`}>
              <i className={`fa-solid ${stat.icon}`}></i>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900">{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {isStudent && (
            <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Prochains Délais (Versioning v1/v2)</h3>
              <div className="space-y-4">
                {upcomingAssignments.length === 0 ? (
                  <div className="py-20 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-100">
                    <p className="text-slate-400 font-bold">Zéro échéance ! ✨</p>
                  </div>
                ) : (
                  upcomingAssignments.map((asg: Assignment) => {
                    const submission = submissions.find(s => s.assignmentId === asg.id);
                    return (
                      <div key={asg.id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex justify-between items-center group hover:border-indigo-200 transition-all">
                        <div className="flex gap-4 items-center">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-500 border border-slate-100 font-black">
                            {submission ? `v${submission.version}` : 'v0'}
                          </div>
                          <div>
                            <p className="font-black text-slate-800">{asg.title}</p>
                            <p className="text-[10px] text-indigo-500 font-bold uppercase">{subjects.find(s => s.id === asg.subjectId)?.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-[10px] font-black uppercase ${submission ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {submission ? 'Mis à jour' : 'Rendu en attente'}
                          </p>
                          <p className="text-xs text-slate-400 font-bold">Limite: {new Date(asg.deadline).toLocaleDateString()}</p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {isTeacher && (
            <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-sm">
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Surveillance Plagiat & Corrections</h3>
              <div className="space-y-4">
                {submissions.filter(s => (s.plagiarismScore || 0) > 20).slice(0, 5).map((s) => (
                  <div key={s.id} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <i className="fa-solid fa-circle-exclamation text-rose-500"></i>
                      <p className="text-xs font-bold text-rose-900">Plagiat probable - Submission {s.id.substring(0, 6)}</p>
                    </div>
                    <Link to="/grading" className="px-4 py-2 bg-white text-rose-600 rounded-xl text-[10px] font-black uppercase border border-rose-200">Investiguer</Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="bg-slate-900 text-white rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
              <h3 className="text-2xl font-black mb-4">Administration de Sécurité</h3>
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                  <p className="text-[10px] text-indigo-400 font-black uppercase">Statut Serveur</p>
                  <p className="text-xl font-bold mt-1 text-emerald-400">Opérationnel</p>
                </div>
                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                  <p className="text-[10px] text-indigo-400 font-black uppercase">Accès Audit</p>
                  <p className="text-xl font-bold mt-1">Lecture/Écriture</p>
                </div>
              </div>
              <Link to="/audit" className="mt-8 px-8 py-3 bg-white text-slate-900 font-black rounded-2xl inline-block hover:scale-105 transition-all">Consulter l'Audit Complet</Link>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px] mb-8">Journal Sécurisé</h3>
            <div className="space-y-8">
              {recentLogs.map((log: any) => (
                <div key={log.id} className="flex gap-5 relative">
                  <div className={`z-10 w-3 h-3 rounded-full border-2 border-white mt-1 ${log.severity === 'CRITICAL' ? 'bg-rose-500' :
                    log.severity === 'WARN' ? 'bg-amber-500' : 'bg-indigo-500'
                    }`}></div>
                  <div className="flex-1">
                    <p className={`text-xs font-black ${log.severity === 'CRITICAL' ? 'text-rose-600' : 'text-slate-800'}`}>{log.action}</p>
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{log.details}</p>
                    <p className="text-[9px] text-slate-300 font-bold mt-2">{new Date(log.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
