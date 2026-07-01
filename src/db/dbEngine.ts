import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User, Student, Teacher, Parent, Course, Attendance, Grade,
  Timetable, Payment, Notification, UserRole, AttendanceStatus, PaymentStatus,
  StudentDetailed, TeacherDetailed, ParentDetailed, CourseDetailed,
  AttendanceDetailed, GradeDetailed, TimetableDetailed, PaymentDetailed,
  Assignment, AssignmentGroup, AssignmentSubmission, AssignmentGroupChat,
  Book, BookChapter, ReadingProgress, Bookmark, AiInteractionLog,
  ClassroomCamera, LiveSession, LiveAttendanceLog
} from '../types/db';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'school_db.json');

// Helper to hash password
const hashPassword = (password: string) => {
  return bcrypt.hashSync(password, 10);
};

export class SchoolDatabase {
  private users: User[] = [];
  private students: Student[] = [];
  private teachers: Teacher[] = [];
  private parents: Parent[] = [];
  private courses: Course[] = [];
  private attendance: Attendance[] = [];
  private grades: Grade[] = [];
  private timetables: Timetable[] = [];
  private payments: Payment[] = [];
  private notifications: Notification[] = [];
  
  // New tables for Advanced features
  private assignments: Assignment[] = [];
  private assignmentSubmissions: AssignmentSubmission[] = [];
  private assignmentGroupChats: AssignmentGroupChat[] = [];
  private books: Book[] = [];
  private readingProgress: ReadingProgress[] = [];
  private bookmarks: Bookmark[] = [];
  private aiInteractionLogs: AiInteractionLog[] = [];
  private classroomCameras: ClassroomCamera[] = [];
  private liveSessions: LiveSession[] = [];
  private liveAttendanceLogs: LiveAttendanceLog[] = [];
  private availableSections: string[] = ['A', 'B', 'C', 'D'];

  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const rawData = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(rawData);
        this.users = data.users || [];
        this.students = data.students || [];
        this.teachers = data.teachers || [];
        this.parents = data.parents || [];
        this.courses = data.courses || [];
        this.attendance = data.attendance || [];
        this.grades = data.grades || [];
        this.timetables = data.timetables || [];
        this.payments = data.payments || [];
        this.notifications = data.notifications || [];
        
