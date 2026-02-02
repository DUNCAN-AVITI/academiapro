import React, { useEffect, useState } from 'react';
import { useAcademic } from '../App';
import { UserRole, Subject, FileMetadata } from '../types';
import { resourceService, submissionService } from '../services/academic'; // Assuming resourceService is there
import { subjectService } from '../services/core';
import { fileService } from '../services/file';

export default function ResourcesPage() {
  const { currentUser, refreshState } = useAcademic();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [description, setDescription] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [resourceFile, setResourceFile] = useState<FileMetadata | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    try {
      const [res, sub] = await Promise.all([
        resourceService.getAll(),
        subjectService.getAll()
      ]);
      setResources(res);
      setSubjects(sub);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role !== UserRole.TEACHER) return;

    try {
      await resourceService.create({
        title, subjectId, description,
        teacherId: currentUser.id, // Should check if user is teacher
        fileId: resourceFile?.id
      });
      setShowAdd(false);
      refreshState();
      setTitle(''); setDescription(''); setResourceFile(null);
      fetchData();
      alert("Ressource publiée avec succès !");
    } catch (e) { alert("Erreur création"); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      const metadata = await fileService.upload(file);
      setResourceFile(metadata);
    } catch (e) { alert("Erreur upload"); }
    setIsProcessing(false);
  };

  const handleDownload = (fileId: string) => {
    setDownloading(fileId);
    fileService.download(fileId, "Ressource.pdf"); // Name approx
    setTimeout(() => setDownloading(null), 1000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Espace Ressources</h2>
          <p className="text-slate-500 mt-1 font-medium">Supports de cours et documentations pédagogiques sécurisées.</p>
        </div>
        {currentUser?.role === UserRole.TEACHER && (
          <button onClick={() => setShowAdd(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all flex items-center gap-2">
            <i className="fa-solid fa-cloud-arrow-up"></i> Partager un cours
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <i className="fa-solid fa-folder-open text-6xl text-slate-200 mb-6"></i>
            <p className="text-slate-500 font-bold">Aucune ressource disponible pour le moment.</p>
          </div>
        ) : resources.map((res: any) => {
          const sub = subjects.find((s: any) => s.id === res.subjectId);
          return (
            <div key={res.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <i className="fa-solid fa-file-pdf"></i>
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full">{sub?.name || 'Général'}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{res.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-6">{res.description}</p>
              <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(res.createdAt).toLocaleDateString()}</span>
                <button
                  onClick={() => handleDownload(res.fileId)}
                  disabled={downloading === res.fileId}
                  className="text-indigo-600 font-black text-sm hover:underline flex items-center gap-2 disabled:opacity-50"
                >
                  {downloading === res.fileId ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-download"></i>}
                  Télécharger
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200">
            <div className="p-10 bg-indigo-600 text-white">
              <h3 className="text-2xl font-black">Publier une ressource</h3>
              <p className="text-indigo-100 text-sm mt-1">Les étudiants autorisés recevront une notification.</p>
            </div>
            <form onSubmit={handleAdd} className="p-10 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Titre du document</label>
                <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" placeholder="ex: Support de cours - Chapitre 2" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Matière</label>
                  <select required value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none">
                    <option value="">Sélection...</option>
                    {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Fichier</label>
                  <div className="w-full px-5 py-4 bg-emerald-50 border-2 border-dashed border-emerald-200 text-emerald-600 rounded-2xl text-center text-xs font-bold cursor-pointer hover:bg-emerald-100 relative">
                    {resourceFile ? (
                      <span>{resourceFile.name}</span>
                    ) : (
                      <span>
                        {isProcessing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-cloud-arrow-up mr-2"></i>}
                        Importer
                      </span>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none" placeholder="Précisez le contenu..." />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all">Annuler</button>
                <button type="submit" disabled={isProcessing} className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all">Publier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
