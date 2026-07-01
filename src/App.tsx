import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserRole } from './types/db';
import DashboardLayout from './components/DashboardLayout';
import AdminViews from './components/AdminViews';
import TeacherViews from './components/TeacherViews';
import StudentViews from './components/StudentViews';
import ParentViews from './components/ParentViews';
import AuthScreens from './components/AuthScreens';
import { RefreshCw } from 'lucide-react';

function MainAppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('');

  // Auto-route active tab when logged-in user role changes or logs out
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case UserRole.ADMIN:
          setActiveTab('admin-overview');
          break;
        case UserRole.TEACHER:
          setActiveTab('teacher-dashboard');
          break;
        case UserRole.STUDENT:
          setActiveTab('student-dashboard');
          break;
        case UserRole.PARENT:
          setActiveTab('parent-dashboard');
          break;
        default:
          setActiveTab('');
      }
    } else {
      setActiveTab('');
    }
  }, [user]);

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center font-sans">
        <div className="bg-rose-500 text-white p-4 rounded-3xl font-black text-2xl tracking-widest shadow-xl shadow-rose-500/20 mb-6 animate-pulse">
          SMS
        </div>
        <div className="flex items-center gap-2 text-slate-400 font-mono text-xs">
          <RefreshCw className="animate-spin text-rose-500" size={16} />
          <span>Synchronizing academia databases...</span>
        </div>
      </div>
    );
  }

  // Guest Router
  if (!user) {
    return <AuthScreens />;
  }

  // Authenticated Dashboard Router
  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {user.role === UserRole.ADMIN && <AdminViews activeTab={activeTab} />}
      {user.role === UserRole.TEACHER && <TeacherViews activeTab={activeTab} />}
      {user.role === UserRole.STUDENT && <StudentViews activeTab={activeTab} />}
      {user.role === UserRole.PARENT && <ParentViews activeTab={activeTab} />}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
