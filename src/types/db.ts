export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT'
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
  ONLINE_PRESENT = 'ONLINE_PRESENT'
}

export enum PaymentStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
  OVERDUE = 'OVERDUE'
}

// Database Interfaces
export interface User {
  id: string;
  fullname: string;
  email: string;
  password?: string; // Hashed password
  role: UserRole;
  created_at: string;
}

export interface Student {
  student_id: string;
  user_id: string;
  grade: string; // e.g., 'Grade 10'
  section: string; // e.g., 'A', 'B'
  parent_id?: string; // Link to parent
  gender?: string; // 'Male' | 'Female'
}

export interface Teacher {
  teacher_id: string;
  user_id: string;
  subject: string; // Specialization
}

export interface Parent {
  parent_id: string;
  user_id: string;
}

export interface Course {
  course_id: string;
  course_name: string;
  teacher_id: string;
}

export interface Attendance {
  attendance_id: string;
  student_id: string;
  course_id: string;
  status: AttendanceStatus;
  date: string; // YYYY-MM-DD
}

export interface Grade {
  grade_id: string;
  student_id: string;
  course_id: string;
  score: number; // e.g. 85, 92
  grade: string; // e.g. 'A', 'B+', 'F'
}

export interface Timetable {
  timetable_id: string;
  class_name: string; // e.g., 'Grade 10-A'
  course_id: string;
  teacher_id: string;
  day: string; // 'Monday', 'Tuesday', etc.
  start_time: string; // e.g., '09:00'
  end_time: string; // e.g., '10:30'
}

export interface Payment {
  payment_id: string;
  student_id: string;
  amount: number;
  payment_date: string; // YYYY-MM-DD
  status: PaymentStatus;
}

export interface Notification {
  notification_id: string;
  title: string;
  message: string;
  recipient: string; // User ID or 'ALL' or role-based like 'TEACHER'
  created_at: string;
}

// Joined/Aggregated Interfaces for Frontend Views
export interface UserWithProfile extends User {
  student_profile?: Student;
  teacher_profile?: Teacher;
  parent_profile?: Parent;
}

export interface StudentDetailed {
  student_id: string;
  user_id: string;
  fullname: string;
  email: string;
  grade: string;
  section: string;
  parent_id?: string;
  parent_name?: string;
  gender?: string;
  created_at: string;
}

export interface TeacherDetailed {
  teacher_id: string;
  user_id: string;
  fullname: string;
  email: string;
  subject: string;
  created_at: string;
}

export interface ParentDetailed {
  parent_id: string;
  user_id: string;
  fullname: string;
  email: string;
  children: {
    student_id: string;
    fullname: string;
    grade: string;
    section: string;
  }[];
  created_at: string;
}

export interface CourseDetailed {
  course_id: string;
  course_name: string;
  teacher_id: string;
  teacher_name: string;
}

export interface AttendanceDetailed {
  attendance_id: string;
  student_id: string;
  student_name: string;
  course_id: string;
  course_name: string;
  status: AttendanceStatus;
  date: string;
}

export interface GradeDetailed {
  grade_id: string;
  student_id: string;
  student_name: string;
  course_id: string;
  course_name: string;
  score: number;
  grade: string;
}

export interface TimetableDetailed {
  timetable_id: string;
  class_name: string;
  course_id: string;
  course_name: string;
  teacher_id: string;
  teacher_name: string;
  day: string;
  start_time: string;
  end_time: string;
}

export interface PaymentDetailed {
  payment_id: string;
  student_id: string;
  student_name: string;
  grade: string;
  amount: number;
  payment_date: string;
  status: PaymentStatus;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    fullname: string;
    email: string;
    role: UserRole;
  };
}

// --- NEW ASSIGNMENT SYSTEM INTERFACES ---
export interface AssignmentGroup {
  group_id: string;
  group_name: string;
  student_ids: string[];
}

export interface Assignment {
  assignment_id: string;
  title: string;
  description: string;
  course_id: string;
  course_name: string;
  class_name: string; // e.g., "Grade 10-A" or "Grade 10" or "All"
  type: 'INDIVIDUAL' | 'GROUP';
  due_date: string; // YYYY-MM-DD
  attachments: { name: string; url: string }[];
  created_at: string;
  groups?: AssignmentGroup[];
}

export interface AssignmentSubmission {
  submission_id: string;
  assignment_id: string;
  student_id?: string; // Set if INDIVIDUAL
  group_id?: string; // Set if GROUP
  student_name?: string; // helper name
  submitted_files: { name: string; content?: string; url?: string }[];
  submitted_at: string;
  status: 'SUBMITTED' | 'LATE' | 'MISSING' | 'GRADED' | 'REVISION_REQUESTED';
  score?: number;
  feedback?: string;
  group_member_contributions?: {
    student_id: string;
    student_name: string;
    contribution_percentage: number;
    notes: string;
  }[];
}

export interface AssignmentGroupChat {
  comment_id: string;
  assignment_id: string;
  group_id: string;
  student_id: string;
  student_name: string;
  message: string;
  created_at: string;
}

// --- NEW DIGITAL LIBRARY INTERFACES ---
export interface BookChapter {
  chapter_id: string;
  title: string;
  content: string;
}

export interface Book {
  book_id: string;
  title: string;
  author: string;
  grade_level: string; // "KG", "Elementary", "Middle", "High", "Grade 12"
  subject: string;
  cover_url: string;
  description: string;
  chapters: BookChapter[];
}

export interface ReadingProgress {
  progress_id: string;
  student_id: string;
  student_name: string;
  book_id: string;
  book_title: string;
  current_chapter_id: string;
  current_chapter_title: string;
  completed_percentage: number;
  last_read: string; // timestamp
}

export interface Bookmark {
  bookmark_id: string;
  student_id: string;
  book_id: string;
  book_title: string;
  chapter_id: string;
  chapter_title: string;
  note?: string;
  created_at: string;
}

export interface AiInteractionLog {
  log_id: string;
  student_id: string;
  student_name: string;
  grade?: string;
  class_name?: string;
  question: string;
  answer: string;
  referenced_books: { book_id: string; title: string; chapter: string }[];
  created_at: string;
}

// --- NEW LIVE CLASSROOM INTERFACES ---
export interface ClassroomCamera {
  camera_id: string;
  name: string;
  room_number: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface LiveSession {
  session_id: string;
  course_id: string;
  course_name: string;
  teacher_id: string;
  teacher_name: string;
  class_name: string; // e.g., "Grade 10-A"
  status: 'LIVE' | 'ENDED';
  started_at: string;
  ended_at?: string;
  video_url?: string; // Recorded session link
  camera_id: string;
  active_viewers: string[]; // List of student IDs
}

export interface LiveAttendanceLog {
  log_id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  joined_at: string;
  watched_duration_seconds: number;
  marked_present: boolean;
}

export const ACADEMIC_GRADES = [
  'KG',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12'
];

export const DEFAULT_SECTIONS = ['A', 'B', 'C', 'D'];