        this.assignments = data.assignments || [];
        this.assignmentSubmissions = data.assignmentSubmissions || [];
        this.assignmentGroupChats = data.assignmentGroupChats || [];
        this.books = data.books || [];
        this.readingProgress = data.readingProgress || [];
        this.bookmarks = data.bookmarks || [];
        this.aiInteractionLogs = data.aiInteractionLogs || [];
        this.classroomCameras = data.classroomCameras || [];
        this.liveSessions = data.liveSessions || [];
        this.liveAttendanceLogs = data.liveAttendanceLogs || [];
        this.availableSections = data.availableSections || ['A', 'B', 'C', 'D'];
        console.log('Database loaded successfully from file.');
        return;
      } catch (err) {
        console.error('Error loading database, re-seeding...', err);
      }
    }

    // File doesn't exist or failed to load -> SEED DATA
    this.seedDatabase();
  }

  private save() {
    try {
      const data = {
        users: this.users,
        students: this.students,
        teachers: this.teachers,
        parents: this.parents,
        courses: this.courses,
        attendance: this.attendance,
        grades: this.grades,
        timetables: this.timetables,
        payments: this.payments,
        notifications: this.notifications,
        
        assignments: this.assignments,
        assignmentSubmissions: this.assignmentSubmissions,
        assignmentGroupChats: this.assignmentGroupChats,
        books: this.books,
        readingProgress: this.readingProgress,
        bookmarks: this.bookmarks,
        aiInteractionLogs: this.aiInteractionLogs,
        classroomCameras: this.classroomCameras,
        liveSessions: this.liveSessions,
        liveAttendanceLogs: this.liveAttendanceLogs,
        availableSections: this.availableSections,
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  private seedDatabase() {
    console.log('Seeding relational database...');
    const defaultPasswordHash = hashPassword('password123');
    const createdAt = new Date().toISOString();

    // 1. Seed Users
    this.users = [
      // Admin
      { id: 'usr-admin', fullname: 'Sarah Jenkins', email: 'admin@school.com', password: defaultPasswordHash, role: UserRole.ADMIN, created_at: createdAt },
      
      // Teachers
      { id: 'usr-t1', fullname: 'Dr. Robert Carter', email: 'robert.carter@school.com', password: defaultPasswordHash, role: UserRole.TEACHER, created_at: createdAt },
      { id: 'usr-t2', fullname: 'Prof. Helen Myers', email: 'helen.myers@school.com', password: defaultPasswordHash, role: UserRole.TEACHER, created_at: createdAt },
      { id: 'usr-t3', fullname: 'Marcus Thompson', email: 'marcus.thompson@school.com', password: defaultPasswordHash, role: UserRole.TEACHER, created_at: createdAt },
      { id: 'usr-t4', fullname: 'Emily Vance', email: 'emily.vance@school.com', password: defaultPasswordHash, role: UserRole.TEACHER, created_at: createdAt },
      
      // Parents
      { id: 'usr-p1', fullname: 'Arthur Pendelton', email: 'arthur.p@school.com', password: defaultPasswordHash, role: UserRole.PARENT, created_at: createdAt },
      { id: 'usr-p2', fullname: 'Claire Fontaine', email: 'claire.f@school.com', password: defaultPasswordHash, role: UserRole.PARENT, created_at: createdAt },
      { id: 'usr-p3', fullname: 'David Vance', email: 'david.v@school.com', password: defaultPasswordHash, role: UserRole.PARENT, created_at: createdAt },
      
      // Students
      { id: 'usr-s1', fullname: 'Alex Pendelton', email: 'alex.p@school.com', password: defaultPasswordHash, role: UserRole.STUDENT, created_at: createdAt },
      { id: 'usr-s2', fullname: 'Chloe Pendelton', email: 'chloe.p@school.com', password: defaultPasswordHash, role: UserRole.STUDENT, created_at: createdAt },
      { id: 'usr-s3', fullname: 'Maxime Fontaine', email: 'maxime.f@school.com', password: defaultPasswordHash, role: UserRole.STUDENT, created_at: createdAt },
      { id: 'usr-s4', fullname: 'Julian Vance', email: 'julian.v@school.com', password: defaultPasswordHash, role: UserRole.STUDENT, created_at: createdAt },
      { id: 'usr-s5', fullname: 'Sophia Miller', email: 'sophia.m@school.com', password: defaultPasswordHash, role: UserRole.STUDENT, created_at: createdAt },
      { id: 'usr-s6', fullname: 'Liam Anderson', email: 'liam.a@school.com', password: defaultPasswordHash, role: UserRole.STUDENT, created_at: createdAt },
      { id: 'usr-s7', fullname: 'Tommy Baker', email: 'tommy.b@school.com', password: defaultPasswordHash, role: UserRole.STUDENT, created_at: createdAt },
      { id: 'usr-s8', fullname: 'Lily Evans', email: 'lily.e@school.com', password: defaultPasswordHash, role: UserRole.STUDENT, created_at: createdAt },
      { id: 'usr-s9', fullname: 'Leo Harris', email: 'leo.h@school.com', password: defaultPasswordHash, role: UserRole.STUDENT, created_at: createdAt },
      { id: 'usr-s10', fullname: 'Emma Wilson', email: 'emma.w@school.com', password: defaultPasswordHash, role: UserRole.STUDENT, created_at: createdAt },
    ];

    // 2. Seed Teachers Profile
    this.teachers = [
      { teacher_id: 'tch-1', user_id: 'usr-t1', subject: 'Mathematics' },
      { teacher_id: 'tch-2', user_id: 'usr-t2', subject: 'Science' },
      { teacher_id: 'tch-3', user_id: 'usr-t3', subject: 'English Literature' },
      { teacher_id: 'tch-4', user_id: 'usr-t4', subject: 'World History' },
    ];

    // 3. Seed Parents Profile
    this.parents = [
      { parent_id: 'prt-1', user_id: 'usr-p1' },
      { parent_id: 'prt-2', user_id: 'usr-p2' },
      { parent_id: 'prt-3', user_id: 'usr-p3' },
    ];

    // 4. Seed Students Profile
    this.students = [
      { student_id: 'std-1', user_id: 'usr-s1', grade: 'Grade 10', section: 'A', parent_id: 'prt-1', gender: 'Male' },
      { student_id: 'std-2', user_id: 'usr-s2', grade: 'Grade 10', section: 'A', parent_id: 'prt-1', gender: 'Female' },
      { student_id: 'std-3', user_id: 'usr-s3', grade: 'Grade 11', section: 'B', parent_id: 'prt-2', gender: 'Male' },
      { student_id: 'std-4', user_id: 'usr-s4', grade: 'Grade 12', section: 'A', parent_id: 'prt-3', gender: 'Male' },
      { student_id: 'std-5', user_id: 'usr-s5', grade: 'Grade 10', section: 'B', gender: 'Female' },
      { student_id: 'std-6', user_id: 'usr-s6', grade: 'Grade 11', section: 'A', gender: 'Male' },
      { student_id: 'std-7', user_id: 'usr-s7', grade: 'KG', section: 'A', gender: 'Male' },
      { student_id: 'std-8', user_id: 'usr-s8', grade: 'Grade 1', section: 'B', gender: 'Female' },
      { student_id: 'std-9', user_id: 'usr-s9', grade: 'Grade 5', section: 'C', gender: 'Male' },
      { student_id: 'std-10', user_id: 'usr-s10', grade: 'Grade 8', section: 'D', gender: 'Female' },
    ];

    // 5. Seed Courses
    this.courses = [
      { course_id: 'crs-math', course_name: 'Advanced Algebra II', teacher_id: 'tch-1' },
      { course_id: 'crs-sci', course_name: 'Physics & Mechanics', teacher_id: 'tch-2' },
      { course_id: 'crs-eng', course_name: 'English Literature', teacher_id: 'tch-3' },
      { course_id: 'crs-hist', course_name: 'Modern World History', teacher_id: 'tch-4' },
    ];

    // 6. Seed Timetables
    this.timetables = [
      // Grade 10-A Schedules
      { timetable_id: 'tt-1', class_name: 'Grade 10-A', course_id: 'crs-math', teacher_id: 'tch-1', day: 'Monday', start_time: '08:30', end_time: '10:00' },
      { timetable_id: 'tt-2', class_name: 'Grade 10-A', course_id: 'crs-sci', teacher_id: 'tch-2', day: 'Monday', start_time: '10:15', end_time: '11:45' },
      { timetable_id: 'tt-3', class_name: 'Grade 10-A', course_id: 'crs-eng', teacher_id: 'tch-3', day: 'Wednesday', start_time: '08:30', end_time: '10:00' },
      { timetable_id: 'tt-4', class_name: 'Grade 10-A', course_id: 'crs-hist', teacher_id: 'tch-4', day: 'Friday', start_time: '13:00', end_time: '14:30' },

      // Grade 10-B Schedules
      { timetable_id: 'tt-5', class_name: 'Grade 10-B', course_id: 'crs-math', teacher_id: 'tch-1', day: 'Tuesday', start_time: '08:30', end_time: '10:00' },
      { timetable_id: 'tt-6', class_name: 'Grade 10-B', course_id: 'crs-sci', teacher_id: 'tch-2', day: 'Tuesday', start_time: '10:15', end_time: '11:45' },
      { timetable_id: 'tt-7', class_name: 'Grade 10-B', course_id: 'crs-eng', teacher_id: 'tch-3', day: 'Thursday', start_time: '08:30', end_time: '10:00' },

      // Grade 11-A Schedules
      { timetable_id: 'tt-8', class_name: 'Grade 11-A', course_id: 'crs-math', teacher_id: 'tch-1', day: 'Monday', start_time: '13:00', end_time: '14:30' },
      { timetable_id: 'tt-9', class_name: 'Grade 11-A', course_id: 'crs-sci', teacher_id: 'tch-2', day: 'Wednesday', start_time: '10:15', end_time: '11:45' },
      { timetable_id: 'tt-10', class_name: 'Grade 11-A', course_id: 'crs-hist', teacher_id: 'tch-4', day: 'Friday', start_time: '08:30', end_time: '10:00' },

      // Grade 11-B Schedules
      { timetable_id: 'tt-11', class_name: 'Grade 11-B', course_id: 'crs-eng', teacher_id: 'tch-3', day: 'Monday', start_time: '10:15', end_time: '11:45' },
      { timetable_id: 'tt-12', class_name: 'Grade 11-B', course_id: 'crs-sci', teacher_id: 'tch-2', day: 'Thursday', start_time: '13:00', end_time: '14:30' },

      // Grade 12-A Schedules
      { timetable_id: 'tt-13', class_name: 'Grade 12-A', course_id: 'crs-math', teacher_id: 'tch-1', day: 'Wednesday', start_time: '13:00', end_time: '14:30' },
      { timetable_id: 'tt-14', class_name: 'Grade 12-A', course_id: 'crs-sci', teacher_id: 'tch-2', day: 'Friday', start_time: '10:15', end_time: '11:45' },
    ];

    // 7. Seed Grades
    this.grades = [
      // Alex Pendelton (std-1) - Algebra, Science, English, History
      { grade_id: 'grd-1', student_id: 'std-1', course_id: 'crs-math', score: 94, grade: 'A' },
      { grade_id: 'grd-2', student_id: 'std-1', course_id: 'crs-sci', score: 88, grade: 'B+' },
      { grade_id: 'grd-3', student_id: 'std-1', course_id: 'crs-eng', score: 91, grade: 'A-' },
      { grade_id: 'grd-4', student_id: 'std-1', course_id: 'crs-hist', score: 96, grade: 'A+' },

      // Chloe Pendelton (std-2)
      { grade_id: 'grd-5', student_id: 'std-2', course_id: 'crs-math', score: 79, grade: 'C+' },
      { grade_id: 'grd-6', student_id: 'std-2', course_id: 'crs-sci', score: 85, grade: 'B' },
      { grade_id: 'grd-7', student_id: 'std-2', course_id: 'crs-eng', score: 92, grade: 'A' },

      // Maxime Fontaine (std-3)
      { grade_id: 'grd-8', student_id: 'std-3', course_id: 'crs-math', score: 68, grade: 'D' },
      { grade_id: 'grd-9', student_id: 'std-3', course_id: 'crs-sci', score: 74, grade: 'C' },
      { grade_id: 'grd-10', student_id: 'std-3', course_id: 'crs-hist', score: 82, grade: 'B-' },

      // Julian Vance (std-4)
      { grade_id: 'grd-11', student_id: 'std-4', course_id: 'crs-math', score: 99, grade: 'A+' },
      { grade_id: 'grd-12', student_id: 'std-4', course_id: 'crs-sci', score: 95, grade: 'A' },

      // Sophia Miller (std-5)
      { grade_id: 'grd-13', student_id: 'std-5', course_id: 'crs-math', score: 83, grade: 'B' },
      { grade_id: 'grd-14', student_id: 'std-5', course_id: 'crs-eng', score: 87, grade: 'B+' },

      // Liam Anderson (std-6)
      { grade_id: 'grd-15', student_id: 'std-6', course_id: 'crs-sci', score: 90, grade: 'A-' },
      { grade_id: 'grd-16', student_id: 'std-6', course_id: 'crs-hist', score: 85, grade: 'B' },
    ];

    // 8. Seed Attendance (last 5 school days)
    const dates = ['2026-06-18', '2026-06-19', '2026-06-22', '2026-06-23', '2026-06-24'];
    let attendanceIdCounter = 1;

    dates.forEach((date) => {
      this.students.forEach((std) => {
        // Decide courses based on timetable
        const stdClassName = `${std.grade}-${std.section}`;
        const schedules = this.timetables.filter(t => t.class_name === stdClassName);
        
        schedules.forEach((sch) => {
          // Generate realistic statistics (92% Present, 4% Absent, 4% Late)
          const rand = Math.random();
          let status = AttendanceStatus.PRESENT;
          if (rand < 0.05) {
            status = AttendanceStatus.ABSENT;
          } else if (rand < 0.09) {
            status = AttendanceStatus.LATE;
          }

          this.attendance.push({
            attendance_id: `att-${attendanceIdCounter++}`,
            student_id: std.student_id,
            course_id: sch.course_id,
            status: status,
            date: date
          });
        });
      });
    });

    // 9. Seed Payments
    this.payments = [
      { payment_id: 'pmt-1', student_id: 'std-1', amount: 1200, payment_date: '2026-06-05', status: PaymentStatus.PAID },
      { payment_id: 'pmt-2', student_id: 'std-2', amount: 1200, payment_date: '2026-06-05', status: PaymentStatus.PAID },
      { payment_id: 'pmt-3', student_id: 'std-3', amount: 1500, payment_date: '2026-06-12', status: PaymentStatus.PENDING },
      { payment_id: 'pmt-4', student_id: 'std-4', amount: 1800, payment_date: '2026-05-10', status: PaymentStatus.OVERDUE },
      { payment_id: 'pmt-5', student_id: 'std-5', amount: 1200, payment_date: '2026-06-14', status: PaymentStatus.PAID },
      { payment_id: 'pmt-6', student_id: 'std-6', amount: 1500, payment_date: '2026-06-20', status: PaymentStatus.PENDING },
    ];

    // 10. Seed Announcements
    this.notifications = [
      { notification_id: 'not-1', title: 'Welcome to the New School Term', message: 'We are excited to welcome all parents, students, and teachers back for this academic term. Let\'s work together to achieve excellence.', recipient: 'ALL', created_at: '2026-06-01T08:00:00Z' },
      { notification_id: 'not-2', title: 'Final Term Examinations Schedule', message: 'The schedules for final evaluations are posted in the timetables section. Exams commence next month.', recipient: 'ALL', created_at: '2026-06-15T09:30:00Z' },
      { notification_id: 'not-3', title: 'Science Fair Enrollment Extended', message: 'Good news! Project submission deadline for the regional Science Fair has been extended by one week.', recipient: 'ALL', created_at: '2026-06-20T11:00:00Z' },
      { notification_id: 'not-4', title: 'Urgent Tuition Payments Notice', message: 'Please review outstanding payments in your fees dashboard. Late fees will apply after June 30th.', recipient: 'PARENT', created_at: '2026-06-22T14:15:00Z' },
      { notification_id: 'not-5', title: 'Teacher Evaluation Feedback', message: 'All teachers are requested to submit evaluation feedback for Grade 10 classes by Friday.', recipient: 'TEACHER', created_at: '2026-06-23T10:00:00Z' },
    ];

    this.books = [
      {
        book_id: 'bk-bio-9',
        title: 'Biology Grade 9',
        author: 'Dr. Evelyn Foster',
        grade_level: 'Grade 9',
        subject: 'Biology',
        cover_url: 'https://images.unsplash.com/photo-1530210120071-01b5a41873b1?w=200&auto=format&fit=crop&q=60',
        description: 'An introductory biology textbook covering taxonomy, plant cell functions, and biodiversity.',
        chapters: [
          {
            chapter_id: 'ch-bio9-1',
            title: 'Classification and Five Kingdoms',
            content: 'Taxonomy is the branch of science concerned with classification, especially of organisms. Living organisms are classified into five main kingdoms: Monera, Protista, Fungi, Plantae, and Animalia. Binomial nomenclature, created by Carl Linnaeus, gives each species a two-part scientific name consisting of its genus and species identifier. Biodiversity refers to the variety of life forms on Earth, which is critical for ecosystem stability and health.'
          }
        ]
      },
      {
        book_id: 'bk-bio-10',
        title: 'Biology Grade 10',
        author: 'Dr. Evelyn Foster',
        grade_level: 'Grade 10',
        subject: 'Biology',
        cover_url: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=200&auto=format&fit=crop&q=60',
        description: 'Advanced topics in biology including gaseous exchange, cellular respiration, and human genetics.',
        chapters: [
          {
            chapter_id: 'ch-bio10-1',
            title: 'Gaseous Exchange and Cellular Respiration',
            content: 'Gaseous exchange is the biological process through which different gases are transferred across a cell membrane or respiratory surface. In plants, gaseous exchange occurs primarily through stomata in the leaves. In humans, gaseous exchange occurs in the alveoli of the lungs. Oxygen diffuses into the capillaries while carbon dioxide diffuses out. Cellular respiration is the chemical process where cells break down glucose to generate ATP energy, utilizing oxygen and producing carbon dioxide as a byproduct.'
          }
        ]
      },
      {
        book_id: 'bk-phy-11',
        title: 'Physics Grade 11',
        author: 'Prof. Arthur Pendelton',
        grade_level: 'Grade 11',
        subject: 'Physics',
        cover_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=200&auto=format&fit=crop&q=60',
        description: 'Explores classical mechanics, thermodynamics, kinetic forces, and Newton\'s laws of motion.',
        chapters: [
          {
            chapter_id: 'ch-phy11-1',
            title: 'Newton\'s Laws of Motion',
            content: 'According to Physics Grade 11, Newton\'s First Law states that an object remains at rest or in uniform motion in a straight line unless acted upon by an external force. This is also called the law of inertia. Newton\'s Second Law states that the acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass, represented mathematically as F = ma. Newton\'s Third Law states that for every action, there is an equal and opposite reaction.'
          }
        ]
      },
      {
        book_id: 'bk-chem-12',
        title: 'Chemistry Grade 12',
        author: 'Dr. Alan Vance',
        grade_level: 'Grade 12',
        subject: 'Chemistry',
        cover_url: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?w=200&auto=format&fit=crop&q=60',
        description: 'Covers physical chemistry, chemical equilibrium, Le Chatelier\'s principle, and organic molecular structures.',
        chapters: [
          {
            chapter_id: 'ch-chem12-1',
            title: 'Chemical Equilibrium and Constants',
            content: 'Chemical equilibrium is the state in a reversible reaction where the rate of the forward reaction equals the rate of the reverse reaction. As a result, the concentrations of reactants and products remain constant over time. Le Chatelier\'s principle states that if a dynamic equilibrium is disturbed by changing the conditions (temperature, pressure, or concentration), the position of equilibrium shifts to counteract the change. The equilibrium constant (Kc) is the ratio of product concentrations to reactant concentrations raised to their stoichiometric coefficients.'
          }
        ]
      },
      {
        book_id: 'bk-math-8',
        title: 'Mathematics Grade 8',
        author: 'Sarah Jenkins, MSc',
        grade_level: 'Grade 8',
        subject: 'Mathematics',
        cover_url: 'https://images.unsplash.com/photo-1453733190148-c44698c26588?w=200&auto=format&fit=crop&q=60',
        description: 'Middle school algebra, linear equations, and basic geometry coordinate grids.',
        chapters: [
          {
            chapter_id: 'ch-math8-1',
            title: 'Linear Equations and Solving Techniques',
            content: 'A linear equation is an algebraic equation of degree 1, meaning that the highest power of any variable is 1. Standard form of a linear equation in one variable is ax + b = 0, where a and b are real numbers and a is not equal to zero. To solve a linear equation, apply the same inverse operations to both sides of the equation (addition, subtraction, multiplication, or division) to isolate the variable x.'
          }
        ]
      },
      {
        book_id: 'bk-math-10',
        title: 'Mathematics Grade 10',
        author: 'Sarah Jenkins, MSc',
        grade_level: 'Grade 10',
        subject: 'Mathematics',
        cover_url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=200&auto=format&fit=crop&q=60',
        description: 'High school trigonometry, quadratic equations, vertex forms, and parabola graphing guides.',
        chapters: [
          {
            chapter_id: 'ch-math10-1',
            title: 'Trigonometric Identities and Pythagoras',
            content: 'Trigonometry is the branch of mathematics that studies relationships between side lengths and angles of triangles. The Pythagorean theorem states that in a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides (a^2 + b^2 = c^2). Standard trigonometric functions include sine (opposite/hypotenuse), cosine (adjacent/hypotenuse), and tangent (opposite/adjacent). Fundamental trigonometric identities include: sin^2(theta) + cos^2(theta) = 1.'
          }
        ]
      },
      {
        book_id: 'bk-eng-7',
        title: 'English Grammar Grade 7',
        author: 'Linda Sterling, PhD',
        grade_level: 'Grade 7',
        subject: 'English',
        cover_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=200&auto=format&fit=crop&q=60',
        description: 'Middle school english syntax, sentence building, and the parts of speech.',
        chapters: [
          {
            chapter_id: 'ch-eng7-1',
            title: 'The Parts of Speech and Sentence Structure',
            content: 'Every word in the English language belongs to one of eight parts of speech, which define its grammatical role in a sentence. These are: nouns (naming people, places, things), pronouns (replacing nouns), verbs (expressing action or state of being), adjectives (describing nouns), adverbs (modifying verbs, adjectives, or other adverbs), prepositions (showing relationships), conjunctions (connecting words or clauses), and interjections (expressing strong emotion). A complete sentence must contain a subject and a predicate verb.'
          }
        ]
      },
      {
        book_id: 'bk-ict',
        title: 'ICT Fundamentals',
        author: 'Mark Sterling, PhD',
        grade_level: 'High School',
        subject: 'ICT',
        cover_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&auto=format&fit=crop&q=60',
        description: 'Introductory computer science, CPU architecture, memory types, and local network setups.',
        chapters: [
          {
            chapter_id: 'ch-ict-1',
            title: 'Introduction to Computer Systems and Hardware',
            content: 'Information and Communications Technology (ICT) refers to the diverse set of technological tools and resources used to transmit, store, create, or exchange information. A computer system consists of hardware (physical components) and software (instructions). The Central Processing Unit (CPU) is the brain of the computer, executing instructions. Random Access Memory (RAM) provides temporary, volatile workspace for active programs, while hard disk drives and SSDs provide non-volatile long-term storage.'
          }
        ]
      },
      {
        book_id: 'bk-world-hist',
        title: 'World History Essentials',
        author: 'Emily Vance, MA',
        grade_level: 'High School',
        subject: 'History',
        cover_url: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=200&auto=format&fit=crop&q=60',
        description: 'A study of global transformations from the 18th century forward, focusing on the World Wars.',
        chapters: [
          {
            chapter_id: 'ch-hist-1',
            title: 'The World Wars and Global Treaties',
            content: 'World War I (1914-1918) and World War II (1939-1945) were global conflicts that dramatically reshaped national borders and political alliances. World War I was triggered by the assassination of Archduke Franz Ferdinand and ended with the Treaty of Versailles, creating the League of Nations. World War II resulted from the rise of totalitarian regimes in Germany, Italy, and Japan. It concluded with the Allied victory, leading to the creation of the United Nations to prevent future global wars.'
          }
        ]
      },
      {
        book_id: 'bk-geo',
        title: 'Geography Essentials',
        author: 'Julian Mercer',
        grade_level: 'Middle School',
        subject: 'Geography',
        cover_url: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=200&auto=format&fit=crop&q=60',
        description: 'Explores physical geography, earth\'s interior structure, and tectonic plates movement.',
        chapters: [
          {
            chapter_id: 'ch-geo-1',
            title: 'Earth\'s Interior Layers and Plate Tectonics',
            content: 'Physical geography studies the natural features of the Earth. The Earth is divided into three primary layers based on composition: the crust (outer rocky shell), the mantle (dense silicate layer), and the core (metallic center composed of an outer liquid core and an inner solid iron-nickel core). Plate tectonics is the scientific theory explaining how the Earth\'s lithosphere is divided into several large plates that move slowly over the asthenosphere, causing earthquakes, volcanoes, and mountain ranges.'
          }
        ]
      },
      {
        book_id: 'bk-kg-abc',
        title: 'Alphabet Learning',
        author: 'Emily Vance, MA',
        grade_level: 'KG',
        subject: 'English',
        cover_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&auto=format&fit=crop&q=60',
        description: 'Kindergarten alphabet phonics, letters learning, and simple spelling drills.',
        chapters: [
          {
            chapter_id: 'ch-kgabc-1',
            title: 'The Alphabet and Phonics Song',
            content: 'The English alphabet contains 26 letters, divided into vowels (A, E, I, O, U) and consonants. Phonics teaches children the sounds that letters make. For example, A says "ah" as in Apple. B says "buh" as in Ball. C says "cuh" as in Cat. D says "duh" as in Dog. Learning these sounds helps children blend letters together to read simple three-letter words.'
          }
        ]
      },
      {
        book_id: 'bk-kg-num',
        title: 'Numbers and Counting',
        author: 'Sarah Jenkins, MSc',
        grade_level: 'KG',
        subject: 'Mathematics',
        cover_url: 'https://images.unsplash.com/photo-1518133680790-398573042988?w=200&auto=format&fit=crop&q=60',
        description: 'Fun counting games, basic digits from 1 to 20, and counting symbols.',
        chapters: [
          {
            chapter_id: 'ch-kgnum-1',
            title: 'Counting 1 to 10 with Shapes',
            content: 'Counting is matching a number to each item in a group. Let\'s count: 1 star, 2 apples, 3 squares, 4 triangles, 5 circles, 6 bananas, 7 flowers, 8 balloons, 9 dots, and 10 fingers. Practicing counting every day helps children develop primary number sense, paving the way for simple addition and subtraction math operations.'
          }
        ]
      },
      {
        book_id: 'bk-kg-shape',
        title: 'Shapes and Colors',
        author: 'Linda Sterling, PhD',
        grade_level: 'KG',
        subject: 'Art',
        cover_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&auto=format&fit=crop&q=60',
        description: 'Learning primary colors, identifying basic shapes, and drawing exercises.',
        chapters: [
          {
            chapter_id: 'ch-kgshape-1',
            title: 'Primary Colors and Geometric Shapes',
            content: 'Shapes and colors are all around us! The three primary colors are Red, Blue, and Yellow. We can mix red and yellow to make Orange, blue and yellow to make Green, and red and blue to make Purple. Geometric shapes include the Circle (round like a ball), the Square (four equal sides), and the Triangle (three sides and three corners).'
          }
        ]
      },
      {
        book_id: 'bk-kg-read',
        title: 'Basic Reading',
        author: 'Linda Sterling, PhD',
        grade_level: 'KG',
        subject: 'English',
        cover_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&auto=format&fit=crop&q=60',
        description: 'First steps in reading simple sentences with phonics and sight words.',
        chapters: [
          {
            chapter_id: 'ch-kgread-1',
            title: 'My First Sentences and Sight Words',
            content: 'Let\'s practice reading! "The cat is fat. The cat sat on the red mat. A big dog ran after the fat cat. The dog is brown. The cat ran up the tall tree." Reading short sentences with sight words like "the", "is", "on", "and", "a" increases word recognition and confidence for kindergarten learners.'
          }
        ]
      }
    ];

    // 12. Seed Assignments
    this.assignments = [
      {
        assignment_id: 'asg-1',
        title: 'Mitochondria Cell Essay',
        description: 'Write a 500-word academic analysis exploring why the mitochondria is designated the powerhouse of the cell. Highlight cellular respiration and ATP conversion.',
        course_id: 'crs-sci',
        course_name: 'Physics & Mechanics',
        class_name: 'Grade 10-A',
        type: 'INDIVIDUAL',
        due_date: '2026-06-28',
        attachments: [{ name: 'Cell Diagram Guide.pdf', url: '#' }],
        created_at: new Date().toISOString()
      },
      {
        assignment_id: 'asg-2',
        title: 'Clean Energy Solution Debate',
        description: 'Form a collaborative team analysis assessing Solar versus Wind power energy grids. Present structural efficiency calculations, installation footprints, and life-cycle costs.',
        course_id: 'crs-sci',
        course_name: 'Physics & Mechanics',
        class_name: 'Grade 10-A',
        type: 'GROUP',
        due_date: '2026-07-02',
        attachments: [{ name: 'Grid Efficiency Calculations.xlsx', url: '#' }],
        created_at: new Date().toISOString(),
        groups: [
          {
            group_id: 'grp-1',
            group_name: 'Solar Pioneers',
            student_ids: ['std-1', 'std-5']
          },
          {
            group_id: 'grp-2',
            group_name: 'Wind Turbiners',
            student_ids: ['std-2']
          }
        ]
      }
    ];

    // 13. Seed Classroom Cameras
    this.classroomCameras = [
      { camera_id: 'cam-101', name: 'Room 101 Front Cam', room_number: '101', status: 'ACTIVE' },
      { camera_id: 'cam-lab', name: 'Science Lab B Wide-Angle', room_number: 'Lab B', status: 'ACTIVE' },
      { camera_id: 'cam-aud', name: 'Auditorium Main Stage', room_number: 'Auditorium', status: 'INACTIVE' }
    ];

    // 14. Seed Live Sessions
    this.liveSessions = [
      {
        session_id: 'live-1',
        course_id: 'crs-sci',
        course_name: 'Physics & Mechanics',
        teacher_id: 'tch-2',
        teacher_name: 'Prof. Helen Myers',
        class_name: 'Grade 10-A',
        status: 'LIVE',
        started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
        camera_id: 'cam-101',
        active_viewers: ['std-1']
      }
    ];

    this.save();
    console.log('Seed completed. Relational database is live with Advanced features.');
  }

  // --- QUERY APIS ---

  // USERS / AUTH
  public getAllUsers(): User[] {
    return this.users.map(({ password, ...u }) => u as User);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  public createUser(userData: Partial<User>): User {
    const id = `usr-${Math.random().toString(36).substr(2, 9)}`;
    const defaultHash = userData.password ? hashPassword(userData.password) : hashPassword('password123');
    const newUser: User = {
      id,
      fullname: userData.fullname || 'New User',
      email: userData.email || '',
      password: defaultHash,
      role: userData.role || UserRole.STUDENT,
      created_at: new Date().toISOString()
    };
    this.users.push(newUser);
    this.save();
    return { ...newUser, password: undefined };
  }

  public updateUser(id: string, updateData: Partial<User>): User | undefined {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;

    const user = this.users[index];
    const updated = { ...user, ...updateData };
    if (updateData.password) {
      updated.password = hashPassword(updateData.password);
    }
    this.users[index] = updated;
    this.save();
    return { ...updated, password: undefined };
  }

  public deleteUser(id: string): boolean {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return false;

    const user = this.users[userIndex];
    this.users.splice(userIndex, 1);

    // Cascade deletions based on role
    if (user.role === UserRole.STUDENT) {
      const idx = this.students.findIndex(s => s.user_id === id);
      if (idx !== -1) {
        const student = this.students[idx];
        this.students.splice(idx, 1);
        // Cascade student's grades, attendance, payments
        this.grades = this.grades.filter(g => g.student_id !== student.student_id);
        this.attendance = this.attendance.filter(a => a.student_id !== student.student_id);
        this.payments = this.payments.filter(p => p.student_id !== student.student_id);
      }
    } else if (user.role === UserRole.TEACHER) {
      const idx = this.teachers.findIndex(t => t.user_id === id);
      if (idx !== -1) {
        const teacher = this.teachers[idx];
        this.teachers.splice(idx, 1);
        // Set course teachers to undefined or cascade
        this.courses = this.courses.map(c => c.teacher_id === teacher.teacher_id ? { ...c, teacher_id: '' } : c);
        this.timetables = this.timetables.filter(t => t.teacher_id !== teacher.teacher_id);
      }
    } else if (user.role === UserRole.PARENT) {
      const idx = this.parents.findIndex(p => p.user_id === id);
      if (idx !== -1) {
        const parent = this.parents[idx];
        this.parents.splice(idx, 1);
        // Remove parent_id reference from students
        this.students = this.students.map(s => s.parent_id === parent.parent_id ? { ...s, parent_id: undefined } : s);
      }
    }

    this.save();
    return true;
  }

  // STUDENTS
  public getAllStudentsDetailed(): StudentDetailed[] {
    return this.students.map(s => {
      const user = this.users.find(u => u.id === s.user_id);
      let parentName = undefined;
      if (s.parent_id) {
        const parentProfile = this.parents.find(p => p.parent_id === s.parent_id);
        if (parentProfile) {
          const parentUser = this.users.find(u => u.id === parentProfile.user_id);
          parentName = parentUser?.fullname;
        }
      }

      return {
        student_id: s.student_id,
        user_id: s.user_id,
        fullname: user?.fullname || 'Unknown Student',
        email: user?.email || '',
        grade: s.grade,
        section: s.section,
        parent_id: s.parent_id,
        parent_name: parentName,
        gender: s.gender,
        created_at: user?.created_at || '',
      };
    });
  }

  public getStudentByUserId(userId: string): StudentDetailed | undefined {
    const student = this.students.find(s => s.user_id === userId);
    if (!student) return undefined;

    const user = this.users.find(u => u.id === userId);
    let parentName = undefined;
    if (student.parent_id) {
      const parentProfile = this.parents.find(p => p.parent_id === student.parent_id);
      if (parentProfile) {
        const parentUser = this.users.find(u => u.id === parentProfile.user_id);
        parentName = parentUser?.fullname;
      }
    }

    return {
      student_id: student.student_id,
      user_id: student.user_id,
      fullname: user?.fullname || '',
      email: user?.email || '',
      grade: student.grade,
      section: student.section,
      parent_id: student.parent_id,
      parent_name: parentName,
      gender: student.gender,
      created_at: user?.created_at || '',
    };
  }

  public getStudentByIdDetailed(studentId: string): StudentDetailed | undefined {
    const student = this.students.find(s => s.student_id === studentId);
    if (!student) return undefined;

    const user = this.users.find(u => u.id === student.user_id);
    let parentName = undefined;
    if (student.parent_id) {
      const parentProfile = this.parents.find(p => p.parent_id === student.parent_id);
      if (parentProfile) {
        const parentUser = this.users.find(u => u.id === parentProfile.user_id);
        parentName = parentUser?.fullname;
      }
    }

    return {
      student_id: student.student_id,
      user_id: student.user_id,
      fullname: user?.fullname || '',
      email: user?.email || '',
      grade: student.grade,
      section: student.section,
      parent_id: student.parent_id,
      parent_name: parentName,
      gender: student.gender,
      created_at: user?.created_at || '',
    };
  }

  public getBestSectionForGrade(grade: string, gender: string): string {
    const sections = this.availableSections;
    const counts = sections.map(sec => {
      const studentsInSec = this.students.filter(s => s.grade === grade && s.section === sec);
      const totalCount = studentsInSec.length;
      const genderCount = studentsInSec.filter(s => s.gender?.toLowerCase() === gender.toLowerCase()).length;
      return { section: sec, totalCount, genderCount };
    });
    
    counts.sort((a, b) => {
      if (a.totalCount !== b.totalCount) {
        return a.totalCount - b.totalCount;
      }
      return a.genderCount - b.genderCount;
    });
    
    return counts.length > 0 ? counts[0].section : 'A';
  }

  public createStudent(fullname: string, email: string, grade: string, section: string, parentId?: string, gender?: string): StudentDetailed {
    const user = this.createUser({ fullname, email, role: UserRole.STUDENT });
    const student_id = `std-${Math.random().toString(36).substr(2, 9)}`;
    const studentGender = gender || (Math.random() > 0.5 ? 'Male' : 'Female');
    
    let assignedSection = section;
    if (!section || section === 'auto') {
      assignedSection = this.getBestSectionForGrade(grade, studentGender);
    }

    const newStudent: Student = {
      student_id,
      user_id: user.id,
      grade,
      section: assignedSection,
      parent_id: parentId || undefined,
      gender: studentGender
    };
    this.students.push(newStudent);
    this.save();
    return this.getStudentByIdDetailed(student_id)!;
  }

  public updateStudent(studentId: string, data: { fullname?: string; email?: string; grade?: string; section?: string; parent_id?: string; gender?: string }): StudentDetailed | undefined {
    const sIdx = this.students.findIndex(s => s.student_id === studentId);
    if (sIdx === -1) return undefined;

    const student = this.students[sIdx];
    if (data.grade !== undefined) student.grade = data.grade;
    if (data.section !== undefined) student.section = data.section;
    if (data.parent_id !== undefined) student.parent_id = data.parent_id || undefined;
    if (data.gender !== undefined) student.gender = data.gender;

    if (data.fullname !== undefined || data.email !== undefined) {
      this.updateUser(student.user_id, {
        fullname: data.fullname,
        email: data.email
      });
    }

    this.save();
    return this.getStudentByIdDetailed(studentId);
  }

  // TEACHERS
  public getAllTeachersDetailed(): TeacherDetailed[] {
    return this.teachers.map(t => {
      const user = this.users.find(u => u.id === t.user_id);
      return {
        teacher_id: t.teacher_id,
        user_id: t.user_id,
        fullname: user?.fullname || '',
        email: user?.email || '',
        subject: t.subject,
        created_at: user?.created_at || '',
      };
    });
  }

  public getTeacherByUserId(userId: string): TeacherDetailed | undefined {
    const teacher = this.teachers.find(t => t.user_id === userId);
    if (!teacher) return undefined;

    const user = this.users.find(u => u.id === userId);
    return {
      teacher_id: teacher.teacher_id,
      user_id: teacher.user_id,
      fullname: user?.fullname || '',
      email: user?.email || '',
      subject: teacher.subject,
      created_at: user?.created_at || '',
    };
  }

  public createTeacher(fullname: string, email: string, subject: string): TeacherDetailed {
    const user = this.createUser({ fullname, email, role: UserRole.TEACHER });
    const teacher_id = `tch-${Math.random().toString(36).substr(2, 9)}`;
    const newTeacher: Teacher = {
      teacher_id,
      user_id: user.id,
      subject
    };
    this.teachers.push(newTeacher);
    this.save();
    return this.getTeacherByUserId(user.id)!;
  }

  public updateTeacher(teacherId: string, data: { fullname?: string; email?: string; subject?: string }): TeacherDetailed | undefined {
    const tIdx = this.teachers.findIndex(t => t.teacher_id === teacherId);
    if (tIdx === -1) return undefined;

    const teacher = this.teachers[tIdx];
    if (data.subject !== undefined) teacher.subject = data.subject;

    if (data.fullname !== undefined || data.email !== undefined) {
      this.updateUser(teacher.user_id, {
        fullname: data.fullname,
        email: data.email
      });
    }

    this.save();
    return this.teachers.map(t => {
      const user = this.users.find(u => u.id === t.user_id);
      return {
        teacher_id: t.teacher_id,
        user_id: t.user_id,
        fullname: user?.fullname || '',
        email: user?.email || '',
        subject: t.subject,
        created_at: user?.created_at || '',
      };
    }).find(t => t.teacher_id === teacherId);
  }

  // PARENTS
  public getAllParentsDetailed(): ParentDetailed[] {
    return this.parents.map(p => {
      const user = this.users.find(u => u.id === p.user_id);
      const kids = this.students.filter(s => s.parent_id === p.parent_id).map(s => {
        const sUser = this.users.find(u => u.id === s.user_id);
        return {
          student_id: s.student_id,
          fullname: sUser?.fullname || '',
          grade: s.grade,
          section: s.section
        };
      });

      return {
        parent_id: p.parent_id,
        user_id: p.user_id,
        fullname: user?.fullname || '',
        email: user?.email || '',
        children: kids,
        created_at: user?.created_at || '',
      };
    });
  }

  public getParentByUserId(userId: string): ParentDetailed | undefined {
    const parent = this.parents.find(p => p.user_id === userId);
    if (!parent) return undefined;

    const user = this.users.find(u => u.id === userId);
    const kids = this.students.filter(s => s.parent_id === parent.parent_id).map(s => {
      const sUser = this.users.find(u => u.id === s.user_id);
      return {
        student_id: s.student_id,
        fullname: sUser?.fullname || '',
        grade: s.grade,
        section: s.section
      };
    });

    return {
      parent_id: parent.parent_id,
      user_id: parent.user_id,
      fullname: user?.fullname || '',
      email: user?.email || '',
      children: kids,
      created_at: user?.created_at || '',
    };
  }

  public createParent(fullname: string, email: string): ParentDetailed {
    const user = this.createUser({ fullname, email, role: UserRole.PARENT });
    const parent_id = `prt-${Math.random().toString(36).substr(2, 9)}`;
    const newParent: Parent = {
      parent_id,
      user_id: user.id
    };
    this.parents.push(newParent);
    this.save();
    return this.getParentByUserId(user.id)!;
  }

  public updateParent(parentId: string, data: { fullname?: string; email?: string }): ParentDetailed | undefined {
    const pIdx = this.parents.findIndex(p => p.parent_id === parentId);
    if (pIdx === -1) return undefined;

    const parent = this.parents[pIdx];
    if (data.fullname !== undefined || data.email !== undefined) {
      this.updateUser(parent.user_id, {
        fullname: data.fullname,
        email: data.email
      });
    }

    this.save();
    return this.getAllParentsDetailed().find(p => p.parent_id === parentId);
  }

  // COURSES
  public getAllCoursesDetailed(): CourseDetailed[] {
    return this.courses.map(c => {
      let teacherName = 'Unassigned';
      if (c.teacher_id) {
        const teacherProfile = this.teachers.find(t => t.teacher_id === c.teacher_id);
        if (teacherProfile) {
          const user = this.users.find(u => u.id === teacherProfile.user_id);
          teacherName = user?.fullname || 'Unassigned';
        }
      }

      return {
        course_id: c.course_id,
        course_name: c.course_name,
        teacher_id: c.teacher_id,
        teacher_name: teacherName
      };
    });
  }

  public createCourse(course_name: string, teacher_id: string): CourseDetailed {
    const course_id = `crs-${Math.random().toString(36).substr(2, 9)}`;
    const newCourse: Course = {
      course_id,
      course_name,
      teacher_id
    };
    this.courses.push(newCourse);
    this.save();
    return this.getAllCoursesDetailed().find(c => c.course_id === course_id)!;
  }

  public updateCourse(courseId: string, course_name?: string, teacher_id?: string): CourseDetailed | undefined {
    const cIdx = this.courses.findIndex(c => c.course_id === courseId);
    if (cIdx === -1) return undefined;

    if (course_name !== undefined) this.courses[cIdx].course_name = course_name;
    if (teacher_id !== undefined) this.courses[cIdx].teacher_id = teacher_id;

    this.save();
    return this.getAllCoursesDetailed().find(c => c.course_id === courseId);
  }

  public deleteCourse(courseId: string): boolean {
    const idx = this.courses.findIndex(c => c.course_id === courseId);
    if (idx === -1) return false;

    this.courses.splice(idx, 1);
    this.grades = this.grades.filter(g => g.course_id !== courseId);
    this.attendance = this.attendance.filter(a => a.course_id !== courseId);
    this.timetables = this.timetables.filter(t => t.course_id !== courseId);

    this.save();
    return true;
  }

  // ATTENDANCE
  public getAllAttendanceDetailed(): AttendanceDetailed[] {
    return this.attendance.map(a => {
      const student = this.students.find(s => s.student_id === a.student_id);
      const studentUser = student ? this.users.find(u => u.id === student.user_id) : null;
      const course = this.courses.find(c => c.course_id === a.course_id);

      return {
        attendance_id: a.attendance_id,
        student_id: a.student_id,
        student_name: studentUser?.fullname || 'Unknown Student',
        course_id: a.course_id,
        course_name: course?.course_name || 'Unknown Course',
        status: a.status,
        date: a.date
      };
    });
  }

  public recordAttendance(student_id: string, course_id: string, status: AttendanceStatus, date: string): AttendanceDetailed {
    // Check if attendance already exists for this student + course + date
    const existingIndex = this.attendance.findIndex(
      a => a.student_id === student_id && a.course_id === course_id && a.date === date
    );

    if (existingIndex !== -1) {
      this.attendance[existingIndex].status = status;
    } else {
      const attendance_id = `att-${Math.random().toString(36).substr(2, 9)}`;
      this.attendance.push({
        attendance_id,
        student_id,
        course_id,
        status,
        date
      });
    }

    this.save();
    
    // Return detailed record
    const match = this.getAllAttendanceDetailed().find(
      a => a.student_id === student_id && a.course_id === course_id && a.date === date
    );
    return match!;
  }

  // GRADES
  public getAllGradesDetailed(): GradeDetailed[] {
    return this.grades.map(g => {
      const student = this.students.find(s => s.student_id === g.student_id);
      const studentUser = student ? this.users.find(u => u.id === student.user_id) : null;
      const course = this.courses.find(c => c.course_id === g.course_id);

      return {
        grade_id: g.grade_id,
        student_id: g.student_id,
        student_name: studentUser?.fullname || 'Unknown Student',
        course_id: g.course_id,
        course_name: course?.course_name || 'Unknown Course',
        score: g.score,
        grade: g.grade
      };
    });
  }

  public addGrade(student_id: string, course_id: string, score: number): GradeDetailed {
    // Grade converter helper
    const getGradeChar = (val: number) => {
      if (val >= 97) return 'A+';
      if (val >= 93) return 'A';
      if (val >= 90) return 'A-';
      if (val >= 87) return 'B+';
      if (val >= 83) return 'B';
      if (val >= 80) return 'B-';
      if (val >= 77) return 'C+';
      if (val >= 73) return 'C';
      if (val >= 70) return 'C-';
      if (val >= 60) return 'D';
      return 'F';
    };

    const gradeChar = getGradeChar(score);

    const existingIdx = this.grades.findIndex(g => g.student_id === student_id && g.course_id === course_id);
    if (existingIdx !== -1) {
      this.grades[existingIdx].score = score;
      this.grades[existingIdx].grade = gradeChar;
    } else {
      const grade_id = `grd-${Math.random().toString(36).substr(2, 9)}`;
      this.grades.push({
        grade_id,
        student_id,
        course_id,
        score,
        grade: gradeChar
      });
    }

    this.save();
    return this.getAllGradesDetailed().find(g => g.student_id === student_id && g.course_id === course_id)!;
  }

  public deleteGrade(gradeId: string): boolean {
    const idx = this.grades.findIndex(g => g.grade_id === gradeId);
    if (idx === -1) return false;

    this.grades.splice(idx, 1);
    this.save();
    return true;
  }

  // TIMETABLES (SCHEDULES)
  public getAllTimetablesDetailed(): TimetableDetailed[] {
    return this.timetables.map(t => {
      const course = this.courses.find(c => c.course_id === t.course_id);
      const teacher = this.teachers.find(tc => tc.teacher_id === t.teacher_id);
      const teacherUser = teacher ? this.users.find(u => u.id === teacher.user_id) : null;

      return {
        timetable_id: t.timetable_id,
        class_name: t.class_name,
        course_id: t.course_id,
        course_name: course?.course_name || 'Unknown Course',
        teacher_id: t.teacher_id,
        teacher_name: teacherUser?.fullname || 'Unknown Teacher',
        day: t.day,
        start_time: t.start_time,
        end_time: t.end_time
      };
    });
  }

  public createTimetableSchedule(class_name: string, course_id: string, teacher_id: string, day: string, start_time: string, end_time: string): TimetableDetailed {
    const timetable_id = `tt-${Math.random().toString(36).substr(2, 9)}`;
    const newTimetable: Timetable = {
      timetable_id,
      class_name,
      course_id,
      teacher_id,
      day,
      start_time,
      end_time
    };
    this.timetables.push(newTimetable);
    this.save();
    return this.getAllTimetablesDetailed().find(t => t.timetable_id === timetable_id)!;
  }

  public deleteTimetableSchedule(timetableId: string): boolean {
    const idx = this.timetables.findIndex(t => t.timetable_id === timetableId);
    if (idx === -1) return false;

    this.timetables.splice(idx, 1);
    this.save();
    return true;
  }

  // FEES / PAYMENTS
  public getAllPaymentsDetailed(): PaymentDetailed[] {
    return this.payments.map(p => {
      const student = this.students.find(s => s.student_id === p.student_id);
      const studentUser = student ? this.users.find(u => u.id === student.user_id) : null;

      return {
        payment_id: p.payment_id,
        student_id: p.student_id,
        student_name: studentUser?.fullname || 'Unknown Student',
        grade: student?.grade || 'N/A',
        amount: p.amount,
        payment_date: p.payment_date,
        status: p.status
      };
    });
  }

  public addPayment(student_id: string, amount: number, status: PaymentStatus, date?: string): PaymentDetailed {
    const payment_id = `pmt-${Math.random().toString(36).substr(2, 9)}`;
    const payment_date = date || new Date().toISOString().split('T')[0];
    const newPayment: Payment = {
      payment_id,
      student_id,
      amount,
      payment_date,
      status
    };
    this.payments.push(newPayment);
    this.save();
    return this.getAllPaymentsDetailed().find(p => p.payment_id === payment_id)!;
  }

  public updatePaymentStatus(paymentId: string, status: PaymentStatus): PaymentDetailed | undefined {
    const idx = this.payments.findIndex(p => p.payment_id === paymentId);
    if (idx === -1) return undefined;

    this.payments[idx].status = status;
    this.save();
    return this.getAllPaymentsDetailed().find(p => p.payment_id === paymentId);
  }

  // ANNOUNCEMENTS / NOTIFICATIONS
  public getAllNotifications(): Notification[] {
    return this.notifications;
  }

  public createNotification(title: string, message: string, recipient: string): Notification {
    const notification_id = `not-${Math.random().toString(36).substr(2, 9)}`;
    const newNot: Notification = {
      notification_id,
      title,
      message,
      recipient,
      created_at: new Date().toISOString()
    };
    this.notifications.unshift(newNot); // Most recent first
    this.save();
    return newNot;
  }

  public deleteNotification(notificationId: string): boolean {
    const idx = this.notifications.findIndex(n => n.notification_id === notificationId);
    if (idx === -1) return false;

    this.notifications.splice(idx, 1);
    this.save();
    return true;
  }

  // --- NEW SECTIONS METHODS ---
  public getAvailableSections(): string[] {
    return this.availableSections;
  }

  public createSection(name: string): string[] {
    const cleanName = name.trim().toUpperCase();
    if (cleanName && !this.availableSections.includes(cleanName)) {
      this.availableSections.push(cleanName);
      this.save();
    }
    return this.availableSections;
  }

  // --- NEW ASSIGNMENT SYSTEM METHODS ---
  public getAllAssignments(): Assignment[] {
    return this.assignments;
  }

  public getAssignmentsForStudent(studentId: string): Assignment[] {
    const student = this.students.find(s => s.student_id === studentId);
    if (!student) return [];
    const studentClassName = `${student.grade}-${student.section}`;
    return this.assignments.filter(asg => 
      asg.class_name === studentClassName || 
      asg.class_name === student.grade || 
      asg.class_name === 'All'
    );
  }

  public getAssignmentById(id: string): Assignment | undefined {
    return this.assignments.find(asg => asg.assignment_id === id);
  }

  public createAssignment(
    title: string, 
    description: string, 
    courseId: string, 
    className: string, 
    type: 'INDIVIDUAL' | 'GROUP', 
    dueDate: string, 
    attachments: { name: string; url: string }[],
    groups?: AssignmentGroup[]
  ): Assignment {
    const course = this.courses.find(c => c.course_id === courseId);
    const courseName = course ? course.course_name : 'Unknown Course';
    const assignment_id = `asg-${Math.random().toString(36).substr(2, 9)}`;
    
    const newAsg: Assignment = {
      assignment_id,
      title,
      description,
      course_id: courseId,
      course_name: courseName,
      class_name: className,
      type,
      due_date: dueDate,
      attachments,
      created_at: new Date().toISOString(),
      groups: type === 'GROUP' ? (groups || []) : undefined
    };

    this.assignments.unshift(newAsg);
    this.save();
    return newAsg;
  }

  public getAllSubmissions(): AssignmentSubmission[] {
    return this.assignmentSubmissions;
  }

  public getSubmissionsForAssignment(assignmentId: string): AssignmentSubmission[] {
    return this.assignmentSubmissions.filter(sub => sub.assignment_id === assignmentId);
  }

  public getSubmissionsForStudent(studentId: string): AssignmentSubmission[] {
    // If individual, student_id matches.
    // If group, check if student is in any group for the assignment
    return this.assignmentSubmissions.filter(sub => {
      if (sub.student_id === studentId) return true;
      
      const asg = this.getAssignmentById(sub.assignment_id);
      if (asg && asg.type === 'GROUP' && asg.groups && sub.group_id) {
        const grp = asg.groups.find(g => g.group_id === sub.group_id);
        if (grp && grp.student_ids.includes(studentId)) {
          return true;
        }
      }
      return false;
    });
  }

  public submitAssignment(
    assignmentId: string, 
    studentId: string, 
    files: { name: string; content?: string; url?: string }[],
    memberContributions?: { student_id: string; student_name: string; contribution_percentage: number; notes: string }[]
  ): AssignmentSubmission {
    const asg = this.getAssignmentById(assignmentId);
    const student = this.students.find(s => s.student_id === studentId);
    const studentUser = student ? this.users.find(u => u.id === student.user_id) : null;
    const studentName = studentUser ? studentUser.fullname : 'Unknown Student';

    let groupId: string | undefined = undefined;
    if (asg && asg.type === 'GROUP' && asg.groups) {
      const foundGrp = asg.groups.find(g => g.student_ids.includes(studentId));
      if (foundGrp) {
        groupId = foundGrp.group_id;
      }
    }

    // Check if duplicate submission exists
    const existingIdx = this.assignmentSubmissions.findIndex(sub => 
      sub.assignment_id === assignmentId && 
      (asg?.type === 'INDIVIDUAL' ? sub.student_id === studentId : sub.group_id === groupId)
    );

    const submission_id = `sub-${Math.random().toString(36).substr(2, 9)}`;
    const isLate = asg ? new Date() > new Date(asg.due_date + 'T23:59:59') : false;

    const newSub: AssignmentSubmission = {
      submission_id,
      assignment_id: assignmentId,
      student_id: asg?.type === 'INDIVIDUAL' ? studentId : undefined,
      group_id: groupId,
      student_name: asg?.type === 'INDIVIDUAL' ? studentName : undefined,
      submitted_files: files,
      submitted_at: new Date().toISOString(),
      status: isLate ? 'LATE' : 'SUBMITTED',
      group_member_contributions: memberContributions
    };

    if (existingIdx !== -1) {
      this.assignmentSubmissions[existingIdx] = newSub;
    } else {
      this.assignmentSubmissions.push(newSub);
    }

    this.save();
    return newSub;
  }

  public gradeSubmission(submissionId: string, score: number, feedback: string): AssignmentSubmission | undefined {
    const idx = this.assignmentSubmissions.findIndex(sub => sub.submission_id === submissionId);
    if (idx === -1) return undefined;

    this.assignmentSubmissions[idx].score = score;
    this.assignmentSubmissions[idx].feedback = feedback;
    this.assignmentSubmissions[idx].status = 'GRADED';

    this.save();
    return this.assignmentSubmissions[idx];
  }

  public deleteSubmission(submissionId: string): boolean {
    const idx = this.assignmentSubmissions.findIndex(sub => sub.submission_id === submissionId);
    if (idx === -1) return false;
    this.assignmentSubmissions.splice(idx, 1);
    this.save();
    return true;
  }

  public requestRevision(submissionId: string, comments: string): AssignmentSubmission | undefined {
    const idx = this.assignmentSubmissions.findIndex(sub => sub.submission_id === submissionId);
    if (idx === -1) return undefined;
    this.assignmentSubmissions[idx].status = 'REVISION_REQUESTED';
    this.assignmentSubmissions[idx].feedback = comments;
    this.save();
    return this.assignmentSubmissions[idx];
  }

  public getGroupChats(assignmentId: string, groupId: string): AssignmentGroupChat[] {
    return this.assignmentGroupChats.filter(chat => 
      chat.assignment_id === assignmentId && chat.group_id === groupId
    );
  }

  public postGroupComment(assignmentId: string, groupId: string, studentId: string, message: string): AssignmentGroupChat {
    const student = this.students.find(s => s.student_id === studentId);
    const studentUser = student ? this.users.find(u => u.id === student.user_id) : null;
    const studentName = studentUser ? studentUser.fullname : 'Unknown Student';

    const comment_id = `cmt-${Math.random().toString(36).substr(2, 9)}`;
    const newChat: AssignmentGroupChat = {
      comment_id,
      assignment_id: assignmentId,
      group_id: groupId,
      student_id: studentId,
      student_name: studentName,
      message,
      created_at: new Date().toISOString()
    };

    this.assignmentGroupChats.push(newChat);
    this.save();
    return newChat;
  }

  // --- NEW DIGITAL LIBRARY METHODS ---
  public getBooks(): Book[] {
    return this.books;
  }

  public getBookById(id: string): Book | undefined {
    return this.books.find(bk => bk.book_id === id);
  }

  public addBook(book: Book): Book {
    this.books.push(book);
    this.save();
    return book;
  }

  public deleteBook(bookId: string): boolean {
    const initialLen = this.books.length;
    this.books = this.books.filter(bk => bk.book_id !== bookId);
    if (this.books.length < initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public getReadingProgressForStudent(studentId: string): ReadingProgress[] {
    return this.readingProgress.filter(rp => rp.student_id === studentId);
  }

  public updateReadingProgress(studentId: string, bookId: string, chapterId: string, completedPercentage: number): ReadingProgress {
    const student = this.students.find(s => s.student_id === studentId);
    const studentUser = student ? this.users.find(u => u.id === student.user_id) : null;
    const studentName = studentUser ? studentUser.fullname : 'Unknown Student';

    const book = this.getBookById(bookId);
    const bookTitle = book ? book.title : 'Unknown Book';
    const chapter = book ? book.chapters.find(ch => ch.chapter_id === chapterId) : null;
    const chapterTitle = chapter ? chapter.title : 'Unknown Chapter';

    const idx = this.readingProgress.findIndex(rp => rp.student_id === studentId && rp.book_id === bookId);
    const currentTimestamp = new Date().toISOString();

    if (idx !== -1) {
      this.readingProgress[idx].current_chapter_id = chapterId;
      this.readingProgress[idx].current_chapter_title = chapterTitle;
      this.readingProgress[idx].completed_percentage = completedPercentage;
      this.readingProgress[idx].last_read = currentTimestamp;
      this.save();
      return this.readingProgress[idx];
    } else {
      const progress_id = `rp-${Math.random().toString(36).substr(2, 9)}`;
      const newRp: ReadingProgress = {
        progress_id,
        student_id: studentId,
        student_name: studentName,
        book_id: bookId,
        book_title: bookTitle,
        current_chapter_id: chapterId,
        current_chapter_title: chapterTitle,
        completed_percentage: completedPercentage,
        last_read: currentTimestamp
      };
      this.readingProgress.push(newRp);
      this.save();
      return newRp;
    }
  }

  public getBookmarksForStudent(studentId: string): Bookmark[] {
    return this.bookmarks.filter(bm => bm.student_id === studentId);
  }

  public getAllBookmarks(): Bookmark[] {
    return this.bookmarks;
  }

  public addBookmark(studentId: string, bookId: string, chapterId: string, note?: string): Bookmark {
    const book = this.getBookById(bookId);
    const bookTitle = book ? book.title : 'Unknown Book';
    const chapter = book ? book.chapters.find(ch => ch.chapter_id === chapterId) : null;
    const chapterTitle = chapter ? chapter.title : 'Unknown Chapter';

    const bookmark_id = `bmk-${Math.random().toString(36).substr(2, 9)}`;
    const newBm: Bookmark = {
      bookmark_id,
      student_id: studentId,
      book_id: bookId,
      book_title: bookTitle,
      chapter_id: chapterId,
      chapter_title: chapterTitle,
      note,
      created_at: new Date().toISOString()
    };

    this.bookmarks.push(newBm);
    this.save();
    return newBm;
  }

  public deleteBookmark(bookmarkId: string): boolean {
    const idx = this.bookmarks.findIndex(bm => bm.bookmark_id === bookmarkId);
    if (idx === -1) return false;
    this.bookmarks.splice(idx, 1);
    this.save();
    return true;
  }

  public logAiInteraction(studentId: string, question: string, answer: string, referencedBooks: { book_id: string; title: string; chapter: string }[]): AiInteractionLog {
    const student = this.students.find(s => s.student_id === studentId);
    const studentUser = student ? this.users.find(u => u.id === student.user_id) : null;
    const studentName = studentUser ? studentUser.fullname : 'Unknown Student';

    const log_id = `ail-${Math.random().toString(36).substr(2, 9)}`;
    const newLog: AiInteractionLog = {
      log_id,
      student_id: studentId,
      student_name: studentName,
      grade: student ? student.grade : undefined,
      class_name: student ? `${student.grade}-${student.section}` : undefined,
      question,
      answer,
      referenced_books: referencedBooks,
      created_at: new Date().toISOString()
    };

    this.aiInteractionLogs.unshift(newLog);
    this.save();
    return newLog;
  }

  public getAllAiInteractionLogs(): AiInteractionLog[] {
    return this.aiInteractionLogs;
  }

  public getAllReadingProgress(): ReadingProgress[] {
    return this.readingProgress;
  }

  // --- NEW LIVE CLASSROOM METHODS ---
  public getCameras(): ClassroomCamera[] {
    return this.classroomCameras;
  }

  public createCamera(name: string, roomNumber: string): ClassroomCamera {
    const camera_id = `cam-${Math.random().toString(36).substr(2, 9)}`;
    const newCam: ClassroomCamera = {
      camera_id,
      name,
      room_number: roomNumber,
      status: 'ACTIVE'
    };
    this.classroomCameras.push(newCam);
    this.save();
    return newCam;
  }

  public updateCameraStatus(cameraId: string, status: 'ACTIVE' | 'INACTIVE'): ClassroomCamera | undefined {
    const camIdx = this.classroomCameras.findIndex(c => c.camera_id === cameraId);
    if (camIdx === -1) return undefined;
    this.classroomCameras[camIdx].status = status;
    this.save();
    return this.classroomCameras[camIdx];
  }

  public getLiveSessions(): LiveSession[] {
    return this.liveSessions;
  }

  public startLiveSession(courseId: string, teacherId: string, className: string, cameraId: string): LiveSession {
    const course = this.courses.find(c => c.course_id === courseId);
    const courseName = course ? course.course_name : 'Unknown Course';
    
    const teacher = this.teachers.find(t => t.teacher_id === teacherId);
    const teacherUser = teacher ? this.users.find(u => u.id === teacher.user_id) : null;
    const teacherName = teacherUser ? teacherUser.fullname : 'Unknown Teacher';

    const session_id = `live-${Math.random().toString(36).substr(2, 9)}`;
    const newSession: LiveSession = {
      session_id,
      course_id: courseId,
      course_name: courseName,
      teacher_id: teacherId,
      teacher_name: teacherName,
      class_name: className,
      status: 'LIVE',
      started_at: new Date().toISOString(),
      camera_id: cameraId,
      active_viewers: []
    };

    this.liveSessions.push(newSession);
    this.save();
    return newSession;
  }

  public endLiveSession(sessionId: string, videoUrl?: string): LiveSession | undefined {
    const idx = this.liveSessions.findIndex(s => s.session_id === sessionId);
    if (idx === -1) return undefined;

    this.liveSessions[idx].status = 'ENDED';
    this.liveSessions[idx].ended_at = new Date().toISOString();
    this.liveSessions[idx].video_url = videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4'; // default recording
    this.liveSessions[idx].active_viewers = [];

    // Auto mark "ONLINE PRESENT" for students who attended this live session (duration >= 60 seconds)
    const logs = this.getLiveAttendanceLogsForSession(sessionId);
    logs.forEach(log => {
      if (log.watched_duration_seconds >= 60) {
        log.marked_present = true;
        // Also record this in the primary school attendance table!
        const randId = `att-${Math.random().toString(36).substr(2, 9)}`;
        this.attendance.push({
          attendance_id: randId,
          student_id: log.student_id,
          course_id: this.liveSessions[idx].course_id,
          status: AttendanceStatus.ONLINE_PRESENT,
          date: new Date().toISOString().split('T')[0]
        });
      }
    });

    this.save();
    return this.liveSessions[idx];
  }

  public joinLiveSession(sessionId: string, studentId: string): boolean {
    const sIdx = this.liveSessions.findIndex(s => s.session_id === sessionId);
    if (sIdx === -1) return false;

    const session = this.liveSessions[sIdx];
    if (!session.active_viewers.includes(studentId)) {
      session.active_viewers.push(studentId);
    }

    const student = this.students.find(st => st.student_id === studentId);
    const studentUser = student ? this.users.find(u => u.id === student.user_id) : null;
    const studentName = studentUser ? studentUser.fullname : 'Unknown Student';

    // Log or initialize attendance log
    const logIdx = this.liveAttendanceLogs.findIndex(l => l.session_id === sessionId && l.student_id === studentId);
    if (logIdx === -1) {
      const log_id = `lal-${Math.random().toString(36).substr(2, 9)}`;
      this.liveAttendanceLogs.push({
        log_id,
        session_id: sessionId,
        student_id: studentId,
        student_name: studentName,
        joined_at: new Date().toISOString(),
        watched_duration_seconds: 0,
        marked_present: false
      });
    } else {
      this.liveAttendanceLogs[logIdx].joined_at = new Date().toISOString();
    }

    this.save();
    return true;
  }

  public leaveLiveSession(sessionId: string, studentId: string, durationSeconds: number): boolean {
    const sIdx = this.liveSessions.findIndex(s => s.session_id === sessionId);
    if (sIdx !== -1) {
      const session = this.liveSessions[sIdx];
      session.active_viewers = session.active_viewers.filter(id => id !== studentId);
    }

    const logIdx = this.liveAttendanceLogs.findIndex(l => l.session_id === sessionId && l.student_id === studentId);
    if (logIdx !== -1) {
      this.liveAttendanceLogs[logIdx].watched_duration_seconds += durationSeconds;
      if (this.liveAttendanceLogs[logIdx].watched_duration_seconds >= 60) {
        this.liveAttendanceLogs[logIdx].marked_present = true;
      }
    }

    this.save();
    return true;
  }

  public getLiveAttendanceLogsForSession(sessionId: string): LiveAttendanceLog[] {
    return this.liveAttendanceLogs.filter(l => l.session_id === sessionId);
  }

  public getAllLiveAttendanceLogs(): LiveAttendanceLog[] {
    return this.liveAttendanceLogs;
  }
}

// Export singleton instance
export const db = new SchoolDatabase();
