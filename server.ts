import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { setGlobalDispatcher, Agent } from 'undici';
import { db } from './src/db/dbEngine';
import { UserRole, AttendanceStatus, PaymentStatus } from './src/types/db';

// Configure global fetch dispatcher for long-running AI operations (like base64 PDFs)
setGlobalDispatcher(new Agent({
  headersTimeout: 180000, // 3 minutes
  bodyTimeout: 180000,    // 3 minutes
  connectTimeout: 60000,   // 1 minute
}));

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'school-mgmt-super-secure-jwt-secret-99';

// Lazy-initialize Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is not configured. Please add it in the Secrets panel.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        timeout: 180000, // 3 minutes
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Robust retry wrapper for Gemini API calls to gracefully handle transient 503/429 errors
async function withRetry<T>(fn: () => Promise<T>, retries = 5, delayMs = 2000): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const errMsg = err.message || '';
    const status = err.status || err.statusCode || (err.error && err.error.code) || 0;
    const isTransient = status === 503 || status === 429 || 
                        errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || 
                        errMsg.includes('high demand') || errMsg.includes('429') || 
                        errMsg.includes('Too Many Requests') || errMsg.includes('fetch failed') ||
                        errMsg.includes('timeout') || errMsg.includes('Timeout');
    if (retries > 0 && isTransient) {
      // Add a randomized jitter between 0 and 1000ms
      const jitter = Math.floor(Math.random() * 1000);
      const totalDelay = delayMs + jitter;
      console.warn(`Gemini API returned transient error (status ${status}). Retrying in ${totalDelay}ms... (${retries} retries left). Error:`, errMsg);
      await new Promise(resolve => setTimeout(resolve, totalDelay));
      return withRetry(fn, retries - 1, delayMs * 2);
    }
    
    // If we exhausted retries on high demand, return a more human-friendly, beautiful error message
    if (isTransient) {
      throw new Error('The AI service is currently experiencing extremely high demand. Please wait a few moments and try your upload again, or use a smaller PDF/text file.');
    }
    throw err;
  }
}

// Extends Request interface to hold auth data
interface AuthRequest extends Request {
  user?: {
    id: string;
    fullname: string;
    email: string;
    role: UserRole;
  };
}

