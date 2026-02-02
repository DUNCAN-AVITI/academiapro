import React, { useState, useRef, useEffect } from 'react';
import { useAcademic } from '../App';
import { SubmissionStatus, FileMetadata, Submission } from '../types';
import { submissionService } from '../services/academic';
import { fileService } from '../services/file';

export default function SubmissionsPage() {
  const { currentUser, refreshState } = useAcademic();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [grade, setGrade] = useState('');
  const [comment, setComment] = useState('');
  const [correctionFile, setCorrectionFile] = useState<FileMetadata | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const correctionInputRef = useRef<HTMLInputElement>(null);

  // Helper to check role
  const isTeacher = currentUser?.role === 'TEACHER';

  const fetchData = async () => {
    try {
      const subs = await submissionService.getAll();
      setSubmissions(subs);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleDownload = (fileId: string, fileName: string) => {
    fileService.download(fileId, fileName);
  };

  const handleCorrectionFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return alert("Taille max 5Mo.");

    setIsProcessing(true);
    try {
      const metadata = await fileService.upload(file);
      setCorrectionFile(metadata);
      setIsProcessing(false);
    } catch (err) { setIsProcessing(false); alert("Erreur upload"); }
  };

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    try {
      await submissionService.grade(selectedSubmission.id, {
        grade: parseFloat(grade),
        comment,
        correctionFileId: correctionFile?.id
      });
      setSelectedSubmission(null); setGrade(''); setComment(''); setCorrectionFile(null);
      refreshState();
      fetchData();
      alert("Note publiée et versionnée.");
    } catch (err) { alert("Erreur notation"); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Centre d'Évaluation</h2>
          <p className="text-slate-500 font-medium">Notation sécurisée, versioning des rendus et anti-plagiat.</p>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-8 py-5">Candidat & Version</th>
              <th className="px-8 py-5">Devoir</th>
              <th className="px-8 py-5">Plagiat (Hash)</th>
              <th className="px-8 py-5">Note Actuelle</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {submissions.map((sub: any) => {
              const studentUser = sub.student?.user;
              const assignment = sub.assignment;
              const isPlagiarized = (sub.plagiarismScore || 0) > 0;

              return (
                <tr key={sub.id} className={`hover:bg-slate-50 transition-colors ${isPlagiarized ? 'bg-rose-50/30' : ''}`}>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs">v{sub.version}</div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{studentUser?.firstName} {studentUser?.lastName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dernier rendu : {new Date(sub.submittedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5"><p className="text-sm font-bold text-slate-700">{assignment?.title}</p></td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest border ${isPlagiarized ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                      {isPlagiarized ? `Alerte Plagiat !` : 'Négatif'}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-lg font-black text-slate-900">{sub.grade !== null && sub.grade !== undefined ? `${sub.grade}/20` : '-'}</span>
                  </td>
                  <td className="px-8 py-5 text-right space-y-2">
                    {sub.fileIds && sub.fileIds.map((fId: string, idx: number) => (
                      <div key={fId} className="flex justify-end gap-2">
                        <span className="text-[10px] font-bold text-slate-400 self-center">Fich. {idx + 1}</span>
                        <button onClick={() => handleDownload(fId, `document_${idx + 1}`)} className="p-2 bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all text-xs">
                          <i className="fa-solid fa-cloud-arrow-down"></i>
                        </button>
                      </div>
                    ))}
                    {isTeacher && (
                      <div className="mt-4">
                        <button onClick={() => setSelectedSubmission(sub)} className="px-5 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all">
                          {sub.status === SubmissionStatus.GRADED ? 'Modifier' : 'Noter'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selectedSubmission && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-widest">Évaluation v{selectedSubmission.version}</h3>
              </div>
              <button onClick={() => setSelectedSubmission(null)} className="text-slate-400 hover:text-white"><i className="fa-solid fa-xmark text-2xl"></i></button>
            </div>
            <form onSubmit={handleGrade} className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Note (/20)</label>
                  <input type="number" step="0.5" min="0" max="20" required value={grade} onChange={e => setGrade(e.target.value)} className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-500/10 text-2xl font-black text-center" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Copie Corrigée</label>
                  <input type="file" ref={correctionInputRef} className="hidden" onChange={handleCorrectionFile} />
                  {correctionFile ? (
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                      <i className="fa-solid fa-file-circle-check text-emerald-600"></i>
                      <span className="text-[10px] font-bold text-emerald-800 truncate">{correctionFile.name}</span>
                    </div>
                  ) : (
                    <button type="button" onClick={() => correctionInputRef.current?.click()} className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-all h-[72px]">
                      {isProcessing ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-paperclip mr-2"></i>}
                      Correction Signée
                    </button>
                  )}
                </div>
              </div>
              <textarea rows={4} required value={comment} onChange={e => setComment(e.target.value)} className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl outline-none" placeholder="Feedback pédagogique détaillé..." />
              <button type="submit" className="w-full py-6 bg-indigo-600 text-white font-black rounded-3xl shadow-2xl hover:bg-indigo-700 transition-all">
                Publier l'Évaluation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
