import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { User, UserRole, AcademicContextType, AppNotification } from './types';
import { authService } from './services/auth';
import { notificationApi } from './services/api';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import AssignmentsPage from './pages/AssignmentsPage';
import SubmissionsPage from './pages/SubmissionsPage';
import AuditPage from './pages/AuditPage';
import ResourcesPage from './pages/ResourcesPage';
import MessagingPage from './pages/MessagingPage';
import AttendancePage from './pages/AttendancePage';
import MailboxPage from './pages/MailboxPage';
import TranscriptPage from './pages/TranscriptPage';

// Note: db is removed. Components must fetch data via services.
const AcademicContext = createContext<AcademicContextType | null>(null);

export const useAcademic = () => {
  const context = useContext(AcademicContext);
  if (!context) throw new Error("useAcademic must be used within Provider");
  return context;
};

const PrivateRoute: React.FC<{ children: React.ReactNode, roles?: UserRole[] }> = ({ children, roles }) => {
  const { currentUser } = useAcademic();
  const location = useLocation();
  if (!currentUser) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(currentUser.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout, notifications, markNotificationAsRead, clearAllNotifications } = useAcademic();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  // TODO: Add endpoint for unread emails count
  const unreadEmails = 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menu = [
    { label: 'Tableau de bord', path: '/dashboard', icon: 'fa-house', roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT] },
    { label: 'E-mails Système', path: '/mailbox', icon: 'fa-at', roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT], count: unreadEmails },
    { label: 'Mon Relevé', path: '/transcript', icon: 'fa-file-invoice', roles: [UserRole.STUDENT] },
    { label: 'Devoirs', path: '/assignments', icon: 'fa-book', roles: [UserRole.TEACHER, UserRole.STUDENT] },
    { label: 'Appel / Présences', path: '/attendance', icon: 'fa-user-check', roles: [UserRole.TEACHER] },
    { label: 'Ressources', path: '/resources', icon: 'fa-folder-open', roles: [UserRole.TEACHER, UserRole.STUDENT] },
    { label: 'Messagerie', path: '/messages', icon: 'fa-envelope', roles: [UserRole.TEACHER, UserRole.STUDENT, UserRole.ADMIN] },
    { label: 'Corrections', path: '/grading', icon: 'fa-check-to-slot', roles: [UserRole.TEACHER] },
    { label: 'Administration', path: '/admin', icon: 'fa-shield-halved', roles: [UserRole.ADMIN] },
    { label: 'Sécurité Audit', path: '/audit', icon: 'fa-fingerprint', roles: [UserRole.ADMIN] },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <aside className="w-full md:w-72 bg-slate-900 text-slate-300 flex flex-col z-50">
        <div className="p-8 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
              <i className="fa-solid fa-graduation-cap text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tighter">AcademiaPro</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enterprise Edition</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menu.filter(m => m.roles.includes(currentUser?.role as UserRole)).map(m => (
            <Link key={m.path} to={m.path} className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all relative ${location.pathname === m.path ? 'bg-indigo-600 text-white shadow-xl' : 'hover:bg-slate-800'}`}>
              <i className={`fa-solid ${m.icon} w-5 text-center text-lg`}></i>
              <span className="font-semibold">{m.label}</span>
              {m.count !== undefined && m.count > 0 && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-emerald-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">{m.count}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="p-6 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-indigo-400">
              {currentUser?.firstName[0]}{currentUser?.lastName[0]}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white truncate">{currentUser?.firstName}</p>
              <p className="text-[10px] text-slate-500 uppercase font-black">{currentUser?.role}</p>
            </div>
            <button onClick={logout} className="text-slate-500 hover:text-rose-400" aria-label="Déconnexion"><i className="fa-solid fa-power-off"></i></button>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-slate-400"><i className="fa-solid fa-search"></i><input className="bg-transparent border-none outline-none text-sm w-64" placeholder="Rechercher..." /></div>
          <div className="flex items-center gap-6 relative" ref={dropdownRef}>
            <Link to="/mailbox" className="p-2.5 bg-slate-50 rounded-full text-slate-400 hover:text-indigo-600 transition-colors relative">
              <i className="fa-solid fa-at text-xl"></i>
              {unreadEmails > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">{unreadEmails}</span>}
            </Link>
            <button onClick={() => setNotifOpen(!notifOpen)} className="p-2.5 bg-slate-50 rounded-full text-slate-400 hover:text-indigo-600 transition-colors relative">
              <i className="fa-solid fa-bell text-xl"></i>
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white">{unreadCount}</span>}
            </button>

            {/* Notifications Dropdown */}
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[100] animate-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                  <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">Notifications</h4>
                  <button onClick={clearAllNotifications} className="text-[10px] font-black text-indigo-600 hover:underline uppercase">Tout effacer</button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center text-slate-300">
                      <i className="fa-solid fa-bell-slash text-2xl mb-2 opacity-20"></i>
                      <p className="text-[10px] font-bold uppercase">Aucune notification</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} onClick={() => markNotificationAsRead(n.id)} className={`p-4 border-b border-slate-50 cursor-pointer transition-colors ${n.isRead ? 'opacity-60' : 'bg-indigo-50/30 hover:bg-indigo-50/50'}`}>
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.type === 'GRADING' ? 'bg-emerald-100 text-emerald-600' :
                            n.type === 'REMINDER' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                            }`}>
                            <i className={`fa-solid ${n.type === 'GRADING' ? 'fa-check-to-slot' :
                              n.type === 'REMINDER' ? 'fa-clock' : 'fa-circle-info'
                              } text-xs`}></i>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-800 truncate">{n.title}</p>
                            <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                            <p className="text-[8px] text-slate-300 font-bold mt-2 uppercase">{new Date(n.createdAt).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </header>
        <section className="flex-1 overflow-y-auto p-8 bg-slate-50/50">{children}</section>
      </main>
    </div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [tick, setTick] = useState(0);

  const refreshState = () => setTick(t => t + 1);
  const initialized = useRef(false);

  // Initial Sync on Mount
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const token = localStorage.getItem('token');
      if (token) {
        console.log("App: Token found, performing initial sync...");
        authService.fetchMe().then(user => {
          if (user) {
            setCurrentUser(user);
            console.log("App: Sync successful, role:", user.role);
          }
        }).catch(e => {
          console.error("App: Sync failed", e);
          logout();
        });
      }
    }
  }, []);

  // Sync notifications from API with polling
  useEffect(() => {
    if (currentUser) {
      const fetchNotifs = () => {
        notificationApi.getNotifications(currentUser.id)
          .then(setNotifications)
          .catch(err => {
            console.error("Notification error:", err);
            if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
              console.warn("Session expired or unauthorized, logging out...");
              logout();
            }
          });
      };

      fetchNotifs();
      const interval = setInterval(fetchNotifs, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [tick, currentUser]);

  const login = async (e: string, p: string) => {
    try {
      const u = await authService.login(e, p);
      if (u) { setCurrentUser(u); return true; }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const logout = () => { authService.logout(); setCurrentUser(null); };

  const markNotificationAsRead = async (id: string) => {
    await notificationApi.markAsRead(id);
    refreshState();
  };

  const clearAllNotifications = async () => {
    if (currentUser) {
      await notificationApi.clearAll(currentUser.id);
      refreshState();
    }
  };

  return (
    <AcademicContext.Provider value={{ currentUser, login, logout, db: null, notifications, markNotificationAsRead, clearAllNotifications, refreshState }}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={!currentUser ? <LoginPage /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!currentUser ? <RegisterPage /> : <Navigate to="/dashboard" />} />
          <Route path="/forgot-password" element={!currentUser ? <ForgotPasswordPage /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
          <Route path="/mailbox" element={<PrivateRoute><Layout><MailboxPage /></Layout></PrivateRoute>} />
          <Route path="/transcript" element={<PrivateRoute roles={[UserRole.STUDENT]}><Layout><TranscriptPage /></Layout></PrivateRoute>} />
          <Route path="/assignments" element={<PrivateRoute roles={[UserRole.TEACHER, UserRole.STUDENT]}><Layout><AssignmentsPage /></Layout></PrivateRoute>} />
          <Route path="/attendance" element={<PrivateRoute roles={[UserRole.TEACHER]}><Layout><AttendancePage /></Layout></PrivateRoute>} />
          <Route path="/grading" element={<PrivateRoute roles={[UserRole.TEACHER]}><Layout><SubmissionsPage /></Layout></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute roles={[UserRole.ADMIN]}><Layout><AdminPanel /></Layout></PrivateRoute>} />
          <Route path="/audit" element={<PrivateRoute roles={[UserRole.ADMIN]}><Layout><AuditPage /></Layout></PrivateRoute>} />
          <Route path="/resources" element={<PrivateRoute><Layout><ResourcesPage /></Layout></PrivateRoute>} />
          <Route path="/messages" element={<PrivateRoute><Layout><MessagingPage /></Layout></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </HashRouter>
    </AcademicContext.Provider>
  );
}
