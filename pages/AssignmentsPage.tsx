import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAcademic } from '../App';
import { UserRole, SubmissionStatus, Assignment, FileMetadata, Subject, Group } from '../types';
import { assignmentService, submissionService } from '../services/academic';
import { groupService, subjectService } from '../services/core';
import { fileService } from '../services/file';

export default function AssignmentsPage() {
  const { currentUser, refreshState } = useAcademic();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [groupId, setGroupId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [statementFile, setStatementFile] = useState<FileMetadata | null>(null);

  const [selectedAsgId, setSelectedAsgId] = useState<string | null>(null);
  const selectedAsgIdRef = useRef<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const studentFileInputRef = useRef<HTMLInputElement>(null);

  // Extended user type for easier access
  const isStudent = currentUser?.role === UserRole.STUDENT;
  const isTeacher = currentUser?.role === UserRole.TEACHER;
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const fetchData = async () => {
    console.log("AssignmentsPage: Fetching data for user role:", currentUser?.role);
    try {
      const [asgs, subs, grps, subjs] = await Promise.all([
        assignmentService.getAll(),
        submissionService.getAll(),
        groupService.getAll(),
        subjectService.getAll()
      ]);
      setAssignments(asgs);
      setSubmissions(subs);
      setGroups(grps);
      setSubjects(subjs);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const openEditModal = (asg: Assignment) => {
    setEditingAssignment(asg);
    setTitle(asg.title);
    setDescription(asg.description);
    setDeadline(asg.deadline ? new Date(asg.deadline).toISOString().substring(0, 16) : '');
    setGroupId(asg.groupId);
    setSubjectId(asg.subjectId);
    setStatementFile(null);
    setShowCreateModal(true);
  };

  const handleDownload = (fileId: string, fileName: string) => {
    fileService.download(fileId, fileName);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'STATEMENT' | 'SUBMISSION') => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      console.log("No files selected");
      return;
    }

    // Check total size or per file size
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > 10 * 1024 * 1024) return alert(`Le fichier ${files[i].name} dépasse la limite de 10Mo.`);
    }

    const idToUse = type === 'SUBMISSION' ? selectedAsgIdRef.current : undefined;
    console.log("idToUse for submission:", idToUse);

    setIsProcessing(true);
    try {
      if (type === 'STATEMENT') {
        const metadata = await fileService.upload(files[0]); // Only one statement
        setStatementFile(metadata);
      } else if (type === 'SUBMISSION' && idToUse) {
        const uploadPromises = (Array.from(files) as File[]).map(f => fileService.upload(f));
        const uploadedMetadatas = await Promise.all(uploadPromises);

        await submissionService.submit({
          assignmentId: idToUse,
          fileIds: uploadedMetadatas.map(m => m.id),
          comment: ""
        });
        refreshState();
        fetchData();
        alert("Travail transmis !");
      } else if (type === 'SUBMISSION' && !idToUse) {
        console.warn("Attempted submission WITHOUT assignment ID!");
        alert("Erreur interne : Devoir non identifié.");
      }
      setIsProcessing(false);
      e.target.value = ''; // Reset
    } catch (err: any) {
      setIsProcessing(false);
      e.target.value = '';
      alert("Erreur upload: " + (err.message || "Inconnue"));
    }
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAssignment) {
        await assignmentService.update(editingAssignment.id, {
          title,
          description,
          deadline: new Date(deadline),
          groupId,
          subjectId,
          allowedFormats: ['pdf', 'zip', 'rar', 'docx', 'doc', '7z'],
          maxSizeMB: 50,
        });
        alert("Devoir mis à jour !");
      } else {
        await assignmentService.create({
          title,
          description,
          deadline: new Date(deadline),
          groupId,
          subjectId,
          allowedFormats: ['pdf', 'zip', 'rar', 'docx', 'doc', '7z'],
          maxSizeMB: 50,
          statementFileId: statementFile?.id
        });
        alert("Devoir publié !");
      }
      closeModal();
      refreshState();
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (window.confirm("Supprimer ce devoir et tous les rendus associés ?")) {
      try {
        await assignmentService.delete(id);
        fetchData();
        refreshState();
        alert("Devoir supprimé.");
      } catch (err) { alert("Erreur suppression"); }
    }
  };

  const closeModal = () => { setShowCreateModal(false); setEditingAssignment(null); setTitle(''); setDescription(''); setDeadline(''); setGroupId(''); setSubjectId(''); setStatementFile(null); };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Gestion des Travaux</h2>
          <p className="text-slate-500 font-medium">Accès sécurisé aux énoncés et rendu des copies.</p>
        </div>
        {(isTeacher || isAdmin) && (
          <button onClick={() => setShowCreateModal(true)} className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all">Publier un Devoir</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {assignments.map((asg: any) => {
          const submission = submissions.find((s: any) => s.assignmentId === asg.id && s.studentId === (currentUser as any)?.student?.id);
          const deadlineDate = new Date(asg.deadline);
          const isLate = new Date() > deadlineDate;

          return (
            <div key={asg.id} className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-indigo-200 transition-all">
              <div className="p-8">
                <h3 className="font-black text-slate-800 text-xl mb-3">{asg.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-3 mb-6">{asg.description}</p>
                <div className="flex items-center gap-3 text-xs font-black text-slate-500 bg-slate-50 p-3 rounded-2xl">
                  <i className={`fa-solid fa-clock ${isLate && !submission ? 'text-rose-500' : 'text-indigo-500'}`}></i>
                  <span>Limite : {deadlineDate.toLocaleString()}</span>
                </div>
              </div>

              <div className="px-8 pb-8 mt-auto space-y-4">
                {asg.statementFileId && (
                  <button onClick={() => handleDownload(asg.statementFileId, 'Enonce.pdf')} className="w-full py-3 bg-white text-indigo-600 text-[10px] font-black uppercase rounded-xl border-2 border-indigo-100 hover:bg-indigo-50 transition-all">
                    <i className="fa-solid fa-file-download mr-2"></i> Télécharger l'énoncé
                  </button>
                )}

                {submission?.grade !== undefined && (
                  <div className="mt-4 p-6 bg-slate-900 text-white rounded-[32px]">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">NOTE</p>
                    <p className="text-4xl font-black">{submission.grade}/20</p>
                    {submission.correctionFileId && (
                      <button onClick={() => handleDownload(submission.correctionFileId, 'Correction.pdf')} className="mt-4 text-[10px] font-black text-emerald-400 uppercase">
                        <i className="fa-solid fa-file-signature"></i> Voir Correction
                      </button>
                    )}
                  </div>
                )}

                {(isTeacher || isAdmin) && (
                  <div className="flex gap-4">
                    <button onClick={() => openEditModal(asg)} className="flex-1 py-3 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                      <i className="fa-solid fa-pen-to-square mr-2"></i> Modifier
                    </button>
                    <button onClick={() => handleDeleteAssignment(asg.id)} className="flex-1 py-3 bg-rose-50 text-rose-600 text-[10px] font-black uppercase rounded-xl hover:bg-rose-100 transition-all">
                      <i className="fa-solid fa-trash mr-2"></i> Supprimer
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100">
                {isStudent && !submission?.grade && (
                  <div className="relative">
                    <button
                      disabled={isProcessing}
                      onClick={() => {
                        console.log("Submit button clicked for assignment:", asg.id);
                        setSelectedAsgId(asg.id);
                        selectedAsgIdRef.current = asg.id;
                        studentFileInputRef.current?.click();
                      }}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-600 transition-all disabled:opacity-30"
                    >
                      {isProcessing && selectedAsgId === asg.id ? "Signature..." : "Soumettre mon travail"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <input
        type="file"
        multiple
        className="hidden"
        ref={studentFileInputRef}
        onChange={(e) => handleFileChange(e, 'SUBMISSION')}
        aria-label="Sélectionner les fichiers pour la soumission"
      />

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[200] p-4">
          <div className="bg-white p-10 rounded-[48px] w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-black text-slate-800">Nouveau Devoir</h3>
              <button onClick={closeModal} className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center" aria-label="Fermer la fenêtre"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <form onSubmit={handleSaveAssignment} className="space-y-6">
              <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl font-bold" placeholder="Titre" />
              <textarea required rows={4} value={description} onChange={e => setDescription(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl" placeholder="Consignes..." />
              <div className="grid grid-cols-2 gap-6">
                <select required value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl font-bold" aria-label="Sélectionner la matière">
                  <option value="">Matière...</option>
                  {subjects.map((s: Subject) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select required value={groupId} onChange={e => setGroupId(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl font-bold" aria-label="Sélectionner le groupe">
                  <option value="">Groupe...</option>
                  {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <input type="datetime-local" required value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-3xl font-bold" aria-label="Date limite du devoir" />
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50/50 text-center">
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'STATEMENT')} accept=".pdf" aria-label="Sélectionner le fichier énoncé" />
                {statementFile ? <p className="text-emerald-600 font-bold">{statementFile.name}</p> : <button type="button" onClick={() => fileInputRef.current?.click()} className="text-slate-400 font-black uppercase text-xs">Attacher l'énoncé (PDF)</button>}
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-3xl shadow-2xl hover:bg-indigo-700">PUBLIER LE DEVOIR</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
