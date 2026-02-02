import React, { useEffect, useState } from 'react';
import { coreService, userService } from '../services/core';
import { AuditLog } from '../types';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [usersCache, setUsersCache] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [l, u] = await Promise.all([
          coreService.getAuditLogs(),
          userService.getAll()
        ]);
        setLogs(l);
        const uMap = u.reduce((acc: any, curr: any) => { acc[curr.id] = curr; return acc; }, {});
        setUsersCache(uMap);
      } catch (e) { console.error(e); }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Journal d'Audit</h2>
        <p className="text-slate-500">Traçabilité complète des actions critiques effectuées sur la plateforme.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Horodatage</th>
                <th className="px-6 py-4">Utilisateur</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map((log) => {
                const user = usersCache[log.userId];
                return (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700">{user ? `${user.firstName} ${user.lastName}` : 'Inconnu'}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{user?.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${log.action.includes('CREATE') ? 'bg-emerald-100 text-emerald-700' :
                          log.action.includes('LOGIN') ? 'bg-blue-100 text-blue-700' :
                            log.action.includes('DELETE') ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {log.details}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
