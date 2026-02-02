import React, { useState, useEffect } from 'react';
import { useAcademic } from '../App';
import { UserRole, Subject, Group } from '../types';
import { subjectService, groupService, userService } from '../services/core';
import { attendanceService } from '../services/messaging';

export default function AttendancePage() {
  const { currentUser, refreshState } = useAcademic();
  const [subjectId, setSubjectId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [attendanceData, setAttendanceData] = useState<{ [studentId: string]: string }>({});

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, g] = await Promise.all([
          subjectService.getAll(),
          groupService.getAll()
        ]);
        setSubjects(s);
        setGroups(g);
      } catch (e) { console.error(e); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (groupId) {
      const group = groups.find(g => g.id === groupId);
      if (group && group.students) {
        Promise.all(
          group.students.map((s: any) => userService.getAll().then(users => users.find(u => u.id === s.userId)))
        ).then(studentUsers => {
          const studentsWithUsers = group.students.map((s: any, i: number) => ({
            ...s,
            user: studentUsers[i]
          }));
          setStudents(studentsWithUsers);
        });
      }
    } else {
      setStudents([]);
    }
  }, [groupId, groups]);

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    if (!subjectId || !groupId) return alert("Sélectionnez une matière et un groupe.");
    const today = new Date().toISOString().split('T')[0];
    const payload = students.map((s: any) => ({
      studentId: s.id,
      status: attendanceData[s.id] || 'PRESENT'
    }));
    try {
      await attendanceService.mark({ subjectId, date: today, records: payload });
      alert("Appel enregistré !");
      setGroupId(''); setSubjectId(''); setAttendanceData({});
      refreshState();
    } catch (err: any) { alert("Erreur enregistrement"); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Feuille d'Appel</h2>
          <p className="text-slate-500 font-medium">Contrôle de présence quotidien et suivi d'assiduité.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 h-fit space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Matière</label>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold">
              <option value="">Sélectionner...</option>
              {subjects.map((s: Subject) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Groupe d'étudiants</label>
            <select value={groupId} onChange={e => setGroupId(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold">
              <option value="">Sélectionner...</option>
              {groups.map((g: Group) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          {groupId && (
            <button onClick={handleSave} className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all">Valider l'appel</button>
          )}
        </div>

        <div className="md:col-span-2">
          {students.length > 0 ? (
            <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-5">Étudiant</th>
                    <th className="px-8 py-5 text-center">Statut de Présence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.map((s: any) => {
                    const currentStatus = attendanceData[s.id] || 'PRESENT';
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5 font-bold text-slate-800">{s.user?.firstName} {s.user?.lastName}</td>
                        <td className="px-8 py-5">
                          <div className="flex justify-center gap-2">
                            {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as string[]).map(status => (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(s.id, status)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${currentStatus === status
                                    ? (status === 'PRESENT' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                                      status === 'ABSENT' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' :
                                        status === 'LATE' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-slate-500 text-white')
                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                  }`}
                              >
                                {status === 'PRESENT' ? 'Présent' : status === 'ABSENT' ? 'Absent' : status === 'LATE' ? 'Retard' : 'Excusé'}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] flex items-center justify-center text-slate-400 font-bold p-10 text-center">
              Veuillez sélectionner un groupe pour charger la liste des étudiants.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
