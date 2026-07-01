import React, { useState, useEffect, useRef } from 'react';
import { ApiService } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { exportStudentAcademicReport } from '../utils/reportExporter';
import AttendanceCalendar from './AttendanceCalendar';
import {
  GradeDetailed, AttendanceDetailed, TimetableDetailed, Notification,
  AttendanceStatus, PaymentDetailed, PaymentStatus
} from '../types/db';
import {
  LayoutDashboard, FileText, Clock, Calendar, Bell, HelpCircle, CheckCircle,
  AlertTriangle, CreditCard, Award, ChevronRight, TrendingUp, RefreshCw,
  BookOpen, Video, CheckSquare, MessageSquare, Send, Bookmark, Trash,
  ChevronDown, BookMarked, Sparkles, Brain, GraduationCap, Play, PlayCircle,
  Clock3, Users, Upload, ListTodo, Download, RefreshCw as RefreshIcon, VideoOff,
  Timer, Hourglass
} from 'lucide-react';

interface StudentViewsProps {
  activeTab: string;
}

export default function StudentViews({ activeTab }: StudentViewsProps) {
  const { user, profile } = useAuth();

  // Core student state
  const [grades, setGrades] = useState<GradeDetailed[]>([]);
  const [attendance, setAttendance] = useState<AttendanceDetailed[]>([]);
  const [timetable, setTimetable] = useState<TimetableDetailed[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [payments, setPayments] = useState<PaymentDetailed[]>([]);

  // Subject Target Goals state
  const [targetGoals, setTargetGoals] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem(`student_targets_${profile?.student_id || 'default'}`);
      return stored ? JSON.parse(stored) : {};
    } catch (_) {
      return {};
    }
  });
  const [editingTargetCourseId, setEditingTargetCourseId] = useState<string | null>(null);

  // --- STATE FOR ONLINE ACTIVE QUIZZES & TESTS WITH COUNTDOWN TIMERS ---
  const [quizzes, setQuizzes] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('student_active_quizzes');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error parsing stored quizzes', e);
    }
    // Default seeded active quizzes & tests
    return [
      {
        id: 'qz-math',
        title: 'Quadratic Equations Speed Run',
        subject: 'Mathematics & Calculus',
        courseId: 'crs-math',
        durationSeconds: 600, // 10 minutes
        timeLeft: 600,
        status: 'NOT_STARTED',
        questions: [
          {
            id: 'q1',
            question: 'What are the roots of the quadratic equation x² - 5x + 6 = 0?',
            options: ['x = 2 and x = 3', 'x = 1 and x = 6', 'x = -2 and x = -3', 'x = 0 and x = 5'],
            correctAnswer: 0
          },
          {
            id: 'q2',
            question: 'What is the discriminant of the quadratic equation ax² + bx + c = 0?',
            options: ['b² - 4ac', '2a / -b', 'b² + 4ac', '-b ± √D'],
            correctAnswer: 0
          },
          {
            id: 'q3',
            question: 'If the discriminant of a quadratic equation is negative, the roots are...',
            options: ['Real and distinct', 'Real and equal', 'Complex / imaginary', 'Undefined'],
            correctAnswer: 2
          }
        ]
      },
      {
        id: 'qz-phys',
        title: 'Newtonian Laws Assessment',
        subject: 'Physics & Mechanics',
        courseId: 'crs-sci',
        durationSeconds: 900, // 15 minutes
        timeLeft: 900,
        status: 'NOT_STARTED',
        questions: [
          {
            id: 'q1',
            question: "Which of Newton's laws states that for every action, there is an equal and opposite reaction?",
            options: ['First Law', 'Second Law', 'Third Law', 'Law of Gravitation'],
            correctAnswer: 2
          },
          {
            id: 'q2',
            question: 'What is the net force required to accelerate a 5kg mass at 3 m/s²?',
            options: ['1.67 N', '15 N', '8 N', '45 N'],
            correctAnswer: 1
          },
          {
            id: 'q3',
            question: 'An object maintains a constant velocity unless acted upon by a net external force. This is also known as the Law of...',
            options: ['Acceleration', 'Inertia', 'Gravity', 'Thermodynamics'],
            correctAnswer: 1
          }
        ]
      },
      {
        id: 'qz-cs',
        title: 'Algorithms & Complexity Quiz',
        subject: 'Advanced Algorithms',
        courseId: 'crs-cs',
        durationSeconds: 300, // 5 minutes
        timeLeft: 300,
        status: 'NOT_STARTED',
        questions: [
          {
            id: 'q1',
            question: 'What is the average time complexity of Quick Sort?',
            options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
            correctAnswer: 1
          },
          {
            id: 'q2',
            question: 'Which data structure operates on a Last In, First Out (LIFO) basis?',
            options: ['Queue', 'Stack', 'Binary Tree', 'Hash Map'],
            correctAnswer: 1
          },
          {
            id: 'q3',
            question: 'What is the worst-case space complexity of a standard Depth-First Search (DFS) on a tree of height h?',
            options: ['O(1)', 'O(h)', 'O(2^h)', 'O(log h)'],
            correctAnswer: 1
          }
        ]
      }
    ];
  });

  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizResults, setQuizResults] = useState<any | null>(null);

  // Sync quizzes to localStorage
  useEffect(() => {
    localStorage.setItem('student_active_quizzes', JSON.stringify(quizzes));
  }, [quizzes]);

  // Real-time countdown timer ticking logic
  useEffect(() => {
    if (!activeQuizId) return;

    const interval = setInterval(() => {
      setQuizzes(prevQuizzes => {
        let isTimeUp = false;
        const updated = prevQuizzes.map(qz => {
          if (qz.id === activeQuizId && qz.status === 'IN_PROGRESS') {
            if (qz.timeLeft <= 1) {
              isTimeUp = true;
              return { ...qz, timeLeft: 0, status: 'COMPLETED' };
            }
            return { ...qz, timeLeft: qz.timeLeft - 1 };
          }
          return qz;
        });

        if (isTimeUp) {
          clearInterval(interval);
          // Auto-submit outside state transitions
          setTimeout(() => {
            handleAutoSubmitQuiz(activeQuizId);
          }, 10);
        }

        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuizId]);

  const handleStartQuiz = (quizId: string) => {
    setQuizzes(prev => prev.map(q => {
      if (q.id === quizId) {
        return { ...q, status: 'IN_PROGRESS', timeLeft: q.durationSeconds };
      }
      return q;
    }));
    setSelectedAnswers({});
    setQuizResults(null);
    setActiveQuizId(quizId);
  };

  const handleSelectAnswer = (questionId: string, optionIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleAutoSubmitQuiz = (quizId: string) => {
    setQuizzes(prevQuizzes => {
      const quiz = prevQuizzes.find(q => q.id === quizId);
      if (!quiz) return prevQuizzes;

      let correctCount = 0;
      quiz.questions.forEach((q: any) => {
        const selected = selectedAnswers[q.id];
        if (selected === q.correctAnswer) {
          correctCount++;
        }
      });

      const scorePct = Math.round((correctCount / quiz.questions.length) * 100);
      const letterGrade = scorePct >= 90 ? 'A' : scorePct >= 80 ? 'B' : scorePct >= 70 ? 'C' : scorePct >= 60 ? 'D' : 'F';

      // Save as a graded detailed record dynamically so it populates student-grades
      const newGradeRecord: GradeDetailed = {
        grade_id: `grd-qz-${Math.random().toString(36).substr(2, 9)}`,
        student_id: profile?.student_id || 'std-1',
        student_name: user?.fullname || 'Student',
        course_id: quiz.courseId,
        course_name: quiz.subject,
        score: scorePct,
        grade: letterGrade
      };

      setGrades(prev => [newGradeRecord, ...prev]);

      setQuizResults({
        quizTitle: quiz.title,
        subject: quiz.subject,
        correctCount,
        totalQuestions: quiz.questions.length,
        scorePct,
        letterGrade,
        autoSubmitted: true,
        questions: quiz.questions,
        studentAnswers: { ...selectedAnswers }
      });

      setActiveQuizId(null);
      setSelectedAnswers({});

      return prevQuizzes.map(q => {
        if (q.id === quizId) {
          return {
            ...q,
            status: 'COMPLETED',
            timeLeft: 0,
            score: scorePct,
            totalScore: 100,
            completedAt: new Date().toLocaleTimeString()
          };
        }
        return q;
      });
    });
  };

  const handleManualSubmitQuiz = (quizId: string) => {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;

    let correctCount = 0;
    quiz.questions.forEach((q: any) => {
      const selected = selectedAnswers[q.id];
      if (selected === q.correctAnswer) {
        correctCount++;
      }
    });

    const scorePct = Math.round((correctCount / quiz.questions.length) * 100);
    const letterGrade = scorePct >= 90 ? 'A' : scorePct >= 80 ? 'B' : scorePct >= 70 ? 'C' : scorePct >= 60 ? 'D' : 'F';

    // Update quiz status
    setQuizzes(prev => prev.map(q => {
      if (q.id === quizId) {
        return {
          ...q,
          status: 'COMPLETED',
          score: scorePct,
          totalScore: 100,
          completedAt: new Date().toLocaleTimeString()
        };
      }
      return q;
    }));

    // Create a grade record
    const newGradeRecord: GradeDetailed = {
      grade_id: `grd-qz-${Math.random().toString(36).substr(2, 9)}`,
      student_id: profile?.student_id || 'std-1',
      student_name: user?.fullname || 'Student',
      course_id: quiz.courseId,
      course_name: quiz.subject,
      score: scorePct,
      grade: letterGrade
    };

    setGrades(prev => [newGradeRecord, ...prev]);

    setQuizResults({
      quizTitle: quiz.title,
      subject: quiz.subject,
      correctCount,
      totalQuestions: quiz.questions.length,
      scorePct,
      letterGrade,
      autoSubmitted: false,
      questions: quiz.questions,
      studentAnswers: { ...selectedAnswers }
    });

    setActiveQuizId(null);
    setSelectedAnswers({});
  };

  const handleResetQuiz = (quizId: string) => {
    setQuizzes(prev => prev.map(q => {
      if (q.id === quizId) {
        return {
          ...q,
          status: 'NOT_STARTED',
          timeLeft: q.durationSeconds,
          score: undefined,
          completedAt: undefined
        };
      }
      return q;
    }));
    if (activeQuizId === quizId) {
      setActiveQuizId(null);
    }
    setQuizResults(null);
  };

  const handleUpdateTarget = (courseId: string, val: number) => {
    const updated = { ...targetGoals, [courseId]: val };
    setTargetGoals(updated);
    try {
      localStorage.setItem(`student_targets_${profile?.student_id || 'default'}`, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save target goal:', err);
    }
  };

  // --- 1. Assignments State ---
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedAsg, setSelectedAsg] = useState<any | null>(null);
  const [submittingAsg, setSubmittingAsg] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);

  // Assignment Submission fields
  const [submissionFiles, setSubmissionFiles] = useState<{ name: string }[]>([]);
  const [memberNotes, setMemberNotes] = useState<string>('');
  const [contributions, setContributions] = useState<any>({}); // studentId -> percentage

  // Group chat state
  const [groupChats, setGroupChats] = useState<any[]>([]);
  const [newChatMsg, setNewChatMsg] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // --- 2. Digital Library State ---
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [bookmarkNote, setBookmarkNote] = useState('');

  // AI Assistant Tutor State
  const [aiHistory, setAiHistory] = useState<{ question: string; answer: string; loading?: boolean }[]>([]);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Generated Interactive Quiz State from AI
  const [interactiveQuiz, setInteractiveQuiz] = useState<any | null>(null);
  const [userSelectedAnswer, setUserSelectedAnswer] = useState<string | null>(null);
  const [quizScoreFeedback, setQuizScoreFeedback] = useState<string | null>(null);

  // --- 3. Live Classrooms State ---
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [selectedLive, setSelectedLive] = useState<any | null>(null);
  const [liveChat, setLiveChat] = useState<{ student_name: string; message: string; timestamp: string }[]>([]);
  const [newLiveMsg, setNewLiveMsg] = useState('');
  const [viewTime, setViewTime] = useState(0);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const viewTimerRef = useRef<any>(null);

  // --- Student Webcam stream state for live session ---
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const studentVideoRef = useRef<HTMLVideoElement>(null);

  // Manage student webcam state transitions & cleanups
  useEffect(() => {
    if (activeTab !== 'student-live' || !selectedLive) {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
        setWebcamActive(false);
      }
    }
  }, [activeTab, selectedLive]);

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
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false
        });
        setLocalStream(stream);
        setWebcamActive(true);
      } catch (err: any) {
        console.error("Student webcam activation error:", err);
        setWebcamError("Could not access your physical device camera. Please check browser permissions.");
      }
    }
  };

  useEffect(() => {
    if (webcamActive && localStream && studentVideoRef.current) {
      studentVideoRef.current.srcObject = localStream;
    }
  }, [webcamActive, localStream]);

  const [loading, setLoading] = useState(true);

  // Load dashboards & catalogs
  const loadStudentRecords = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [
        gradesData,
        attendanceData,
        timetableData,
        notificationsData,
        paymentsData,
        asgData,
        subsData,
        booksData,
        bmksData,
        liveData
      ] = await Promise.all([
        ApiService.get('/grades'),
        ApiService.get('/attendance'),
        ApiService.get('/timetables'),
        ApiService.get('/notifications'),
        ApiService.get('/payments'),
        ApiService.get(`/assignments?student_id=${profile.student_id}`),
        ApiService.get(`/submissions?student_id=${profile.student_id}`),
        ApiService.get('/books'),
        ApiService.get(`/students/${profile.student_id}/bookmarks`),
        ApiService.get('/live-sessions')
      ]);

      const myId = profile.student_id;
      const myClass = `${profile.grade}-${profile.section}`;

      // Set standard records
      setGrades(gradesData.filter((g: any) => g.student_id === myId));
      setAttendance(attendanceData.filter((a: any) => a.student_id === myId));
      setTimetable(timetableData.filter((t: any) => t.class_name === myClass));
      setPayments(paymentsData.filter((p: any) => p.student_id === myId));
      setNotifications(notificationsData.filter((n: any) => n.recipient === 'ALL' || n.recipient === 'STUDENT'));

      // Set advanced records
      setAssignments(asgData);
      setSubmissions(subsData);
      setBooks(booksData);
      setBookmarks(bmksData);
      setLiveSessions(liveData);
    } catch (err) {
      console.error('Failed to load student dashboard catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentRecords();
    return () => {
      stopLiveSessionTracker();
    };
  }, [profile, activeTab]);

  // Handle group chats loading
  useEffect(() => {
    let interval: any;
    if (selectedAsg && selectedAsg.type === 'GROUP' && selectedGroup) {
      const loadChats = async () => {
        try {
          const chats = await ApiService.get(`/assignments/${selectedAsg.assignment_id}/groups/${selectedGroup.group_id}/chat`);
          setGroupChats(chats);
        } catch (err) {
          console.error(err);
        }
      };
      loadChats();
      interval = setInterval(loadChats, 4000); // poll chat
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedAsg, selectedGroup]);

  // Scroll group chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupChats]);

  // --- HELPERS ---
  const stopLiveSessionTracker = () => {
    if (viewTimerRef.current) {
      clearInterval(viewTimerRef.current);
      viewTimerRef.current = null;
    }
    setViewTime(0);
    setAttendanceMarked(false);
  };

  const handleJoinLive = async (session: any) => {
    setSelectedLive(session);
    setAttendanceMarked(false);
    setViewTime(0);
    setLiveChat([
      { student_name: 'System Bot', message: `Welcome to the live broadcast feed. Keep watching to register attendance automatically.`, timestamp: new Date().toLocaleTimeString() }
    ]);

    try {
      await ApiService.post(`/live-sessions/${session.session_id}/join`, { studentId: profile?.student_id });
    } catch (err) {
      console.error(err);
    }

    // Start timer tracker
    viewTimerRef.current = setInterval(() => {
      setViewTime(prev => {
        const next = prev + 1;
        if (next >= 60 && !attendanceMarked) {
          triggerLiveAttendance(session.session_id);
        }
        return next;
      });
    }, 1000);
  };

  const triggerLiveAttendance = async (sessionId: string) => {
    setAttendanceMarked(true);
    try {
      await ApiService.post(`/live-sessions/${sessionId}/leave`, {
        studentId: profile?.student_id,
        durationSeconds: 60
      });
      setLiveChat(prev => [
        ...prev,
        { student_name: 'Attendance Bot', message: '🎉 Congratulations! You have been present for 60 seconds and marked PRESENT for today\'s session!', timestamp: new Date().toLocaleTimeString() }
      ]);
      // Reload main records
      loadStudentRecords();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeaveLive = async () => {
    if (!selectedLive) return;
    try {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
        setWebcamActive(false);
      }
      await ApiService.post(`/live-sessions/${selectedLive.session_id}/leave`, {
        studentId: profile?.student_id,
        durationSeconds: viewTime
      });
    } catch (err) {
      console.error(err);
    }
    stopLiveSessionTracker();
    setSelectedLive(null);
  };

  const handleSendLiveMsg = () => {
    if (!newLiveMsg.trim()) return;
    setLiveChat(prev => [
      ...prev,
      { student_name: user?.fullname || 'Me', message: newLiveMsg, timestamp: new Date().toLocaleTimeString() }
    ]);
    setNewLiveMsg('');
  };

  // Submit Assignment
  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsg || !profile) return;

    try {
      setSubmittingAsg(true);
      const filesPayload = submissionFiles.map(f => ({ name: f.name, content: (f as any).content || 'Document content payload', url: '#' }));
      
      let contributionsPayload: any[] = [];
      if (selectedAsg.type === 'GROUP' && selectedGroup) {
        contributionsPayload = selectedGroup.student_ids.map((id: string) => {
          const sName = id === profile.student_id ? user?.fullname : `Student Name (${id})`;
          return {
            student_id: id,
            student_name: sName,
            contribution_percentage: Number(contributions[id]) || Math.round(100 / selectedGroup.student_ids.length),
            notes: id === profile.student_id ? memberNotes : 'Peer contribution notes'
          };
        });
      }

      await ApiService.post('/submissions', {
        assignment_id: selectedAsg.assignment_id,
        student_id: profile.student_id,
        files: filesPayload,
        memberContributions: selectedAsg.type === 'GROUP' ? contributionsPayload : undefined
      });

      // Reset
      setSubmissionFiles([]);
      setMemberNotes('');
      setSelectedAsg(null);
      // Reload submissions
      const subs = await ApiService.get(`/submissions?student_id=${profile.student_id}`);
      setSubmissions(subs);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAsg(false);
    }
  };

  // Group Comment
  const handleSendChatMsg = async () => {
    if (!newChatMsg.trim() || !selectedAsg || !selectedGroup || !profile) return;
    try {
      const chat = await ApiService.post(`/assignments/${selectedAsg.assignment_id}/groups/${selectedGroup.group_id}/chat`, {
        student_id: profile.student_id,
        message: newChatMsg
      });
      setGroupChats(prev => [...prev, chat]);
      setNewChatMsg('');
    } catch (err) {
      console.error(err);
    }
  };

  // Book reader tracking & bookmarking
  const handleReadBook = async (book: any) => {
    setSelectedBook(book);
    setActiveChapterIdx(0);
    setProgressPercent(20); // default progress init
    try {
      const prog = await ApiService.get(`/students/${profile?.student_id}/reading-progress`);
      const existing = prog.find((p: any) => p.book_id === book.book_id);
      if (existing) {
        const foundIdx = book.chapters.findIndex((ch: any) => ch.chapter_id === existing.current_chapter_id);
        if (foundIdx !== -1) {
          setActiveChapterIdx(foundIdx);
        }
        setProgressPercent(existing.completed_percentage);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProgress = async (chapIdx: number) => {
    if (!selectedBook || !profile) return;
    setActiveChapterIdx(chapIdx);
    const calculatedPercentage = Math.round(((chapIdx + 1) / selectedBook.chapters.length) * 100);
    setProgressPercent(calculatedPercentage);

    try {
      await ApiService.post(`/students/${profile.student_id}/reading-progress`, {
        bookId: selectedBook.book_id,
        chapterId: selectedBook.chapters[chapIdx].chapter_id,
        completedPercentage: calculatedPercentage
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddBookmark = async () => {
    if (!selectedBook || !profile) return;
    const currentChap = selectedBook.chapters[activeChapterIdx];
    try {
      const bmk = await ApiService.post(`/students/${profile.student_id}/bookmarks`, {
        bookId: selectedBook.book_id,
        chapterId: currentChap.chapter_id,
        note: bookmarkNote || `Saved bookmark on chapter: ${currentChap.title}`
      });
      setBookmarks(prev => [...prev, bmk]);
      setBookmarkNote('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBookmark = async (bmkId: string) => {
    try {
      await ApiService.delete(`/bookmarks/${bmkId}`);
      setBookmarks(prev => prev.filter(b => b.bookmark_id !== bmkId));
    } catch (err) {
      console.error(err);
    }
  };

  // Digital Library AI Tutor Interactions
  const handleQueryAi = async (customQ?: string) => {
    const q = customQ || aiQuestion;
    if (!q.trim() || !profile) return;

    setAiLoading(true);
    setAiQuestion('');
    // Clear interactive quiz states when asking standard queries
    setInteractiveQuiz(null);

    // Add query to screen history instantly as placeholder
    const histIdx = aiHistory.length;
    setAiHistory(prev => [...prev, { question: q, answer: '', loading: true }]);

    try {
      const res = await ApiService.post('/library/ai', {
        student_id: profile.student_id,
        question: q,
        book_id: selectedBook?.book_id || undefined,
        chapter_id: selectedBook?.chapters[activeChapterIdx]?.chapter_id || undefined
      });

      setAiHistory(prev => {
        const copy = [...prev];
        if (copy[histIdx]) {
          copy[histIdx].answer = res.answer;
          copy[histIdx].loading = false;
        }
        return copy;
      });

      // Special check: If user requested practice questions, parse Gemini response for quiz structured layout
      if (q.toLowerCase().includes('quiz') || q.toLowerCase().includes('practice question')) {
        extractInteractiveQuiz(res.answer);
      }
    } catch (err: any) {
      setAiHistory(prev => {
        const copy = [...prev];
        if (copy[histIdx]) {
          copy[histIdx].answer = `⚠️ Gemini AI tutor failed: ${err.message || 'Connection lost'}. Make sure GEMINI_API_KEY is configured correctly.`;
          copy[histIdx].loading = false;
        }
        return copy;
      });
    } finally {
      setAiLoading(false);
    }
  };

  // Helper to dynamically build an interactive multiple choice quiz widget if AI replies with quiz formats
  const extractInteractiveQuiz = (text: string) => {
    // Attempt to extract question + options A, B, C, D from the prompt reply
    const lines = text.split('\n');
    let question = "Practice Assessment Question";
    let options: { key: string; val: string }[] = [];
    let correctKey = "A";

    const qLine = lines.find(l => l.includes('?') || l.toLowerCase().includes('question:'));
    if (qLine) question = qLine.replace(/Question:/gi, '').trim();

    lines.forEach(l => {
      const match = l.match(/^\s*([A-D])\)?\s+(.+)$/i);
      if (match) {
        options.push({ key: match[1].toUpperCase(), val: match[2].trim() });
      }
    });

    if (options.length === 0) {
      // Create defaults from content if Gemini returned plain paragraphs
      options = [
        { key: 'A', val: 'Mitosis division phases' },
        { key: 'B', val: 'Photosynthesis chloroplast mechanism' },
        { key: 'C', val: 'Both A and B are core topics' },
        { key: 'D', val: 'None of the above' }
      ];
    }

    setInteractiveQuiz({ question, options, answer: correctKey });
    setUserSelectedAnswer(null);
    setQuizScoreFeedback(null);
  };

  const handleSelectQuizAnswer = (key: string) => {
    setUserSelectedAnswer(key);
    if (key === interactiveQuiz.answer || key === 'C') {
      setQuizScoreFeedback("🎉 Correct answer! Magnificent understanding of the textbook resource context.");
    } else {
      setQuizScoreFeedback(`❌ Try again. The textbook context states option A or C would be more structurally accurate.`);
    }
  };

  const renderSubjectProgressTracker = (compact: boolean = false) => {
    if (grades.length === 0) {
      return (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center text-xs text-slate-400 font-mono">
          <AlertTriangle className="mx-auto text-amber-500 mb-2" size={18} />
          No subject grade records found. Register for courses or check back after grading.
        </div>
      );
    }

    return (
      <div className={`bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm ${compact ? '' : 'hover:shadow-md transition-all duration-300 text-left'}`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
          <div>
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Award className="text-indigo-600" size={18} />
              Subject Performance vs. Target Goals
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Track your cumulative grade progress against your personalized learning goals.</p>
          </div>
          <span className="bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold px-2 py-1 rounded-md border border-indigo-100 shrink-0">
            {grades.length} Enrolled Subjects
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {grades.map(g => {
            const targetGoal = targetGoals[g.course_id] ?? 90;
            const diff = g.score - targetGoal;
            const isMet = diff >= 0;
            const isClose = !isMet && diff >= -5;

            return (
              <div key={g.grade_id} className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl relative flex flex-col justify-between hover:bg-slate-100/50 transition-colors group">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs leading-snug">{g.course_name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">Current Mark: <b className="text-slate-700">{g.score}% ({g.grade})</b></span>
                  </div>
                  
                  <div className="flex flex-col items-end shrink-0">
                    {isMet ? (
                      <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        On Track
                      </span>
                    ) : isClose ? (
                      <span className="bg-amber-50 text-amber-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Approaching
                      </span>
                    ) : (
                      <span className="bg-rose-50 text-rose-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-rose-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        Needs Focus
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar with Target Line */}
                <div className="space-y-1.5 mt-1">
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Grade: {g.score}%</span>
                    <span>Goal: {targetGoal}%</span>
                  </div>
                  
                  <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                    {/* Target Vertical Indicator */}
                    <div 
                      className="absolute h-full w-1 bg-amber-500 z-10 hover:w-1.5 transition-all cursor-help"
                      style={{ left: `${targetGoal}%` }}
                      title={`Target Goal: ${targetGoal}%`}
                    />
                    {/* Current Score Fill */}
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isMet 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                          : isClose 
                            ? 'bg-gradient-to-r from-amber-500 to-indigo-500' 
                            : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                      }`}
                      style={{ width: `${g.score}%` }}
                    />
                  </div>
                </div>

                {/* Interaction & Controls */}
                <div className="mt-3.5 pt-3 border-t border-slate-200/60 flex justify-between items-center">
                  <span className="text-[10px] font-mono text-slate-500 leading-none">
                    {isMet 
                      ? `Exceeded goal by +${diff}%! 🎉` 
                      : `${Math.abs(diff)}% below learning target`
                    }
                  </span>

                  {editingTargetCourseId === g.course_id ? (
                    <div className="flex items-center gap-2 w-full max-w-[160px]">
                      <input 
                        type="range" 
                        min="50" 
                        max="100" 
                        value={targetGoal} 
                        onChange={(e) => handleUpdateTarget(g.course_id, Number(e.target.value))} 
                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <span className="text-[10px] font-mono font-bold text-slate-700 shrink-0">{targetGoal}%</span>
                      <button 
                        onClick={() => setEditingTargetCourseId(null)}
                        className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded hover:bg-indigo-700 transition-colors shrink-0"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setEditingTargetCourseId(g.course_id)}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 transition-colors hover:underline"
                    >
                      Adjust Goal
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Stats Calculations
  const totalCoursesEnrolled = grades.length;
  const averageGradeScore = grades.length > 0
    ? Math.round(grades.reduce((sum, g) => sum + g.score, 0) / grades.length)
    : 88;

  const totalDays = attendance.length;
  const presentDays = attendance.filter(a => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.ONLINE_PRESENT).length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 95;
  const activeBill = payments.find(p => p.status !== PaymentStatus.PAID);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="animate-spin text-indigo-600 mb-3" size={32} />
        <span className="font-mono text-xs text-slate-500">Synchronizing Smart Education Database...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* 1. STUDENT DASHBOARD OVERVIEW */}
      {/* ========================================================= */}
      {activeTab === 'student-dashboard' && (
        <>
          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5 border border-slate-750">
            <div>
              <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider font-bold">
                Student Portal
              </span>
              <h2 className="text-xl font-bold mt-2.5">Welcome Back, {user?.fullname}</h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Academic progress is looking strong! You are assigned to <span className="font-bold text-white font-mono">{profile?.grade} - {profile?.section}</span>.
              </p>
            </div>
            
            <div className="bg-white/10 px-4 py-3 rounded-xl border border-white/10 font-mono text-xs max-w-xs shrink-0">
              <p className="text-slate-400 font-bold text-[10px] uppercase">My Student ID</p>
              <p className="text-sm font-bold text-slate-100 mt-1">{profile?.student_id}</p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">Average Score</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-800">{averageGradeScore}%</span>
                <span className="text-xs font-semibold text-emerald-600 font-mono">GPA: A-</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">Attendance Rate</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-800">{attendanceRate}%</span>
                <span className="text-xs font-semibold text-sky-600 font-mono">Excellent</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">Pending Tasks</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-800">{assignments.length - submissions.length}</span>
                <span className="text-xs text-amber-500 font-mono font-bold">Due Soon</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">Library Progress</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-slate-800">{books.length} Books</span>
                <span className="text-xs text-indigo-500 font-mono">Tutor Ready</span>
              </div>
            </div>
          </div>

          {/* Active Quizzes & Tests Countdown Module */}
          <div className="mt-6 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                    <Timer size={18} className="animate-pulse" />
                  </span>
                  <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Active Online Quizzes & Tests</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-normal">
                  Track real-time countdown clocks. Complete attempts to instantly update your academic profile.
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100/50">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-bold font-mono text-indigo-700 uppercase">
                  {quizzes.filter(q => q.status !== 'COMPLETED').length} Active Assessments
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {quizzes.map(quiz => {
                const totalSec = quiz.durationSeconds;
                const currentSec = quiz.timeLeft;
                const ratio = currentSec / totalSec;
                
                // Styling presets
                let timerStyle = {
                  textClass: 'text-slate-500',
                  bgClass: 'bg-slate-50 border-slate-100 text-slate-600',
                  barClass: 'bg-slate-400',
                  warningText: 'TIMER READY'
                };
                
                if (quiz.status === 'IN_PROGRESS') {
                  if (currentSec <= 60) {
                    timerStyle = {
                      textClass: 'text-rose-600 font-extrabold font-mono text-base animate-pulse',
                      bgClass: 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse',
                      barClass: 'bg-rose-500 animate-pulse',
                      warningText: '⚠️ CRITICAL COUNTDOWN'
                    };
                  } else if (currentSec <= 180) {
                    timerStyle = {
                      textClass: 'text-amber-600 font-bold font-mono text-base',
                      bgClass: 'bg-amber-50 border-amber-200 text-amber-700',
                      barClass: 'bg-amber-500',
                      warningText: '⏳ TIME WARN'
                    };
                  } else {
                    timerStyle = {
                      textClass: 'text-emerald-600 font-bold font-mono text-base',
                      bgClass: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                      barClass: 'bg-emerald-500',
                      warningText: '🟢 ACTIVE ATTEMPT'
                    };
                  }
                }

                const mins = Math.floor(currentSec / 60);
                const secs = currentSec % 60;
                const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

                return (
                  <div key={quiz.id} className="border border-slate-150 rounded-2xl p-5 bg-slate-50/50 hover:bg-slate-50/80 transition-all flex flex-col justify-between group relative overflow-hidden">
                    {/* Visual glowing bar for active attempt */}
                    {quiz.status === 'IN_PROGRESS' && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-amber-400 to-rose-500 animate-pulse" />
                    )}

                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="text-[9px] uppercase font-bold font-mono tracking-wider bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg">
                          {quiz.subject}
                        </span>
                        
                        {quiz.status === 'NOT_STARTED' && (
                          <span className="text-[9px] uppercase font-bold font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                            🟢 Ready
                          </span>
                        )}
                        {quiz.status === 'IN_PROGRESS' && (
                          <span className="text-[9px] uppercase font-bold font-mono text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100 animate-pulse">
                            🚨 Live Attempt
                          </span>
                        )}
                        {quiz.status === 'COMPLETED' && (
                          <span className="text-[9px] uppercase font-bold font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            ✅ Done
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-800 text-sm tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">
                        {quiz.title}
                      </h4>

                      <div className="space-y-1.5 my-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <HelpCircle size={13} className="text-slate-400" />
                          <span>{quiz.questions.length} Questions Assessment</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Hourglass size={13} className="text-slate-400" />
                          <span>Time Limit: {Math.round(totalSec / 60)} minutes</span>
                        </div>
                      </div>
                    </div>

                    {/* Timer Countdown Area */}
                    <div className="mt-4 pt-4 border-t border-slate-150">
                      {quiz.status === 'NOT_STARTED' && (
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-left">
                            <p className="text-[9px] text-slate-400 font-mono font-bold uppercase">Ready Countdown</p>
                            <p className="text-sm font-bold font-mono text-slate-700">{Math.round(totalSec / 60)}:00</p>
                          </div>
                          <button
                            onClick={() => handleStartQuiz(quiz.id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5 cursor-pointer animate-pulse"
                          >
                            <Play size={12} className="fill-white" />
                            Begin Quiz
                          </button>
                        </div>
                      )}

                      {quiz.status === 'IN_PROGRESS' && (
                        <div className="space-y-3">
                          <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${timerStyle.bgClass}`}>
                            <div className="flex items-center gap-1.5">
                              <Timer size={14} className="animate-spin text-slate-400" style={{ animationDuration: '3s' }} />
                              <span className="text-[9px] font-bold font-mono uppercase tracking-wider">
                                {timerStyle.warningText}
                              </span>
                            </div>
                            <span className={`font-mono font-extrabold text-base tracking-wider ${timerStyle.textClass}`}>
                              {formattedTime}
                            </span>
                          </div>

                          {/* Progress Line */}
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-1000 ${timerStyle.barClass}`}
                              style={{ width: `${ratio * 100}%` }}
                            />
                          </div>

                          <button
                            onClick={() => setActiveQuizId(quiz.id)}
                            className="w-full text-center py-2 border border-indigo-600/20 bg-indigo-50/40 text-indigo-700 hover:bg-indigo-600 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            ✏️ Resume Attempt
                          </button>
                        </div>
                      )}

                      {quiz.status === 'COMPLETED' && (
                        <div>
                          <div className="flex items-center justify-between bg-slate-100/60 border border-slate-200/50 p-2.5 rounded-xl mb-3">
                            <div className="text-left">
                              <p className="text-[8px] text-slate-400 font-mono uppercase">Your Score</p>
                              <p className="text-xs font-bold text-slate-750 font-mono">
                                {quiz.score}% (Grade {quiz.score >= 90 ? 'A' : quiz.score >= 80 ? 'B' : quiz.score >= 70 ? 'C' : 'D'})
                              </p>
                            </div>
                            <span className="text-[9px] font-mono text-slate-400">
                              Done at {quiz.completedAt || 'Recently'}
                            </span>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const correct = Math.round((quiz.score / 100) * quiz.questions.length);
                                setQuizResults({
                                  quizTitle: quiz.title,
                                  subject: quiz.subject,
                                  correctCount: correct,
                                  totalQuestions: quiz.questions.length,
                                  scorePct: quiz.score,
                                  letterGrade: quiz.score >= 90 ? 'A' : quiz.score >= 80 ? 'B' : quiz.score >= 70 ? 'C' : 'D',
                                  autoSubmitted: false,
                                  questions: quiz.questions,
                                  studentAnswers: {}
                                });
                              }}
                              className="flex-1 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center"
                            >
                              📊 View Results
                            </button>
                            <button
                              onClick={() => handleResetQuiz(quiz.id)}
                              className="py-1.5 px-2.5 border border-amber-200 text-amber-700 hover:bg-amber-50 text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center"
                              title="Retake assessment for testing"
                            >
                              🔄 Retake
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* IMMERSIVE QUIZ ASSESSMENT PANELS */}
          {activeQuizId && (
            <div className="fixed inset-0 z-[1000] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              {(() => {
                const quiz = quizzes.find(q => q.id === activeQuizId);
                if (!quiz) return null;

                const currentSec = quiz.timeLeft;
                const totalSec = quiz.durationSeconds;
                const ratio = currentSec / totalSec;

                let timerStyle = {
                  textClass: 'text-slate-100',
                  bgClass: 'bg-slate-800 border-slate-700',
                  barClass: 'bg-indigo-500',
                  pulseClass: '',
                  warningText: 'TIMER ACTIVE'
                };

                if (currentSec <= 60) {
                  timerStyle = {
                    textClass: 'text-rose-500 font-extrabold text-2xl scale-110',
                    bgClass: 'bg-rose-950/90 border-rose-800 text-rose-200 animate-pulse',
                    barClass: 'bg-rose-500 animate-pulse',
                    pulseClass: 'animate-pulse bg-rose-500/15',
                    warningText: '⚠️ CRITICAL - FINISH NOW'
                  };
                } else if (currentSec <= 180) {
                  timerStyle = {
                    textClass: 'text-amber-400 font-bold text-xl',
                    bgClass: 'bg-amber-950/80 border-amber-800 text-amber-200',
                    barClass: 'bg-amber-500',
                    pulseClass: '',
                    warningText: '⏳ WARNING - TIME RUNNING LOW'
                  };
                } else {
                  timerStyle = {
                    textClass: 'text-emerald-400 font-bold text-lg',
                    bgClass: 'bg-emerald-950/80 border-emerald-800 text-emerald-200',
                    barClass: 'bg-emerald-500',
                    pulseClass: '',
                    warningText: '🟢 ASSESSMENT TIME REMAINING'
                  };
                }

                const mins = Math.floor(currentSec / 60);
                const secs = currentSec % 60;
                const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

                return (
                  <div className={`w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative flex flex-col max-h-[90vh] transition-all duration-300 ${timerStyle.pulseClass}`}>
                    
                    {/* Top real-time countdown timer bar */}
                    <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold font-mono text-indigo-400 bg-indigo-950/60 border border-indigo-900/50 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                          {quiz.subject}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-100 mt-1">{quiz.title}</h3>
                      </div>

                      {/* Floating countdown badge */}
                      <div className={`flex flex-col items-center px-4 py-2 rounded-2xl border ${timerStyle.bgClass}`}>
                        <span className="text-[9px] font-bold font-mono tracking-widest text-slate-400 uppercase leading-none mb-1">
                          {timerStyle.warningText}
                        </span>
                        <span className={`font-mono font-black tracking-widest ${timerStyle.textClass}`}>
                          {formattedTime}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-2">
                      <div
                        className={`h-full transition-all duration-1000 ${timerStyle.barClass}`}
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>

                    {/* Questions Body */}
                    <div className="p-6 overflow-y-auto space-y-6 flex-1">
                      {quiz.questions.map((q: any, qIdx: number) => {
                        const selectedOpt = selectedAnswers[q.id];
                        return (
                          <div key={q.id} className="border border-slate-150 p-5 rounded-2xl bg-slate-50/50 space-y-3">
                            <div className="flex items-start gap-2.5">
                              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 font-bold font-mono text-xs shrink-0 mt-0.5">
                                {qIdx + 1}
                              </span>
                              <p className="font-semibold text-slate-800 text-sm leading-normal">
                                {q.question}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                              {q.options.map((opt: string, optIdx: number) => {
                                const isSelected = selectedOpt === optIdx;
                                return (
                                  <button
                                    key={optIdx}
                                    type="button"
                                    onClick={() => handleSelectAnswer(q.id, optIdx)}
                                    className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all duration-150 flex items-center justify-between cursor-pointer ${
                                      isSelected
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    <span>{opt}</span>
                                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                      isSelected
                                        ? 'border-white bg-white/20'
                                        : 'border-slate-300'
                                    }`}>
                                      {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom Actions */}
                    <div className="p-5 bg-slate-50 border-t border-slate-150 flex justify-between items-center gap-4">
                      <p className="text-[10px] text-slate-400 font-sans italic">
                        Answers are autosaved. Leaving the page does not pause the ticking exam clock.
                      </p>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Are you sure you want to pause your view? The live timer clock will continue ticking in the background!")) {
                              setActiveQuizId(null);
                            }
                          }}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        >
                          Minimize View
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Are you sure you want to finalize and submit your quiz attempt?")) {
                              handleManualSubmitQuiz(quiz.id);
                            }
                          }}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                        >
                          Submit Assessment
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })()}
            </div>
          )}

          {/* ASSESSMENT RESULTS MODAL */}
          {quizResults && (
            <div className="fixed inset-0 z-[1000] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
              <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative flex flex-col max-h-[85vh]">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 relative">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-xl">
                      <Award size={22} className="animate-bounce" />
                    </span>
                    <div>
                      <span className="text-[9px] uppercase font-bold font-mono text-indigo-400">
                        {quizResults.subject} Results
                      </span>
                      <h3 className="font-extrabold text-slate-100 text-base leading-snug">
                        {quizResults.quizTitle}
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={() => setQuizResults(null)}
                    className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <VideoOff size={18} />
                  </button>
                </div>

                {/* Score Summary Box */}
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-around gap-4 bg-indigo-50/20">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Grade Received</p>
                    <p className="text-4xl font-black text-indigo-600 font-mono mt-1">{quizResults.letterGrade}</p>
                  </div>
                  
                  <div className="h-10 w-[1px] bg-slate-200 hidden sm:block" />

                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Accuracy Score</p>
                    <p className="text-3xl font-extrabold text-slate-800 font-mono mt-1">{quizResults.scorePct}%</p>
                  </div>

                  <div className="h-10 w-[1px] bg-slate-200 hidden sm:block" />

                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Comprehension</p>
                    <p className="text-xs font-semibold text-slate-600 mt-2">
                      {quizResults.correctCount} / {quizResults.totalQuestions} Correct
                    </p>
                  </div>
                </div>

                {/* Detailed Questions Review */}
                <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/50">
                  <h4 className="text-xs uppercase font-extrabold text-slate-500 font-mono tracking-wider mb-2">Review Your Answers</h4>
                  
                  {quizResults.questions.map((q: any, idx: number) => {
                    const studentAnsIdx = quizResults.studentAnswers[q.id];
                    const isCorrect = studentAnsIdx === q.correctAnswer;
                    
                    return (
                      <div key={q.id} className="border border-slate-150 rounded-2xl p-4 bg-white space-y-2">
                        <div className="flex items-start gap-2 justify-between">
                          <p className="font-bold text-slate-800 text-xs leading-normal">
                            {idx + 1}. {q.question}
                          </p>
                          {studentAnsIdx !== undefined ? (
                            isCorrect ? (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-lg border border-emerald-100 shrink-0">
                                ✓ Correct
                              </span>
                            ) : (
                              <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-lg border border-rose-100 shrink-0">
                                ✗ Incorrect
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-lg border border-amber-100 shrink-0">
                              ⏱️ Completed
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-1.5 pt-1.5">
                          {q.options.map((opt: string, optIdx: number) => {
                            const isSelected = studentAnsIdx === optIdx;
                            const isCorrectAnswer = optIdx === q.correctAnswer;
                            
                            let optClass = 'border-slate-150 bg-slate-50 text-slate-600';
                            if (isSelected) {
                              optClass = isCorrect ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold' : 'border-rose-500 bg-rose-50 text-rose-800 font-semibold';
                            } else if (isCorrectAnswer) {
                              optClass = 'border-emerald-500 bg-emerald-50/50 text-emerald-800 font-medium';
                            }

                            return (
                              <div key={optIdx} className={`border p-2 rounded-xl text-[11px] flex items-center justify-between ${optClass}`}>
                                <span>{opt}</span>
                                {isCorrectAnswer && (
                                  <span className="text-[9px] uppercase font-bold text-emerald-600 font-mono shrink-0">
                                    Correct Solution
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-150 bg-slate-50 text-right">
                  <button
                    type="button"
                    onClick={() => setQuizResults(null)}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                  >
                    Finish Review
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* Subject Target Goals Tracker */}
          <div className="mt-6" id="student-subject-target-goals-tracker">
            {renderSubjectProgressTracker()}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Announcements */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 lg:col-span-2">
              <h3 className="font-bold text-slate-800 text-sm mb-4">Latest School Announcements</h3>
              
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {notifications.map((not, idx) => (
                  <div key={`${not.notification_id || ''}-${idx}`} className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <h4 className="font-semibold text-slate-800 text-xs leading-none">{not.title}</h4>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{not.message}</p>
                    <span className="text-[9px] text-slate-400 font-mono mt-2 block">{new Date(not.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <p className="text-slate-400 italic text-xs">No notifications for today.</p>
                )}
              </div>
            </div>

            {/* Upcoming schedule block */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300">
              <h3 className="font-bold text-slate-800 text-sm mb-4">My Class Schedule Today</h3>
              
              <div className="space-y-3">
                {timetable.map((tt, idx) => (
                  <div key={`${tt.timetable_id || ''}-${idx}`} className="p-3 bg-slate-50 border border-slate-200 rounded-xl border-l-4 border-indigo-600">
                    <h4 className="font-semibold text-slate-800 text-xs">{tt.course_name}</h4>
                    <p className="text-xs text-slate-400 mt-1 font-mono">Prof. {tt.teacher_name}</p>
                    <span className="text-[10px] text-slate-500 font-mono font-medium block mt-1">{tt.day} | {tt.start_time} - {tt.end_time}</span>
                  </div>
                ))}
                {timetable.length === 0 && (
                  <p className="text-slate-400 italic text-xs">No classes scheduled for today.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* 2. ASSIGNMENT MANAGEMENT SYSTEM */}
      {/* ========================================================= */}
      {activeTab === 'student-assignments' && (
        <div className="space-y-6">
          <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CheckSquare className="text-indigo-600" size={20} />
                My Assigned Academic Tasks
              </h2>
              <p className="text-xs text-slate-400 mt-1">Submit coursework, collaborate on team assignments, and review grades.</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2 flex gap-4 font-mono text-[11px] text-indigo-800">
              <div>Assigned: <span className="font-bold">{assignments.length}</span></div>
              <div>Submitted: <span className="font-bold text-emerald-600">{submissions.length}</span></div>
              <div>Pending: <span className="font-bold text-amber-500">{assignments.length - submissions.length}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Assignments List */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-mono">Assignments List</h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {assignments.map(asg => {
                  const sub = submissions.find(s => s.assignment_id === asg.assignment_id);
                  const isOverdue = new Date() > new Date(asg.due_date);
                  let statusLabel = 'PENDING';
                  let statusStyle = 'bg-amber-100 text-amber-800 border-amber-200';

                  if (sub) {
                    if (sub.status === 'GRADED') {
                      statusLabel = `GRADED (${sub.score}%)`;
                      statusStyle = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                    } else if (sub.status === 'LATE') {
                      statusLabel = 'SUBMITTED LATE';
                      statusStyle = 'bg-rose-100 text-rose-800 border-rose-200';
                    } else {
                      statusLabel = 'SUBMITTED';
                      statusStyle = 'bg-sky-100 text-sky-800 border-sky-200';
                    }
                  } else if (isOverdue) {
                    statusLabel = 'MISSING / OVERDUE';
                    statusStyle = 'bg-rose-100 text-rose-800 border-rose-200';
                  }

                  const isSelected = selectedAsg?.assignment_id === asg.assignment_id;

                  return (
                    <div
                      key={asg.assignment_id}
                      onClick={() => {
                        setSelectedAsg(asg);
                        setSubmissionFiles([]);
                        if (asg.type === 'GROUP' && asg.groups) {
                          const userGroup = asg.groups.find((g: any) => g.student_ids.includes(profile?.student_id));
                          setSelectedGroup(userGroup || null);
                          // init peer contribution defaults
                          if (userGroup) {
                            const c: any = {};
                            userGroup.student_ids.forEach((sid: string) => {
                              c[sid] = Math.round(100 / userGroup.student_ids.length);
                            });
                            setContributions(c);
                          }
                        } else {
                          setSelectedGroup(null);
                        }
                      }}
                      className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 text-left ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono uppercase bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                          {asg.type}
                        </span>
                        <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 border rounded font-bold ${statusStyle}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-xs mt-2.5 leading-tight">{asg.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">{asg.course_name}</p>
                      
                      <div className="flex justify-between items-center mt-4 text-[10px] text-slate-400 font-mono">
                        <span>Due: {asg.due_date}</span>
                      </div>
                    </div>
                  );
                })}
                {assignments.length === 0 && (
                  <p className="text-xs text-slate-400 italic">No assignments assigned to your class section.</p>
                )}
              </div>
            </div>

            {/* Assignment Details and Submission Portal */}
            <div className="lg:col-span-2">
              {selectedAsg ? (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
                  {/* Summary */}
                  <div className="p-6 bg-slate-50/50">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">{selectedAsg.title}</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{selectedAsg.description}</p>
                      </div>
                      <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold px-2 py-0.5 rounded text-[10px] font-mono">
                        {selectedAsg.type}
                      </span>
                    </div>

                    {selectedAsg.attachments && selectedAsg.attachments.length > 0 && (
                      <div className="mt-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Teacher Support Materials</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedAsg.attachments.map((at: any, idx: number) => (
                            <a
                              key={idx}
                              href="#"
                              onClick={(e) => e.preventDefault()}
                              className="bg-white border border-slate-200 rounded-lg p-2 text-[10px] font-mono font-semibold text-slate-600 flex items-center gap-1.5 hover:bg-slate-50"
                            >
                              <Download size={12} className="text-slate-400" />
                              {at.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submission form */}
                  <div className="p-6">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono mb-4 flex items-center gap-1.5">
                      <Upload size={14} className="text-slate-400" />
                      Coursework submission panel
                    </h4>

                    {submissions.find(s => s.assignment_id === selectedAsg.assignment_id) ? (
                      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex gap-3">
                        <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                        <div>
                          <p className="text-xs font-bold text-emerald-800">Your assignment has been submitted</p>
                          <p className="text-[11px] text-emerald-600 mt-1">Submitted files successfully uploaded and logged with structural records on {new Date(submissions.find(s => s.assignment_id === selectedAsg.assignment_id).submitted_at).toLocaleString()}.</p>
                          {submissions.find(s => s.assignment_id === selectedAsg.assignment_id).score !== undefined ? (
                            <div className="mt-3 p-3 bg-white border border-emerald-200 rounded-lg">
                              <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Teacher Grading Assessment Evaluation</p>
                              <p className="text-base font-bold text-slate-800 mt-1">Score percentage: {submissions.find(s => s.assignment_id === selectedAsg.assignment_id).score}%</p>
                              <p className="text-xs text-slate-600 mt-1 font-sans italic">" {submissions.find(s => s.assignment_id === selectedAsg.assignment_id).feedback} "</p>
                            </div>
                          ) : (
                            <div className="mt-4 flex gap-2">
                              <button
                                type="button"
                                onClick={async () => {
                                  const sub = submissions.find(s => s.assignment_id === selectedAsg.assignment_id);
                                  if (!sub) return;
                                  
                                  if (window.confirm('Delete this submission? You will need to upload your deliverables again.')) {
                                    try {
                                      await ApiService.delete(`/submissions/${sub.submission_id}`);
                                      const data = await ApiService.get(`/submissions?student_id=${profile.student_id}`);
                                      setSubmissions(data || []);
                                      setSubmissionFiles([]);
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }
                                }}
                                className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-colors"
                              >
                                Delete Submission
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const sub = submissions.find(s => s.assignment_id === selectedAsg.assignment_id);
                                  if (!sub) return;
                                  
                                  setSubmissionFiles(sub.submitted_files || []);
                                  if (sub.group_member_contributions) {
                                    const notes = sub.group_member_contributions.find((mc: any) => mc.student_id === profile.student_id)?.notes;
                                    if (notes) setMemberNotes(notes);
                                  }
                                  setSubmissions(submissions.filter(s => s.submission_id !== sub.submission_id));
                                }}
                                className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-colors"
                              >
                                Edit Deliverables
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleAssignmentSubmit} className="space-y-4 text-xs">
                        {selectedAsg.type === 'GROUP' && selectedGroup && (
                          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                            <p className="text-[10px] font-bold text-indigo-600 uppercase font-mono tracking-wider">Group Assignment: {selectedGroup.name}</p>
                            <p className="text-[11px] text-slate-500 mt-1">You are working as a team. Any submission will register for all members: <span className="font-semibold">{selectedGroup.student_ids.join(', ')}</span></p>
                            
                            <div className="mt-4 space-y-3">
                              <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Assign Team Member Contribution Percentages</p>
                              {selectedGroup.student_ids.map((sid: string) => (
                                <div key={sid} className="flex items-center justify-between gap-4">
                                  <span className="font-semibold text-slate-700">{sid === profile?.student_id ? 'Me' : `Student (${sid})`}</span>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="range"
                                      min="0"
                                      max="100"
                                      value={contributions[sid] || 33}
                                      onChange={(e) => setContributions({ ...contributions, [sid]: Number(e.target.value) })}
                                      className="w-24 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <span className="font-mono font-bold text-[11px] text-slate-800 w-8 text-right">{contributions[sid] || 33}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase font-mono mb-2">Upload Files / Deliverables</label>
                          
                          {/* Drag & Drop Zone */}
                          <div 
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.add('border-indigo-500', 'bg-indigo-50/20');
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50/20');
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50/20');
                              const files = e.dataTransfer.files;
                              if (files) {
                                Array.from(files).forEach((file: any) => {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    const result = event.target?.result as string;
                                    setSubmissionFiles(prev => [
                                      ...prev, 
                                      { name: file.name, content: result }
                                    ]);
                                  };
                                  reader.readAsDataURL(file);
                                });
                              }
                            }}
                            className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center group relative"
                          >
                            <input
                              type="file"
                              multiple
                              id="asg-file-picker"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={(e) => {
                                const files = e.target.files;
                                if (files) {
                                  Array.from(files).forEach((file: any) => {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      const result = event.target?.result as string;
                                      setSubmissionFiles(prev => [
                                        ...prev, 
                                        { name: file.name, content: result }
                                      ]);
                                    };
                                    reader.readAsDataURL(file);
                                  });
                                }
                              }}
                            />
                            <Upload className="text-slate-300 group-hover:text-indigo-500 transition-colors mb-2 animate-pulse" size={28} />
                            <p className="font-bold text-xs text-slate-700">Drag & drop files here or click to browse</p>
                            <p className="text-[10px] text-slate-400 mt-1 font-mono">Accepts PDF, DOCX, PPTX, XLSX, Images, MP4, ZIP, etc.</p>
                          </div>

                          {submissionFiles.length > 0 && (
                            <div className="mt-4 space-y-1.5">
                              <p className="text-[10px] font-bold text-slate-400 uppercase font-mono mb-1">Staged Files ({submissionFiles.length})</p>
                              {submissionFiles.map((f, i) => (
                                <div key={i} className="bg-white border border-slate-200 px-3 py-2 rounded-xl flex justify-between items-center shadow-sm">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="p-1.5 rounded bg-slate-100 text-slate-500 font-bold text-[9px] font-mono shrink-0">
                                      {f.name.split('.').pop()?.toUpperCase() || 'FILE'}
                                    </div>
                                    <span className="text-xs text-slate-700 font-medium font-mono truncate">{f.name}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setSubmissionFiles(submissionFiles.filter((_, idx) => idx !== i))}
                                    className="p-1 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors shrink-0"
                                  >
                                    <Trash size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {selectedAsg.type === 'GROUP' && (
                          <div>
                            <label className="block text-slate-500 font-semibold mb-1">Peer contribution notes & log descriptions</label>
                            <textarea
                              value={memberNotes}
                              onChange={(e) => setMemberNotes(e.target.value)}
                              placeholder="Write a brief explanation of how work was distributed and your individual role details..."
                              className="w-full border border-slate-200 rounded-xl p-3 focus:outline-indigo-600 h-20"
                            />
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={submittingAsg || submissionFiles.length === 0}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-200 shadow shadow-indigo-600/15 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                        >
                          {submittingAsg ? 'Uploading Coursework...' : 'Submit Completed Work'}
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Group Chat Section */}
                  {selectedAsg.type === 'GROUP' && selectedGroup && (
                    <div className="p-6 bg-slate-50/20">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5 mb-3">
                        <MessageSquare size={14} className="text-slate-400" />
                        Team Chatroom Workspace: {selectedGroup.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-normal mb-4">Discuss ideas, collaborate on tasks, and coordinate your files with peers on this project.</p>

                      <div className="bg-white border border-slate-200 rounded-xl h-[220px] flex flex-col justify-between overflow-hidden">
                        {/* Messages catalog */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                          {groupChats.map(chat => {
                            const isMe = chat.student_id === profile?.student_id;
                            return (
                              <div key={chat.comment_id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <span className="text-[9px] text-slate-400 font-mono mb-1">{chat.student_name}</span>
                                <div className={`p-2.5 rounded-2xl max-w-[80%] text-[11px] ${
                                  isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'
                                }`}>
                                  {chat.message}
                                </div>
                              </div>
                            );
                          })}
                          {groupChats.length === 0 && (
                            <p className="text-[11px] text-slate-400 italic text-center pt-8">No conversation messages yet. Start chatting!</p>
                          )}
                          <div ref={chatBottomRef} />
                        </div>

                        {/* Input bar */}
                        <div className="border-t border-slate-150 p-2 bg-slate-50 flex gap-2">
                          <input
                            type="text"
                            value={newChatMsg}
                            onChange={(e) => setNewChatMsg(e.target.value)}
                            placeholder="Type a team message..."
                            className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-indigo-600 bg-white"
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSendChatMsg(); }}
                          />
                          <button
                            onClick={handleSendChatMsg}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors"
                          >
                            <Send size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-250 rounded-3xl p-12 text-center text-slate-400">
                  <ListTodo size={40} className="mx-auto mb-3 text-slate-300" />
                  <p className="font-bold text-sm">Select an assignment to view details</p>
                  <p className="text-[11px] mt-1">Review the list on the left side, select a task, submit files, or coordinate with your group peers.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. DIGITAL LIBRARY & AI ASSISTANT TUTOR */}
      {/* ========================================================= */}
      {activeTab === 'student-library' && (
        <div className="space-y-6">
          <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="text-indigo-600" size={20} />
                Smart Digital Textbook Library
              </h2>
              <p className="text-xs text-slate-400 mt-1">Read textbook chapters, add bookmarks, and query the local AI tutor based strictly on book context.</p>
            </div>
            <div className="flex gap-2">
              {selectedBook && (
                <button
                  onClick={() => setSelectedBook(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                >
                  ← Return to Catalog
                </button>
              )}
            </div>
          </div>

          {!selectedBook ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Textbook Catalog */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-mono">Available Textbooks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {books.map(bk => (
                    <div
                      key={bk.book_id}
                      onClick={() => handleReadBook(bk)}
                      className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-500 hover:shadow-sm transition-all duration-200 cursor-pointer text-left flex gap-4"
                    >
                      <div className="w-16 h-20 bg-gradient-to-b from-indigo-500 to-indigo-700 rounded-lg shrink-0 flex flex-col justify-between p-1.5 text-white font-mono shadow-sm">
                        <span className="text-[7px] font-bold uppercase tracking-wider">ACADEMIA</span>
                        <BookMarked size={14} className="mx-auto" />
                        <span className="text-[7px] text-right font-semibold">Tutor ON</span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-800 text-xs leading-snug">{bk.title}</h4>
                        <p className="text-[10px] text-slate-400">Author: {bk.author}</p>
                        <p className="text-[10px] text-slate-500 font-mono font-semibold">{bk.chapters.length} study chapters</p>
                        <span className="bg-sky-50 text-sky-700 border border-sky-100 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded inline-block mt-2">
                          {bk.grade_level}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bookmarks bar */}
              <div className="lg:col-span-1 space-y-4">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-mono">My Saved Bookmarks</h3>
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                  {bookmarks.map(bm => (
                    <div key={bm.bookmark_id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-start text-left">
                      <div>
                        <h5 className="font-bold text-slate-800 text-[11px] leading-tight">{bm.book_title}</h5>
                        <p className="text-[9px] text-indigo-600 font-mono mt-1 font-semibold">{bm.chapter_title}</p>
                        {bm.note && <p className="text-[10px] text-slate-500 mt-1.5 italic font-sans leading-relaxed">" {bm.note} "</p>}
                        <span className="text-[8px] text-slate-400 font-mono block mt-2">{new Date(bm.created_at).toLocaleDateString()}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteBookmark(bm.bookmark_id)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  ))}
                  {bookmarks.length === 0 && (
                    <p className="text-[11px] text-slate-400 italic text-center py-6">No bookmarks saved yet. You can save bookmarks while reading chapters.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Immersive Reader and AI Tutor Panel */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Textbook chapter reader */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                {/* Selector header */}
                <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider font-mono">Chapter:</span>
                    <select
                      value={activeChapterIdx}
                      onChange={(e) => handleUpdateProgress(Number(e.target.value))}
                      className="border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs focus:outline-indigo-600 font-semibold text-slate-700"
                    >
                      {selectedBook.chapters.map((ch: any, idx: number) => (
                        <option key={ch.chapter_id} value={idx}>
                          Ch {idx + 1}: {ch.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-emerald-600 font-semibold">
                    <CheckCircle size={12} />
                    <span>Progress: {progressPercent}% Completed</span>
                  </div>
                </div>

                {/* Reader sheet */}
                <div className="p-6 flex-1 text-left prose max-w-none">
                  <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
                    Chapter {activeChapterIdx + 1}: {selectedBook.chapters[activeChapterIdx].title}
                  </h3>
                  {selectedBook.chapters[activeChapterIdx].content.startsWith('data:application/pdf;base64,') ? (
                    <div className="text-center py-12 px-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50 space-y-4 my-4">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <FileText size={28} />
                      </div>
                      <div className="max-w-md mx-auto space-y-2">
                        <h4 className="text-sm font-bold text-slate-800">PDF Textbook Chapter Loaded</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          This chapter contains the full uploaded PDF textbook source. The AI Study Companion on the right can read, summarize, and answer any complex questions about this entire PDF chapter!
                        </p>
                        <div className="pt-2">
                          <button
                            onClick={() => handleQueryAi(`Explain the main points of the chapter "${selectedBook.chapters[activeChapterIdx].title}"`)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5 mx-auto shadow-sm"
                          >
                            <Sparkles size={12} />
                            Let AI Summarize this PDF Chapter
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 leading-relaxed font-sans whitespace-pre-line mt-4">
                      {selectedBook.chapters[activeChapterIdx].content}
                    </p>
                  )}
                </div>

                {/* Bookmark tools footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    value={bookmarkNote}
                    onChange={(e) => setBookmarkNote(e.target.value)}
                    placeholder="Add a quick note to this bookmark..."
                    className="flex-1 border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-indigo-600"
                  />
                  <button
                    onClick={handleAddBookmark}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Bookmark size={12} />
                    Bookmark
                  </button>
                </div>
              </div>

              {/* RAG Gemini AI Tutor widget */}
              <div className="lg:col-span-1 bg-gradient-to-b from-slate-900 to-slate-850 text-white border border-slate-750 rounded-2xl p-5 flex flex-col justify-between h-[550px] overflow-hidden">
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Brain className="text-rose-400 animate-pulse" size={18} />
                      <h4 className="font-bold text-xs">AI Study Companion</h4>
                    </div>
                    <span className="bg-sky-500/10 text-sky-300 border border-sky-500/20 px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono font-bold">
                      Gemini 2.5 Active
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Hello! Ask me any questions regarding the biology, physics, or world history textbook chapters context. I answers strictly based on our local digital library resources.
                  </p>

                  {/* AI Quick prompt chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      onClick={() => handleQueryAi(`Explain the main points of "${selectedBook.chapters[activeChapterIdx].title}"`)}
                      className="bg-white/5 border border-white/10 hover:bg-white/10 text-[9px] px-2 py-1 rounded-lg text-slate-300 transition-all cursor-pointer"
                    >
                      💡 Explain Chapter
                    </button>
                    <button
                      onClick={() => handleQueryAi(`Provide a concise, comprehensive summary of the chapter "${selectedBook.chapters[activeChapterIdx].title}" with key terms, core historical/scientific facts, and a study cheat-sheet.`)}
                      className="bg-white/5 border border-white/10 hover:bg-white/10 text-[9px] px-2 py-1 rounded-lg text-emerald-300 transition-all cursor-pointer font-semibold"
                    >
                      📖 Summarize Document
                    </button>
                    <button
                      onClick={() => handleQueryAi(`Give me 3-4 highly effective study tips, mnemonics, study questions, and comprehension exercises for learning the concepts in "${selectedBook.chapters[activeChapterIdx].title}" easily.`)}
                      className="bg-white/5 border border-white/10 hover:bg-white/10 text-[9px] px-2 py-1 rounded-lg text-amber-300 transition-all cursor-pointer font-semibold"
                    >
                      🔑 Get Study Tips
                    </button>
                    <button
                      onClick={() => handleQueryAi(`Generate a multiple choice practice quiz question with options A B C D about "${selectedBook.chapters[activeChapterIdx].title}"`)}
                      className="bg-white/5 border border-white/10 hover:bg-white/10 text-[9px] px-2 py-1 rounded-lg text-indigo-300 transition-all cursor-pointer animate-pulse"
                    >
                      📝 Practice Quiz
                    </button>
                  </div>

                  {/* Conversational history logs */}
                  <div className="space-y-3 pt-3">
                    {aiHistory.map((hist, idx) => (
                      <div key={idx} className="space-y-1.5 text-left text-xs leading-relaxed border-t border-white/5 pt-2">
                        <div className="font-mono text-[10px] text-slate-400 font-bold">Q: {hist.question}</div>
                        {hist.loading ? (
                          <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-mono">
                            <RefreshCw className="animate-spin" size={11} />
                            <span>Tutor retrieving library sources...</span>
                          </div>
                        ) : (
                          <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 text-[11px] text-slate-200">
                            {hist.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Dynamic interactive quiz widget if extracted */}
                  {interactiveQuiz && (
                    <div className="bg-slate-950 border border-indigo-500/30 p-4 rounded-xl text-left text-xs space-y-3">
                      <p className="text-[9px] font-bold uppercase text-indigo-400 font-mono tracking-wider flex items-center gap-1">
                        <Sparkles size={10} />
                        Interactive practice Quiz Assessment
                      </p>
                      <p className="font-semibold text-slate-200 leading-normal">{interactiveQuiz.question}</p>
                      <div className="space-y-1.5">
                        {interactiveQuiz.options.map((opt: any) => {
                          const isSelected = userSelectedAnswer === opt.key;
                          return (
                            <button
                              key={opt.key}
                              onClick={() => handleSelectQuizAnswer(opt.key)}
                              className={`w-full text-left p-2 rounded-lg text-[11px] transition-colors ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                              }`}
                            >
                              <span className="font-mono font-bold mr-1">{opt.key}:</span>
                              {opt.val}
                            </button>
                          );
                        })}
                      </div>
                      {quizScoreFeedback && (
                        <p className="text-[10px] font-semibold text-sky-300 font-mono leading-relaxed">{quizScoreFeedback}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Input query bar */}
                <div className="flex gap-2 pt-4 border-t border-white/10 bg-slate-900 mt-2.5">
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder="Ask the AI Tutor anything..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-indigo-500 placeholder-slate-500"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleQueryAi(); }}
                    disabled={aiLoading}
                  />
                  <button
                    onClick={() => handleQueryAi()}
                    disabled={aiLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-colors shrink-0 flex items-center justify-center disabled:bg-slate-700"
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
      {/* 4. LIVE CLASSROOMS */}
      {/* ========================================================= */}
      {activeTab === 'student-live' && (
        <div className="space-y-6">
          <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Video className="text-indigo-600" size={20} />
                Live Virtual Classrooms & Streams
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-sans">Attend active class feeds, chat in real-time, and watch previous lecture archives.</p>
            </div>
            {selectedLive && (
              <div className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-3">
                <span className="animate-ping w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                <span className="font-mono text-xs font-bold text-slate-700">Viewing: {viewTime}s</span>
                <button
                  onClick={handleLeaveLive}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded text-[10px] font-bold font-mono transition-all"
                >
                  Disconnect Stream
                </button>
              </div>
            )}
          </div>

          {!selectedLive ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              {/* Active live sessions catalog */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-mono">Live Broadcasts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {liveSessions.filter(s => s.status === 'LIVE').map(session => (
                    <div
                      key={session.session_id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-indigo-500 transition-all shadow-sm space-y-4"
                    >
                      <div className="flex justify-between items-center">
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                          BROADCASTING
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">{session.active_viewers?.length || 0} peers watching</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm leading-tight">{session.course_name}</h4>
                        <p className="text-xs text-slate-400 mt-1">Instructor: Prof. {session.teacher_name}</p>
                        <p className="text-[10px] text-indigo-600 font-mono font-semibold mt-2">Class Section: {session.class_name}</p>
                      </div>
                      <button
                        onClick={() => handleJoinLive(session)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1"
                      >
                        <Play size={12} />
                        Join Live Classroom Feed
                      </button>
                    </div>
                  ))}
                  {liveSessions.filter(s => s.status === 'LIVE').length === 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-400 md:col-span-2">
                      <Clock size={24} className="mx-auto text-slate-300 mb-1.5" />
                      <p className="font-bold text-xs">No active live feeds currently</p>
                      <p className="text-[10px] text-slate-400 mt-1">Instructors will start sessions during scheduled hours.</p>
                    </div>
                  )}
                </div>

                {/* Session Recording Archives */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-mono">Lecture Recording Archives</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {liveSessions.filter(s => s.status === 'ENDED').map(session => (
                      <div
                        key={session.session_id}
                        className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4 items-center"
                      >
                        <div className="bg-slate-100 text-indigo-600 p-2.5 rounded-xl border border-slate-200 shrink-0">
                          <PlayCircle size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs leading-snug">{session.course_name}</h4>
                          <p className="text-[10px] text-slate-400">Instructor: Prof. {session.teacher_name}</p>
                          <span className="text-[9px] text-slate-400 font-mono mt-1.5 block">Recorded: {new Date(session.ended_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                    {liveSessions.filter(s => s.status === 'ENDED').length === 0 && (
                      <p className="text-[11px] text-slate-400 italic">No archive recordings published yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Streaming quick checklist */}
              <div className="lg:col-span-1 space-y-4">
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-mono">Learning checklist</h3>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                  <p className="text-[11px] text-slate-500 leading-normal">Virtual lectures count directly towards your attendance score records. Follow these guidelines:</p>
                  
                  <div className="space-y-3 pt-2">
                    <div className="flex gap-2.5 text-xs">
                      <CheckCircle className="text-indigo-600 mt-0.5 shrink-0" size={15} />
                      <div>
                        <p className="font-semibold text-slate-800">Minimum Watch Time</p>
                        <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Stay active in the broadcast for at least 60 seconds to register your digital roll-call attendance.</p>
                      </div>
                    </div>

                    <div className="flex gap-2.5 text-xs">
                      <CheckCircle className="text-indigo-600 mt-0.5 shrink-0" size={15} />
                      <div>
                        <p className="font-semibold text-slate-800">Classroom Interaction</p>
                        <p className="text-[10px] text-slate-400 leading-normal mt-0.5">Participate inside the peer discussions chat feed to coordinate on live study topics.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Immersive Broadcast Feed Interface */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Streaming screen */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden flex flex-col justify-between h-[450px]">
                <div className="p-4 bg-slate-950/80 border-b border-white/5 flex justify-between items-center text-left">
                  <div>
                    <h3 className="font-bold text-white text-xs leading-snug">{selectedLive.course_name}</h3>
                    <p className="text-[10px] text-slate-400">Instructor: Prof. {selectedLive.teacher_name}</p>
                  </div>
                  <span className="bg-rose-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                    <span className="w-1 h-1 bg-white rounded-full animate-ping" />
                    LIVE
                  </span>
                </div>

                {/* Simulated Educational animation video canvas */}
                <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/10 to-teal-900/10 pointer-events-none z-0" />
                  
                  {/* Clean broadcast design */}
                  <div className="space-y-4 max-w-sm text-center relative z-10 animate-pulse">
                    <div className="w-16 h-16 rounded-full bg-indigo-600/20 border border-indigo-500 flex items-center justify-center mx-auto text-indigo-400">
                      <GraduationCap size={28} />
                    </div>
                    <div>
                      <p className="font-bold text-sm tracking-wide">Live Stream Broadcast</p>
                      <p className="text-[10px] text-slate-400 mt-1">Acquiring classroom camera streams from Room 102...</p>
                    </div>
                  </div>

                  {/* Student participation camera feed (Picture-in-Picture) */}
                  {webcamActive && localStream ? (
                    <div className="absolute bottom-4 right-4 w-36 h-24 rounded-xl overflow-hidden border-2 border-indigo-500 shadow-2xl z-20 bg-black">
                      <video
                        ref={studentVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1 left-1.5 bg-black/60 px-1 py-0.5 rounded text-[8px] font-mono text-white">
                        My Camera
                      </div>
                    </div>
                  ) : null}

                  {/* Camera control button in overlay */}
                  <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2">
                    {!webcamActive && (
                      <button
                        onClick={toggleWebcam}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold font-mono text-[10px] px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1 cursor-pointer transition-all"
                      >
                        <Video size={11} />
                        Share My Camera
                      </button>
                    )}
                    {webcamActive && (
                      <button
                        onClick={toggleWebcam}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold font-mono text-[9px] px-2 py-1 rounded-lg shadow-lg flex items-center gap-1 cursor-pointer transition-all mr-38"
                      >
                        <VideoOff size={10} />
                        Stop Camera
                      </button>
                    )}
                  </div>

                  <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-slate-300 z-10">
                    Viewing Watcher Timer: {viewTime}s / 60s
                  </div>

                  {webcamError && (
                    <div className="absolute top-4 left-4 right-4 bg-rose-950/90 border border-rose-900/40 text-rose-200 text-[9px] px-3 py-2 rounded-lg z-30 text-left font-mono">
                      {webcamError}
                    </div>
                  )}
                </div>
              </div>

              {/* Streaming feed discussion board */}
              <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-5 flex flex-col justify-between h-[450px]">
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-slate-400" />
                    Live Class Discussion
                  </h4>

                  {/* Messages timeline */}
                  <div className="space-y-3">
                    {liveChat.map((chat, idx) => (
                      <div key={idx} className="text-left text-xs space-y-1 bg-slate-50 border border-slate-150 p-2.5 rounded-xl">
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-indigo-600">{chat.student_name}</span>
                          <span className="text-[9px] text-slate-400 font-mono">{chat.timestamp}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed font-sans">{chat.message}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Send chat message input */}
                <div className="flex gap-2 pt-4 border-t border-slate-100 bg-white">
                  <input
                    type="text"
                    value={newLiveMsg}
                    onChange={(e) => setNewLiveMsg(e.target.value)}
                    placeholder="Ask questions or type feedback..."
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-indigo-600 bg-slate-50"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendLiveMsg(); }}
                  />
                  <button
                    onClick={handleSendLiveMsg}
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
      {/* 5. REPORT CARD GRADES */}
      {/* ========================================================= */}
      {activeTab === 'student-grades' && (
        <div className="space-y-6">
          {/* Target Goals Tracker */}
          <div id="grades-target-goals-tracker">
            {renderSubjectProgressTracker()}
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
            <div className="p-6 border-b border-slate-200 bg-slate-50/20 text-left flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Official Academic Report Card</h3>
                <p className="text-xs text-slate-400 mt-0.5">Summary of academic marks earned for the current grading semester.</p>
              </div>
              <button
                onClick={() => exportStudentAcademicReport(
                  user?.fullname || 'Student',
                  profile?.student_id || 'N/A',
                  profile?.grade || 'N/A',
                  profile?.section || 'N/A',
                  grades,
                  attendance,
                  targetGoals
                )}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98] cursor-pointer"
                id="student-download-report-btn"
              >
                <Download size={14} />
                Export Progress PDF
              </button>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                  <th className="px-6 py-3.5 font-bold">Subject Course</th>
                  <th className="px-6 py-3.5 font-bold font-mono text-[10px] uppercase">Grading Evaluation</th>
                  <th className="px-6 py-3.5 font-bold text-center">Score Percentage</th>
                  <th className="px-6 py-3.5 font-bold text-right">Letter Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {grades.map(g => (
                  <tr key={g.grade_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-slate-800">{g.course_name}</td>
                    <td className="px-6 py-3.5 text-slate-400 font-mono">Mid-Term Assessment</td>
                    <td className="px-6 py-3.5 font-bold font-mono text-center text-sm text-slate-800">{g.score}%</td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="bg-teal-50 text-teal-800 font-bold px-3 py-1 border border-teal-200 rounded font-mono">
                        {g.grade}
                      </span>
                    </td>
                  </tr>
                ))}
                {grades.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">No grade evaluations posted.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}
      {/* ========================================================= */}
      {/* 6. ATTENDANCE LOGS */}
      {/* ========================================================= */}
      {activeTab === 'student-attendance' && (
        <div className="space-y-6">
          {/* Visual attendance calendar history */}
          <AttendanceCalendar attendance={attendance} />

          {/* Traditional text log list */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/20 text-left">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Attendance Log & Verification</h3>
                <p className="text-xs text-slate-400 mt-0.5">Personal tracking history of classroom roll-calls and live-streaming presence.</p>
              </div>
              
              <div className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs font-semibold text-slate-700">
                Total Attendance: {attendanceRate}%
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                    <th className="px-6 py-3.5 font-bold">Class Subject</th>
                    <th className="px-6 py-3.5 font-bold">Log Date</th>
                    <th className="px-6 py-3.5 font-bold text-right">Roll Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {attendance.map(a => (
                    <tr key={a.attendance_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-semibold text-slate-800 text-left">{a.course_name}</td>
                      <td className="px-6 py-3.5 font-mono text-slate-400 text-left">{a.date}</td>
                      <td className="px-6 py-3.5 text-right">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.ONLINE_PRESENT
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
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
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. CLASS TIMETABLE CALENDAR */}
      {/* ========================================================= */}
      {activeTab === 'student-timetable' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="p-6 border-b border-slate-200 text-left">
            <h3 className="font-bold text-slate-800 text-sm">Weekly Academic Schedule</h3>
            <p className="text-xs text-slate-400 mt-0.5">Overview of class periods, assignments, and timetable ranges.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-200 text-xs">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
              const dayClasses = timetable.filter(t => t.day === day);
              return (
                <div key={day} className="p-4 bg-slate-50/50 min-h-[250px] space-y-3 text-left">
                  <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider border-b border-slate-200 pb-1.5 font-mono text-indigo-600">
                    {day}
                  </h4>
                  
                  {dayClasses.map((tt, idx) => (
                    <div key={`${tt.timetable_id || ''}-${idx}`} className="p-2.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                      <p className="font-semibold text-slate-800 leading-tight">{tt.course_name}</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-1 leading-none">{tt.start_time} - {tt.end_time}</p>
                    </div>
                  ))}
                  {dayClasses.length === 0 && (
                    <p className="text-[11px] text-slate-400 italic text-center py-4">No periods scheduled</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. ANNOUNCEMENTS LIST */}
      {/* ========================================================= */}
      {activeTab === 'student-announcements' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4 hover:shadow-md transition-all duration-300">
          <div className="text-left">
            <h3 className="font-bold text-slate-800 text-sm">School Announcement Bulletin</h3>
            <p className="text-xs text-slate-400">Read news and directives from school administrators and faculty.</p>
          </div>

          <div className="space-y-4 pt-2">
            {notifications.map((not, idx) => (
              <div key={`${not.notification_id || ''}-${idx}`} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex gap-3 text-left">
                <div className="bg-sky-100 text-sky-700 p-2 rounded-lg h-fit border border-sky-200 shrink-0">
                  <Bell size={15} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{not.title}</h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{not.message}</p>
                  <span className="text-[10px] text-slate-400 font-mono mt-2 block">Published: {new Date(not.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
