import React, { useRef, useState, useEffect } from 'react';
import { useAcademic } from '../App';
import { UserRole } from '../types';
import { submissionService, assignmentService } from '../services/academic';
import { subjectService } from '../services/core';

const SecurityWatermark = ({ studentName, studentId }: { studentName: string, studentId: string }) => {
  const timestamp = new Date().toLocaleString('fr-FR');
  const watermarkText = `ACADEMIAPRO SECURE • ${studentName.toUpperCase()} • ID: ${studentId.substring(0, 8)} • ${timestamp} `;

  return (
    <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden select-none z-0 flex flex-wrap justify-center items-center gap-x-20 gap-y-32 rotate-[-30deg] scale-150">
      {Array.from({ length: 40 }).map((_, i) => (
        <span key={i} className="text-sm font-black uppercase whitespace-nowrap tracking-widest">
          {watermarkText}
        </span>
      ))}
    </div>
  );
};

export default function TranscriptPage() {
  const { currentUser } = useAcademic();
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [transcriptData, setTranscriptData] = useState<any>(null);

  const isStudent = currentUser?.role === UserRole.STUDENT;

  useEffect(() => {
    if (!isStudent) return;

    const fetchData = async () => {
      try {
        const [submissions, assignments, subjects] = await Promise.all([
          submissionService.getAll(),
          assignmentService.getAll(),
          subjectService.getAll()
        ]);

        // Calculate Transcript
        const transcript = subjects.map(sub => {
          const subAssignments = assignments.filter(a => a.subjectId === sub.id);
          const subSubmissions = submissions.filter(s =>
            subAssignments.some(a => a.id === s.assignmentId) &&
            s.status === 'GRADED' &&
            s.grade !== null
          );

          const total = subSubmissions.reduce((acc, curr) => acc + (curr.grade || 0), 0);
          const avg = subSubmissions.length > 0 ? total / subSubmissions.length : null;

          return {
            subjectId: sub.id,
            subjectName: sub.name,
            subjectCode: sub.code,
            coefficient: sub.coefficient,
            average: avg,
            gradesCount: subSubmissions.length
          };
        }).filter(t => t.gradesCount > 0); // Only show subjects with grades? Or all? Usually all. 

        // Helper: Global average
        let totalPoints = 0;
        let totalCoeff = 0;

        transcript.forEach(t => {
          if (t.average !== null) {
            totalPoints += t.average * t.coefficient;
            totalCoeff += t.coefficient;
          }
        });

        const globalAverage = totalCoeff > 0 ? (totalPoints / totalCoeff).toFixed(2) : '--';
        setTranscriptData({ transcript, globalAverage });

      } catch (e) { console.error(e); }
    };

    fetchData();
  }, [currentUser]);

  if (!isStudent) return <div className="p-20 text-center">Accès réservé aux étudiants.</div>;

  const handleExportPDF = async () => {
    if (!transcriptRef.current) return;
    setIsExporting(true);
    const element = transcriptRef.current;

    // Simplistic PDF export trigger (assumes html2pdf available globally as in original)
    try {
      // @ts-ignore 
      if (window.html2pdf) {
        const opt = {
          margin: [10, 10, 10, 10],
          filename: `Relevé_Notes_${currentUser?.lastName}_${new Date().getFullYear()}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        // @ts-ignore
        await window.html2pdf().set(opt).from(element).save();
      } else {
        window.print();
      }
    } catch (error) {
      alert("Erreur PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">

      <div ref={transcriptRef} className="relative bg-white rounded-[50px] shadow-sm border border-slate-100 overflow-hidden">

        <SecurityWatermark
          studentName={`${currentUser?.firstName} ${currentUser?.lastName}`}
          studentId={currentUser?.id || 'ANONYMOUS'}
        />

        <div className="relative z-10 p-12 space-y-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-b border-slate-100 pb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                  <i className="fa-solid fa-file-invoice text-xl"></i>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Document Officiel Académique</span>
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Relevé de Notes <span className="text-indigo-600">S1</span></h2>
              <div className="mt-4 space-y-1">
                <p className="text-slate-800 font-bold text-lg">{currentUser?.firstName} {currentUser?.lastName}</p>
                <p className="text-slate-500 text-sm font-medium">Numero Etudiant : {currentUser?.id.substring(0, 12)}</p>
                <p className="text-slate-500 text-sm font-medium">Session : {new Date().getFullYear()} / {new Date().getFullYear() + 1}</p>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-8 rounded-[40px] text-center min-w-[220px] shadow-2xl">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Moyenne Générale</p>
              <p className="text-5xl font-black">{transcriptData?.globalAverage || '--'}<span className="text-sm text-slate-500 ml-1">/20</span></p>
              <div className="mt-4 pt-4 border-t border-white/10">
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${Number(transcriptData?.globalAverage) >= 10 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {Number(transcriptData?.globalAverage) >= 10 ? 'Admis' : 'En attente'}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="pb-6">Matière & Code</th>
                  <th className="pb-6 text-center">Coeff.</th>
                  <th className="pb-6 text-center">Évals</th>
                  <th className="pb-6 text-right">Moyenne /20</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transcriptData?.transcript.map((row: any) => (
                  <tr key={row.subjectId} className="group">
                    <td className="py-8">
                      <p className="font-black text-slate-800 text-lg">{row.subjectName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{row.subjectCode}</p>
                    </td>
                    <td className="py-8 text-center">
                      <span className="text-sm font-bold text-slate-600">{row.coefficient}</span>
                    </td>
                    <td className="py-8 text-center text-sm font-medium text-slate-500">
                      {row.gradesCount}
                    </td>
                    <td className="py-8 text-right">
                      <span className={`text-xl font-black ${row.average >= 10 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {row.average !== null ? row.average.toFixed(2) : '--'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(!transcriptData || transcriptData.transcript.length === 0) && (
              <div className="py-32 text-center text-slate-300">
                <i className="fa-solid fa-graduation-cap text-6xl mb-4 opacity-10"></i>
                <p className="font-bold">Aucune note n'a encore été enregistrée.</p>
              </div>
            )}
          </div>

          <div className="pt-12 mt-12 border-t border-slate-100 flex justify-between items-end">
            <div className="text-[10px] text-slate-400 font-medium max-w-xs leading-relaxed">
              <p className="font-black uppercase mb-1">Authenticité du Document</p>
              <p>Ce relevé est généré automatiquement par AcademiaPro. Toute modification manuelle rend ce document nul et non avenu.</p>
              <p className="mt-2 text-indigo-400">Certificat ID: {Math.random().toString(36).substring(2, 15).toUpperCase()}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase text-slate-400 mb-8">Cachet de l'Établissement</p>
              <div className="w-32 h-32 border-4 border-indigo-600/20 rounded-full flex items-center justify-center rotate-[-15deg] mx-auto">
                <div className="text-indigo-600/30 text-center font-black leading-none">
                  <p className="text-[10px]">ACADEMIAPRO</p>
                  <p className="text-[8px] mt-1">SÉCURISÉ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
        <p className="text-xs text-slate-500 font-medium">
          <i className="fa-solid fa-circle-info text-indigo-500 mr-2"></i>
          Le filigrane de sécurité est incrusté automatiquement lors de l'exportation.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => window.print()}
            className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-3"
          >
            <i className="fa-solid fa-print"></i> Imprimer
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i> Génération...
              </>
            ) : (
              <>
                <i className="fa-solid fa-file-pdf"></i> Exporter en PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
