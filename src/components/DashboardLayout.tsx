import { useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/db';
import { ApiService } from '../utils/api';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Clock,
  FileText,
  Video,
  Layers,
  TrendingUp,
  CheckSquare,
  Check,
  Trash2,
  BellRing,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
  roles: UserRole[];
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  // Admin items
  { id: 'admin-overview', label: 'Overview Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN] },
  { id: 'admin-sections', label: 'Manage Sections', icon: Layers, roles: [UserRole.ADMIN] },
  { id: 'admin-students', label: 'Manage Students', icon: Users, roles: [UserRole.ADMIN] },
  { id: 'admin-teachers', label: 'Manage Teachers', icon: GraduationCap, roles: [UserRole.ADMIN] },
  { id: 'admin-parents', label: 'Manage Parents', icon: User, roles: [UserRole.ADMIN] },
  { id: 'admin-courses', label: 'Manage Courses', icon: BookOpen, roles: [UserRole.ADMIN] },
  { id: 'admin-attendance', label: 'Manage Attendance', icon: Clock, roles: [UserRole.ADMIN] },
  { id: 'admin-timetable', label: 'Manage Timetables', icon: Calendar, roles: [UserRole.ADMIN] },
  { id: 'admin-library', label: 'Library Analytics', icon: TrendingUp, roles: [UserRole.ADMIN] },
  { id: 'admin-live', label: 'Live Analytics', icon: Video, roles: [UserRole.ADMIN] },
  { id: 'admin-reports', label: 'Academic Reports', icon: FileText, roles: [UserRole.ADMIN] },
  { id: 'admin-settings', label: 'System Settings', icon: Settings, roles: [UserRole.ADMIN] },

  // Teacher items
  { id: 'teacher-dashboard', label: 'Teacher Dashboard', icon: LayoutDashboard, roles: [UserRole.TEACHER] },
  { id: 'teacher-assignments', label: 'Assignments', icon: CheckSquare, roles: [UserRole.TEACHER] },
  { id: 'teacher-live', label: 'Live Sessions', icon: Video, roles: [UserRole.TEACHER] },
  { id: 'teacher-attendance', label: 'Record Attendance', icon: Clock, roles: [UserRole.TEACHER] },
  { id: 'teacher-grades', label: 'Manage Grades', icon: FileText, roles: [UserRole.TEACHER] },
  { id: 'teacher-students', label: 'View Students', icon: Users, roles: [UserRole.TEACHER] },

  // Student items
  { id: 'student-dashboard', label: 'Student Dashboard', icon: LayoutDashboard, roles: [UserRole.STUDENT] },
  { id: 'student-assignments', label: 'Assignments', icon: CheckSquare, roles: [UserRole.STUDENT] },
  { id: 'student-library', label: 'Digital Library', icon: BookOpen, roles: [UserRole.STUDENT] },
  { id: 'student-live', label: 'Live Classrooms', icon: Video, roles: [UserRole.STUDENT] },
  { id: 'student-grades', label: 'My Report Card', icon: FileText, roles: [UserRole.STUDENT] },
  { id: 'student-attendance', label: 'My Attendance', icon: Clock, roles: [UserRole.STUDENT] },
  { id: 'student-timetable', label: 'My Timetable', icon: Calendar, roles: [UserRole.STUDENT] },
  { id: 'student-announcements', label: 'Announcements', icon: Bell, roles: [UserRole.STUDENT] },

  // Parent items
  { id: 'parent-dashboard', label: 'Parent Dashboard', icon: LayoutDashboard, roles: [UserRole.PARENT] },
  { id: 'parent-grades', label: 'Academic Performance', icon: FileText, roles: [UserRole.PARENT] },
  { id: 'parent-attendance', label: 'Child Attendance', icon: Clock, roles: [UserRole.PARENT] },
  { id: 'parent-notifications', label: 'Notifications', icon: Bell, roles: [UserRole.PARENT] }
];

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function DashboardLayout({ children, activeTab, setActiveTab }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showCenter, setShowCenter] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`read_notif_${user?.id}`) || '[]');
    } catch (_) {
      return [];
    }
  });
  const [delIds, setDelIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`del_notif_${user?.id}`) || '[]');
    } catch (_) {
      return [];
    }
  });

  const [toasts, setToasts] = useState<any[]>([]);
  const [processedNotifIds, setProcessedNotifIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`processed_notif_${user?.id}`) || '[]');
    } catch (_) {
      return [];
    }
  });

  const loadNotifications = async () => {
    try {
      const data = await ApiService.get('/notifications');
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Track userNotifications to trigger toasts for new items
  useEffect(() => {
    if (user && userNotifications.length > 0) {
      const isFirstLoad = processedNotifIds.length === 0;
      const newToasts: any[] = [];
      const updatedProcessed = [...processedNotifIds];
      let changed = false;

      userNotifications.forEach((n: any) => {
        const isRead = readIds.includes(n.notification_id);
        const isProcessed = processedNotifIds.includes(n.notification_id);

        if (!isRead && !isProcessed) {
          // Toast if not the first load, or if it is extremely recent (created within past 2 hours)
          const isRecent = (new Date().getTime() - new Date(n.created_at).getTime()) < 2 * 60 * 60 * 1000;
          if (!isFirstLoad || isRecent) {
            const isGrade = n.title.toLowerCase().includes('grade') || n.message.toLowerCase().includes('grade');
            const isAnnouncement = n.title.toLowerCase().includes('announcement') || n.title.toLowerCase().includes('teacher') || n.message.toLowerCase().includes('announcement');
            
            newToasts.push({
              id: n.notification_id || `toast-${Math.random().toString(36).substr(2, 9)}`,
              title: n.title,
              message: n.message,
              type: isGrade ? 'GRADE' : isAnnouncement ? 'ANNOUNCEMENT' : 'SYSTEM',
              created_at: n.created_at
            });
          }
          updatedProcessed.push(n.notification_id);
          changed = true;
        }
      });

      if (changed) {
        setProcessedNotifIds(updatedProcessed);
        localStorage.setItem(`processed_notif_${user.id}`, JSON.stringify(updatedProcessed));
        if (newToasts.length > 0) {
          // Limit concurrent toasts
          setToasts(prev => [...prev, ...newToasts].slice(-3));
        }
      }
    }
  }, [notifications, readIds]);

  // Handle toast self-dismissal
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts(prev => prev.filter((_, idx) => idx !== 0));
      }, 5500);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  if (!user) return null;

  // Filter notifications based on role and deletion list
  const userNotifications = notifications.filter((n: any) => {
    if (delIds.includes(n.notification_id)) return false;

    if (n.recipient === 'ALL') return true;
    if (user.role === UserRole.ADMIN && n.recipient === 'ADMIN') return true;
    if (user.role === UserRole.TEACHER && n.recipient === 'TEACHER') return true;
    if (user.role === UserRole.STUDENT && n.recipient === 'STUDENT') return true;
    if (user.role === UserRole.PARENT && n.recipient === 'PARENT') return true;

    return false;
  });

  const filteredNotifications = showHistory 
    ? userNotifications 
    : userNotifications.filter((n: any) => !readIds.includes(n.notification_id));

  const unreadCount = userNotifications.filter((n: any) => !readIds.includes(n.notification_id)).length;

  const markAsRead = (id: string) => {
    const updated = Array.from(new Set([...readIds, id]));
    setReadIds(updated);
    localStorage.setItem(`read_notif_${user.id}`, JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const allIds = userNotifications.map((n: any) => n.notification_id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    localStorage.setItem(`read_notif_${user.id}`, JSON.stringify(updated));
  };

  const deleteNotif = (id: string) => {
    const updated = [...delIds, id];
    setDelIds(updated);
    localStorage.setItem(`del_notif_${user.id}`, JSON.stringify(updated));
  };

  // Filter items based on user role
  const menuItems = SIDEBAR_ITEMS.filter(item => item.roles.includes(user.role));

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'Administrator';
      case UserRole.TEACHER: return 'Teacher Profile';
      case UserRole.STUDENT: return 'Student Portal';
      case UserRole.PARENT: return 'Parent Portal';
      default: return 'User';
    }
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case UserRole.TEACHER: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case UserRole.STUDENT: return 'bg-sky-50 text-sky-700 border-sky-200';
      case UserRole.PARENT: return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans" id="dashboard-container">
      {/* 1. Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shadow-xl fixed h-full z-20">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <div className="bg-indigo-600 text-white p-2 rounded-lg font-bold text-lg tracking-wide shadow-md">
            SMS
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide leading-tight text-white">ACADEMIA</h1>
            <p className="text-xs text-slate-400 font-mono font-medium">MANAGEMENT v1.0</p>
          </div>
        </div>

        {/* User Mini Profile */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/40">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Signed In As</p>
          <p className="font-medium text-sm text-slate-100 truncate mt-1">{user.fullname}</p>
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border mt-2 uppercase tracking-wider ${getRoleBadgeStyle(user.role)}`}>
            {getRoleLabel(user.role)}
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                id={`sidebar-${item.id}`}
                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all group duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/15'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <Icon size={18} className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <button
            onClick={logout}
            id="sidebar-logout"
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-rose-950/30 hover:text-rose-200 transition-colors"
          >
            <LogOut size={18} className="text-slate-400 group-hover:text-rose-300" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* 2. Mobile Sidebar Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black z-30 md:hidden"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-white shadow-2xl z-40 md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-600 text-white px-2 py-1 rounded font-bold text-base shadow">SMS</div>
                  <span className="font-bold text-sm tracking-wider">ACADEMIA</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800">
                  <X size={20} />
                </button>
              </div>

              {/* User Mini Profile */}
              <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/40">
                <p className="font-medium text-slate-100 truncate">{user.fullname}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border mt-2 uppercase tracking-wider ${getRoleBadgeStyle(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
              </div>

              <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {menuItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                      }`}
                    >
                      <Icon size={18} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-800">
                <button
                  onClick={logout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-rose-950/30 hover:text-rose-200 transition-colors"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* 3. Main Frame & Content */}
      <div className="flex-1 flex flex-col md:pl-64">
        {/* Top Header Nav */}
        <header className="sticky top-0 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 z-10 shadow-sm shadow-slate-100">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileOpen(true)}
              id="mobile-menu-trigger"
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Menu size={22} />
            </button>
            <h2 className="font-bold text-slate-800 text-lg md:text-xl tracking-tight uppercase font-mono">
              {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Date Widget */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-600">
              <Clock size={14} className="text-slate-400" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>

            {/* Notification Bell with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowCenter(!showCenter)}
                id="header-notification-bell"
                className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-indigo-600 transition-all focus:outline-none"
              >
                <Bell size={20} className={unreadCount > 0 ? 'animate-pulse text-indigo-500' : ''} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showCenter && (
                  <>
                    {/* Click backdrop to close */}
                    <div className="fixed inset-0 z-40" onClick={() => setShowCenter(false)} />

                    {/* Dropdown panel */}
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2.5 w-80 md:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                      id="notification-center-dropdown"
                    >
                      {/* Header */}
                      <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-xs tracking-wider uppercase font-mono flex items-center gap-1.5">
                            <BellRing size={14} className="text-indigo-400" />
                            Notification Center
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{unreadCount} Unread Alerts</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="text-[9px] font-bold uppercase tracking-wider font-mono bg-slate-800 text-indigo-300 px-2 py-1 rounded border border-slate-700 hover:bg-slate-700 transition-colors"
                          >
                            {showHistory ? 'Hide Read' : 'Show All'}
                          </button>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-[9px] font-bold uppercase tracking-wider font-mono bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-500 transition-colors"
                            >
                              Mark All Read
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Notification List */}
                      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                        {filteredNotifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-400 font-mono flex flex-col items-center gap-2">
                            <Info size={18} className="text-slate-300" />
                            No notifications to display.
                          </div>
                        ) : (
                          filteredNotifications.map((n: any, idx: number) => {
                            const isRead = readIds.includes(n.notification_id);
                            return (
                              <div
                                key={`${n.notification_id || ''}-${idx}`}
                                className={`p-4 hover:bg-slate-50 transition-colors flex gap-3 ${isRead ? 'opacity-65' : ''}`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start gap-2">
                                    <span className="font-bold text-slate-800 text-[11px] leading-tight block">
                                      {n.title}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-mono shrink-0">
                                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                                    {n.message}
                                  </p>
                                  <div className="mt-2 flex justify-between items-center">
                                    <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                                      {n.recipient}
                                    </span>
                                    <div className="flex gap-1.5">
                                      {!isRead && (
                                        <button
                                          onClick={() => markAsRead(n.notification_id)}
                                          title="Mark as Read"
                                          className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                        >
                                          <Check size={10} />
                                        </button>
                                      )}
                                      <button
                                        onClick={() => deleteNotif(n.notification_id)}
                                        title="Delete Alert"
                                        className="p-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors"
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar Trigger */}
            <div className="flex items-center gap-2.5 pl-2">
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold border-2 border-indigo-500/10 shadow-sm text-sm">
                {user.fullname.charAt(0)}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{user.fullname}</p>
                <p className="text-[10px] text-slate-400 font-mono leading-none mt-0.5">{user.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Inner View Content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Toast Notification System */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0 animate-in fade-in slide-in-from-bottom-5" id="global-toasts-container">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-4 flex gap-3 overflow-hidden relative"
              style={{
                borderLeft: toast.type === 'GRADE' ? '4px solid #10b981' : toast.type === 'ANNOUNCEMENT' ? '4px solid #6366f1' : '4px solid #64748b'
              }}
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === 'GRADE' ? (
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <GraduationCap size={18} />
                  </div>
                ) : toast.type === 'ANNOUNCEMENT' ? (
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <BellRing size={18} />
                  </div>
                ) : (
                  <div className="p-1.5 bg-slate-50 text-slate-600 rounded-lg">
                    <Info size={18} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 pr-4 text-left">
                <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono">
                  {toast.type === 'GRADE' ? '🏆 New Grade Published' : toast.type === 'ANNOUNCEMENT' ? '📣 School Announcement' : '🔔 System Update'}
                </p>
                <h4 className="text-[11px] font-bold text-slate-950 leading-tight mt-0.5 truncate">{toast.title}</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-1">{toast.message}</p>
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition-all"
              >
                <X size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