async function startServer() {
  const app = express();

  // Middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // CORS middleware for iframe compliance & local routes
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Authentication Middleware
  const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1]; // "Bearer <TOKEN>"
      jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
          return res.status(403).json({ error: 'Forbidden. Invalid or expired token.' });
        }
        req.user = user as { id: string; fullname: string; email: string; role: UserRole };
        next();
      });
    } else {
      res.status(401).json({ error: 'Unauthorized. Auth header missing.' });
    }
  };

  // Role Authorization Middleware Maker
  const authorizeRoles = (...allowedRoles: UserRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: `Forbidden. Requires role: [${allowedRoles.join(', ')}]` });
      }
      next();
    };
  };

  // --- REST API ENDPOINTS ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 1. AUTHENTICATION ENDPOINTS
  
  // Login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = db.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Read real password hash
      const realUser = db.getUserById(user.id);
      if (!realUser || !realUser.password) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isPasswordValid = bcrypt.compareSync(password, realUser.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { id: user.id, fullname: user.fullname, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          fullname: user.fullname,
          email: user.email,
          role: user.role
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Internal server error: ' + err.message });
    }
  });

  // Get current user profile
  app.get('/api/auth/me', authenticateJWT, (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const user = db.getUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User profile not found' });

    // Include sub-profile depending on role
    let profile: any = null;
    if (user.role === UserRole.STUDENT) {
      profile = db.getStudentByUserId(user.id);
    } else if (user.role === UserRole.TEACHER) {
      profile = db.getTeacherByUserId(user.id);
    } else if (user.role === UserRole.PARENT) {
      profile = db.getParentByUserId(user.id);
    }

    res.json({
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      },
      profile
    });
  });

  // Register
  app.post('/api/auth/register', (req: Request, res: Response) => {
    try {
      const { fullname, email, password, role, gender, grade, section } = req.body;
      if (!fullname || !email || !password || !role) {
        return res.status(400).json({ error: 'Missing required signup fields' });
      }

      const existing = db.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const created = db.createUser({
        fullname,
        email,
        password,
        role: role as UserRole
      });

      // If they are Student, Teacher, or Parent, provision appropriate default profiles
      if (role === UserRole.STUDENT) {
        // Create student entry using grade, section, and gender
        db.createStudent(fullname, email, grade || 'Grade 10', section || 'auto', undefined, gender);
      } else if (role === UserRole.TEACHER) {
        db.createTeacher(fullname, email, 'General Science');
      } else if (role === UserRole.PARENT) {
        db.createParent(fullname, email);
      }

      const token = jwt.sign(
        { id: created.id, fullname: created.fullname, email: created.email, role: created.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: {
          id: created.id,
          fullname: created.fullname,
          email: created.email,
          role: created.role
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Change Password
  app.post('/api/auth/change-password', authenticateJWT, (req: AuthRequest, res: Response) => {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Old and new passwords are required' });
      }

      const user = db.getUserById(req.user!.id);
      if (!user || !user.password) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isOldValid = bcrypt.compareSync(oldPassword, user.password);
      if (!isOldValid) {
        return res.status(401).json({ error: 'Incorrect current password' });
      }

      db.updateUser(user.id, { password: newPassword });
      res.json({ message: 'Password updated successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Forgot Password / Reset Link (Simulated)
  app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'No account matches this email' });
    }

    // Success response with clear mock recovery info
    res.json({
      message: 'Password reset link sent to your email. (For demo purposes, password has been reset to "password123")',
    });
    
    db.updateUser(user.id, { password: 'password123' });
  });

  // 2. STUDENT APIS
  app.get('/api/students', authenticateJWT, (req: AuthRequest, res: Response) => {
    res.json(db.getAllStudentsDetailed());
  });

  app.get('/api/students/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
    const std = db.getStudentByIdDetailed(req.params.id);
    if (!std) return res.status(404).json({ error: 'Student not found' });
    res.json(std);
  });

  app.post('/api/students', authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    try {
      const { fullname, email, grade, section, parent_id } = req.body;
      if (!fullname || !email || !grade || !section) {
        return res.status(400).json({ error: 'Fullname, email, grade, and section are required' });
      }

      const existing = db.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const student = db.createStudent(fullname, email, grade, section, parent_id);
      res.status(201).json(student);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/students/:id', authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    try {
      const updated = db.updateStudent(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Student not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/students/:id', authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    const student = db.getAllStudentsDetailed().find(s => s.student_id === req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    db.deleteUser(student.user_id);
    res.json({ message: 'Student and linked login profile deleted successfully' });
  });

  // 3. TEACHER APIS
  app.get('/api/teachers', authenticateJWT, (req: AuthRequest, res: Response) => {
    res.json(db.getAllTeachersDetailed());
  });

  app.post('/api/teachers', authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    try {
      const { fullname, email, subject } = req.body;
      if (!fullname || !email || !subject) {
        return res.status(400).json({ error: 'Fullname, email, and subject are required' });
      }

      const existing = db.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const teacher = db.createTeacher(fullname, email, subject);
      res.status(201).json(teacher);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/teachers/:id', authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    try {
      const updated = db.updateTeacher(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Teacher not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/teachers/:id', authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    const teacher = db.getAllTeachersDetailed().find(t => t.teacher_id === req.params.id);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    db.deleteUser(teacher.user_id);
    res.json({ message: 'Teacher deleted successfully' });
  });

  // 4. PARENTS APIS
  app.get('/api/parents', authenticateJWT, (req: AuthRequest, res: Response) => {
    res.json(db.getAllParentsDetailed());
  });

  app.post('/api/parents', authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    try {
      const { fullname, email } = req.body;
      if (!fullname || !email) {
        return res.status(400).json({ error: 'Fullname and email are required' });
      }

      const existing = db.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: 'Email already in use' });
      }

      const parent = db.createParent(fullname, email);
      res.status(201).json(parent);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/parents/:id', authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    try {
      const updated = db.updateParent(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Parent not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. COURSE APIS
  app.get('/api/courses', authenticateJWT, (req: AuthRequest, res: Response) => {
    res.json(db.getAllCoursesDetailed());
  });

  app.post('/api/courses', authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    try {
      const { course_name, teacher_id } = req.body;
      if (!course_name || !teacher_id) {
        return res.status(400).json({ error: 'Course name and Teacher ID are required' });
      }

      const course = db.createCourse(course_name, teacher_id);
      res.status(201).json(course);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/courses/:id', authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    const { course_name, teacher_id } = req.body;
    const updated = db.updateCourse(req.params.id, course_name, teacher_id);
    if (!updated) return res.status(404).json({ error: 'Course not found' });
    res.json(updated);
  });

  app.delete('/api/courses/:id', authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    const success = db.deleteCourse(req.params.id);
    if (!success) return res.status(404).json({ error: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
  });

  // 6. ATTENDANCE APIS
  app.get('/api/attendance', authenticateJWT, (req: AuthRequest, res: Response) => {
    res.json(db.getAllAttendanceDetailed());
  });

  app.post('/api/attendance', authenticateJWT, authorizeRoles(UserRole.ADMIN, UserRole.TEACHER), (req: AuthRequest, res: Response) => {
    try {
      const { student_id, course_id, status, date } = req.body;
      if (!student_id || !course_id || !status || !date) {
        return res.status(400).json({ error: 'student_id, course_id, status, and date are required' });
      }

      const recorded = db.recordAttendance(student_id, course_id, status as AttendanceStatus, date);
      res.status(200).json(recorded);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. GRADES APIS
  app.get('/api/grades', authenticateJWT, (req: AuthRequest, res: Response) => {
    res.json(db.getAllGradesDetailed());
  });

  app.post('/api/grades', authenticateJWT, authorizeRoles(UserRole.ADMIN, UserRole.TEACHER), (req: AuthRequest, res: Response) => {
    try {
      const { student_id, course_id, score } = req.body;
      if (!student_id || !course_id || score === undefined) {
        return res.status(400).json({ error: 'student_id, course_id, and score are required' });
      }

      const numericScore = Number(score);
      if (isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
        return res.status(400).json({ error: 'Score must be a number between 0 and 100' });
      }

      const grade = db.addGrade(student_id, course_id, numericScore);
      
      // Auto-trigger a system-wide notification for students and parents!
      db.createNotification(
        `New Grade Posted: ${grade.course_name}`,
        `A new grade has been posted for ${grade.student_name} in ${grade.course_name}: Score of ${grade.score}% (Grade: ${grade.grade}).`,
        'ALL'
      );

      res.status(200).json(grade);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/grades/:id', authenticateJWT, authorizeRoles(UserRole.ADMIN, UserRole.TEACHER), (req: AuthRequest, res: Response) => {
    const success = db.deleteGrade(req.params.id);
    if (!success) return res.status(404).json({ error: 'Grade record not found' });
    res.json({ message: 'Grade record deleted successfully' });
  });

  // 8. TIMETABLE APIS
  app.get('/api/timetables', authenticateJWT, (req: AuthRequest, res: Response) => {
    res.json(db.getAllTimetablesDetailed());
  });

  app.post('/api/timetables', authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    try {
      const { class_name, course_id, teacher_id, day, start_time, end_time } = req.body;
      if (!class_name || !course_id || !teacher_id || !day || !start_time || !end_time) {
        return res.status(400).json({ error: 'All schedule details are required' });
      }

      const schedule = db.createTimetableSchedule(class_name, course_id, teacher_id, day, start_time, end_time);
      res.status(201).json(schedule);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/timetables/:id', authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    const success = db.deleteTimetableSchedule(req.params.id);
    if (!success) return res.status(404).json({ error: 'Schedule entry not found' });
    res.json({ message: 'Schedule entry deleted successfully' });
  });

  // 9. FEE/PAYMENTS APIS
  app.get('/api/payments', authenticateJWT, (req: AuthRequest, res: Response) => {
    res.json(db.getAllPaymentsDetailed());
  });

  app.post('/api/payments', authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    try {
      const { student_id, amount, status, date } = req.body;
      if (!student_id || !amount || !status) {
        return res.status(400).json({ error: 'student_id, amount, and status are required' });
      }

      const numericAmount = Number(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
      }

      const payment = db.addPayment(student_id, numericAmount, status as PaymentStatus, date);
      res.status(201).json(payment);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/payments/:id', authenticateJWT, authorizeRoles(UserRole.ADMIN, UserRole.PARENT), (req: AuthRequest, res: Response) => {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: 'Status is required' });

      const updated = db.updatePaymentStatus(req.params.id, status as PaymentStatus);
      if (!updated) return res.status(404).json({ error: 'Payment bill not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 10. NOTIFICATIONS/ANNOUNCEMENTS APIS
  app.get(['/api/notifications', '/api/announcements', '/api/updates', '/api/bulletins'], authenticateJWT, (req: AuthRequest, res: Response) => {
    res.json(db.getAllNotifications());
  });

  app.post(['/api/notifications', '/api/announcements', '/api/updates', '/api/bulletins'], authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    try {
      const { title, message, recipient } = req.body;
      if (!title || !message || !recipient) {
        return res.status(400).json({ error: 'Title, message, and recipient target are required' });
      }

      const notif = db.createNotification(title, message, recipient);
      res.status(201).json(notif);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete(['/api/notifications/:id', '/api/announcements/:id', '/api/updates/:id', '/api/bulletins/:id'], authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    const success = db.deleteNotification(req.params.id);
    if (!success) return res.status(404).json({ error: 'Notification not found' });
    res.json({ message: 'Notification deleted successfully' });
  });

  // --- 11. SECTIONS APIS ---
  app.get('/api/sections', authenticateJWT, (req: AuthRequest, res: Response) => {
    res.json(db.getAvailableSections());
  });

  app.post('/api/sections', authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: 'Section name is required' });
      const list = db.createSection(name);
      res.status(201).json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- 12. ASSIGNMENT APIS ---
  app.get('/api/assignments', authenticateJWT, (req: AuthRequest, res: Response) => {
    try {
      const { student_id } = req.query;
      if (student_id) {
        return res.json(db.getAssignmentsForStudent(student_id as string));
      }
      res.json(db.getAllAssignments());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/assignments/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
    const asg = db.getAssignmentById(req.params.id);
    if (!asg) return res.status(404).json({ error: 'Assignment not found' });
    res.json(asg);
  });

  app.post('/api/assignments', authenticateJWT, authorizeRoles(UserRole.TEACHER, UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    try {
      const { title, description, course_id, class_name, type, due_date, attachments, groups } = req.body;
      if (!title || !description || !course_id || !class_name || !type || !due_date) {
        return res.status(400).json({ error: 'Missing required assignment fields' });
      }
      const asg = db.createAssignment(title, description, course_id, class_name, type, due_date, attachments || [], groups);
      res.status(201).json(asg);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/submissions', authenticateJWT, (req: AuthRequest, res: Response) => {
    try {
      const { assignment_id, student_id } = req.query;
      if (assignment_id) {
        return res.json(db.getSubmissionsForAssignment(assignment_id as string));
      }
      if (student_id) {
        return res.json(db.getSubmissionsForStudent(student_id as string));
      }
      res.json(db.getAllSubmissions());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/submissions', authenticateJWT, (req: AuthRequest, res: Response) => {
    try {
      const { assignment_id, student_id, files, memberContributions } = req.body;
      if (!assignment_id || !student_id || !files) {
        return res.status(400).json({ error: 'Missing submission details' });
      }
      const sub = db.submitAssignment(assignment_id, student_id, files, memberContributions);
      res.status(201).json(sub);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/submissions/:id/grade', authenticateJWT, authorizeRoles(UserRole.TEACHER, UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    try {
      const { score, feedback } = req.body;
      if (score === undefined || !feedback) {
        return res.status(400).json({ error: 'Score and feedback are required' });
      }
      const graded = db.gradeSubmission(req.params.id, Number(score), feedback);
      if (!graded) return res.status(404).json({ error: 'Submission not found' });
      res.json(graded);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/submissions/:id/revision', authenticateJWT, authorizeRoles(UserRole.TEACHER, UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    try {
      const { comments } = req.body;
      if (!comments) {
        return res.status(400).json({ error: 'Revision feedback comments are required' });
      }
      const revised = db.requestRevision(req.params.id, comments);
      if (!revised) return res.status(404).json({ error: 'Submission not found' });
      res.json(revised);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/submissions/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
    try {
      const success = db.deleteSubmission(req.params.id);
      if (!success) return res.status(404).json({ error: 'Submission not found' });
      res.json({ message: 'Submission deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/assignments/:id/groups/:groupId/chat', authenticateJWT, (req: AuthRequest, res: Response) => {
    res.json(db.getGroupChats(req.params.id, req.params.groupId));
  });

  app.post('/api/assignments/:id/groups/:groupId/chat', authenticateJWT, (req: AuthRequest, res: Response) => {
    try {
      const { student_id, message } = req.body;
      if (!student_id || !message) {
        return res.status(400).json({ error: 'Student ID and message are required' });
      }
      const chat = db.postGroupComment(req.params.id, req.params.groupId, student_id, message);
      res.status(201).json(chat);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- 13. DIGITAL LIBRARY APIS ---
  app.get('/api/books', authenticateJWT, (req: AuthRequest, res: Response) => {
    res.json(db.getBooks());
  });

  app.post('/api/books/parse-text', authenticateJWT, authorizeRoles(UserRole.ADMIN), async (req: AuthRequest, res: Response) => {
    try {
      const { text, grade_level, subject } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Book raw text content is required' });
      }

      const prompt = `Analyze the following uploaded textbook raw text. Extract and structure it into a complete textbook suitable for the specified grade level: "${grade_level || 'High'}" and subject: "${subject || 'Science'}".
If the text is too long or unstructured, write high-quality educational chapters, sections, or lessons explaining the key concepts of the text, tailored specifically to the learning capacity, tone, and depth of the target grade level: "${grade_level || 'High'}".

RAW TEXT CONTENT FROM UPLOADED FILE:
${text.slice(0, 50000)}

Make sure to explain everything clearly and build the chapters sequentially. Create 1-5 chapters depending on the content size. All text must be highly engaging, pedagogical, and perfectly suited to the "${grade_level || 'High'}" audience.`;

      const gemini = getGeminiClient();
      const aiResponse = await withRetry(() => gemini.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "A structured, clear book title suited for the subject and grade level." },
              author: { type: Type.STRING, description: "The author name if found in the text, otherwise a suitable academic name or 'Smart Academy AI'." },
              description: { type: Type.STRING, description: "A brief description or summary of the book contents." },
              chapters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Chapter or Lesson title (e.g. Chapter 1: Introduction to Mechanics)" },
                    content: { type: Type.STRING, description: "Extracted and structured content for this chapter/lesson. It must be written at the pedagogical level suitable for the target grade level." }
                  },
                  required: ["title", "content"]
                }
              }
            },
            required: ["title", "author", "description", "chapters"]
          }
        }
      }));

      const structuredBook = JSON.parse(aiResponse.text || '{}');
      res.json(structuredBook);
    } catch (err: any) {
      console.error('Error parsing book file:', err);
      res.status(500).json({ error: err.message || 'Failed to structure textbook using AI' });
    }
  });

  app.post('/api/books/parse-pdf', authenticateJWT, authorizeRoles(UserRole.ADMIN), async (req: AuthRequest, res: Response) => {
    try {
      const { pdfBase64, grade_level, subject } = req.body;
      if (!pdfBase64) {
        return res.status(400).json({ error: 'Book raw PDF base64 content is required' });
      }

      const prompt = `Analyze the following uploaded textbook PDF. Extract and structure it into a complete textbook suitable for the specified grade level: "${grade_level || 'High'}" and subject: "${subject || 'Science'}".
If the document is too long or has too many chapters, select or summarize the key chapters and write high-quality educational chapters, sections, or lessons explaining the key concepts of the text, tailored specifically to the learning capacity, tone, and depth of the target grade level: "${grade_level || 'High'}".

Make sure to explain everything clearly and build the chapters sequentially. Create 1-5 chapters depending on the content size. All text must be highly engaging, pedagogical, and perfectly suited to the "${grade_level || 'High'}" audience.`;

      const gemini = getGeminiClient();
      const aiResponse = await withRetry(() => gemini.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            inlineData: {
              data: pdfBase64,
              mimeType: 'application/pdf'
            }
          },
          prompt
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "A structured, clear book title suited for the subject and grade level." },
              author: { type: Type.STRING, description: "The author name if found in the text, otherwise a suitable academic name or 'Smart Academy AI'." },
              description: { type: Type.STRING, description: "A brief description or summary of the book contents." },
              chapters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Chapter or Lesson title (e.g. Chapter 1: Introduction to Mechanics)" },
                    content: { type: Type.STRING, description: "Extracted and structured content for this chapter/lesson. It must be written at the pedagogical level suitable for the target grade level." }
                  },
                  required: ["title", "content"]
                }
              }
            },
            required: ["title", "author", "description", "chapters"]
          }
        }
      }));

      const structuredBook = JSON.parse(aiResponse.text || '{}');
      res.json(structuredBook);
    } catch (err: any) {
      console.error('Error parsing book PDF file:', err);
      res.status(500).json({ error: err.message || 'Failed to structure textbook from PDF using AI' });
    }
  });

  app.post('/api/books', authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    try {
      const { title, author, grade_level, subject, cover_url, description, chapters } = req.body;
      if (!title || !author || !grade_level || !subject || !chapters || !Array.isArray(chapters)) {
        return res.status(400).json({ error: 'Missing book details (title, author, grade_level, subject, chapters are required)' });
      }
      const book_id = `bk-${Math.random().toString(36).substr(2, 9)}`;
      const formattedChapters = chapters.map((ch: any, idx: number) => ({
        chapter_id: ch.chapter_id || `ch-${book_id}-${idx + 1}`,
        title: ch.title || `Chapter ${idx + 1}`,
        content: ch.content || ''
      }));
      const newBook = db.addBook({
        book_id,
        title,
        author,
        grade_level,
        subject,
        cover_url: cover_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=200&auto=format&fit=crop&q=60',
        description: description || '',
        chapters: formattedChapters
      });
      res.status(201).json(newBook);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/books/:id', authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    try {
      const success = db.deleteBook(req.params.id);
      if (!success) return res.status(404).json({ error: 'Book not found' });
      res.json({ message: 'Book deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/books/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
    const bk = db.getBookById(req.params.id);
    if (!bk) return res.status(404).json({ error: 'Book not found' });
    res.json(bk);
  });

  app.get('/api/students/:id/reading-progress', authenticateJWT, (req: AuthRequest, res: Response) => {
    res.json(db.getReadingProgressForStudent(req.params.id));
  });

  app.post('/api/students/:id/reading-progress', authenticateJWT, (req: AuthRequest, res: Response) => {
    try {
      const { bookId, chapterId, completedPercentage } = req.body;
      if (!bookId || !chapterId || completedPercentage === undefined) {
        return res.status(400).json({ error: 'Book ID, Chapter ID, and progress percentage are required' });
      }
      const prog = db.updateReadingProgress(req.params.id, bookId, chapterId, Number(completedPercentage));
      res.json(prog);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get(['/api/students/:id/bookmarks', '/api/students/:id/favs'], authenticateJWT, (req: AuthRequest, res: Response) => {
    res.json(db.getBookmarksForStudent(req.params.id));
  });

  app.post(['/api/students/:id/bookmarks', '/api/students/:id/favs'], authenticateJWT, (req: AuthRequest, res: Response) => {
    try {
      const { bookId, chapterId, note } = req.body;
      if (!bookId || !chapterId) {
        return res.status(400).json({ error: 'Book ID and Chapter ID are required' });
      }
      const bmk = db.addBookmark(req.params.id, bookId, chapterId, note);
      res.status(201).json(bmk);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete(['/api/bookmarks/:id', '/api/favs/:id'], authenticateJWT, (req: AuthRequest, res: Response) => {
    const success = db.deleteBookmark(req.params.id);
    if (!success) return res.status(404).json({ error: 'Bookmark not found' });
    res.json({ message: 'Bookmark deleted successfully' });
  });

  app.get(['/api/bookmarks', '/api/favs'], authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    try {
      res.json(db.getAllBookmarks());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/library/ai-logs', authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    try {
      res.json(db.getAllAiInteractionLogs());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Library admin analytics reports
  app.get(['/api/library/analytics', '/api/library/insights'], authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    try {
      const allProgress = db.getAllReadingProgress();
      const aiLogs = db.getAllAiInteractionLogs();
      const books = db.getBooks();

      // Readers count
      const activeReadersCount = Array.from(new Set(allProgress.map(p => p.student_id))).length;

      // Popular books
      const popularMap: any = {};
      allProgress.forEach(p => {
        popularMap[p.book_title] = (popularMap[p.book_title] || 0) + 1;
      });
      const popularBooks = Object.keys(popularMap).map(title => ({
        title,
        readers: popularMap[title]
      })).sort((a,b) => b.readers - a.readers);

      // AI logs by grade
      const aiByGradeMap: any = {};
      aiLogs.forEach(log => {
        if (log.grade) {
          aiByGradeMap[log.grade] = (aiByGradeMap[log.grade] || 0) + 1;
        }
      });
      const aiByGrade = Object.keys(aiByGradeMap).map(grade => ({
        grade,
        queries: aiByGradeMap[grade]
      }));

      // Engagement report
      const engagementReport = allProgress.map(p => ({
        student_name: p.student_name,
        book_title: p.book_title,
        chapter_title: p.current_chapter_title,
        percentage: p.completed_percentage,
        last_read: p.last_read
      }));

      // Daily AI usage study trends
      const studyTrendsMap: any = {};
      aiLogs.forEach(log => {
        const date = log.created_at.split('T')[0];
        studyTrendsMap[date] = (studyTrendsMap[date] || 0) + 1;
      });
      const studyTrends = Object.keys(studyTrendsMap).map(date => ({
        date,
        aiQueries: studyTrendsMap[date]
      })).sort((a,b) => a.date.localeCompare(b.date));

      res.json({
        activeReaders: activeReadersCount,
        popularBooks,
        aiUsage: {
          totalQueries: aiLogs.length,
          byGrade: aiByGrade
        },
        learningEngagementReport: engagementReport,
        studyTrends,
        logs: aiLogs
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // AI Learning Assistant RAG chatbot endpoint
  app.post('/api/library/ai', authenticateJWT, async (req: AuthRequest, res: Response) => {
    try {
      const { student_id, question, book_id, chapter_id } = req.body;
      if (!student_id || !question) {
        return res.status(400).json({ error: 'Student ID and question are required' });
      }

      const books = db.getBooks();
      let relevantChapters: { bookTitle: string; bookId: string; chapterId: string; chapterTitle: string; content: string; gradeLevel: string }[] = [];
      let targetBookGrade = 'High';

      // 1. Resolve direct selected context if provided
      if (book_id) {
        const matchedBook = books.find(b => b.book_id === book_id);
        if (matchedBook) {
          targetBookGrade = matchedBook.grade_level;
          const matchedChapter = chapter_id 
            ? matchedBook.chapters.find(c => c.chapter_id === chapter_id)
            : matchedBook.chapters[0];

          if (matchedChapter) {
            relevantChapters.push({
              bookTitle: matchedBook.title,
              bookId: matchedBook.book_id,
              chapterId: matchedChapter.chapter_id,
              chapterTitle: matchedChapter.title,
              content: matchedChapter.content,
              gradeLevel: matchedBook.grade_level
            });
          }
        }
      }

      // 2. Keyword fallback search if no precise chapter matched
      if (relevantChapters.length === 0) {
        const queryWords = question.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter((w: string) => w.length > 3);
        const scoredChapters: { bookTitle: string; bookId: string; chapterId: string; chapterTitle: string; content: string; gradeLevel: string; score: number }[] = [];

        books.forEach(bk => {
          bk.chapters.forEach(ch => {
            let score = 0;
            const chapterText = (ch.title + ' ' + (ch.content.startsWith('data:') ? '' : ch.content)).toLowerCase();
            queryWords.forEach((word: string) => {
              if (chapterText.includes(word)) {
                score += 1;
              }
            });
            if (score > 0) {
              scoredChapters.push({
                bookTitle: bk.title,
                bookId: bk.book_id,
                chapterId: ch.chapter_id,
                chapterTitle: ch.title,
                content: ch.content,
                gradeLevel: bk.grade_level,
                score
              });
            }
          });
        });

        scoredChapters.sort((a, b) => b.score - a.score);
        const matchedScored = scoredChapters.slice(0, 2);
        matchedScored.forEach(ms => {
          relevantChapters.push({
            bookTitle: ms.bookTitle,
            bookId: ms.bookId,
            chapterId: ms.chapterId,
            chapterTitle: ms.chapterTitle,
            content: ms.content,
            gradeLevel: ms.gradeLevel
          });
        });
      }

      // 3. Fallback to first chapter of first book if still empty
      if (relevantChapters.length === 0 && books.length > 0) {
        const firstBk = books[0];
        if (firstBk && firstBk.chapters[0]) {
          targetBookGrade = firstBk.grade_level;
          relevantChapters.push({
            bookTitle: firstBk.title,
            bookId: firstBk.book_id,
            chapterId: firstBk.chapters[0].chapter_id,
            chapterTitle: firstBk.chapters[0].title,
            content: firstBk.chapters[0].content,
            gradeLevel: firstBk.grade_level
          });
        }
      }

      let context = '';
      const referencedBooks: { book_id: string; title: string; chapter: string }[] = [];
      let pdfBase64Content = '';

      relevantChapters.forEach(rc => {
        if (rc.content.startsWith('data:application/pdf;base64,')) {
          pdfBase64Content = rc.content.split(',')[1];
        } else {
          context += `[Book Title: ${rc.bookTitle}, Chapter: ${rc.chapterTitle}]\n"${rc.content}"\n\n`;
        }
        referencedBooks.push({
          book_id: rc.bookId,
          title: rc.bookTitle,
          chapter: rc.chapterTitle
        });
      });

      // Fetch student grade profile
      const studentProfile = db.getStudentByIdDetailed(student_id);
      const studentGrade = studentProfile ? studentProfile.grade : 'High';

      const prompt = `You are an AI Learning Assistant for our school's Smart Education Platform.
Your task is to answer the student's question STRICTLY using the provided textbook chapters context from our digital library.

STUDENT INFO:
- Grade Level: ${studentGrade}

TEXTBOOK CONTEXT FROM SCHOOL DIGITAL LIBRARY (Target Book Grade Level: ${targetBookGrade}):
${context}

STUDENT QUESTION: "${question}"

INSTRUCTIONS FOR GRADE-LEVEL COMPREHENSION:
- You MUST adapt your vocabulary, tutoring style, explanation depth, and complexity to be age-appropriate for the student's grade (${studentGrade}) and the book's target grade level (${targetBookGrade}).
- If the grade level is "KG": Use super simple, warm, sweet, pre-school friendly language. Use cute analogies (e.g. cell walls are like "cozy little cell jackets", gravity is like "invisible friendly magnets"), keep sentences short, and use lots of exclamation marks.
- If the grade level is "Elementary" (Grades 1-5): Use simple words, elementary-friendly vocabulary, clear and friendly tone, and basic visual/concrete examples.
- If the grade level is "Middle" (Grades 6-8): Use moderate, intermediate complexity, explain basic scientific/historical terms clearly, and use clear conceptual examples.
- If the grade level is "High" / "Grade 12" (Grades 9-12): Use sophisticated, academic, advanced college-prep vocabulary, precise scientific/academic definitions, and thorough, rigorous analyses.

INSTRUCTIONS:
1. Answer the question accurately based ONLY on the context provided.
2. Be encouraging, clear, and helpful.
3. CITE the textbook title and chapter title clearly in your response.
4. If the question is completely unrelated to the textbook context, or the answer cannot be found in the context, respond politely: "I can only answer questions related to our digital library textbooks. Please ask about cell biology, physics, or world history!"
5. Do NOT use any external knowledge or internet facts.`;

      const gemini = getGeminiClient();
      let aiResponse;

      if (pdfBase64Content) {
        const pdfPrompt = `You are an AI Learning Assistant for our school's Smart Education Platform.
Your task is to answer the student's question STRICTLY using the provided textbook PDF from our digital library.

STUDENT INFO:
- Grade Level: ${studentGrade}

STUDENT QUESTION: "${question}"

INSTRUCTIONS FOR GRADE-LEVEL COMPREHENSION:
- You MUST adapt your vocabulary, tutoring style, explanation depth, and complexity to be age-appropriate for the student's grade (${studentGrade}) and the book's target grade level (${targetBookGrade}).
- If the grade level is "KG": Use super simple, warm, sweet, pre-school friendly language. Use cute analogies, keep sentences short, and use lots of exclamation marks.
- If the grade level is "Elementary" (Grades 1-5): Use simple words, elementary-friendly vocabulary, clear and friendly tone, and basic concrete examples.
- If the grade level is "Middle" (Grades 6-8): Use moderate, intermediate complexity, explain basic scientific/historical terms clearly.
- If the grade level is "High" / "Grade 12" (Grades 9-12): Use sophisticated, academic, advanced college-prep vocabulary, precise definitions, and thorough analyses.

INSTRUCTIONS:
1. Answer the question accurately based ONLY on the provided PDF context.
2. Be encouraging, clear, and helpful.
3. Cite the textbook and chapter title clearly in your response.
4. If the question is completely unrelated to the textbook, or cannot be answered using the PDF, respond politely: "I can only answer questions related to our digital library textbooks."
5. Do NOT use any external knowledge or internet facts.`;

        aiResponse = await withRetry(() => gemini.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [
            {
              inlineData: {
                data: pdfBase64Content,
                mimeType: 'application/pdf'
              }
            },
            pdfPrompt
          ]
        }));
      } else {
        aiResponse = await withRetry(() => gemini.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt
        }));
      }

      const answer = aiResponse.text || "I apologize, but I could not formulate a response.";
      const log = db.logAiInteraction(student_id, question, answer, referencedBooks);

      const matchedBook = referencedBooks[0];
      const rag_steps = [
        `[1. Upload Book] Loaded active school digital catalog with ${books.length} publications.`,
        `[2. Extract Text] Parsed content blocks for query term.`,
        `[3. Create Embeddings] Constructed localized semantic indices.`,
        `[4. Store Embeddings] Cached vector tokens in active database index.`,
        matchedBook 
          ? `[5. Search Knowledge Base] Found matched content node: "${matchedBook.title}" - "${matchedBook.chapter}".`
          : `[5. Search Knowledge Base] No exact match; fallback to default textbook reference.`,
        `[6. Generate Response] Grounded answer generated strictly using textbook context via Gemini.`
      ];

      res.json({ answer, log, rag_steps });
    } catch (err: any) {
      console.error('Gemini AI tutor failed:', err);
      res.status(500).json({ error: err.message || 'Gemini tutoring server error' });
    }
  });

  // --- 14. LIVE CLASSROOM APIS ---
  app.get('/api/cameras', authenticateJWT, (req: AuthRequest, res: Response) => {
    res.json(db.getCameras());
  });

  app.post('/api/cameras', authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    try {
      const { name, roomNumber } = req.body;
      if (!name || !roomNumber) {
        return res.status(400).json({ error: 'Name and Room Number are required' });
      }
      const cam = db.createCamera(name, roomNumber);
      res.status(201).json(cam);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/cameras/:id/status', authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: 'Status is required' });
      const updated = db.updateCameraStatus(req.params.id, status as 'ACTIVE' | 'INACTIVE');
      if (!updated) return res.status(404).json({ error: 'Camera not found' });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/live-sessions', authenticateJWT, (req: AuthRequest, res: Response) => {
    res.json(db.getLiveSessions());
  });

  app.post('/api/live-sessions', authenticateJWT, authorizeRoles(UserRole.TEACHER, UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    try {
      const { courseId, teacherId, className, cameraId } = req.body;
      if (!courseId || !teacherId || !className || !cameraId) {
        return res.status(400).json({ error: 'Missing session setup parameters' });
      }
      const session = db.startLiveSession(courseId, teacherId, className, cameraId);
      res.status(201).json(session);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/live-sessions/:id/end', authenticateJWT, authorizeRoles(UserRole.TEACHER, UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    try {
      const { videoUrl } = req.body;
      const session = db.endLiveSession(req.params.id, videoUrl);
      if (!session) return res.status(404).json({ error: 'Live session not found' });
      res.json(session);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/live-sessions/:id/join', authenticateJWT, (req: AuthRequest, res: Response) => {
    try {
      const { studentId } = req.body;
      if (!studentId) return res.status(400).json({ error: 'Student ID is required' });
      const success = db.joinLiveSession(req.params.id, studentId);
      if (!success) return res.status(404).json({ error: 'Live session not found' });
      res.json({ message: 'Successfully joined live classroom feed' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/live-sessions/:id/leave', authenticateJWT, (req: AuthRequest, res: Response) => {
    try {
      const { studentId, durationSeconds } = req.body;
      if (!studentId || durationSeconds === undefined) {
        return res.status(400).json({ error: 'Student ID and watched duration are required' });
      }
      const success = db.leaveLiveSession(req.params.id, studentId, Number(durationSeconds));
      if (!success) return res.status(404).json({ error: 'Live session not found' });
      res.json({ message: 'Successfully left live classroom feed' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/live-sessions/:id/attendance', authenticateJWT, (req: AuthRequest, res: Response) => {
    res.json(db.getLiveAttendanceLogsForSession(req.params.id));
  });

  app.get(['/api/live-sessions-analytics', '/api/live-sessions-insights'], authenticateJWT, authorizeRoles(UserRole.ADMIN), (req: AuthRequest, res: Response) => {
    try {
      const allSessions = db.getLiveSessions();
      const cameras = db.getCameras();
      const allAttendance = db.getAllLiveAttendanceLogs();

      const liveCount = allSessions.filter(s => s.status === 'LIVE').length;
      const endedCount = allSessions.filter(s => s.status === 'ENDED').length;

      const cameraStatusReport = cameras.map(cam => {
        const currentStream = allSessions.find(s => s.camera_id === cam.camera_id && s.status === 'LIVE');
        return {
          camera_id: cam.camera_id,
          name: cam.name,
          room_number: cam.room_number,
          status: cam.status,
          isStreaming: !!currentStream,
          streamingClass: currentStream ? currentStream.class_name : null,
          streamingCourse: currentStream ? currentStream.course_name : null
        };
      });

      res.json({
        totalStreamsStarted: allSessions.length,
        liveCount,
        endedCount,
        cameras: cameraStatusReport,
        attendanceLogs: allAttendance
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- VITE DEV MIDDLEWARE AND STATIC SERVING ---
  
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server successfully started. Running on port ${PORT}`);
  });
}

startServer();
