import React, { useState, useEffect } from 'react';
import { ApiService } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  StudentDetailed, TeacherDetailed, ParentDetailed, CourseDetailed,
  AttendanceDetailed, TimetableDetailed, PaymentDetailed, Notification,
  UserRole, AttendanceStatus, PaymentStatus, ACADEMIC_GRADES, DEFAULT_SECTIONS
} from '../types/db';
import {
  Users, GraduationCap, User, BookOpen, Clock, Calendar, FileText, Settings,
  Plus, Edit, Trash2, Search, Filter, Check, X, AlertCircle, DollarSign,
  TrendingUp, BarChart2, PieChart as PieIcon, RefreshCw, AlertTriangle, Bell,
  Video, Layers, UploadCloud, Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell
} from 'recharts';

interface AdminViewsProps {
  activeTab: string;
}

export default function AdminViews({ activeTab }: AdminViewsProps) {
  const { user } = useAuth();
  
  // Data States
  const [students, setStudents] = useState<StudentDetailed[]>([]);
  const [teachers, setTeachers] = useState<TeacherDetailed[]>([]);
  const [parents, setParents] = useState<ParentDetailed[]>([]);
  const [courses, setCourses] = useState<CourseDetailed[]>([]);
  const [attendance, setAttendance] = useState<AttendanceDetailed[]>([]);
  const [timetables, setTimetables] = useState<TimetableDetailed[]>([]);
  const [payments, setPayments] = useState<PaymentDetailed[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Advanced feature data states
  const [sections, setSections] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [libraryAnalytics, setLibraryAnalytics] = useState<any>(null);
  const [liveAnalytics, setLiveAnalytics] = useState<any>(null);

  // Section Creator Form Values
  const [newSectionGrade, setNewSectionGrade] = useState('Grade 10');
  const [newSectionLetter, setNewSectionLetter] = useState('C');
  
  // UI & Loading States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  // Modal / Form States
  const [modalType, setModalType] = useState<'student' | 'teacher' | 'parent' | 'course' | 'timetable' | 'payment' | 'notification' | 'book' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form Values
  const [formValues, setFormValues] = useState<any>({});

  // File Upload states for textbooks
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedBookFile, setSelectedBookFile] = useState<File | null>(null);

  // 1. Fetch data when view shifts
  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        studentsData, teachersData, parentsData, coursesData,
        attendanceData, timetablesData, paymentsData, notificationsData,
        sectionsData, booksData, bookmarksData, aiLogsData, camerasData, liveSessionsData,
        libAnalyticsData, liveAnalyticsData
      ] = await Promise.all([
        ApiService.get('/students'),
        ApiService.get('/teachers'),
        ApiService.get('/parents'),
        ApiService.get('/courses'),
        ApiService.get('/attendance'),
        ApiService.get('/timetables'),
        ApiService.get('/payments'),
        ApiService.get('/notifications'),
        ApiService.get('/sections').catch(() => []),
        ApiService.get('/books').catch(() => []),
        ApiService.get('/bookmarks').catch(() => []),
        ApiService.get('/library/ai-logs').catch(() => []),
        ApiService.get('/cameras').catch(() => []),
        ApiService.get('/live-sessions').catch(() => []),
        ApiService.get('/library/analytics').catch(() => null),
        ApiService.get('/live-sessions-analytics').catch(() => null)
      ]);

      setStudents(studentsData);
      setTeachers(teachersData);
      setParents(parentsData);
      setCourses(coursesData);
      setAttendance(attendanceData);
      setTimetables(timetablesData);
      setPayments(paymentsData);
      setNotifications(notificationsData);
      setSections(sectionsData);
      setBooks(booksData);
      setBookmarks(bookmarksData);
      setAiLogs(aiLogsData);
      setCameras(camerasData);
      setLiveSessions(liveSessionsData);
      setLibraryAnalytics(libAnalyticsData);
      setLiveAnalytics(liveAnalyticsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load system data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  const showSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // --- File Upload & AI Textbook parsing handlers ---
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension !== 'json' && extension !== 'txt' && extension !== 'pdf') {
        setFileError('Invalid file type. Please upload a .txt, .json, or .pdf file.');
        return;
      }
      setSelectedBookFile(file);
      setFileError(null);
    }
  };

  const handleBookFile = async (file: File) => {
    setFileError(null);
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (extension !== 'json' && extension !== 'txt' && extension !== 'pdf') {
      setFileError('Invalid file type. Please upload a .txt, .json, or .pdf file.');
      return;
    }

    const reader = new FileReader();
    setIsParsingFile(true);
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      if (!content) {
        setFileError('The file appears to be empty.');
        setIsParsingFile(false);
        return;
      }

      try {
        if (extension === 'json') {
          const parsed = JSON.parse(content);
          if (parsed.chapters && Array.isArray(parsed.chapters)) {
            setFormValues((prev: any) => ({
              ...prev,
              title: parsed.title || prev.title || file.name.replace(/\.[^/.]+$/, ""),
              author: parsed.author || prev.author || 'AI Structured',
              description: parsed.description || prev.description || '',
              chapters: parsed.chapters.map((ch: any, idx: number) => ({
                chapter_id: ch.chapter_id || `ch-upload-${idx + 1}-${Math.random().toString(36).substr(2, 4)}`,
                title: ch.title || `Chapter ${idx + 1}`,
                content: ch.content || ''
              }))
            }));
            showSuccess('JSON textbook file successfully loaded!');
          } else {
            // Treat JSON as plain text if it does not match chapter structure
            const newChapter = {
              chapter_id: `ch-upload-${Math.random().toString(36).substr(2, 4)}`,
              title: file.name,
              content: content
            };
            setFormValues((prev: any) => ({
              ...prev,
              title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
              chapters: [...(prev.chapters || []), newChapter]
            }));
            showSuccess(`Successfully loaded ${file.name} as a book chapter!`);
          }
        } else if (extension === 'pdf') {
          // Store raw PDF data URL / base64 string
          const newChapter = {
            chapter_id: `ch-upload-${Math.random().toString(36).substr(2, 4)}`,
            title: file.name,
            content: content // Full data URL containing data:application/pdf;base64,...
          };
          setFormValues((prev: any) => ({
            ...prev,
            title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
            chapters: [...(prev.chapters || []), newChapter]
          }));
          showSuccess(`Successfully loaded ${file.name} as a PDF book chapter!`);
        } else if (extension === 'txt') {
          // Store raw text content
          const newChapter = {
            chapter_id: `ch-upload-${Math.random().toString(36).substr(2, 4)}`,
            title: file.name,
            content: content
          };
          setFormValues((prev: any) => ({
            ...prev,
            title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
            chapters: [...(prev.chapters || []), newChapter]
          }));
          showSuccess(`Successfully loaded ${file.name} as a text book chapter!`);
        }
        setSelectedBookFile(null); // Clear selected file state
      } catch (err: any) {
        console.error(err);
        setFileError(err.message || 'Error occurred while loading the file.');
      } finally {
        setIsParsingFile(false);
      }
    };
    reader.onerror = () => {
      setFileError('Failed to read file from device.');
      setIsParsingFile(false);
    };
    
    if (extension === 'pdf') {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  // --- CRUD ACTIONS ---

  // Students Delete
  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this student profile? This will cascade-delete grades, attendance, payment history and security logins.')) return;
    try {
      await ApiService.delete(`/students/${id}`);
      showSuccess('Student profile deleted successfully.');
      loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Teachers Delete
  const handleDeleteTeacher = async (id: string) => {
    if (!window.confirm('Delete teacher? Courses linked to this teacher will be unassigned.')) return;
    try {
      await ApiService.delete(`/teachers/${id}`);
      showSuccess('Teacher profile and courses mapping updated.');
      loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.post('/sections', {
        name: newSectionLetter
      });
      showSuccess(`Created section "${newSectionLetter.toUpperCase()}" successfully!`);
      loadAllData();
      setNewSectionLetter('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Courses Delete
  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm('Delete course? Linked grades and schedule tables will be deleted.')) return;
    try {
      await ApiService.delete(`/courses/${id}`);
      showSuccess('Course deleted.');
      loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Timetables Delete
  const handleDeleteTimetable = async (id: string) => {
    if (!window.confirm('Remove class schedule item?')) return;
    try {
      await ApiService.delete(`/timetables/${id}`);
      showSuccess('Schedule entry removed.');
      loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Notification Delete
  const handleDeleteNotification = async (id: string) => {
    try {
      await ApiService.delete(`/notifications/${id}`);
      showSuccess('Announcement deleted.');
      loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Book Delete
  const handleDeleteBook = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this textbook from the library catalog? This will remove all of its chapters and reader bookmarks.')) return;
    try {
      await ApiService.delete(`/books/${id}`);
      showSuccess('Digital textbook removed from library catalog.');
      loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handle Form Submissions (Create / Update)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (modalType === 'student') {
        if (editingId) {
          await ApiService.put(`/students/${editingId}`, formValues);
          showSuccess('Student updated successfully.');
        } else {
          await ApiService.post('/students', formValues);
          showSuccess('Student profile and security credentials generated.');
        }
      } else if (modalType === 'teacher') {
        if (editingId) {
          await ApiService.put(`/teachers/${editingId}`, formValues);
          showSuccess('Teacher updated successfully.');
        } else {
          await ApiService.post('/teachers', formValues);
          showSuccess('Teacher registered.');
        }
      } else if (modalType === 'parent') {
        if (editingId) {
          await ApiService.put(`/parents/${editingId}`, formValues);
          showSuccess('Parent updated.');
        } else {
          await ApiService.post('/parents', formValues);
          showSuccess('Parent login profile established.');
        }
      } else if (modalType === 'course') {
        if (editingId) {
          await ApiService.put(`/courses/${editingId}`, formValues);
          showSuccess('Course catalog updated.');
        } else {
          await ApiService.post('/courses', formValues);
          showSuccess('Course created successfully.');
        }
      } else if (modalType === 'timetable') {
        await ApiService.post('/timetables', formValues);
        showSuccess('New schedule block created.');
      } else if (modalType === 'payment') {
        await ApiService.post('/payments', formValues);
        showSuccess('Payment invoice created.');
      } else if (modalType === 'notification') {
        await ApiService.post('/notifications', formValues);
        showSuccess('Announcement posted live to targeted role boards.');
      } else if (modalType === 'book') {
        await ApiService.post('/books', formValues);
        showSuccess('Digital textbook added to library catalog.');
      }

      setModalType(null);
      setEditingId(null);
      setFormValues({});
      loadAllData();
    } catch (err: any) {
      setError(err.message || 'Action failed.');
    }
  };

  // Mark Attendance on the fly
  const handleRecordAttendance = async (student_id: string, status: AttendanceStatus) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      // Default to advanced math course for tracking purposes
      await ApiService.post('/attendance', {
        student_id,
        course_id: courses[0]?.course_id || 'crs-math',
        status,
        date: today
      });
      showSuccess(`Attendance recorded for today.`);
      loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Toggle Fee payment verification status
  const handleTogglePaymentStatus = async (pmtId: string, currentStatus: PaymentStatus) => {
    try {
      const nextStatus = currentStatus === PaymentStatus.PAID ? PaymentStatus.PENDING : PaymentStatus.PAID;
      await ApiService.put(`/payments/${pmtId}`, { status: nextStatus });
      showSuccess('Payment receipt verified successfully.');
      loadAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Password reset/change request
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formValues.newPassword !== formValues.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await ApiService.post('/auth/change-password', {
        oldPassword: formValues.oldPassword,
        newPassword: formValues.newPassword
      });
      showSuccess('Profile login password has been changed.');
      setFormValues({});
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- ANALYTICS CALCULATIONS ---
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalParents = parents.length;
  
  const presentCount = attendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
  const totalAttendanceRecords = attendance.length;
  const attendanceRate = totalAttendanceRecords > 0 ? Math.round((presentCount / totalAttendanceRecords) * 100) : 94;

  const totalRevenue = payments
    .filter(p => p.status === PaymentStatus.PAID)
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingRevenue = payments
    .filter(p => p.status === PaymentStatus.PENDING)
    .reduce((sum, p) => sum + p.amount, 0);

  const overdueRevenue = payments
    .filter(p => p.status === PaymentStatus.OVERDUE)
    .reduce((sum, p) => sum + p.amount, 0);

  // Chart Data: Monthly enrollment tracker
  const enrollmentChartData = [
    { month: 'Jan', students: totalStudents - 4 },
    { month: 'Feb', students: totalStudents - 3 },
    { month: 'Mar', students: totalStudents - 2 },
    { month: 'Apr', students: totalStudents - 1 },
    { month: 'May', students: totalStudents },
    { month: 'Jun', students: totalStudents },
  ];

  // Chart Data: Grade Distribution representation
  const gradeDistributionData = [
    { name: 'Grade A', count: 6 },
    { name: 'Grade B', count: 7 },
    { name: 'Grade C', count: 2 },
    { name: 'Grade D/F', count: 1 },
  ];

  // Chart Data: Revenue representation
  const revenueChartData = [
    { name: 'Collected', value: totalRevenue, color: '#10b981' },
    { name: 'Pending', value: pendingRevenue, color: '#f59e0b' },
    { name: 'Overdue', value: overdueRevenue, color: '#f43f5e' },
  ];

  if (loading && activeTab === 'admin-overview' && students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="animate-spin text-rose-500 mr-2" size={24} />
        <span className="font-mono text-slate-500">Loading system data catalog...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification Action success */}
      {actionSuccess && (
        <div className="fixed top-20 right-6 bg-slate-900 border border-slate-800 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2.5 z-50 animate-fade-in text-sm font-medium">
          <Check size={16} className="text-emerald-400 bg-emerald-500/10 p-0.5 rounded-full" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Error Panel */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold">System Action Blocked:</span> {error}
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600 font-bold font-mono">×</button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. OVERVIEW DASHBOARD */}
      {/* ========================================================= */}
      {activeTab === 'admin-overview' && (
        <>
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Stat 1 */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md hover:border-sky-200 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-mono font-bold">Total Students</p>
                  <p className="text-3xl font-extrabold text-slate-800 mt-2">{totalStudents}</p>
                </div>
                <div className="bg-sky-50 text-sky-600 p-3 rounded-2xl border border-sky-100">
                  <Users size={20} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-4 text-[11px] text-emerald-600 font-semibold">
                <TrendingUp size={12} />
                <span>+14% Enrollment Term</span>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-mono font-bold">Total Teachers</p>
                  <p className="text-3xl font-extrabold text-slate-800 mt-2">{totalTeachers}</p>
                </div>
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl border border-emerald-100">
                  <GraduationCap size={20} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-4 text-[11px] text-slate-500 font-mono font-medium">
                <span>1:1.5 Teacher Ratio</span>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md hover:border-purple-200 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-mono font-bold">Total Parents</p>
                  <p className="text-3xl font-extrabold text-slate-800 mt-2">{totalParents}</p>
                </div>
                <div className="bg-purple-50 text-purple-600 p-3 rounded-2xl border border-purple-100">
                  <User size={20} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-4 text-[11px] text-emerald-600 font-semibold">
                <Check size={12} />
                <span>Active Portal Access</span>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-mono font-bold">Attendance Rate</p>
                  <p className="text-3xl font-extrabold text-slate-800 mt-2">{attendanceRate}%</p>
                </div>
                <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl border border-indigo-100">
                  <Clock size={20} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-4 text-[11px] text-slate-500 font-mono font-medium">
                <span>Weekly Evaluation logs</span>
              </div>
            </div>

            {/* Stat 5 */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-300 sm:col-span-2 lg:col-span-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-mono font-bold">Paid Tuition</p>
                  <p className="text-3xl font-extrabold text-slate-800 mt-2">${totalRevenue}</p>
                </div>
                <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl border border-amber-100">
                  <DollarSign size={20} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-4 text-[11px] text-slate-500 font-mono font-medium">
                <span>Pending: ${pendingRevenue}</span>
              </div>
            </div>
          </div>

          {/* Charts & Analytics Boards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Enrollment growth block */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Monthly Student Enrollment Trend</h3>
                  <p className="text-xs text-slate-400">Current academic term tracking</p>
                </div>
                <BarChart2 size={18} className="text-slate-400 font-mono" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={enrollmentChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Line type="monotone" dataKey="students" stroke="#4f46e5" strokeWidth={3} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue collected breakdown */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Revenue Distribution</h3>
                  <p className="text-xs text-slate-400">Status of billing allocations</p>
                </div>
                <PieIcon size={18} className="text-slate-400" />
              </div>
              <div className="h-48 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {revenueChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-4 text-center">
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="block w-2 h-2 rounded-full bg-emerald-500 mx-auto mb-1"></span>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Collected</span>
                  <span className="text-xs font-bold text-slate-700">${totalRevenue}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="block w-2 h-2 rounded-full bg-amber-500 mx-auto mb-1"></span>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Pending</span>
                  <span className="text-xs font-bold text-slate-700">${pendingRevenue}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <span className="block w-2 h-2 rounded-full bg-rose-500 mx-auto mb-1"></span>
                  <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold">Overdue</span>
                  <span className="text-xs font-bold text-slate-700">${overdueRevenue}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grade distribution block */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Grade Distribution</h3>
                  <p className="text-xs text-slate-400">Evaluated score benchmarks</p>
                </div>
                <BarChart2 size={18} className="text-slate-400" />
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Actions & Live system status */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 lg:col-span-2">
              <h3 className="font-bold text-slate-800 text-sm mb-4">Latest Board Announcements</h3>
              <div className="space-y-3.5 max-h-[220px] overflow-y-auto">
                {notifications.slice(0, 3).map((not, idx) => (
                  <div key={`${not.notification_id || ''}-${idx}`} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex gap-3">
                    <div className="bg-indigo-50 text-indigo-700 p-2 h-fit rounded-lg border border-indigo-100">
                      <Bell size={14} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-800 text-xs leading-none">{not.title}</h4>
                        <span className="bg-slate-200 text-slate-600 text-[9px] px-1.5 py-0.5 rounded font-mono font-medium">{not.recipient}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{not.message}</p>
                      <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                        {new Date(not.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* 2. STUDENTS MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === 'admin-students' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {/* Header Controls */}
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-550/10">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Students Ledger</h3>
              <p className="text-xs text-slate-400 mt-0.5">Maintain, register, and update active student profiles.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none w-48 transition-colors"
                />
              </div>

              {/* Class Grade Filter */}
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 focus:outline-none focus:bg-white cursor-pointer"
              >
                <option value="ALL">All Grades</option>
                {ACADEMIC_GRADES.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>

              {/* Action */}
              <button
                onClick={() => {
                  setEditingId(null);
                  setFormValues({ fullname: '', email: '', grade: ACADEMIC_GRADES[0], section: 'A', parent_id: '' });
                  setModalType('student');
                }}
                id="add-student-btn"
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-1.5 rounded-xl text-xs transition-colors shadow-sm"
              >
                <Plus size={14} />
                Register Student
              </button>
            </div>
          </div>

          {/* List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                  <th className="px-6 py-3.5 font-bold">Student Name</th>
                  <th className="px-6 py-3.5 font-bold">Student ID</th>
                  <th className="px-6 py-3.5 font-bold">Class Assignment</th>
                  <th className="px-6 py-3.5 font-bold">Linked Parent</th>
                  <th className="px-6 py-3.5 font-bold">Enrolled Date</th>
                  <th className="px-6 py-3.5 font-bold text-center">Quick Attendance</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {students
                  .filter(s => {
                    const matchSearch = s.fullname.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchGrade = gradeFilter === 'ALL' || s.grade === gradeFilter;
                    return matchSearch && matchGrade;
                  })
                  .map(s => (
                    <tr key={s.student_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold border border-slate-200 text-xs">
                            {s.fullname.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm leading-none">{s.fullname}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-[11px] text-slate-500">{s.student_id}</td>
                      <td className="px-6 py-3.5">
                        <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2.5 py-0.5 rounded font-medium font-mono text-[10px]">
                          {s.grade} - {s.section}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        {s.parent_name ? (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-700 font-medium">{s.parent_name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unlinked</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-slate-400 font-mono text-[11px]">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleRecordAttendance(s.student_id, AttendanceStatus.PRESENT)}
                            className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold"
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleRecordAttendance(s.student_id, AttendanceStatus.ABSENT)}
                            className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-2 py-1 rounded text-[10px] font-bold"
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingId(s.student_id);
                              setFormValues({ fullname: s.fullname, email: s.email, grade: s.grade, section: s.section, parent_id: s.parent_id || '' });
                              setModalType('student');
                            }}
                            className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s.student_id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. TEACHERS MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === 'admin-teachers' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Faculty Directory</h3>
              <p className="text-xs text-slate-400 mt-0.5">Assign subjects, manage class supervisors, and setup logins.</p>
            </div>
            
            <button
              onClick={() => {
                setEditingId(null);
                setFormValues({ fullname: '', email: '', subject: '' });
                setModalType('teacher');
              }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-1.5 rounded-xl text-xs transition-colors shadow-sm"
            >
              <Plus size={14} />
              Register Teacher
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                  <th className="px-6 py-3.5 font-bold">Faculty Member</th>
                  <th className="px-6 py-3.5 font-bold">Teacher ID</th>
                  <th className="px-6 py-3.5 font-bold">Primary Subject Specialization</th>
                  <th className="px-6 py-3.5 font-bold">Hired Date</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {teachers.map(t => (
                  <tr key={t.teacher_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold border border-slate-200 text-xs">
                          {t.fullname.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm leading-none">{t.fullname}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-[11px] text-slate-500">{t.teacher_id}</td>
                    <td className="px-6 py-3.5">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded font-medium text-[10px]">
                        {t.subject}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400 font-mono text-[11px]">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingId(t.teacher_id);
                            setFormValues({ fullname: t.fullname, email: t.email, subject: t.subject });
                            setModalType('teacher');
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(t.teacher_id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. PARENTS MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === 'admin-parents' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Parents Ledger</h3>
              <p className="text-xs text-slate-400 mt-0.5">Link children and coordinate notifications.</p>
            </div>
            
            <button
              onClick={() => {
                setEditingId(null);
                setFormValues({ fullname: '', email: '' });
                setModalType('parent');
              }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-1.5 rounded-xl text-xs transition-colors shadow-sm"
            >
              <Plus size={14} />
              Register Parent
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                  <th className="px-6 py-3.5 font-bold">Parent Guardian</th>
                  <th className="px-6 py-3.5 font-bold">Parent ID</th>
                  <th className="px-6 py-3.5 font-bold">Linked Children (Students)</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {parents.map(p => (
                  <tr key={p.parent_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold border border-slate-200 text-xs">
                          {p.fullname.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm leading-none">{p.fullname}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-[11px] text-slate-500">{p.parent_id}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {p.children.length > 0 ? (
                          p.children.map(ch => (
                            <span key={ch.student_id} className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded text-[10px] font-medium font-mono">
                              {ch.fullname} ({ch.grade})
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No children linked yet</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingId(p.parent_id);
                            setFormValues({ fullname: p.fullname, email: p.email });
                            setModalType('parent');
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. COURSES CATALOG */}
      {/* ========================================================= */}
      {activeTab === 'admin-courses' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Course Catalog</h3>
              <p className="text-xs text-slate-400 mt-0.5">Organize subjects and assign specialized faculty members.</p>
            </div>
            
            <button
              onClick={() => {
                setEditingId(null);
                setFormValues({ course_name: '', teacher_id: teachers[0]?.teacher_id || '' });
                setModalType('course');
              }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-1.5 rounded-xl text-xs transition-colors shadow-sm"
            >
              <Plus size={14} />
              Add Course
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                  <th className="px-6 py-3.5 font-bold">Course Title</th>
                  <th className="px-6 py-3.5 font-bold">Course ID</th>
                  <th className="px-6 py-3.5 font-bold">Assigned Professor</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {courses.map(c => (
                  <tr key={c.course_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-slate-800 text-sm">{c.course_name}</td>
                    <td className="px-6 py-3.5 font-mono text-[11px] text-slate-500">{c.course_id}</td>
                    <td className="px-6 py-3.5">
                      <span className="font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        {c.teacher_name}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingId(c.course_id);
                            setFormValues({ course_name: c.course_name, teacher_id: c.teacher_id });
                            setModalType('course');
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(c.course_id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. ATTENDANCE LOGS */}
      {/* ========================================================= */}
      {activeTab === 'admin-attendance' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Attendance logs</h3>
              <p className="text-xs text-slate-400 mt-0.5">Audit complete institutional roll-calls and tracking metrics.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold font-mono text-slate-500">Live Status Overview:</span>
              <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-200">PRESENT</span>
              <span className="bg-rose-50 text-rose-800 px-2 py-0.5 rounded text-[10px] font-semibold border border-rose-200">ABSENT</span>
              <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded text-[10px] font-semibold border border-amber-200">LATE</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                  <th className="px-6 py-3.5 font-bold">Student Name</th>
                  <th className="px-6 py-3.5 font-bold">Class Course</th>
                  <th className="px-6 py-3.5 font-bold">Date of Logging</th>
                  <th className="px-6 py-3.5 font-bold">Roll-Call Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {attendance.slice(0, 50).map(a => (
                  <tr key={a.attendance_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-slate-800">{a.student_name}</td>
                    <td className="px-6 py-3.5 text-slate-500">{a.course_name}</td>
                    <td className="px-6 py-3.5 font-mono text-slate-400">{a.date}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        a.status === AttendanceStatus.PRESENT
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : a.status === AttendanceStatus.ABSENT
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. CLASS TIMETABLES */}
      {/* ========================================================= */}
      {activeTab === 'admin-timetable' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">School Timetable Scheduling</h3>
              <p className="text-xs text-slate-400 mt-0.5">Establish class periods, allocate class blocks, and avoid conflict clashes.</p>
            </div>
            
            <button
              onClick={() => {
                setFormValues({
                  class_name: 'Grade 10-A',
                  course_id: courses[0]?.course_id || '',
                  teacher_id: teachers[0]?.teacher_id || '',
                  day: 'Monday',
                  start_time: '08:30',
                  end_time: '10:00'
                });
                setModalType('timetable');
              }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-1.5 rounded-xl text-xs transition-colors shadow-sm"
            >
              <Plus size={14} />
              Add Schedule Block
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                  <th className="px-6 py-3.5 font-bold">Assigned Class Group</th>
                  <th className="px-6 py-3.5 font-bold">Course Name</th>
                  <th className="px-6 py-3.5 font-bold">Teacher Supervisor</th>
                  <th className="px-6 py-3.5 font-bold">Scheduled Day</th>
                  <th className="px-6 py-3.5 font-bold">Time Range Slot</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {timetables.map((t, idx) => (
                  <tr key={`${t.timetable_id || ''}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-800 text-[11px]">{t.class_name}</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-700">{t.course_name}</td>
                    <td className="px-6 py-3.5 text-slate-500">{t.teacher_name}</td>
                    <td className="px-6 py-3.5 font-medium">{t.day}</td>
                    <td className="px-6 py-3.5 font-mono text-slate-600 bg-slate-50 border-x border-slate-150 px-2.5 py-1 text-[11px] text-center w-36">
                      {t.start_time} - {t.end_time}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteTimetable(t.timetable_id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. REPORTS BOARD */}
      {/* ========================================================= */}
      {activeTab === 'admin-reports' && (
        <div className="space-y-6">
          {/* Card list of students report cards */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-2">Academic Report Card Summaries</h3>
            <p className="text-xs text-slate-400 mb-4">Printable summaries of student report evaluation scores.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {students.map((std) => (
                <div key={std.student_id} className="border border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{std.fullname}</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{std.student_id} | {std.grade} - {std.section}</p>
                      </div>
                      <span className="bg-teal-50 text-teal-800 font-bold border border-teal-200 px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider">
                        PASSING
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs border-b border-slate-200/55 pb-1">
                        <span className="text-slate-400">Term Evaluation GPA:</span>
                        <span className="font-bold text-slate-700">3.8 GPA (A)</span>
                      </div>
                      <div className="flex justify-between text-xs border-b border-slate-200/55 pb-1">
                        <span className="text-slate-400">Verified Attendance rate:</span>
                        <span className="font-bold text-slate-700">96.2% Present</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Payment status:</span>
                        <span className="font-bold text-slate-700 text-emerald-600">FULLY SETTLED</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="mt-4 w-full text-center bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-1.5 rounded-lg text-xs transition-colors"
                  >
                    Export / Print Report Sheet
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Ledger of Financial payments billed & collected */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Tuition & Financial Bill Ledger</h3>
                <p className="text-xs text-slate-400 mt-0.5">Monitor and authorize payment invoices and active balances.</p>
              </div>

              <button
                onClick={() => {
                  setFormValues({
                    student_id: students[0]?.student_id || '',
                    amount: 1500,
                    status: PaymentStatus.PENDING,
                  });
                  setModalType('payment');
                }}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-1.5 rounded-xl text-xs transition-colors shadow-sm"
              >
                <Plus size={14} />
                Generate Bill Invoice
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                    <th className="px-6 py-3.5 font-bold">Enrolled Student</th>
                    <th className="px-6 py-3.5 font-bold">Class Grade</th>
                    <th className="px-6 py-3.5 font-bold">Invoice Date</th>
                    <th className="px-6 py-3.5 font-bold">Billed Amount</th>
                    <th className="px-6 py-3.5 font-bold">Status</th>
                    <th className="px-6 py-3.5 font-bold text-right">Verification Auth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {payments.map(p => (
                    <tr key={p.payment_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-semibold text-slate-800">{p.student_name}</td>
                      <td className="px-6 py-3.5 font-mono text-[11px] text-slate-400">{p.grade}</td>
                      <td className="px-6 py-3.5 font-mono text-[11px] text-slate-400">{p.payment_date}</td>
                      <td className="px-6 py-3.5 font-bold text-slate-800">${p.amount}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          p.status === PaymentStatus.PAID
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : p.status === PaymentStatus.PENDING
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => handleTogglePaymentStatus(p.payment_id, p.status)}
                          className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg text-slate-700 font-semibold font-mono"
                        >
                          Mark {p.status === PaymentStatus.PAID ? 'Pending' : 'PAID'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SECTIONS MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === 'admin-sections' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Section Form */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm h-fit">
              <h3 className="font-bold text-slate-800 text-sm mb-2 uppercase tracking-wider font-mono">Create New Section</h3>
              <p className="text-xs text-slate-400 mb-4">Provision additional academic sections for student enrollment.</p>
              
              <form onSubmit={handleCreateSection} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono mb-1.5">
                    Section Code / Name (e.g. "E", "F", "Grade 10-E")
                  </label>
                  <input
                    type="text"
                    required
                    value={newSectionLetter}
                    onChange={(e) => setNewSectionLetter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    placeholder="E.g., E"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  Provision Section
                </button>
              </form>
            </div>

            {/* Sections Catalog */}
            <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-1 uppercase tracking-wider font-mono">Available Sections</h3>
              <p className="text-xs text-slate-400 mb-6">Explore currently defined student roster sections and class sizes.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sections.map((sec, idx) => {
                  const sectionStudents = students.filter(
                    s => s.section && s.section.toUpperCase() === sec.toUpperCase()
                  );
                  const courseSchedules = timetables.filter(
                    t => t.class_name && (t.class_name.toUpperCase().endsWith('-' + sec.toUpperCase()) || t.class_name.toUpperCase() === sec.toUpperCase())
                  );

                  return (
                    <div key={idx} className="border border-slate-100 hover:border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-white transition-all shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 px-2.5 py-1 rounded-lg text-xs uppercase font-mono tracking-wider">
                            Section {sec}
                          </span>
                          <p className="text-xs text-slate-400 mt-2 font-mono">
                            Total Students: <span className="font-bold text-slate-700 font-sans text-sm">{sectionStudents.length}</span>
                          </p>
                        </div>
                        <span className="bg-slate-200 text-slate-600 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                          {courseSchedules.length} Scheduled Classes
                        </span>
                      </div>

                      {sectionStudents.length > 0 && (
                        <div className="mt-4 border-t border-slate-100 pt-3">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Enrolled Students</p>
                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                            {sectionStudents.map(s => (
                              <span key={s.student_id} className="bg-white border border-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-md font-medium">
                                {s.fullname} ({s.grade})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {courseSchedules.length > 0 && (
                        <div className="mt-3 border-t border-slate-100 pt-3">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Timetable schedule</p>
                          <div className="space-y-1">
                            {courseSchedules.slice(0, 3).map((t, tIdx) => (
                              <div key={tIdx} className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                                <span className="font-semibold text-slate-700">{t.course_name}</span>
                                <span>{t.day_of_week} {t.start_time}-{t.end_time}</span>
                              </div>
                            ))}
                            {courseSchedules.length > 3 && (
                              <p className="text-[9px] text-slate-400 text-right">+ {courseSchedules.length - 3} more schedule items</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DIGITAL LIBRARY ANALYTICS */}
      {/* ========================================================= */}
      {activeTab === 'admin-library' && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats overview cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-mono font-bold">Total Library Books</p>
                  <p className="text-2xl font-extrabold text-slate-800 mt-2">{books.length}</p>
                </div>
                <div className="bg-sky-50 text-sky-600 p-3 rounded-2xl border border-sky-100">
                  <BookOpen size={20} />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-3">Full digital catalog with AI tutor access</p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-mono font-bold">Active Readers</p>
                  <p className="text-2xl font-extrabold text-slate-800 mt-2">
                    {libraryAnalytics?.activeReaders ?? bookmarks.length}
                  </p>
                </div>
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl border border-emerald-100">
                  <TrendingUp size={20} />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-3">Students currently logging reading progress</p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-mono font-bold">AI Tutor Questions</p>
                  <p className="text-2xl font-extrabold text-slate-800 mt-2">
                    {libraryAnalytics?.aiUsage?.totalQueries ?? aiLogs.length}
                  </p>
                </div>
                <div className="bg-purple-50 text-purple-600 p-3 rounded-2xl border border-purple-100">
                  <BarChart2 size={20} />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-3">Semantic learning prompts submitted</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Popular books chart */}
            {libraryAnalytics?.popularBooks && libraryAnalytics.popularBooks.length > 0 ? (
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-1 uppercase tracking-wider font-mono">Popular Digital Textbooks</h3>
                <p className="text-xs text-slate-400 mb-4">Number of students reading each catalog textbook.</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={libraryAnalytics.popularBooks}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="title" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      <Bar dataKey="readers" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Active Readers" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}

            {/* Daily AI Usage trend chart */}
            {libraryAnalytics?.studyTrends && libraryAnalytics.studyTrends.length > 0 ? (
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-1 uppercase tracking-wider font-mono">AI Study Query Trends</h3>
                <p className="text-xs text-slate-400 mb-4">Daily query metrics submitted to the Gemini textbook assistant.</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={libraryAnalytics.studyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      <Line type="monotone" dataKey="aiQueries" stroke="#a855f7" strokeWidth={2.5} name="Queries Raised" activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}
          </div>

          {/* AI Logs / Chat Interaction Audit Ledger */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm">AI Study Assistant Prompt logs</h3>
              <p className="text-xs text-slate-400 mt-0.5">Audit real-time student interactions with the AI Textbook helper.</p>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {aiLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-mono">No AI helper interaction logs registered.</div>
              ) : (
                aiLogs.map((log: any) => (
                  <div key={log.log_id} className="p-5 hover:bg-slate-50/40 transition-colors">
                    <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700 text-xs">{log.student_name}</span>
                        <span className="bg-slate-200 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded font-mono">
                          {log.class_name || 'STUDENT'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-2 mt-2 pl-3 border-l-2 border-indigo-500">
                      <div>
                        <span className="text-[9px] uppercase font-mono font-bold text-indigo-500 block">Question</span>
                        <p className="text-xs font-semibold text-slate-800 leading-relaxed mt-0.5">{log.question}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                        <span className="text-[9px] uppercase font-mono font-bold text-purple-600 block">AI response</span>
                        <p className="text-xs text-slate-600 leading-relaxed mt-1 font-mono">{log.answer}</p>
                      </div>
                    </div>

                    {log.referenced_books && log.referenced_books.length > 0 && (
                      <div className="mt-3 flex items-center gap-1.5 flex-wrap pl-3">
                        <span className="text-[9px] text-slate-400 font-mono">Referenced:</span>
                        {log.referenced_books.map((b: any, bIdx: number) => (
                          <span key={bIdx} className="bg-slate-100 border border-slate-200 text-slate-500 text-[9px] font-medium px-2 py-0.5 rounded-full">
                            {b.title} ({b.chapter || 'Ch'})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DIGITAL TEXTBOOK CATALOG */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider font-mono">Digital Textbook Catalog</h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage interactive digital library books and lesson textbook content.</p>
              </div>
              <button
                onClick={() => {
                  setEditingId(null);
                  setFormValues({
                    title: '',
                    author: '',
                    grade_level: 'High',
                    subject: 'Science',
                    cover_url: '',
                    description: '',
                    chapters: [{ title: 'Chapter 1', content: '' }]
                  });
                  setModalType('book');
                }}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-1.5 rounded-xl text-xs transition-colors shadow-sm"
              >
                <Plus size={14} />
                Add Textbook
              </button>
            </div>

            <div className="p-6">
              {books.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-mono">No digital textbooks in the library catalog.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {books.map((book: any) => (
                    <div key={book.book_id} className="group border border-slate-200 hover:border-indigo-200 hover:shadow-md rounded-2xl overflow-hidden bg-white flex flex-col justify-between transition-all duration-200">
                      <div className="p-4 space-y-3">
                        <div className="aspect-[4/5] w-full rounded-lg overflow-hidden bg-slate-50 border border-slate-100 relative shadow-inner">
                          <img
                            src={book.cover_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=200&auto=format&fit=crop&q=60'}
                            alt={book.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                          />
                        </div>
                        <div>
                          <span className="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase">
                            {book.subject}
                          </span>
                          <h4 className="font-bold text-slate-800 text-xs mt-1.5 line-clamp-1">{book.title}</h4>
                          <p className="text-slate-400 text-[10px] font-mono mt-0.5">By {book.author}</p>
                        </div>
                        <p className="text-slate-500 text-[11px] line-clamp-2 mt-2 leading-relaxed">
                          {book.description || 'No description provided.'}
                        </p>
                      </div>

                      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[11px]">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 text-[10px] font-mono">{book.grade_level}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{book.chapters?.length || 0} chapters</span>
                        </div>
                        <button
                          onClick={() => handleDeleteBook(book.book_id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100"
                          title="Delete Textbook"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* LIVE VIRTUAL CLASSROOMS & CAMERA ANALYTICS */}
      {/* ========================================================= */}
      {activeTab === 'admin-live' && (
        <div className="space-y-6 animate-fade-in">
          {/* Live overview statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-mono font-bold">Active Live Streams</p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-2xl font-extrabold text-slate-800">{liveAnalytics?.liveCount ?? 0}</p>
                    {(liveAnalytics?.liveCount ?? 0) > 0 && (
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="bg-rose-50 text-rose-600 p-3 rounded-2xl border border-rose-100">
                  <Video size={20} />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-3">Live virtual courses currently running</p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-mono font-bold">Total Cameras Registered</p>
                  <p className="text-2xl font-extrabold text-slate-800 mt-2">{cameras.length}</p>
                </div>
                <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl border border-indigo-100">
                  <Settings size={20} />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-3">Facility IoT camera endpoints monitored</p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-mono font-bold">Classroom Sessions Streamed</p>
                  <p className="text-2xl font-extrabold text-slate-800 mt-2">{liveAnalytics?.totalStreamsStarted ?? liveSessions.length}</p>
                </div>
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl border border-emerald-100">
                  <Clock size={20} />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-3">Historical digital course stream archives</p>
            </div>
          </div>

          {/* IoT Classroom CCTV monitors */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-1 uppercase tracking-wider font-mono">IoT Security & CCTV Cameras</h3>
            <p className="text-xs text-slate-400 mb-6">Control online classroom stream cameras and authorize facility observation.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cameras.map((cam: any) => {
                const isStreaming = liveAnalytics?.cameras?.find((c: any) => c.camera_id === cam.camera_id)?.isStreaming;
                const streamInfo = liveAnalytics?.cameras?.find((c: any) => c.camera_id === cam.camera_id);

                return (
                  <div key={cam.camera_id} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 shadow-lg relative flex flex-col justify-between group">
                    {/* Monitor stream output container */}
                    <div className="aspect-video bg-slate-950 flex flex-col items-center justify-center relative border-b border-slate-800">
                      {cam.status === 'ACTIVE' ? (
                        <>
                          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-900/80 px-2 py-0.5 rounded text-[9px] font-bold text-emerald-400 font-mono uppercase tracking-wider border border-emerald-500/20">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Feed Online
                          </div>

                          {isStreaming ? (
                            <div className="absolute top-3 right-3 flex items-center gap-1 bg-rose-600 px-2 py-0.5 rounded text-[9px] font-extrabold text-white font-mono uppercase tracking-wider animate-pulse">
                              Streaming LIVE
                            </div>
                          ) : null}

                          <Video size={36} className={`text-slate-700 transition-transform ${isStreaming ? 'text-indigo-400 scale-110' : ''}`} />
                          
                          <span className="text-[10px] text-slate-500 font-mono mt-2 uppercase tracking-wide">
                            {isStreaming ? `${streamInfo?.streamingCourse} - ${streamInfo?.streamingClass}` : 'Static Idle Stream'}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-950/80 px-2 py-0.5 rounded text-[9px] font-bold text-rose-500 font-mono uppercase tracking-wider border border-rose-500/20">
                            <X size={8} />
                            Feed Offline
                          </div>
                          <AlertCircle size={36} className="text-slate-800" />
                          <span className="text-[10px] text-slate-600 font-mono mt-2 uppercase tracking-wide">CCTV Monitor Disabled</span>
                        </>
                      )}
                    </div>

                    {/* Camera Info Panel */}
                    <div className="p-4 bg-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs">{cam.name}</h4>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Room Number: {cam.room_number}</p>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono tracking-wider ${
                          cam.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {cam.status}
                        </span>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const nextStatus = cam.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                              await ApiService.put(`/cameras/${cam.camera_id}/status`, { status: nextStatus });
                              showSuccess(`Camera "${cam.name}" status updated to ${nextStatus}.`);
                              loadAllData();
                            } catch (err: any) {
                              setError(err.message);
                            }
                          }}
                          className={`w-full py-1.5 text-center rounded-xl text-xs font-bold transition-all border ${
                            cam.status === 'ACTIVE'
                              ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                              : 'bg-indigo-600 border-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                          }`}
                        >
                          {cam.status === 'ACTIVE' ? 'Deactivate Camera' : 'Activate Camera'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live and Ended sessions archives */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm">Streaming Session Archives</h3>
              <p className="text-xs text-slate-400 mt-0.5">Explore active and completed virtual stream session archives.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                    <th className="px-6 py-3.5 font-bold">Target Course</th>
                    <th className="px-6 py-3.5 font-bold">Class Name</th>
                    <th className="px-6 py-3.5 font-bold">Teacher Host</th>
                    <th className="px-6 py-3.5 font-bold">Started At</th>
                    <th className="px-6 py-3.5 font-bold">Status</th>
                    <th className="px-6 py-3.5 font-bold text-right">Viewers Log</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {liveSessions.map((session: any) => (
                    <tr key={session.session_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-semibold text-slate-800">{session.course_name}</td>
                      <td className="px-6 py-3.5 font-mono text-slate-500">{session.class_name}</td>
                      <td className="px-6 py-3.5">{session.teacher_name}</td>
                      <td className="px-6 py-3.5 font-mono text-[11px] text-slate-400">
                        {new Date(session.started_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          session.status === 'LIVE'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {session.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-700">
                        {session.active_viewers?.length ?? 0} Student Viewers
                      </td>
                    </tr>
                  ))}
                  {liveSessions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-mono">No live class streams registered.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. SYSTEM SETTINGS */}
      {/* ========================================================= */}
      {activeTab === 'admin-settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile overview card */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-4">My Security Profile</h3>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold border-2 border-rose-500 shadow-md text-2xl mb-3">
                {user?.fullname.charAt(0)}
              </div>
              <h4 className="font-bold text-slate-800 text-base">{user?.fullname}</h4>
              <p className="text-xs text-slate-400 font-mono mt-1">{user?.email}</p>
              <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-md mt-3 uppercase tracking-wider font-mono">
                {user?.role} Access
              </span>
            </div>
            
            <div className="mt-4 border-t border-slate-100 pt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Database Connection:</span>
                <span className="font-semibold text-emerald-600 font-mono">STABLE SECURE</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Encryption Method:</span>
                <span className="font-semibold text-slate-600 font-mono">BCRYPT x10</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Session Lease:</span>
                <span className="font-semibold text-slate-600 font-mono">24 Hours JWT</span>
              </div>
            </div>
          </div>

          {/* Change password block */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm lg:col-span-2">
            <h3 className="font-bold text-slate-800 text-sm mb-2">Change Account Password</h3>
            <p className="text-xs text-slate-400 mb-4">Revoke old credentials and reinforce secure JWT logins.</p>
            
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono mb-1.5">Current Password</label>
                  <input
                    type="password"
                    required
                    value={formValues.oldPassword || ''}
                    onChange={(e) => setFormValues({ ...formValues, oldPassword: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                    placeholder="Enter current password..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono mb-1.5">New Password</label>
                  <input
                    type="password"
                    required
                    value={formValues.newPassword || ''}
                    onChange={(e) => setFormValues({ ...formValues, newPassword: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                    placeholder="Min 6 characters..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={formValues.confirmPassword || ''}
                  onChange={(e) => setFormValues({ ...formValues, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                  placeholder="Verify new password..."
                />
              </div>

              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-900 text-white font-semibold px-5 py-2 rounded-lg text-xs transition-colors shadow-sm"
                >
                  Save New Security Password
                </button>
              </div>
            </form>
          </div>

          {/* Announcements publishing */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm lg:col-span-3">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Publish Announcements</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">Issue live targeted notifications across user portals.</p>
              </div>
              <button
                onClick={() => {
                  setFormValues({ title: '', message: '', recipient: 'ALL' });
                  setModalType('notification');
                }}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-1.5 rounded-xl text-xs transition-colors"
              >
                <Plus size={14} />
                Create Announcement
              </button>
            </div>

            <div className="space-y-3">
              {notifications.map((not, idx) => (
                <div key={`${not.notification_id || ''}-${idx}`} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="bg-rose-100 text-rose-700 p-2 rounded-lg border border-rose-200 h-fit mt-0.5">
                      <Bell size={15} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-sm leading-none">{not.title}</h4>
                        <span className="bg-slate-200 text-slate-600 text-[9px] font-mono font-bold px-2 py-0.5 rounded">
                          TO: {not.recipient}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">{not.message}</p>
                      <span className="text-[10px] text-slate-400 font-mono mt-2 block">
                        {new Date(not.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteNotification(not.notification_id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* --- FORM DRAWER MODAL --- */}
      {/* ========================================================= */}
      {modalType && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-40 animate-fade-in">
          <div className={`bg-white border border-slate-200 rounded-2xl w-full ${modalType === 'book' ? 'max-w-xl' : 'max-w-md'} shadow-2xl overflow-hidden animate-scale-up`}>
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider font-mono">
                {modalType === 'book' ? 'Add Digital Textbook' : (editingId ? 'Edit Profile' : 'Register / Add Block')}
              </h3>
              <button
                onClick={() => {
                  setModalType(null);
                  setEditingId(null);
                  setFormValues({});
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {/* STUDENT FORM */}
              {modalType === 'student' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formValues.fullname || ''}
                      onChange={(e) => setFormValues({ ...formValues, fullname: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                      placeholder="Alex Pendelton"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Email Address (Login ID)</label>
                    <input
                      type="email"
                      required
                      disabled={!!editingId}
                      value={formValues.email || ''}
                      onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none disabled:opacity-60"
                      placeholder="alex.p@school.com"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Academic Grade</label>
                      <select
                        value={formValues.grade || ACADEMIC_GRADES[0]}
                        onChange={(e) => setFormValues({ ...formValues, grade: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                      >
                        {ACADEMIC_GRADES.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Section</label>
                      <select
                        value={formValues.section || 'A'}
                        onChange={(e) => setFormValues({ ...formValues, section: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                      >
                        {(sections.length > 0 ? sections : DEFAULT_SECTIONS).map(sec => (
                          <option key={sec} value={sec}>Section {sec}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Link Parent (Optional)</label>
                    <select
                      value={formValues.parent_id || ''}
                      onChange={(e) => setFormValues({ ...formValues, parent_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                    >
                      <option value="">No parent linked</option>
                      {parents.map(p => (
                        <option key={p.parent_id} value={p.parent_id}>{p.fullname} ({p.email})</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* TEACHER FORM */}
              {modalType === 'teacher' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formValues.fullname || ''}
                      onChange={(e) => setFormValues({ ...formValues, fullname: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                      placeholder="Dr. Robert Carter"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Email (Login ID)</label>
                    <input
                      type="email"
                      required
                      disabled={!!editingId}
                      value={formValues.email || ''}
                      onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none disabled:opacity-60"
                      placeholder="robert.carter@school.com"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Subject Specialty</label>
                    <input
                      type="text"
                      required
                      value={formValues.subject || ''}
                      onChange={(e) => setFormValues({ ...formValues, subject: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                      placeholder="e.g. Mathematics, Astrophysics"
                    />
                  </div>
                </>
              )}

              {/* PARENT FORM */}
              {modalType === 'parent' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formValues.fullname || ''}
                      onChange={(e) => setFormValues({ ...formValues, fullname: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                      placeholder="Arthur Pendelton"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Email (Login ID)</label>
                    <input
                      type="email"
                      required
                      disabled={!!editingId}
                      value={formValues.email || ''}
                      onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none disabled:opacity-60"
                      placeholder="arthur.p@school.com"
                    />
                  </div>
                </>
              )}

              {/* COURSE FORM */}
              {modalType === 'course' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Course Name</label>
                    <input
                      type="text"
                      required
                      value={formValues.course_name || ''}
                      onChange={(e) => setFormValues({ ...formValues, course_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                      placeholder="e.g. Advanced Chemistry II"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Professor Assignment</label>
                    <select
                      value={formValues.teacher_id || ''}
                      onChange={(e) => setFormValues({ ...formValues, teacher_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                    >
                      <option value="">Select a Faculty Member</option>
                      {teachers.map(t => (
                        <option key={t.teacher_id} value={t.teacher_id}>{t.fullname} ({t.subject})</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* TIMETABLE FORM */}
              {modalType === 'timetable' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Class Group</label>
                      <select
                        value={formValues.class_name || `${ACADEMIC_GRADES[0]}-A`}
                        onChange={(e) => setFormValues({ ...formValues, class_name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                      >
                        {ACADEMIC_GRADES.flatMap(g => 
                          (sections.length > 0 ? sections : DEFAULT_SECTIONS).map(sec => `${g}-${sec}`)
                        ).map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Day</label>
                      <select
                        value={formValues.day || 'Monday'}
                        onChange={(e) => setFormValues({ ...formValues, day: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                      >
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Course</label>
                    <select
                      value={formValues.course_id || ''}
                      onChange={(e) => setFormValues({ ...formValues, course_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                    >
                      <option value="">Select Course</option>
                      {courses.map(c => (
                        <option key={c.course_id} value={c.course_id}>{c.course_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Professor</label>
                    <select
                      value={formValues.teacher_id || ''}
                      onChange={(e) => setFormValues({ ...formValues, teacher_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                    >
                      <option value="">Select Faculty</option>
                      {teachers.map(t => (
                        <option key={t.teacher_id} value={t.teacher_id}>{t.fullname} ({t.subject})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Start Time</label>
                      <input
                        type="time"
                        required
                        value={formValues.start_time || '08:30'}
                        onChange={(e) => setFormValues({ ...formValues, start_time: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">End Time</label>
                      <input
                        type="time"
                        required
                        value={formValues.end_time || '10:00'}
                        onChange={(e) => setFormValues({ ...formValues, end_time: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* PAYMENT BILL FORM */}
              {modalType === 'payment' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Select Student Target</label>
                    <select
                      value={formValues.student_id || ''}
                      onChange={(e) => setFormValues({ ...formValues, student_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                    >
                      <option value="">Select Student</option>
                      {students.map(s => (
                        <option key={s.student_id} value={s.student_id}>{s.fullname} ({s.grade})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Billing Amount ($)</label>
                    <input
                      type="number"
                      required
                      value={formValues.amount || 1500}
                      onChange={(e) => setFormValues({ ...formValues, amount: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                      placeholder="1500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Payment Invoice Status</label>
                    <select
                      value={formValues.status || PaymentStatus.PENDING}
                      onChange={(e) => setFormValues({ ...formValues, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                    >
                      <option value={PaymentStatus.PENDING}>PENDING</option>
                      <option value={PaymentStatus.PAID}>PAID</option>
                      <option value={PaymentStatus.OVERDUE}>OVERDUE</option>
                    </select>
                  </div>
                </>
              )}

              {/* ANNOUNCEMENT FORM */}
              {modalType === 'notification' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Announcement Title</label>
                    <input
                      type="text"
                      required
                      value={formValues.title || ''}
                      onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                      placeholder="e.g. Science Laboratory Maintenance"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Target Audience Recipient</label>
                    <select
                      value={formValues.recipient || 'ALL'}
                      onChange={(e) => setFormValues({ ...formValues, recipient: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                    >
                      <option value="ALL">All Users (Global)</option>
                      <option value="TEACHER">Faculty (Teachers)</option>
                      <option value="PARENT">Parents</option>
                      <option value="STUDENT">Students</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Broadcasting Message Content</label>
                    <textarea
                      required
                      rows={4}
                      value={formValues.message || ''}
                      onChange={(e) => setFormValues({ ...formValues, message: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                      placeholder="Write message details..."
                    />
                  </div>
                </>
              )}

              {/* BOOK FORM */}
              {modalType === 'book' && (
                <>
                  {/* DEVICE FILE UPLOAD COMPONENT - BOOK CHAPTER */}
                  <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-5 mb-4 relative overflow-hidden transition-all duration-200">
                    <input
                      id="book-file-upload"
                      type="file"
                      accept=".txt,.json,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const extension = file.name.split('.').pop()?.toLowerCase();
                          if (extension !== 'json' && extension !== 'txt' && extension !== 'pdf') {
                            setFileError('Invalid file type. Please upload a .txt, .json, or .pdf file.');
                            return;
                          }
                          setSelectedBookFile(file);
                          setFileError(null);
                        }
                      }}
                    />

                    {isParsingFile ? (
                      <div className="flex flex-col items-center text-center space-y-3 py-6">
                        <div className="relative">
                          <RefreshCw className="animate-spin text-indigo-600" size={36} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] text-slate-700 font-medium">
                            Loading Book Chapter: <span className="text-indigo-600 font-semibold">{selectedBookFile?.name}</span>
                          </p>
                        </div>
                      </div>
                    ) : selectedBookFile ? (
                      <div className="flex flex-col items-center justify-center p-4">
                        <div className="flex items-center gap-3 bg-white border border-slate-100 p-3.5 rounded-xl shadow-sm w-full max-w-md">
                          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                            <FileText size={20} />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-xs font-semibold text-slate-800 truncate font-mono">
                              {selectedBookFile.name}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                              {(selectedBookFile.size / 1024 / 1024).toFixed(2)} MB • {selectedBookFile.name.split('.').pop()?.toUpperCase()}
                            </p>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-500 mt-3 text-center leading-relaxed">
                          Click <span className="font-semibold text-indigo-600 font-mono">Add Book Chapter</span> to load this entire file.
                        </p>

                        <div className="flex items-center gap-2 mt-4 w-full max-w-md justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBookFile(null);
                              setFileError(null);
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            <X size={14} />
                            Cancel / Clear
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBookFile(selectedBookFile)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold transition-colors shadow-sm"
                          >
                            <Sparkles size={14} />
                            Add Book Chapter
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer ${
                          dragActive ? 'border-indigo-500 bg-indigo-50/40' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-100/50'
                        }`}
                        onClick={() => document.getElementById('book-file-upload')?.click()}
                      >
                        <div className="p-2.5 bg-white shadow-sm border border-slate-100 rounded-full text-indigo-600">
                          <UploadCloud size={24} />
                        </div>
                        <div className="mt-2 text-center">
                          <p className="text-xs font-bold text-slate-700">
                            Book Chapter Upload
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Drag and drop a <span className="font-semibold text-indigo-600 font-mono">.txt</span>, <span className="font-semibold text-indigo-600 font-mono">.json</span>, or <span className="font-semibold text-indigo-600 font-mono">.pdf</span> file, or click to browse
                          </p>
                        </div>
                        <span className="text-[9px] bg-indigo-250/60 px-2 py-0.5 rounded-full text-indigo-600 font-semibold font-mono mt-2">
                          Supports entire upload path (.pdf, .txt, .json)
                        </span>
                      </div>
                    )}

                    {fileError && (
                      <div className="mt-3 flex items-start gap-2 p-2 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-[10px] text-left">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <p>{fileError}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Book Title</label>
                      <input
                        type="text"
                        required
                        value={formValues.title || ''}
                        onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                        placeholder="e.g. Introduction to Physics"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Author</label>
                      <input
                        type="text"
                        required
                        value={formValues.author || ''}
                        onChange={(e) => setFormValues({ ...formValues, author: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                        placeholder="e.g. Dr. Jane Smith"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Grade Level</label>
                      <select
                        value={formValues.grade_level || 'High'}
                        onChange={(e) => setFormValues({ ...formValues, grade_level: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                      >
                        <option value="KG">KG</option>
                        <option value="Elementary">Elementary</option>
                        <option value="Middle">Middle</option>
                        <option value="High">High</option>
                        <option value="Grade 12">Grade 12</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Subject</label>
                      <input
                        type="text"
                        required
                        value={formValues.subject || ''}
                        onChange={(e) => setFormValues({ ...formValues, subject: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                        placeholder="e.g. Science"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Cover URL (Optional)</label>
                    <input
                      type="text"
                      value={formValues.cover_url || ''}
                      onChange={(e) => setFormValues({ ...formValues, cover_url: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Description</label>
                    <textarea
                      rows={2}
                      value={formValues.description || ''}
                      onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                      placeholder="Brief overview of the textbook content..."
                    />
                  </div>

                  {/* Chapters Dynamic Fields */}
                  <div className="border-t border-slate-100 pt-4 mt-2">
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Book Chapters</label>
                      <div className="flex items-center gap-2">
                        {formValues.chapters && formValues.chapters.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to remove all chapters from this textbook?')) {
                                setFormValues({ ...formValues, chapters: [] });
                              }
                            }}
                            className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded transition-all"
                          >
                            <Trash2 size={12} />
                            Clear All
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const updatedChapters = [...(formValues.chapters || [])];
                            updatedChapters.push({ title: `Chapter ${updatedChapters.length + 1}`, content: '' });
                            setFormValues({ ...formValues, chapters: updatedChapters });
                          }}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded transition-all"
                        >
                          <Plus size={12} />
                          Add Chapter
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {(!formValues.chapters || formValues.chapters.length === 0) ? (
                        <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                          <p className="text-xs text-slate-400 italic">No chapters added yet. Click 'Add Chapter' or select a file under 'Book Chapter Upload' above.</p>
                        </div>
                      ) : (
                        formValues.chapters.map((ch: any, idx: number) => (
                          <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 relative">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-mono font-bold text-slate-500">Chapter {idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedChapters = [...formValues.chapters];
                                  updatedChapters.splice(idx, 1);
                                  setFormValues({ ...formValues, chapters: updatedChapters });
                                }}
                                className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded transition-colors flex items-center gap-0.5 text-[10px] font-bold"
                                title="Remove Chapter"
                              >
                                <X size={12} />
                                Remove
                              </button>
                            </div>
                            <input
                              type="text"
                              required
                              placeholder="Chapter Title"
                              value={ch.title || ''}
                              onChange={(e) => {
                                const updatedChapters = [...formValues.chapters];
                                updatedChapters[idx] = { ...updatedChapters[idx], title: e.target.value };
                                setFormValues({ ...formValues, chapters: updatedChapters });
                              }}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:outline-none"
                            />
                            {ch.content && ch.content.startsWith('data:application/pdf;base64,') ? (
                              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-2.5 flex justify-between items-center">
                                <span className="text-[10px] text-indigo-700 font-semibold font-mono">📎 Loaded PDF File ({((ch.content.length * 0.75) / 1024 / 1024).toFixed(2)} MB)</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedChapters = [...formValues.chapters];
                                    updatedChapters[idx] = { ...updatedChapters[idx], content: '' };
                                    setFormValues({ ...formValues, chapters: updatedChapters });
                                  }}
                                  className="text-[10px] text-rose-600 hover:text-rose-800 font-bold hover:bg-rose-50 px-1.5 py-0.5 rounded transition-colors"
                                >
                                  Clear PDF
                                </button>
                              </div>
                            ) : (
                              <textarea
                                required
                                rows={3}
                                placeholder="Chapter Content..."
                                value={ch.content || ''}
                                onChange={(e) => {
                                  const updatedChapters = [...formValues.chapters];
                                  updatedChapters[idx] = { ...updatedChapters[idx], content: e.target.value };
                                  setFormValues({ ...formValues, chapters: updatedChapters });
                                }}
                                className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:outline-none font-mono text-[11px]"
                              />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setModalType(null);
                    setEditingId(null);
                    setFormValues({});
                    setSelectedBookFile(null);
                    setFileError(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-xl text-xs transition-colors shadow-sm"
                >
                  {editingId ? 'Save Profile Changes' : 'Confirm & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
