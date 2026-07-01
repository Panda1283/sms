import { useState, useEffect } from 'react';
import { ApiService } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { exportStudentAcademicReport } from '../utils/reportExporter';
import {
  StudentDetailed, GradeDetailed, AttendanceDetailed, Notification,
  PaymentDetailed, AttendanceStatus, PaymentStatus
} from '../types/db';
import {
  LayoutDashboard, FileText, Clock, Bell, CheckCircle, AlertTriangle, CreditCard,
  User, ShieldAlert, DollarSign, ArrowUpRight, HelpCircle, Check, RefreshCw, Download, TrendingUp
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface ParentViewsProps {
  activeTab: string;
}

export default function ParentViews({ activeTab }: ParentViewsProps) {
  const { user, profile } = useAuth();

  // Relational linked data
  const [children, setChildren] = useState<StudentDetailed[]>([]);
  const [grades, setGrades] = useState<GradeDetailed[]>([]);
  const [attendance, setAttendance] = useState<AttendanceDetailed[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [payments, setPayments] = useState<PaymentDetailed[]>([]);

  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadParentPortalData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [studentsData, gradesData, attendanceData, notificationsData, paymentsData] = await Promise.all([
        ApiService.get('/students'),
        ApiService.get('/grades'),
        ApiService.get('/attendance'),
        ApiService.get('/notifications'),
        ApiService.get('/payments')
      ]);

      const myParentId = profile.parent_id;

      // Filter children belonging to this parent
      const myChildren = studentsData.filter((s: any) => s.parent_id === myParentId);
      setChildren(myChildren);

      const childIds = myChildren.map((ch: any) => ch.student_id);

      // Filter children's grades, attendance, payments
      setGrades(gradesData.filter((g: any) => childIds.includes(g.student_id)));
      setAttendance(attendanceData.filter((a: any) => childIds.includes(a.student_id)));
      setPayments(paymentsData.filter((p: any) => childIds.includes(p.student_id)));
      setNotifications(notificationsData.filter((n: any) => n.recipient === 'ALL' || n.recipient === 'PARENT'));
    } catch (err) {
      console.error('Failed to load parent portal database records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParentPortalData();
  }, [profile, activeTab]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Authorize dynamic credit card tuition fee payments
  const handlePayTuition = async (paymentId: string) => {
    try {
      await ApiService.put(`/payments/${paymentId}`, { status: PaymentStatus.PAID });
      showSuccess('Tuition payment authorization successful! Receipt issued.');
      loadParentPortalData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <RefreshCw className="animate-spin text-indigo-600 mr-2" size={20} />
        <span className="font-mono text-slate-500">Loading parent portal...</span>
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

      {/* ========================================================= */}
      {/* 1. PARENT PORTAL DASHBOARD */}
      {/* ========================================================= */}
      {activeTab === 'parent-dashboard' && (
        <>
          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider font-bold">
                Parent Portal
              </span>
              <h2 className="text-xl font-bold mt-2.5">Parent Portal, {user?.fullname}</h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Review academic development progress, tuition billing statuses, and roll-calls for children.
              </p>
            </div>
            
            <div className="bg-white/10 px-4 py-3 rounded-xl border border-white/10 font-mono text-xs shrink-0">
              <p className="text-slate-400 font-bold text-[10px] uppercase">Associated Children</p>
              <p className="text-sm font-bold text-slate-100 mt-1">{children.length} Enrolled Students</p>
            </div>
          </div>

          {/* Children list profiles cards */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">My Children Academic Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {children.map((ch) => {
                const childGrades = grades.filter(g => g.student_id === ch.student_id);
                const avgScore = childGrades.length > 0
                  ? Math.round(childGrades.reduce((sum, g) => sum + g.score, 0) / childGrades.length)
                  : 85;

                const childAtt = attendance.filter(a => a.student_id === ch.student_id);
                const presentDays = childAtt.filter(a => a.status === AttendanceStatus.PRESENT).length;
                const attRate = childAtt.length > 0 ? Math.round((presentDays / childAtt.length) * 100) : 96;

                const pendingBill = payments.find(p => p.student_id === ch.student_id && p.status !== PaymentStatus.PAID);

                return (
                  <div key={ch.student_id} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold border border-slate-200">
                          {ch.fullname.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{ch.fullname}</h4>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{ch.student_id} | {ch.grade} - {ch.section}</p>
                        </div>
                      </div>
                      <span className="bg-amber-50 text-amber-700 font-bold px-2 py-0.5 border border-amber-200 rounded-xl text-[9px] uppercase font-mono">
                        Active Term
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-6 text-center">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 block uppercase font-mono font-bold">Avg Grade</span>
                        <span className="text-sm font-bold text-slate-700">{avgScore}%</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 block uppercase font-mono font-bold">Attendance</span>
                        <span className="text-sm font-bold text-slate-700">{attRate}%</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 block uppercase font-mono font-bold">Tuition</span>
                        <span className={`text-xs font-bold block mt-0.5 ${pendingBill ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {pendingBill ? 'Pending' : 'Settled'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {children.length === 0 && (
                <div className="border border-dashed border-slate-300 p-8 text-center text-slate-400 italic rounded-3xl bg-white col-span-2">
                  No children currently mapped to your parent ID. Please contact school administrators.
                </div>
              )}
            </div>
          </div>

          {/* School announcements board */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Latest Board Announcements</h3>
            <div className="space-y-3.5 max-h-[250px] overflow-y-auto">
              {notifications.map((not, idx) => (
                <div key={`${not.notification_id || ''}-${idx}`} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex gap-3">
                  <div className="bg-amber-100 text-amber-700 p-1.5 h-fit rounded-lg border border-amber-200">
                    <Bell size={13} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-xs leading-none">{not.title}</h4>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{not.message}</p>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">Date: {new Date(not.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ========================================================= */}
      {/* 2. ACADEMIC PERFORMANCE (GRADES) */}
      {/* ========================================================= */}
      {activeTab === 'parent-grades' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="p-6 border-b border-slate-200 bg-slate-50/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Children Report Card Marks</h3>
              <p className="text-xs text-slate-400 mt-0.5">Academic grading evaluations issued by faculty professors.</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {children.map(ch => {
                const childGrades = grades.filter(g => g.student_id === ch.student_id);
                const childAttendance = attendance.filter(a => a.student_id === ch.student_id);
                let targetGoals = {};
                try {
                  const stored = localStorage.getItem(`student_targets_${ch.student_id}`);
                  if (stored) targetGoals = JSON.parse(stored);
                } catch (_) {}

                return (
                  <button
                    key={ch.student_id}
                    onClick={() => exportStudentAcademicReport(
                      ch.fullname,
                      ch.student_id,
                      ch.grade,
                      ch.section,
                      childGrades,
                      childAttendance,
                      targetGoals
                    )}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Download size={13} />
                    Export {ch.fullname}'s PDF
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                  <th className="px-6 py-3.5 font-bold">Child</th>
                  <th className="px-6 py-3.5 font-bold">Class Subject</th>
                  <th className="px-6 py-3.5 font-bold text-center">Score Mark</th>
                  <th className="px-6 py-3.5 font-bold text-right">Letter Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {grades.map(g => (
                  <tr key={g.grade_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-slate-800">{g.student_name}</td>
                    <td className="px-6 py-3.5 text-slate-500">{g.course_name}</td>
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
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">No score marks logged.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. ATTENDANCE SHEETS */}
      {/* ========================================================= */}
      {activeTab === 'parent-attendance' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
          <div className="p-6 border-b border-slate-200 bg-slate-50/20">
            <h3 className="font-bold text-slate-800 text-sm">Children Daily Attendance Log</h3>
            <p className="text-xs text-slate-400 mt-0.5">Review registered roll-call indicators regarding your children.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px]">
                  <th className="px-6 py-3.5 font-bold">Child</th>
                  <th className="px-6 py-3.5 font-bold">Class period Course</th>
                  <th className="px-6 py-3.5 font-bold">Log Date</th>
                  <th className="px-6 py-3.5 font-bold text-right">Roll-Call Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {attendance.map(a => (
                  <tr key={a.attendance_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-slate-800">{a.student_name}</td>
                    <td className="px-6 py-3.5 text-slate-500">{a.course_name}</td>
                    <td className="px-6 py-3.5 font-mono text-slate-400">{a.date}</td>
                    <td className="px-6 py-3.5 text-right">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        a.status === AttendanceStatus.PRESENT
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
      )}

      {/* 4. NOTIFICATIONS & PAYMENTS TUITION INVOICES */}
      {/* ========================================================= */}
      {activeTab === 'parent-notifications' && (() => {
        // Compute billing analytics data
        const billingData = children.map(ch => {
          const childPayments = payments.filter(p => p.student_id === ch.student_id);
          const paidAmount = childPayments
            .filter(p => p.status === PaymentStatus.PAID)
            .reduce((sum, p) => sum + p.amount, 0);
          const outstandingAmount = childPayments
            .filter(p => p.status !== PaymentStatus.PAID)
            .reduce((sum, p) => sum + p.amount, 0);

          return {
            name: ch.fullname,
            Paid: paidAmount,
            Outstanding: outstandingAmount
          };
        });

        const totalPaid = billingData.reduce((sum, item) => sum + item.Paid, 0);
        const totalOutstanding = billingData.reduce((sum, item) => sum + item.Outstanding, 0);

        return (
          <div className="space-y-6">
            {/* Billing Analytics Card */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 text-left">
              <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-600" />
                Semester Billing & Tuition Analytics
              </h3>
              <p className="text-xs text-slate-400 mb-6">Visual breakdown of paid vs outstanding school tuition installments over the current academic semester.</p>

              {payments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-mono bg-slate-50 rounded-2xl border border-slate-200/50">
                  No active billing records detected to render analytics.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                  <div className="lg:col-span-2 h-[260px] w-full" id="parent-billing-barchart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={billingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" unit="$" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                          cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        <Bar dataKey="Paid" fill="#10b981" radius={[4, 4, 0, 0]} name="Paid Installments ($)" barSize={36} />
                        <Bar dataKey="Outstanding" fill="#6366f1" radius={[4, 4, 0, 0]} name="Outstanding Balance ($)" barSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-4">
                    <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">Financial Summary</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-slate-200/50 text-left">
                        <span className="text-[9px] text-slate-400 uppercase block font-mono">Total Paid</span>
                        <span className="text-sm font-extrabold text-emerald-600">
                          ${totalPaid}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200/50 text-left">
                        <span className="text-[9px] text-slate-400 uppercase block font-mono">Outstanding</span>
                        <span className="text-sm font-extrabold text-indigo-600">
                          ${totalOutstanding}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-indigo-50 border border-indigo-100/60 rounded-xl text-left">
                      <div className="flex gap-2 items-start">
                        <AlertTriangle className="text-indigo-600 shrink-0 mt-0.5" size={14} />
                        <div>
                          <h5 className="text-[10px] font-bold text-indigo-950">Payment Action Reminder</h5>
                          <p className="text-[9px] text-indigo-700 leading-relaxed mt-0.5">
                            Outstanding fee items are due by the end of the academic semester. Late settlement can incur holds.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tuition billing card */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 text-left">
              <h3 className="font-bold text-slate-800 text-sm mb-1.5 flex items-center gap-2">
                <CreditCard size={18} className="text-amber-500" />
                Tuition Billing Statements
              </h3>
              <p className="text-xs text-slate-400 mb-4 font-mono">Billed term payments for child tuitions.</p>

            <div className="space-y-3.5">
              {payments.map(p => (
                <div key={p.payment_id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 text-sm">{p.student_name} ({p.grade})</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        p.status === PaymentStatus.PAID
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-mono">Billed Invoice: ${p.amount} | Date: {p.payment_date}</p>
                  </div>

                  {p.status !== PaymentStatus.PAID ? (
                    <button
                      onClick={() => handlePayTuition(p.payment_id)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-md shadow-indigo-950/10 flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <DollarSign size={14} />
                      Authorize Payment
                    </button>
                  ) : (
                    <span className="text-emerald-600 font-bold text-xs flex items-center gap-1 font-mono uppercase">
                      <CheckCircle size={14} />
                      FULLY SETTLED
                    </span>
                  )}
                </div>
              ))}
              {payments.length === 0 && (
                <p className="text-slate-400 italic text-xs">No tuition invoice statements registered.</p>
              )}
            </div>
          </div>

          {/* Announcements list */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm space-y-4 hover:shadow-md transition-all duration-300">
            <h3 className="font-bold text-slate-800 text-sm">Parent Bulletin Notifications</h3>
            <div className="space-y-3.5">
              {notifications.map((not, idx) => (
                <div key={`${not.notification_id || ''}-${idx}`} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <h4 className="font-bold text-slate-800 text-sm">{not.title}</h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{not.message}</p>
                  <span className="text-[10px] text-slate-400 font-mono mt-2 block">Date Published: {new Date(not.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )})()}
    </div>
  );
}
