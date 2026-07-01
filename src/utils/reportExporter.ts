import { GradeDetailed, AttendanceDetailed } from '../types/db';

export function exportStudentAcademicReport(
  studentName: string,
  studentId: string,
  gradeLevel: string,
  section: string,
  grades: GradeDetailed[],
  attendance: AttendanceDetailed[],
  targetGoals: Record<string, number> = {}
) {
  const currentTerm = '2026 Academic Summer Semester';
  const reportDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate Cumulative Average & GPA
  const totalCourses = grades.length;
  const avgScore = totalCourses > 0
    ? Math.round(grades.reduce((sum, g) => sum + g.score, 0) / totalCourses)
    : 0;
  
  // Calculate GPA equivalent
  let gpa = 0.0;
  if (avgScore >= 90) gpa = 4.0;
  else if (avgScore >= 80) gpa = 3.0;
  else if (avgScore >= 70) gpa = 2.0;
  else if (avgScore >= 60) gpa = 1.0;
  else gpa = 0.0;

  // Attendance metrics
  const totalDays = attendance.length;
  const presentDays = attendance.filter(a => a.status === 'PRESENT' || a.status === 'ONLINE_PRESENT').length;
  const attRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  // Construct table rows for subjects
  const gradesRows = grades.map(g => {
    const targetGoal = targetGoals[g.course_id] ?? 90;
    const diff = g.score - targetGoal;
    const statusText = diff >= 0 ? 'Goal Achieved' : `${Math.abs(diff)}% Below Goal`;
    const statusColor = diff >= 0 ? '#10b981' : '#6366f1';

    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 8px; text-align: left; font-weight: 600; color: #1e293b;">${g.course_name}</td>
        <td style="padding: 12px 8px; text-align: center; font-family: monospace; font-size: 14px;">${g.score}%</td>
        <td style="padding: 12px 8px; text-align: center; font-family: monospace; font-weight: bold; font-size: 14px; color: #4338ca;">${g.grade}</td>
        <td style="padding: 12px 8px; text-align: center; font-family: monospace;">${targetGoal}%</td>
        <td style="padding: 12px 8px; text-align: right; color: ${statusColor}; font-weight: 500; font-size: 12px;">${statusText}</td>
      </tr>
    `;
  }).join('');

  // Attendance breakdown rows
  const attendanceSummary = `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-top: 24px;">
      <h3 style="margin-top: 0; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; font-family: sans-serif;">Attendance Roll-Call Audit</h3>
      <div style="display: flex; justify-content: space-between; font-size: 13px;">
        <div><strong>Total Sessions Logged:</strong> ${totalDays}</div>
        <div><strong>Days Present:</strong> ${presentDays}</div>
        <div><strong>Attendance Rate:</strong> ${attRate}%</div>
      </div>
    </div>
  `;

  // HTML Report Document Template with full CSS styling
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Official Academic Progress Summary - ${studentName}</title>
  <style>
    @media print {
      body {
        background: #ffffff;
        color: #000000;
        padding: 0;
        margin: 0;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-before: always;
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.5;
      color: #334155;
      background-color: #f1f5f9;
      padding: 40px 20px;
      margin: 0;
    }
    .report-card {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 20px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
      padding: 40px;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      border-bottom: 2px solid #6366f1;
      padding-bottom: 20px;
    }
    .header-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.025em;
      margin: 0;
    }
    .header-subtitle {
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin: 4px 0 0 0;
    }
    .info-grid {
      display: grid;
      grid-template-cols: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 30px;
      font-size: 13px;
    }
    .info-item {
      background: #f8fafc;
      padding: 12px 16px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }
    .info-label {
      color: #64748b;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .info-value {
      font-weight: 600;
      color: #1e293b;
    }
    .metrics-row {
      display: grid;
      grid-template-cols: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 30px;
    }
    .metric-card {
      text-align: center;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .metric-gpa {
      background-color: #f5f3ff;
      border-color: #ddd6fe;
      color: #5b21b6;
    }
    .metric-score {
      background-color: #f0fdf4;
      border-color: #bbf7d0;
      color: #166534;
    }
    .metric-attendance {
      background-color: #f0f9ff;
      border-color: #bae6fd;
      color: #075985;
    }
    .metric-num {
      font-size: 28px;
      font-weight: 800;
      margin-top: 4px;
    }
    .grades-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      font-size: 13px;
    }
    .grades-table th {
      background-color: #f8fafc;
      color: #475569;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
      padding: 12px 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    .signature-area {
      margin-top: 60px;
      border-top: 1px solid #e2e8f0;
      padding-top: 30px;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
    }
    .signature-block {
      text-align: center;
      width: 200px;
    }
    .signature-line {
      border-bottom: 1px dashed #94a3b8;
      height: 40px;
      margin-bottom: 8px;
    }
    .btn-container {
      max-width: 800px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .btn {
      background-color: #4f46e5;
      color: #ffffff;
      font-weight: 700;
      font-size: 13px;
      padding: 10px 20px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      transition: background-color 0.15s ease;
    }
    .btn:hover {
      background-color: #4338ca;
    }
    .btn-secondary {
      background-color: #ffffff;
      color: #475569;
      border: 1px solid #cbd5e1;
    }
    .btn-secondary:hover {
      background-color: #f8fafc;
    }
  </style>
</head>
<body>

  <div class="btn-container no-print">
    <button class="btn btn-secondary" onclick="window.close()">Close Window</button>
    <button class="btn" onclick="window.print()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
      Print / Save as PDF
    </button>
  </div>

  <div class="report-card">
    <table class="header-table">
      <tr>
        <td style="text-align: left; vertical-align: middle;">
          <h1 class="header-title">SMART EDUCATIONAL PLATFORM</h1>
          <p class="header-subtitle">Official Student Academic Progress Summary</p>
        </td>
        <td style="text-align: right; vertical-align: middle; font-family: monospace; font-size: 11px; color: #64748b;">
          <div>REPORT CODE: SEP-2026-${studentId}</div>
          <div>DATE GENERATED: ${reportDate}</div>
        </td>
      </tr>
    </table>

    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Student Name</div>
        <div class="info-value">${studentName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Student Identifier</div>
        <div class="info-value" style="font-family: monospace;">${studentId}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Active Academic Grade</div>
        <div class="info-value">Grade ${gradeLevel} - Section ${section}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Academic Term</div>
        <div class="info-value">${currentTerm}</div>
      </div>
    </div>

    <div class="metrics-row">
      <div class="metric-card metric-gpa">
        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Grade Point Avg</div>
        <div class="metric-num">${gpa.toFixed(2)}</div>
        <div style="font-size: 10px; opacity: 0.8; margin-top: 4px;">4.0 Scale Equivalent</div>
      </div>
      <div class="metric-card metric-score">
        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Cumulative Mark</div>
        <div class="metric-num">${avgScore}%</div>
        <div style="font-size: 10px; opacity: 0.8; margin-top: 4px;">Weighted Average</div>
      </div>
      <div class="metric-card metric-attendance">
        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Attendance Index</div>
        <div class="metric-num">${attRate}%</div>
        <div style="font-size: 10px; opacity: 0.8; margin-top: 4px;">Present Days Ratio</div>
      </div>
    </div>

    <h3 style="color: #0f172a; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 32px;">Subject-by-Subject Academic Standings</h3>
    
    <table class="grades-table">
      <thead>
        <tr>
          <th style="text-align: left;">Course subject</th>
          <th style="text-align: center; width: 100px;">Cumulative Mark</th>
          <th style="text-align: center; width: 100px;">Letter Grade</th>
          <th style="text-align: center; width: 100px;">Target Learning Goal</th>
          <th style="text-align: right; width: 140px;">Learning Standing</th>
        </tr>
      </thead>
      <tbody>
        ${gradesRows}
      </tbody>
    </table>

    ${attendanceSummary}

    <div class="signature-area">
      <div class="signature-block">
        <div class="signature-line"></div>
        <strong>Parent signature</strong>
        <div style="color: #64748b; font-size: 10px; margin-top: 2px;">Acknowledged Review</div>
      </div>
      <div class="signature-block">
        <div class="signature-line" style="border-bottom-style: solid; border-bottom-color: #6366f1; padding-top: 20px; font-family: cursive; color: #4338ca; font-size: 15px;">Smart Registrar</div>
        <strong>School Administration Seal</strong>
        <div style="color: #64748b; font-size: 10px; margin-top: 2px;">Certified Verification</div>
      </div>
    </div>
  </div>

  <script>
    // Auto-trigger native prompt when opened standalone
    window.addEventListener('DOMContentLoaded', () => {
      // Small timeout to let elements render neatly before dialog triggers
      setTimeout(() => {
        if (window.self === window.top) {
          // window.print();
        }
      }, 800);
    });
  </script>
</body>
</html>
  `;

  // Standard elegant client-side download execution
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Trigger immediate file-saver block
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Official_Academic_Report_${studentName.replace(/\s+/g, '_')}.html`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
