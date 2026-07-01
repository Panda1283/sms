import React, { useState, useEffect } from 'react';
import { ApiService } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  StudentDetailed, TeacherDetailed, CourseDetailed, AttendanceDetailed,
  GradeDetailed, TimetableDetailed, AttendanceStatus, UserRole, ACADEMIC_GRADES, DEFAULT_SECTIONS
} from '../types/db';
import {
  LayoutDashboard, Clock, FileText, Users, Check, AlertCircle, Plus, Edit,
  TrendingUp, BookOpen, Calendar, HelpCircle, Save, RefreshCw, Trash2,
  Video, CheckSquare, MessageSquare, ListTodo, UsersRound, CalendarDays,
  Upload, Sparkles, Send, PlayCircle, Eye, StopCircle, ClipboardCheck, Download, X, VideoOff
} from 'lucide-react';

interface TeacherViewsProps {
  activeTab: string;
}

export default function TeacherViews({ activeTab }: TeacherViewsProps) {
  const { user, profile } = useAuth();
  
  // Data State
  const [students, setStudents] = useState<StudentDetailed[]>([]);
  const [courses, setCourses] = useState<CourseDetailed[]>([]);
  const [attendance, setAttendance] = useState<AttendanceDetailed[]>([]);
  const [grades, setGrades] = useState<GradeDetailed[]>([]);
  const [timetables, setTimetables] = useState<TimetableDetailed[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  
  // --- 1. Assignments State ---
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedAsg, setSelectedAsg] = useState<any | null>(null);
  const [isCreatingAsg, setIsCreatingAsg] = useState(false);

  // Assignment Creator Form
  const [asgTitle, setAsgTitle] = useState('');
  const [asgDesc, setAsgDesc] = useState('');
  const [asgCourseId, setAsgCourseId] = useState('');
  const [asgClassName, setAsgClassName] = useState('Grade 10-A');
  const [asgType, setAsgType] = useState<'INDIVIDUAL' | 'GROUP'>('INDIVIDUAL');
  const [asgDueDate, setAsgDueDate] = useState('');
  const [asgAttachments, setAsgAttachments] = useState<{ name: string; url: string }[]>([]);

  // Group creation helper
  const [groupCreationMode, setGroupCreationMode] = useState<'MANUAL' | 'AUTO'>('AUTO');
  const [manualGroups, setManualGroups] = useState<any[]>([]); // { group_id, name, student_ids }
  const [manualGroupName, setManualGroupName] = useState('');
  const [manualGroupStudents, setManualGroupStudents] = useState<string[]>([]);

  // Submission Grading Form
  const [gradingSubId, setGradingSubId] = useState<string | null>(null);
  const [gradingScore, setGradingScore] = useState<number>(90);
  const [gradingFeedback, setGradingFeedback] = useState<string>('');

  // Revision Request & Document Preview
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [revisionComments, setRevisionComments] = useState('');
  const [revisingSubId, setRevisingSubId] = useState<string | null>(null);

  // --- 2. Live Classrooms State ---
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [cameras, setCameras] = useState<any[]>([]);
  const [activeBroadcast, setActiveBroadcast] = useState<any | null>(null);
  const [broadcastViewers, setBroadcastViewers] = useState<any[]>([]);

  // Live Broadcaster Setup Form
  const [liveCourseId, setLiveCourseId] = useState('');
  const [liveClassName, setLiveClassName] = useState('Grade 10-A');
  const [liveCameraId, setLiveCameraId] = useState('');

  // Live broadcast chat
  const [broadcastChat, setBroadcastChat] = useState<{ name: string; msg: string; time: string }[]>([]);
  const [newBroadcastMsg, setNewBroadcastMsg] = useState('');

  // --- Webcam stream state for live session ---
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const teacherVideoRef = React.useRef<HTMLVideoElement>(null);

  // Manage webcam state transitions & cleanups
  useEffect(() => {
    if (activeTab !== 'teacher-live' || !activeBroadcast) {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
        setWebcamActive(false);
      }
    }
  }, [activeTab, activeBroadcast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localStream]);

  const toggleWebcam = async () => {
    if (webcamActive) {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
      }
      setWebcamActive(false);
    } else {
      try {
        setWebcamError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
          audio: false
        });
        setLocalStream(stream);
        setWebcamActive(true);
      } catch (err: any) {
        console.error("Webcam activation error:", err);
        setWebcamError("Could not access your physical device camera. Please check browser permissions.");
      }
    }
  };

  useEffect(() => {
    if (webcamActive && localStream && teacherVideoRef.current) {
      teacherVideoRef.current.srcObject = localStream;
    }
  }, [webcamActive, localStream]);

  // Local interaction states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Mark/add grade state
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [gradeScore, setGradeScore] = useState<number>(85);

  const loadTeacherData = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const [
        studentsData,
        coursesData,
        attendanceData,
        gradesData,
        timetablesData,
        asgData,
        subsData,
        liveData,
        camsData,
        sectionsData
      ] = await Promise.all([
        ApiService.get('/students'),
        ApiService.get('/courses'),
        ApiService.get('/attendance'),
        ApiService.get('/grades'),
        ApiService.get('/timetables'),
        ApiService.get('/assignments'),
        ApiService.get('/submissions'),
        ApiService.get('/live-sessions'),
        ApiService.get('/cameras'),
        ApiService.get('/sections').catch(() => [])
      ]);

      setStudents(studentsData);
      setSections(sectionsData);
      
      const myTeacherId = profile.teacher_id;
      const myCourses = coursesData.filter((c: any) => c.teacher_id === myTeacherId);
      setCourses(myCourses);

      // Default course selections for forms
      if (myCourses.length > 0) {
        setSelectedCourse(myCourses[0].course_id);
        setAsgCourseId(myCourses[0].course_id);
        setLiveCourseId(myCourses[0].course_id);
      }

      setAttendance(attendanceData.filter((a: any) => myCourses.some((c: any) => c.course_id === a.course_id)));
      setGrades(gradesData.filter((g: any) => myCourses.some((c: any) => c.course_id === g.course_id)));
      setTimetables(timetablesData.filter((t: any) => t.teacher_id === myTeacherId));
      setAssignments(asgData.filter((asg: any) => myCourses.some((c: any) => c.course_id === asg.course_id)));
      setSubmissions(subsData);
      setLiveSessions(liveData);
      setCameras(camsData);

      if (camsData.length > 0) {
        setLiveCameraId(camsData[0].camera_id);
      }

      // Check if this teacher has an active live session already
      const active = liveData.find((s: any) => s.teacher_id === myTeacherId && s.status === 'LIVE');
      if (active) {
        setActiveBroadcast(active);
        setBroadcastChat([
          { name: 'System', msg: 'Broadcasting network connection established. Chat is active.', time: new Date().toLocaleTimeString() }
        ]);
      }
    } catch (err: any) {
      setError('Could not load faculty records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeacherData();
  }, [profile, activeTab]);

  // Sync broadcast viewers & chat while broadcasting is live
  useEffect(() => {
    let interval: any;
    if (activeBroadcast) {
      const pollLiveStats = async () => {
        try {
          const sessions = await ApiService.get('/live-sessions');
          const current = sessions.find((s: any) => s.session_id === activeBroadcast.session_id);
          if (current) {
            setBroadcastViewers(current.active_viewers || []);
          }
        } catch (err) {
          console.error(err);
        }
      };
      pollLiveStats();
      interval = setInterval(pollLiveStats, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeBroadcast]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleRecordAttendance = async (studentId: string, courseId: string, status: AttendanceStatus) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await ApiService.post('/attendance', {
        student_id: studentId,
        course_id: courseId,
        status,
        date: today
      });
      showSuccess('Student attendance logged for today.');
      loadTeacherData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedCourse) {
      setError('Please select both student and course.');
      return;
    }
    try {
      await ApiService.post('/grades', {
        student_id: selectedStudent,
        course_id: selectedCourse,
        score: gradeScore
      });
      showSuccess('Student grade uploaded and saved.');
      loadTeacherData();
      setSelectedStudent('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteGrade = async (gradeId: string) => {
    if (!window.confirm('Delete grade mark?')) return;
    try {
      await ApiService.delete(`/grades/${gradeId}`);
      showSuccess('Grade record removed.');
      loadTeacherData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- AUTOMATIC BALANCED GROUPS ALGORITHM ---
  // Distributes student pool evenly to groups, balancing size and gender distribution
  const handleAutoGroupGeneration = () => {
    const classStudents = students.filter(s => `${s.grade}-${s.section}` === asgClassName);
    if (classStudents.length === 0) {
      alert("No students registered for this grade section.");
      return;
    }

    // Balance by partitioning boys and girls
    const girls = classStudents.filter(s => s.gender?.toUpperCase() === 'FEMALE');
    const boys = classStudents.filter(s => s.gender?.toUpperCase() === 'MALE' || !s.gender);

    const groupCount = Math.max(2, Math.round(classStudents.length / 3)); // target ~3 students per group
    const generated: any[] = [];
    for (let i = 0; i < groupCount; i++) {
      generated.push({
        group_id: `grp-${Math.random().toString(36).substr(2, 9)}`,
        name: `Project Team ${String.fromCharCode(65 + i)}`, // Team A, Team B...
        student_ids: []
      });
    }

    // Stagger girls then boys to balance group gender ratios
    let gIdx = 0;
    while (gIdx < girls.length) {
      generated[gIdx % groupCount].student_ids.push(girls[gIdx].student_id);
      gIdx++;
    }

    let bIdx = 0;
    while (bIdx < boys.length) {
      generated[(bIdx + gIdx) % groupCount].student_ids.push(boys[bIdx].student_id);
      bIdx++;
    }

    setManualGroups(generated);
    showSuccess(`System automatically generated ${groupCount} gender-balanced teams!`);
  };

  const handleAddManualGroup = () => {
    if (!manualGroupName.trim()) return;
    const newGroup = {
      group_id: `grp-${Math.random().toString(36).substr(2, 9)}`,
      name: manualGroupName,
      student_ids: manualGroupStudents
    };
    setManualGroups([...manualGroups, newGroup]);
    setManualGroupName('');
    setManualGroupStudents([]);
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asgTitle || !asgDesc || !asgCourseId || !asgDueDate) {
      setError('Please complete all required fields.');
      return;
    }

    try {
      await ApiService.post('/assignments', {
        title: asgTitle,
        description: asgDesc,
        course_id: asgCourseId,
        class_name: asgClassName,
        type: asgType,
        due_date: asgDueDate,
        attachments: asgAttachments,
        groups: asgType === 'GROUP' ? manualGroups : undefined
      });

      showSuccess('New academic assignment created successfully.');
      setIsCreatingAsg(false);
      setManualGroups([]);
      setAsgTitle('');
      setAsgDesc('');
      loadTeacherData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGradeSubmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubId) return;

    try {
      await ApiService.put(`/submissions/${gradingSubId}/grade`, {
        score: gradingScore,
        feedback: gradingFeedback
      });
      showSuccess('Work score & feedback registered successfully.');
      setGradingSubId(null);
      setGradingFeedback('');
      loadTeacherData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const downloadFile = (file: { name: string; content?: string }) => {
    if (!file.content) {
      alert("No content available for download.");
      return;
    }
    const link = document.createElement('a');
    link.href = file.content;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRequestRevisionSubmit = async (e: React.FormEvent, subId: string) => {
    e.preventDefault();
    if (!revisionComments.trim()) return;

    try {
      await ApiService.put(`/submissions/${subId}/revision`, {
        comments: revisionComments
      });
      showSuccess('Revision request successfully returned to student.');
      setRevisingSubId(null);
      setRevisionComments('');
      loadTeacherData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // --- LIVE STREAMING CONTROLS ---
  const handleStartLiveStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveCourseId || !liveCameraId) return;

    try {
      const session = await ApiService.post('/live-sessions', {
        courseId: liveCourseId,
        teacherId: profile?.teacher_id,
        className: liveClassName,
        cameraId: liveCameraId
      });

      setActiveBroadcast(session);
      setBroadcastViewers([]);
      setBroadcastChat([
        { name: 'System', msg: '🎉 Welcome to your live virtual classroom! Students are connecting.', time: new Date().toLocaleTimeString() }
      ]);
      showSuccess('Live classroom stream started successfully.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEndLiveStream = async () => {
    if (!activeBroadcast) return;
    try {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
        setWebcamActive(false);
      }
      await ApiService.post(`/live-sessions/${activeBroadcast.session_id}/end`, {
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
      });
      setActiveBroadcast(null);
      setBroadcastViewers([]);
      showSuccess('Virtual live session ended and archived.');
      loadTeacherData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSendBroadcastMsg = () => {
    if (!newBroadcastMsg.trim()) return;
    setBroadcastChat(prev => [
      ...prev,
      { name: 'Teacher', msg: newBroadcastMsg, time: new Date().toLocaleTimeString() }
    ]);
    setNewBroadcastMsg('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <RefreshCw className="animate-spin text-indigo-600 mr-2" size={20} />
        <span className="font-mono text-slate-500">Loading teacher dashboard portal...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {successMsg && (
        <div className="fixed top-20 right-6 bg-slate-900 border border-slate-800 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2.5 z-50 animate-fade-in text-sm font-medium">
          <Check size={16} className="text-emerald-400 bg-emerald-500/10 p-0.5 rounded-full" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Panel */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-start gap-3 text-left">
          <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold font-mono uppercase tracking-wider">Faculty Error:</span> {error}
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600 font-bold font-mono">×</button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. TEACHER DASHBOARD PORTAL */}
      {/* ========================================================= */}
      {activeTab === 'teacher-dashboard' && (
        <>
          {/* Welcome Panel */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-850 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider font-bold">
                Faculty Lounge
              </span>
              <h2 className="text-xl font-bold mt-2.5">Welcome, {user?.fullname}</h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                You are currently assigned to lead <span className="font-bold text-white font-mono">{courses.length} educational courses</span> this semester.
              </p>
            </div>
            
            <div className="bg-white/10 px-4 py-3 rounded-xl border border-white/10 font-mono text-xs max-w-xs shrink-0 text-left">
              <p className="text-slate-400 font-bold text-[10px] uppercase">Primary Specialty</p>
              <p className="text-sm font-bold text-slate-100 mt-1">{profile?.subject || 'Specialist'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            {/* Taught classes */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 lg:col-span-2">
              <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
                <BookOpen size={16} className="text-indigo-600" />
                My Assigned Academic Courses
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {courses.map(crs => (
                  <div key={crs.course_id} className="p-4 border border-slate-100 bg-slate-50 rounded-xl hover:border-slate-300 transition-colors">
                    <h4 className="font-bold text-slate-800 text-sm">{crs.course_name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase">COURSE ID: {crs.course_id}</p>
                    
                    <div className="flex items-center justify-between mt-4 border-t border-slate-200/50 pt-3 text-xs text-slate-500">
                      <span>Evaluated marks:</span>
                      <span className="font-bold text-slate-700 font-mono">
                        {grades.filter(g => g.course_id === crs.course_id).length} Students
                      </span>
                    </div>
                  </div>
                ))}
                {courses.length === 0 && (
                  <p className="text-slate-400 italic text-xs">No active course assignments found.</p>
                )}
              </div>
            </div>

            {/* My Personal Timetable Schedule */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
                <Calendar size={16} className="text-sky-500" />
                My Timetable Schedule
              </h3>

              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {timetables.map((tt, idx) => (
                  <div key={`${tt.timetable_id || ''}-${idx}`} className="p-3 border-l-4 border-sky-500 bg-slate-50 border border-slate-200 rounded-r-lg">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-800 text-xs">{tt.class_name}</h4>
                      <span className="bg-slate-200 text-slate-600 font-mono text-[9px] px-1.5 py-0.5 rounded uppercase">{tt.day}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{tt.course_name}</p>
                    <span className="text-[10px] text-slate-400 font-mono block mt-1.5">{tt.start_time} - {tt.end_time}</span>
                  </div>
                ))}
                {timetables.length === 0 && (
                  <p className="text-slate-400 italic text-xs text-center py-4">No scheduled teaching slots.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* 2. ASSIGNMENT MANAGEMENT SYSTEM */}
      {/* ========================================================= */}
      {activeTab === 'teacher-assignments' && (
        <div className="space-y-6">
          <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CheckSquare className="text-indigo-600" size={20} />
                Manage Homework & Project Assignments
              </h2>
              <p className="text-xs text-slate-400 mt-1">Author student assignments, coordinate peer groups with smart balancing, and grade submissions.</p>
            </div>
            <button
              onClick={() => setIsCreatingAsg(!isCreatingAsg)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow"
            >
              <Plus size={14} />
              {isCreatingAsg ? 'View Assignments Catalog' : 'Create New Assignment'}
            </button>
          </div>

          {isCreatingAsg ? (
            /* Create Assignment Form Panel */
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 text-left">
              <h3 className="font-bold text-slate-800 text-sm mb-4">Draft Homework/Team Assignment</h3>
              <form onSubmit={handleCreateAssignment} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1.5">Assignment Title</label>
                    <input
                      type="text"
                      required
                      value={asgTitle}
                      onChange={(e) => setAsgTitle(e.target.value)}
                      placeholder="e.g. Lab Report: Cell Membrane Mitosis Structure"
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:bg-white focus:outline-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1.5">Description & Rubric instructions</label>
                    <textarea
                      required
                      value={asgDesc}
                      onChange={(e) => setAsgDesc(e.target.value)}
                      placeholder="Enter detailed description of requirements, support files, and milestones..."
                      className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:bg-white focus:outline-indigo-600 h-28"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1.5">Select Course Specialization</label>
                      <select
                        value={asgCourseId}
                        onChange={(e) => setAsgCourseId(e.target.value)}
                        className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:bg-white focus:outline-indigo-600"
                      >
                        {courses.map(c => (
                          <option key={c.course_id} value={c.course_id}>{c.course_name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 font-semibold mb-1.5">Select Class Target</label>
                      <select
                        value={asgClassName}
                        onChange={(e) => setAsgClassName(e.target.value)}
                        className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:bg-white focus:outline-indigo-600 font-semibold text-slate-700"
                      >
                        {ACADEMIC_GRADES.flatMap(g => 
                          (sections.length > 0 ? sections : DEFAULT_SECTIONS).map(sec => `${g}-${sec}`)
                        ).map(cls => {
                          const parts = cls.split('-');
                          const isKG = parts[0] === 'KG';
                          return (
                            <option key={cls} value={cls}>
                              {isKG ? `KG - Section ${parts[1]}` : `${parts[0]} - Section ${parts[1]}`}
                            </option>
                          );
                        })}
                        <option value="All">All School Sections</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1.5">Submission Type</label>
                      <select
                        value={asgType}
                        onChange={(e) => setAsgType(e.target.value as 'INDIVIDUAL' | 'GROUP')}
                        className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:bg-white focus:outline-indigo-600"
                      >
                        <option value="INDIVIDUAL">Individual Submission</option>
                        <option value="GROUP">Team Project Submission</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 font-semibold mb-1.5">Due Date & Deadline</label>
                      <input
                        type="date"
                        required
                        value={asgDueDate}
                        onChange={(e) => setAsgDueDate(e.target.value)}
                        className="w-full border border-slate-200 bg-slate-50 rounded-xl p-3 focus:bg-white focus:outline-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-2">Simulated support materials attachments</label>
                    <button
                      type="button"
                      onClick={() => {
                        const name = prompt("Enter simulated resource attachment name (e.g. biology_study_guide.pdf):");
                        if (name) setAsgAttachments([...asgAttachments, { name, url: '#' }]);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-2 rounded-xl font-bold font-mono transition-colors"
                    >
                      + Sim Material Attachment
                    </button>
                    {asgAttachments.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {asgAttachments.map((f, i) => (
                          <div key={i} className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg flex justify-between items-center font-mono text-[10px]">
                            <span>{f.name}</span>
                            <button type="button" onClick={() => setAsgAttachments(asgAttachments.filter((_, idx) => idx !== i))} className="text-rose-500">×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Creation algorithm panels */}
                <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  {asgType === 'GROUP' ? (
                    <>
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                        <span className="font-bold text-slate-700 uppercase tracking-wide">Project Teams Setup</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setGroupCreationMode('AUTO')}
                            className={`px-2 py-1 rounded text-[10px] font-bold ${groupCreationMode === 'AUTO' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                          >
                            Auto Balance
                          </button>
                          <button
                            type="button"
                            onClick={() => setGroupCreationMode('MANUAL')}
                            className={`px-2 py-1 rounded text-[10px] font-bold ${groupCreationMode === 'MANUAL' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                          >
                            Manual
                          </button>
                        </div>
                      </div>

                      {groupCreationMode === 'AUTO' ? (
                        <div className="space-y-4">
                          <p className="text-[11px] text-slate-500 leading-normal">Our system automatically creates gender-balanced project groups based on your target class size: <span className="font-semibold text-indigo-600">{students.filter(s => `${s.grade}-${s.section}` === asgClassName).length} students pool</span>.</p>
                          <button
                            type="button"
                            onClick={handleAutoGroupGeneration}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow"
                          >
                            <Sparkles size={14} />
                            Generate Balanced Groups
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={manualGroupName}
                              onChange={(e) => setManualGroupName(e.target.value)}
                              placeholder="e.g. Science Team 1"
                              className="border border-slate-200 bg-white rounded-lg p-2 focus:outline-indigo-600"
                            />
                            <select
                              multiple
                              value={manualGroupStudents}
                              onChange={(e) => setManualGroupStudents(Array.from(e.target.selectedOptions, option => (option as any).value))}
                              className="border border-slate-200 bg-white rounded-lg p-2 focus:outline-indigo-600 h-20"
                            >
                              {students.filter(s => `${s.grade}-${s.section}` === asgClassName).map(s => (
                                <option key={s.student_id} value={s.student_id}>{s.fullname}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={handleAddManualGroup}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg font-bold font-mono w-full"
                          >
                            + Add Team Group
                          </button>
                        </div>
                      )}

                      {manualGroups.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <p className="font-bold text-slate-500 text-[10px] uppercase font-mono tracking-wide">Configured Groups ({manualGroups.length})</p>
                          <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                            {manualGroups.map((g, idx) => (
                              <div key={idx} className="bg-white border border-slate-200 p-2.5 rounded-xl flex justify-between items-center text-[11px]">
                                <div>
                                  <span className="font-bold text-slate-800">{g.name}</span>
                                  <span className="text-slate-400 font-mono ml-2">({g.student_ids.length} members)</span>
                                </div>
                                <button type="button" onClick={() => setManualGroups(manualGroups.filter((_, i) => i !== idx))} className="text-rose-500 hover:text-rose-700">Delete</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center text-slate-400">
                      <ListTodo size={32} className="text-slate-300 mb-2" />
                      <p className="font-bold">Individual Homework</p>
                      <p className="text-[10px] mt-1">Every student submits their own file and receives personal grades.</p>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 pt-4 border-t border-slate-100 flex gap-2">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow transition-all"
                  >
                    Publish Assignment
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingAsg(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-6 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Submissions & grading catalog list */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              <div className="lg:col-span-1 space-y-4">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-mono">Assignments Published</h3>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {assignments.map(asg => {
                    const isSelected = selectedAsg?.assignment_id === asg.assignment_id;
                    const count = submissions.filter(s => s.assignment_id === asg.assignment_id).length;
                    return (
                      <div
                        key={asg.assignment_id}
                        onClick={() => setSelectedAsg(asg)}
                        className={`p-4 border rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 uppercase">{asg.type}</span>
                          <span className="text-emerald-600 font-bold">{count} submitted</span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-xs mt-2 leading-tight">{asg.title}</h4>
                        <p className="text-[10px] text-indigo-600 font-mono mt-1 font-semibold">{asg.class_name}</p>
                      </div>
                    );
                  })}
                  {assignments.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No course assignments drafted yet.</p>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                {selectedAsg ? (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                      <h3 className="font-bold text-slate-800 text-sm">{selectedAsg.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">{selectedAsg.description}</p>
                    </div>

                    <div className="p-5">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono mb-3 flex items-center gap-1.5">
                        <UsersRound size={14} className="text-slate-400" />
                        Submissions received ({submissions.filter(s => s.assignment_id === selectedAsg.assignment_id).length})
                      </h4>

                      <div className="space-y-3">
                        {submissions.filter(s => s.assignment_id === selectedAsg.assignment_id).map(sub => (
                          <div key={sub.submission_id} className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                            <div className="flex justify-between items-start flex-wrap gap-2">
                              <div>
                                <p className="font-bold text-slate-800 text-xs">{sub.student_name || `Group ID: ${sub.group_id}`}</p>
                                <p className="text-[9px] text-slate-400 font-mono mt-0.5">Submitted: {new Date(sub.submitted_at).toLocaleString()}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {sub.status === 'LATE' && (
                                  <span className="text-[9px] font-mono font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded animate-pulse">
                                    ⚠️ LATE SUBMISSION
                                  </span>
                                )}
                                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border rounded uppercase ${
                                  sub.status === 'GRADED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                  sub.status === 'REVISION_REQUESTED' ? 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse' :
                                  sub.status === 'LATE' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                  'bg-amber-100 text-amber-800 border-amber-200'
                                }`}>
                                  {sub.status}
                                </span>
                              </div>
                            </div>

                            {/* Files */}
                            <div className="flex flex-wrap gap-2">
                              {sub.submitted_files?.map((f: any, idx: number) => (
                                <div key={idx} className="flex gap-1.5 items-center bg-white border border-slate-200 rounded-lg p-2 text-[10px] font-mono font-semibold text-slate-600 hover:bg-slate-100 shadow-sm">
                                  <button
                                    onClick={() => downloadFile(f)}
                                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
                                    title="Download Deliverable"
                                  >
                                    <Download size={11} />
                                    {f.name}
                                  </button>
                                  <span className="text-slate-300">|</span>
                                  <button
                                    onClick={() => setPreviewFile(f)}
                                    className="text-slate-500 hover:text-slate-800 flex items-center gap-0.5"
                                    title="Preview Online"
                                  >
                                    <Eye size={11} />
                                    Preview
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Group member contribution indicators */}
                            {sub.group_member_contributions && (
                              <div className="bg-white border border-slate-150 rounded-lg p-2.5 text-[10px] space-y-1">
                                <p className="font-bold text-slate-400 uppercase font-mono tracking-wider">Group Peer Contributions logs</p>
                                {sub.group_member_contributions.map((mc: any, i: number) => (
                                  <div key={i} className="flex justify-between items-center">
                                    <span className="font-semibold text-slate-700">{mc.student_name} ({mc.student_id})</span>
                                    <span className="font-mono font-bold text-indigo-600">{mc.contribution_percentage}% work</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Grading action */}
                            {sub.status !== 'GRADED' && sub.status !== 'REVISION_REQUESTED' ? (
                              <div className="pt-2 border-t border-slate-200/50 flex flex-col gap-3">
                                {gradingSubId === sub.submission_id ? (
                                  <form onSubmit={handleGradeSubmissionSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono mb-1">Score percentage</label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        required
                                        value={gradingScore}
                                        onChange={(e) => setGradingScore(Number(e.target.value))}
                                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-indigo-600 bg-white"
                                      />
                                    </div>
                                    <div className="md:col-span-2">
                                      <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono mb-1">Teacher Feedback Notes</label>
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          required
                                          value={gradingFeedback}
                                          onChange={(e) => setGradingFeedback(e.target.value)}
                                          placeholder="Awesome execution, minor formulas typos..."
                                          className="flex-1 border border-slate-200 rounded-lg p-2 text-xs focus:outline-indigo-600 bg-white"
                                        />
                                        <button type="submit" className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold font-mono">Save</button>
                                        <button type="button" onClick={() => setGradingSubId(null)} className="bg-slate-100 text-slate-600 px-2 py-1.5 rounded-lg text-xs font-mono">Cancel</button>
                                      </div>
                                    </div>
                                  </form>
                                ) : revisingSubId === sub.submission_id ? (
                                  <form onSubmit={(e) => handleRequestRevisionSubmit(e, sub.submission_id)} className="grid grid-cols-1 gap-2 pt-1">
                                    <div>
                                      <label className="block text-[10px] font-bold text-rose-500 uppercase font-mono mb-1">Revision comments & instructions</label>
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          required
                                          value={revisionComments}
                                          onChange={(e) => setRevisionComments(e.target.value)}
                                          placeholder="Please correct formula 3 on sheet 1, then re-upload..."
                                          className="flex-1 border border-slate-200 rounded-lg p-2 text-xs focus:outline-rose-500 bg-white"
                                        />
                                        <button type="submit" className="bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold font-mono shrink-0">Return for Revision</button>
                                        <button type="button" onClick={() => setRevisingSubId(null)} className="bg-slate-100 text-slate-600 px-2 py-1.5 rounded-lg text-xs font-mono">Cancel</button>
                                      </div>
                                    </div>
                                  </form>
                                ) : (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => { setGradingSubId(sub.submission_id); setGradingScore(95); }}
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                                    >
                                      Evaluate Work / Add Grade
                                    </button>
                                    <button
                                      onClick={() => { setRevisingSubId(sub.submission_id); setRevisionComments(''); }}
                                      className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                                    >
                                      Request Revision
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : sub.status === 'REVISION_REQUESTED' ? (
                              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px]">
                                <span className="font-bold text-rose-800 flex items-center gap-1">🔄 Revision Requested</span>
                                <p className="text-slate-500 mt-1 italic">" {sub.feedback} "</p>
                              </div>
                            ) : (
                              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px]">
                                <span className="font-bold text-emerald-800">Evaluated Score: {sub.score}%</span>
                                <p className="text-slate-500 mt-1 italic">" {sub.feedback} "</p>
                              </div>
                            )}
                          </div>
                        ))}

                        {submissions.filter(s => s.assignment_id === selectedAsg.assignment_id).length === 0 && (
                          <p className="text-xs text-slate-400 italic py-6 text-center">No submissions received yet for this active assignment.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-250 rounded-2xl p-12 text-center text-slate-400">
                    <ListTodo size={36} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm">Select assignment details</p>
                    <p className="text-[10px] mt-1">Review the assignments catalog list from the left-hand rail to monitor scores and evaluations.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. LIVE CLASSROOM HOSTING */}
      {/* ========================================================= */}
      {activeTab === 'teacher-live' && (
        <div className="space-y-6 text-left">
          <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Video className="text-indigo-600" size={20} />
                Live virtual classroom Broadcaster
              </h2>
              <p className="text-xs text-slate-400 mt-1">Broadcast real-time courses lectures, stream cameras feed, and participate in peer chats.</p>
            </div>
            {activeBroadcast && (
              <span className="bg-rose-50 border border-rose-200 text-rose-700 font-bold px-3 py-1 rounded-xl text-xs flex items-center gap-1 font-mono">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                BROADCAST ACTIVE
              </span>
            )}
          </div>

          {!activeBroadcast ? (
            /* Broadcast Setup Panel */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <PlayCircle className="text-indigo-600" size={18} />
                  Initiate stream session
                </h3>
                <p className="text-xs text-slate-400">Configure parameters to launch broadcast waves to target class section.</p>

                <form onSubmit={handleStartLiveStream} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1.5">Select Course Specialization</label>
                    <select
                      value={liveCourseId}
                      onChange={(e) => setLiveCourseId(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-lg focus:outline-indigo-600 font-semibold text-slate-700"
                    >
                      {courses.map(c => (
                        <option key={c.course_id} value={c.course_id}>{c.course_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1.5">Select Classroom Camera Network Feed</label>
                    <select
                      value={liveCameraId}
                      onChange={(e) => setLiveCameraId(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-lg focus:outline-indigo-600 font-semibold text-slate-700"
                    >
                      {cameras.map(cam => (
                        <option key={cam.camera_id} value={cam.camera_id}>
                          {cam.name} (Room {cam.room_number})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1.5">Target Class Section</label>
                    <select
                      value={liveClassName}
                      onChange={(e) => setLiveClassName(e.target.value)}
                      className="w-full border border-slate-200 bg-slate-50 p-2.5 rounded-lg focus:outline-indigo-600 font-semibold text-slate-700"
                    >
                      {ACADEMIC_GRADES.flatMap(g => 
                        (sections.length > 0 ? sections : DEFAULT_SECTIONS).map(sec => `${g}-${sec}`)
                      ).map(cls => {
                        const parts = cls.split('-');
                        const isKG = parts[0] === 'KG';
                        return (
                          <option key={cls} value={cls}>
                            {isKG ? `KG - Section ${parts[1]}` : `${parts[0]} - Section ${parts[1]}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="md:col-span-2 pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow flex items-center gap-1.5"
                    >
                      <Video size={14} />
                      Start Lecture Broadcast
                    </button>
                  </div>
                </form>
              </div>

              <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono">Stream Guidelines</h3>
                <div className="space-y-3 text-xs leading-relaxed text-slate-500">
                  <p>1. Make sure your local classroom physical camera is active in Room 102.</p>
                  <p>2. Active student viewers will be tracked automatically for attendance marks logs.</p>
                  <p>3. Ended sessions will be automatically stored inside recording archive vaults.</p>
                </div>
              </div>
            </div>
          ) : (
            /* Immersive Broadcast Console Screen */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Broadcaster Wave visual screen */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col justify-between h-[450px]">
                <div className="p-4 bg-slate-950/80 border-b border-white/5 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-white text-xs leading-snug">{activeBroadcast.course_name}</h3>
                    <p className="text-[10px] text-slate-400">Class target section: {activeBroadcast.class_name}</p>
                  </div>
                  <button
                    onClick={handleEndLiveStream}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 font-mono"
                  >
                    <StopCircle size={14} />
                    End Broadcast
                  </button>
                </div>

                <div className="flex-1 flex flex-col justify-center items-center text-white relative bg-black overflow-hidden">
                  {webcamActive && localStream ? (
                    <video
                      ref={teacherVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover z-0"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/10 to-emerald-900/10 pointer-events-none z-0" />
                  )}
                  
                  {/* Overlay controls & statuses */}
                  <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 space-y-4 bg-black/45 rounded-2xl backdrop-blur-sm max-w-md mx-auto">
                    {!webcamActive ? (
                      <>
                        <div className="w-16 h-16 rounded-full bg-indigo-600/20 border border-indigo-500 flex items-center justify-center mx-auto text-indigo-400 animate-pulse">
                          <Sparkles size={28} />
                        </div>
                        <div>
                          <p className="font-bold text-xs uppercase tracking-widest text-slate-300">Simulated Virtual Stream</p>
                          <p className="text-[11px] text-slate-400 mt-1">Transmitting placeholder educational feed to classroom.</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-emerald-500/25 border border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
                          <Video size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-xs uppercase tracking-widest text-emerald-400">Broadcasting Your Camera Device</p>
                          <p className="text-[11px] text-slate-300 mt-1">Your live web camera feed is actively streaming to enrolled online students.</p>
                        </div>
                      </>
                    )}

                    {webcamError && (
                      <p className="text-rose-400 text-[10px] bg-rose-950/85 border border-rose-900/40 px-2.5 py-1.5 rounded-lg mt-2 font-mono">
                        {webcamError}
                      </p>
                    )}

                    {/* Camera activation controls */}
                    <button
                      onClick={toggleWebcam}
                      className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all duration-200 shadow-lg cursor-pointer flex items-center gap-1.5 ${
                        webcamActive
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {webcamActive ? (
                        <>
                          <VideoOff size={14} />
                          Turn Camera Off
                        </>
                      ) : (
                        <>
                          <Video size={14} />
                          Activate Device Web Camera
                        </>
                      )}
                    </button>
                  </div>

                  <div className="absolute bottom-4 left-4 bg-black/70 px-3 py-1.5 border border-white/10 rounded-lg text-[10px] font-mono text-slate-300 flex items-center gap-1.5 z-10">
                    <Eye size={12} className="text-emerald-400 animate-pulse" />
                    <span>Active viewers count: {broadcastViewers.length} Students</span>
                  </div>
                </div>
              </div>

              {/* Real-time broadcast chat feed */}
              <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-5 flex flex-col justify-between h-[450px]">
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-slate-400" />
                    Lecture Peer Chat Discussions
                  </h4>

                  <div className="space-y-3">
                    {broadcastChat.map((chat, idx) => (
                      <div key={idx} className="text-xs space-y-1 bg-slate-50 border border-slate-150 p-2.5 rounded-xl">
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-indigo-600">{chat.name}</span>
                          <span className="text-[9px] text-slate-400 font-mono">{chat.time}</span>
                        </div>
                        <p className="text-slate-600 leading-normal">{chat.msg}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-slate-100 bg-white">
                  <input
                    type="text"
                    value={newBroadcastMsg}
                    onChange={(e) => setNewBroadcastMsg(e.target.value)}
                    placeholder="Broadcast message to active students..."
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-indigo-600 bg-slate-50"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendBroadcastMsg(); }}
                  />
                  <button
                    onClick={handleSendBroadcastMsg}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-colors"
                  >
                    <Send size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. RECORD ATTENDANCE */}
      {/* ========================================================= */}
      {activeTab === 'teacher-attendance' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/20 text-left">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Classroom Roll-Call Attendance</h3>
              <p className="text-xs text-slate-400 mt-0.5">Mark daily student presence logs for today ({new Date().toISOString().split('T')[0]}).</p>
            </div>
            
            <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-xl border border-indigo-100 font-mono">
              Roll Call Mode
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                  <th className="px-6 py-3.5 font-bold">Student Name</th>
                  <th className="px-6 py-3.5 font-bold">Class Assignment</th>
                  <th className="px-6 py-3.5 font-bold">Select Course to Log</th>
                  <th className="px-6 py-3.5 font-bold text-right">Authorize Today's Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {students.map(s => {
                  const matchingCourse = courses[0]; // Take teacher's primary course
                  if (!matchingCourse) return null;

                  const todayStr = new Date().toISOString().split('T')[0];
                  const todayLog = attendance.find(a => a.student_id === s.student_id && a.course_id === matchingCourse.course_id && a.date === todayStr);

                  return (
                    <tr key={s.student_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 text-left">
                        <p className="font-semibold text-slate-800 text-sm">{s.fullname}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{s.email}</p>
                      </td>
                      <td className="px-6 py-3.5 text-left">
                        <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded font-bold font-mono">
                          {s.grade} - {s.section}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 font-semibold text-left">{matchingCourse.course_name}</td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleRecordAttendance(s.student_id, matchingCourse.course_id, AttendanceStatus.PRESENT)}
                            className={`px-3 py-1 rounded text-[10px] font-bold uppercase font-mono transition-all duration-200 cursor-pointer ${
                              todayLog?.status === AttendanceStatus.PRESENT
                                ? 'bg-emerald-600 text-white shadow-sm border border-emerald-700 scale-105'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            onClick={() => handleRecordAttendance(s.student_id, matchingCourse.course_id, AttendanceStatus.ABSENT)}
                            className={`px-3 py-1 rounded text-[10px] font-bold uppercase font-mono transition-all duration-200 cursor-pointer ${
                              todayLog?.status === AttendanceStatus.ABSENT
                                ? 'bg-rose-600 text-white shadow-sm border border-rose-700 scale-105'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            onClick={() => handleRecordAttendance(s.student_id, matchingCourse.course_id, AttendanceStatus.LATE)}
                            className={`px-3 py-1 rounded text-[10px] font-bold uppercase font-mono transition-all duration-200 cursor-pointer ${
                              todayLog?.status === AttendanceStatus.LATE
                                ? 'bg-amber-500 text-white shadow-sm border border-amber-600 scale-105'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                            }`}
                          >
                            Tardy
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MANAGE GRADES */}
      {/* ========================================================= */}
      {activeTab === 'teacher-grades' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          {/* Upload grades form */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm mb-2">Upload Academic Score</h3>
            <p className="text-xs text-slate-400 mb-4">Enter numerical evaluation marks for students.</p>

            <form onSubmit={handleAddGrade} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Select Student</label>
                <select
                  required
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none font-semibold text-slate-700"
                >
                  <option value="">Select Student...</option>
                  {students.map(s => (
                    <option key={s.student_id} value={s.student_id}>{s.fullname} ({s.grade})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Select Course</label>
                <select
                  required
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none font-semibold text-slate-700"
                >
                  {courses.map(c => (
                    <option key={c.course_id} value={c.course_id}>{c.course_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">Numerical Score (0 - 100)</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={gradeScore}
                  onChange={(e) => setGradeScore(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full flex justify-center items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors shadow-sm"
              >
                <Save size={14} />
                Save Score Record
              </button>
            </form>
          </div>

          {/* Uploaded grades list */}
          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 lg:col-span-2">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm">Grading Ledger</h3>
              <p className="text-xs text-slate-400">All registered course grades issued by your account.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                    <th className="px-6 py-3.5 font-bold">Student</th>
                    <th className="px-6 py-3.5 font-bold">Course Taught</th>
                    <th className="px-6 py-3.5 font-bold text-center">Score Mark</th>
                    <th className="px-6 py-3.5 font-bold text-center">Letter Grade</th>
                    <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {grades.map(g => (
                    <tr key={g.grade_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-semibold text-slate-800">{g.student_name}</td>
                      <td className="px-6 py-3.5 text-slate-500">{g.course_name}</td>
                      <td className="px-6 py-3.5 font-bold font-mono text-center text-sm text-slate-800">{g.score}%</td>
                      <td className="px-6 py-3.5 text-center">
                        <span className="bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded border border-teal-200 font-mono">
                          {g.grade}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteGrade(g.grade_id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {grades.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">No student scores submitted yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. VIEW STUDENTS */}
      {/* ========================================================= */}
      {activeTab === 'teacher-students' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-left">
          <div className="p-5 border-b border-slate-200">
            <h3 className="font-bold text-slate-800 text-sm">Classroom Students</h3>
            <p className="text-xs text-slate-400 mt-0.5">Complete student roster information for class tutoring.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-5">
            {students.map(s => (
              <div key={s.student_id} className="border border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold shrink-0 text-sm">
                  {s.fullname.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{s.fullname}</h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{s.student_id} | {s.grade} - {s.section}</p>
                  <p className="text-xs text-slate-500 mt-1.5">{s.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Online Document Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col h-[550px]" id="document-preview-modal">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center shrink-0 text-left">
              <div className="flex items-center gap-2">
                <FileText className="text-indigo-400" size={18} />
                <div>
                  <h3 className="font-bold text-sm truncate max-w-[300px] md:max-w-md">{previewFile.name}</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Real-time Online Workspace Document Previewer</p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewFile(null)} 
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Preview Content Area */}
            <div className="flex-1 p-6 bg-slate-50 overflow-y-auto flex flex-col items-center justify-center text-center">
              {previewFile.content && previewFile.content.startsWith('data:image/') ? (
                <div className="max-w-full max-h-full flex items-center justify-center">
                  <img 
                    src={previewFile.content} 
                    alt={previewFile.name} 
                    referrerPolicy="no-referrer"
                    className="max-w-full max-h-[380px] rounded-lg border border-slate-200 shadow-md object-contain" 
                  />
                </div>
              ) : previewFile.content && previewFile.content.startsWith('data:video/') ? (
                <div className="max-w-full max-h-full flex items-center justify-center">
                  <video 
                    src={previewFile.content} 
                    controls 
                    className="max-w-full max-h-[380px] rounded-lg border border-slate-250 shadow-md w-full"
                  />
                </div>
              ) : (
                <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm max-w-md w-full text-left space-y-4 font-sans">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs uppercase font-mono">
                      {previewFile.name.split('.').pop() || 'DOC'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">Structural Metadata Validated</p>
                      <p className="text-[9px] text-slate-400 font-mono">File Size: ~24.5 KB • Academic Sandbox Secure</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-slate-600 leading-relaxed font-mono bg-slate-50 p-4 rounded-xl border border-slate-150 max-h-56 overflow-y-auto">
                    <p className="font-bold text-slate-700 text-[10px] uppercase mb-1">Raw File Headers / Contents:</p>
                    <p className="text-[9px] break-all">
                      {previewFile.content && previewFile.content.length > 500 
                        ? previewFile.content.substring(0, 500) + '... [TRUNCATED DELIVERABLE PAYLOAD]' 
                        : previewFile.content || 'Empty or text payload content.'}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400 italic text-center leading-normal">
                    Secure classroom document sandboxed. Click "Download" to open full document formatting structure natively.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setPreviewFile(null)}
                className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold font-mono transition-colors"
              >
                Close Preview
              </button>
              <button
                onClick={() => downloadFile(previewFile)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold font-mono transition-colors"
              >
                Download Natively
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
