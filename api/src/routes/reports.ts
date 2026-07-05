import { Router, Request, Response } from "express";
import { Pool } from "pg";

const router = Router();

// ---------------------------------------------------------------------------
// DB pool — uses the same DATABASE_URL that Person 1 (Mahima) will wire up
// in config/database.ts. We create a local fallback pool here so this file
// is self-contained and can be imported before the shared pool is ready.
// ---------------------------------------------------------------------------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ---------------------------------------------------------------------------
// Helper: run a query and return rows, or throw on DB error
// ---------------------------------------------------------------------------
async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const { rows } = await pool.query(sql, params);
  return rows as T[];
}

// ---------------------------------------------------------------------------
// Helper: safely parse a percentage to 1 decimal place
// ---------------------------------------------------------------------------
function pct(present: number, total: number): number {
  if (!total || total === 0) return 0;
  return Math.round((present / total) * 1000) / 10; // one decimal
}

// ---------------------------------------------------------------------------
// Helper: build a date-range WHERE fragment
// Appends AND clauses to `conditions[]` and values to `params[]`
// ---------------------------------------------------------------------------
function applyDateRange(
  conditions: string[],
  params: unknown[],
  from?: string,
  to?: string,
  dateColumn = "as2.session_date"
): void {
  if (from) {
    params.push(from);
    conditions.push(`${dateColumn} >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`${dateColumn} <= $${params.length}`);
  }
}

// ===========================================================================
// 1. GET /api/v1/reports/students/:studentId
//    Student attendance report — filterable by date range, semester, subjectId
// ===========================================================================
router.get("/students/:studentId", async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const { from, to, semester, subjectId } = req.query as Record<string, string | undefined>;

  try {
    // ── Verify student exists ──────────────────────────────────────────────
    const [student] = await query<{
      student_id: string;
      first_name: string;
      last_name: string;
      batch_code: string;
    }>(
      `SELECT s.student_id, s.first_name, s.last_name, b.batch_code
       FROM student s
       JOIN batch b ON b.batch_id = s.batch_id
       WHERE s.student_id = $1 AND s.is_active = TRUE`,
      [studentId]
    );

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    // ── Build per-subject attendance query ─────────────────────────────────
    const conditions: string[] = [
      "a.student_id = $1",
      "a.is_active = TRUE",
      "as2.is_active = TRUE",
    ];
    const params: unknown[] = [studentId];

    applyDateRange(conditions, params, from, to, "as2.session_date");

    if (semester) {
      // semester lives on batch, not timetable — must join batch to filter
      params.push(Number(semester));
      conditions.push(`b2.semester = $${params.length}`);
    }
    if (subjectId) {
      params.push(subjectId);
      conditions.push(`sub.subject_id = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = await query<{
      subject_id: string;
      subject_name: string;
      subject_code: string;
      present: string;
      total: string;
    }>(
      `SELECT
         sub.subject_id,
         sub.subject_name,
         sub.subject_code,
         COUNT(CASE WHEN a.attendance_status = 'PRESENT' THEN 1 END)::text AS present,
         COUNT(*)::text                                                      AS total
       FROM attendance a
       JOIN attendance_session as2 ON as2.attendance_session_id = a.attendance_session_id
       JOIN timetable t            ON t.timetable_id = as2.timetable_id
       JOIN subject sub            ON sub.subject_id = t.subject_id
       JOIN batch b2               ON b2.batch_id = t.batch_id
       ${whereClause}
       GROUP BY sub.subject_id, sub.subject_name, sub.subject_code
       ORDER BY sub.subject_name`,
      params
    );

    const subjects = rows.map((r) => ({
      subjectId: r.subject_id,
      subjectCode: r.subject_code,
      subject: r.subject_name,
      present: Number(r.present),
      total: Number(r.total),
      percentage: pct(Number(r.present), Number(r.total)),
    }));

    const totalPresent = subjects.reduce((s, r) => s + r.present, 0);
    const totalClasses = subjects.reduce((s, r) => s + r.total, 0);

    return res.json({
      success: true,
      data: {
        studentId: student.student_id,
        studentName: `${student.first_name} ${student.last_name}`,
        batch: student.batch_code,
        overallAttendance: pct(totalPresent, totalClasses),
        totalPresent,
        totalClasses,
        subjects,
      },
    });
  } catch (err) {
    console.error("[reports/students]", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ===========================================================================
// 2. GET /api/v1/reports/batches/:batchId
//    Batch attendance report — per-student breakdown
// ===========================================================================
router.get("/batches/:batchId", async (req: Request, res: Response) => {
  const { batchId } = req.params;
  const { from, to, subjectId } = req.query as Record<string, string | undefined>;

  try {
    const [batch] = await query<{ batch_id: string; batch_code: string }>(
      `SELECT batch_id, batch_code FROM batch WHERE batch_id = $1 AND is_active = TRUE`,
      [batchId]
    );
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found." });
    }

    const conditions: string[] = [
      "s.batch_id = $1",
      "s.is_active = TRUE",
      "a.is_active = TRUE",
      "as2.is_active = TRUE",
    ];
    const params: unknown[] = [batchId];

    applyDateRange(conditions, params, from, to, "as2.session_date");
    if (subjectId) {
      params.push(subjectId);
      conditions.push(`t.subject_id = $${params.length}`);
    }

    const rows = await query<{
      student_id: string;
      first_name: string;
      last_name: string;
      roll_number: string;
      present: string;
      total: string;
    }>(
      `SELECT
         s.student_id,
         s.first_name,
         s.last_name,
         s.roll_number,
         COUNT(CASE WHEN a.attendance_status = 'PRESENT' THEN 1 END)::text AS present,
         COUNT(*)::text AS total
       FROM student s
       LEFT JOIN attendance a ON a.student_id = s.student_id AND a.is_active = TRUE
       LEFT JOIN attendance_session as2 ON as2.attendance_session_id = a.attendance_session_id AND as2.is_active = TRUE
       LEFT JOIN timetable t ON t.timetable_id = as2.timetable_id
       WHERE ${conditions.join(" AND ")}
       GROUP BY s.student_id, s.first_name, s.last_name, s.roll_number
       ORDER BY s.roll_number`,
      params
    );

    const students = rows.map((r) => ({
      studentId: r.student_id,
      rollNumber: r.roll_number,
      student: `${r.first_name} ${r.last_name}`,
      present: Number(r.present),
      total: Number(r.total),
      attendance: pct(Number(r.present), Number(r.total)),
    }));

    const totalPresent = students.reduce((s, r) => s + r.present, 0);
    const totalClasses = students.reduce((s, r) => s + r.total, 0);

    return res.json({
      success: true,
      batch: batch.batch_code,
      overallAttendance: pct(totalPresent, totalClasses),
      totalStudents: students.length,
      students,
    });
  } catch (err) {
    console.error("[reports/batches]", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ===========================================================================
// 3. GET /api/v1/reports/faculties/:facultyId
//    Faculty report — classes conducted + average attendance
// ===========================================================================
router.get("/faculties/:facultyId", async (req: Request, res: Response) => {
  const { facultyId } = req.params;
  const { from, to } = req.query as Record<string, string | undefined>;

  try {
    const [faculty] = await query<{
      faculty_id: string;
      first_name: string;
      last_name: string;
    }>(
      `SELECT faculty_id, first_name, last_name
       FROM faculty WHERE faculty_id = $1 AND is_active = TRUE`,
      [facultyId]
    );
    if (!faculty) {
      return res.status(404).json({ success: false, message: "Faculty not found." });
    }

    const conditions: string[] = [
      "t.faculty_id = $1",
      "as2.is_active = TRUE",
      "as2.session_status = 'COMPLETED'",
    ];
    const params: unknown[] = [facultyId];

    applyDateRange(conditions, params, from, to, "as2.session_date");

    const rows = await query<{
      subject_name: string;
      classes_conducted: string;
      avg_attendance: string;
    }>(
      `SELECT
         sub.subject_name,
         COUNT(DISTINCT as2.attendance_session_id)::text AS classes_conducted,
         ROUND(
           AVG(
             CASE WHEN as2.total_students > 0
               THEN as2.present_students::DECIMAL / as2.total_students * 100
               ELSE 0
             END
           ), 1
         )::text AS avg_attendance
       FROM timetable t
       JOIN attendance_session as2 ON as2.timetable_id = t.timetable_id
       JOIN subject sub ON sub.subject_id = t.subject_id
       WHERE ${conditions.join(" AND ")}
       GROUP BY sub.subject_name
       ORDER BY sub.subject_name`,
      params
    );

    const classesConducted = rows.reduce((s, r) => s + Number(r.classes_conducted), 0);
    const avgAttendance =
      rows.length > 0
        ? Math.round(
            (rows.reduce((s, r) => s + Number(r.avg_attendance), 0) / rows.length) * 10
          ) / 10
        : 0;

    return res.json({
      success: true,
      faculty: `${faculty.first_name} ${faculty.last_name}`,
      classesConducted,
      averageAttendance: avgAttendance,
      subjects: rows.map((r) => ({
        subject: r.subject_name,
        classesConducted: Number(r.classes_conducted),
        averageAttendance: Number(r.avg_attendance),
      })),
    });
  } catch (err) {
    console.error("[reports/faculties]", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ===========================================================================
// 4. GET /api/v1/reports/subjects/:subjectId
//    Subject attendance report
// ===========================================================================
router.get("/subjects/:subjectId", async (req: Request, res: Response) => {
  const { subjectId } = req.params;
  const { from, to } = req.query as Record<string, string | undefined>;

  try {
    const [subject] = await query<{ subject_id: string; subject_name: string; subject_code: string }>(
      `SELECT subject_id, subject_name, subject_code
       FROM subject WHERE subject_id = $1 AND is_active = TRUE`,
      [subjectId]
    );
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found." });
    }

    const conditions: string[] = [
      "t.subject_id = $1",
      "a.is_active = TRUE",
      "as2.is_active = TRUE",
    ];
    const params: unknown[] = [subjectId];

    applyDateRange(conditions, params, from, to, "as2.session_date");

    const [totals] = await query<{ present: string; total: string; sessions: string }>(
      `SELECT
         COUNT(CASE WHEN a.attendance_status = 'PRESENT' THEN 1 END)::text AS present,
         COUNT(*)::text AS total,
         COUNT(DISTINCT as2.attendance_session_id)::text AS sessions
       FROM attendance a
       JOIN attendance_session as2 ON as2.attendance_session_id = a.attendance_session_id
       JOIN timetable t ON t.timetable_id = as2.timetable_id
       WHERE ${conditions.join(" AND ")}`,
      params
    );

    // Build a separate parameterized query for session rows — avoids SQL injection
    const sessionConditions: string[] = ["t.subject_id = $1", "as2.is_active = TRUE"];
    const sessionParams: unknown[] = [subjectId];
    applyDateRange(sessionConditions, sessionParams, from, to, "as2.session_date");

    const sessionRows = await query<{
      session_date: string;
      batch_code: string;
      present: string;
      total: string;
    }>(
      `SELECT
         as2.session_date::text,
         b.batch_code,
         as2.present_students::text AS present,
         as2.total_students::text AS total
       FROM attendance_session as2
       JOIN timetable t ON t.timetable_id = as2.timetable_id
       JOIN batch b ON b.batch_id = t.batch_id
       WHERE ${sessionConditions.join(" AND ")}
       ORDER BY as2.session_date DESC
       LIMIT 50`,
      sessionParams
    );

    return res.json({
      success: true,
      subject: subject.subject_name,
      subjectCode: subject.subject_code,
      totalSessions: Number(totals?.sessions ?? 0),
      overallAttendance: pct(Number(totals?.present ?? 0), Number(totals?.total ?? 0)),
      sessions: sessionRows.map((r) => ({
        date: r.session_date,
        batch: r.batch_code,
        present: Number(r.present),
        total: Number(r.total),
        percentage: pct(Number(r.present), Number(r.total)),
      })),
    });
  } catch (err) {
    console.error("[reports/subjects]", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ===========================================================================
// 5. GET /api/v1/reports/daily?date=YYYY-MM-DD
//    Day-level attendance roll-up
// ===========================================================================
router.get("/daily", async (req: Request, res: Response) => {
  const { date } = req.query as { date?: string };
  const targetDate = date ?? new Date().toISOString().slice(0, 10);

  try {
    const [day] = await query<{
      sessions: string;
      present: string;
      absent: string;
    }>(
      `SELECT
         COUNT(DISTINCT as2.attendance_session_id)::text AS sessions,
         SUM(as2.present_students)::text                 AS present,
         SUM(as2.absent_students)::text                  AS absent
       FROM attendance_session as2
       WHERE as2.session_date = $1 AND as2.is_active = TRUE`,
      [targetDate]
    );

    const present = Number(day?.present ?? 0);
    const absent = Number(day?.absent ?? 0);
    const total = present + absent;

    return res.json({
      success: true,
      date: targetDate,
      sessions: Number(day?.sessions ?? 0),
      present,
      absent,
      attendancePercentage: pct(present, total),
    });
  } catch (err) {
    console.error("[reports/daily]", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ===========================================================================
// 6. GET /api/v1/reports/monthly?month=7&year=2026
//    Month-level attendance roll-up
// ===========================================================================
router.get("/monthly", async (req: Request, res: Response) => {
  const { month, year } = req.query as { month?: string; year?: string };

  const now = new Date();
  const m = month ? Number(month) : now.getMonth() + 1;
  const y = year ? Number(year) : now.getFullYear();

  if (m < 1 || m > 12) {
    return res.status(400).json({ success: false, message: "Invalid month. Must be 1–12." });
  }

  try {
    // Working days from academic_calendar
    const [calRow] = await query<{ working_days: string }>(
      `SELECT COUNT(*)::text AS working_days
       FROM academic_calendar
       WHERE EXTRACT(MONTH FROM calendar_date) = $1
         AND EXTRACT(YEAR  FROM calendar_date) = $2
         AND is_working_day = TRUE
         AND is_active = TRUE`,
      [m, y]
    );

    const [attRow] = await query<{ present: string; total: string; sessions: string }>(
      `SELECT
         SUM(as2.present_students)::text AS present,
         SUM(as2.present_students + as2.absent_students)::text AS total,
         COUNT(DISTINCT as2.attendance_session_id)::text AS sessions
       FROM attendance_session as2
       WHERE EXTRACT(MONTH FROM as2.session_date) = $1
         AND EXTRACT(YEAR  FROM as2.session_date) = $2
         AND as2.is_active = TRUE`,
      [m, y]
    );

    const monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December",
    ];

    return res.json({
      success: true,
      month: monthNames[m - 1],
      year: y,
      workingDays: Number(calRow?.working_days ?? 0),
      totalSessions: Number(attRow?.sessions ?? 0),
      overallAttendance: pct(Number(attRow?.present ?? 0), Number(attRow?.total ?? 0)),
    });
  } catch (err) {
    console.error("[reports/monthly]", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ===========================================================================
// 7. GET /api/v1/reports/departments/:departmentId
//    Department attendance summary
// ===========================================================================
router.get("/departments/:departmentId", async (req: Request, res: Response) => {
  const { departmentId } = req.params;
  const { from, to } = req.query as Record<string, string | undefined>;

  try {
    const [dept] = await query<{ department_id: string; department_name: string }>(
      `SELECT department_id, department_name
       FROM department WHERE department_id = $1 AND is_active = TRUE`,
      [departmentId]
    );
    if (!dept) {
      return res.status(404).json({ success: false, message: "Department not found." });
    }

    const conditions: string[] = [
      "dep.department_id = $1",
      "a.is_active = TRUE",
      "as2.is_active = TRUE",
    ];
    const params: unknown[] = [departmentId];

    applyDateRange(conditions, params, from, to, "as2.session_date");

    const [totals] = await query<{ present: string; total: string }>(
      `SELECT
         COUNT(CASE WHEN a.attendance_status = 'PRESENT' THEN 1 END)::text AS present,
         COUNT(*)::text AS total
       FROM attendance a
       JOIN student s   ON s.student_id = a.student_id
       JOIN batch b     ON b.batch_id = s.batch_id
       JOIN department dep ON dep.department_id = b.department_id
       JOIN attendance_session as2 ON as2.attendance_session_id = a.attendance_session_id
       WHERE ${conditions.join(" AND ")}`,
      params
    );

    // Per-batch breakdown
    const batches = await query<{
      batch_code: string;
      present: string;
      total: string;
    }>(
      `SELECT
         b.batch_code,
         COUNT(CASE WHEN a.attendance_status = 'PRESENT' THEN 1 END)::text AS present,
         COUNT(*)::text AS total
       FROM attendance a
       JOIN student s ON s.student_id = a.student_id
       JOIN batch b   ON b.batch_id = s.batch_id
       JOIN department dep ON dep.department_id = b.department_id
       JOIN attendance_session as2 ON as2.attendance_session_id = a.attendance_session_id
       WHERE ${conditions.join(" AND ")}
       GROUP BY b.batch_code
       ORDER BY b.batch_code`,
      params
    );

    return res.json({
      success: true,
      department: dept.department_name,
      overallAttendance: pct(Number(totals?.present ?? 0), Number(totals?.total ?? 0)),
      batches: batches.map((r) => ({
        batch: r.batch_code,
        present: Number(r.present),
        total: Number(r.total),
        attendance: pct(Number(r.present), Number(r.total)),
      })),
    });
  } catch (err) {
    console.error("[reports/departments]", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ===========================================================================
// 8. GET /api/v1/reports/export?reportType=student&id=<uuid>&format=csv
//    CSV export — streams a downloadable file
// ===========================================================================
router.get("/export", async (req: Request, res: Response) => {
  const { reportType, id, format = "csv" } = req.query as Record<string, string | undefined>;

  if (format !== "csv") {
    return res.status(400).json({
      success: false,
      message: "Only 'csv' format is supported in this version.",
    });
  }

  try {
    let csvContent = "";
    let filename = "report.csv";

    switch (reportType) {
      // ── Student ───────────────────────────────────────────────────────────
      case "student": {
        if (!id) return res.status(400).json({ success: false, message: "id is required for student report." });

        const [student] = await query<{ first_name: string; last_name: string; batch_code: string }>(
          `SELECT s.first_name, s.last_name, b.batch_code
           FROM student s JOIN batch b ON b.batch_id = s.batch_id
           WHERE s.student_id = $1 AND s.is_active = TRUE`,
          [id]
        );
        if (!student) return res.status(404).json({ success: false, message: "Student not found." });

        const rows = await query<{
          subject_name: string;
          subject_code: string;
          present: string;
          total: string;
        }>(
          `SELECT sub.subject_name, sub.subject_code,
                  COUNT(CASE WHEN a.attendance_status = 'PRESENT' THEN 1 END)::text AS present,
                  COUNT(*)::text AS total
           FROM attendance a
           JOIN attendance_session as2 ON as2.attendance_session_id = a.attendance_session_id
           JOIN timetable t ON t.timetable_id = as2.timetable_id
           JOIN subject sub ON sub.subject_id = t.subject_id
           WHERE a.student_id = $1 AND a.is_active = TRUE
           GROUP BY sub.subject_name, sub.subject_code
           ORDER BY sub.subject_name`,
          [id]
        );

        filename = `student-report-${id}.csv`;
        csvContent = `Student,${student.first_name} ${student.last_name}\nBatch,${student.batch_code}\n\n`;
        csvContent += "Subject Code,Subject,Present,Total Classes,Attendance %\n";
        rows.forEach((r) => {
          const p = Number(r.present);
          const t = Number(r.total);
          csvContent += `"${r.subject_code}","${r.subject_name}",${p},${t},${pct(p, t)}\n`;
        });
        break;
      }

      // ── Batch ─────────────────────────────────────────────────────────────
      case "batch": {
        if (!id) return res.status(400).json({ success: false, message: "id is required for batch report." });

        const [batch] = await query<{ batch_code: string }>(
          `SELECT batch_code FROM batch WHERE batch_id = $1 AND is_active = TRUE`,
          [id]
        );
        if (!batch) return res.status(404).json({ success: false, message: "Batch not found." });

        const rows = await query<{
          roll_number: string;
          first_name: string;
          last_name: string;
          present: string;
          total: string;
        }>(
          `SELECT s.roll_number, s.first_name, s.last_name,
                  COUNT(CASE WHEN a.attendance_status = 'PRESENT' THEN 1 END)::text AS present,
                  COUNT(*)::text AS total
           FROM student s
           LEFT JOIN attendance a ON a.student_id = s.student_id AND a.is_active = TRUE
           LEFT JOIN attendance_session as2 ON as2.attendance_session_id = a.attendance_session_id AND as2.is_active = TRUE
           WHERE s.batch_id = $1 AND s.is_active = TRUE
           GROUP BY s.roll_number, s.first_name, s.last_name
           ORDER BY s.roll_number`,
          [id]
        );

        filename = `batch-report-${batch.batch_code}.csv`;
        csvContent = `Batch,${batch.batch_code}\n\n`;
        csvContent += "Roll Number,Student,Present,Total Classes,Attendance %\n";
        rows.forEach((r) => {
          const p = Number(r.present);
          const t = Number(r.total);
          csvContent += `"${r.roll_number}","${r.first_name} ${r.last_name}",${p},${t},${pct(p, t)}\n`;
        });
        break;
      }

      // ── Subject ───────────────────────────────────────────────────────────
      case "subject": {
        if (!id) return res.status(400).json({ success: false, message: "id is required for subject report." });

        const [subject] = await query<{ subject_name: string; subject_code: string }>(
          `SELECT subject_name, subject_code FROM subject WHERE subject_id = $1 AND is_active = TRUE`,
          [id]
        );
        if (!subject) return res.status(404).json({ success: false, message: "Subject not found." });

        const rows = await query<{
          session_date: string;
          batch_code: string;
          present: string;
          total: string;
        }>(
          `SELECT as2.session_date::text, b.batch_code,
                  as2.present_students::text AS present,
                  as2.total_students::text   AS total
           FROM attendance_session as2
           JOIN timetable t ON t.timetable_id = as2.timetable_id
           JOIN batch b ON b.batch_id = t.batch_id
           WHERE t.subject_id = $1 AND as2.is_active = TRUE
           ORDER BY as2.session_date DESC`,
          [id]
        );

        filename = `subject-report-${subject.subject_code}.csv`;
        csvContent = `Subject,${subject.subject_name} (${subject.subject_code})\n\n`;
        csvContent += "Date,Batch,Present,Total,Attendance %\n";
        rows.forEach((r) => {
          const p = Number(r.present);
          const t = Number(r.total);
          csvContent += `"${r.session_date}","${r.batch_code}",${p},${t},${pct(p, t)}\n`;
        });
        break;
      }

      // ── Daily ─────────────────────────────────────────────────────────────
      case "daily": {
        const targetDate = (req.query.date as string) ?? new Date().toISOString().slice(0, 10);

        const rows = await query<{
          batch_code: string;
          subject_name: string;
          present: string;
          total: string;
        }>(
          `SELECT b.batch_code, sub.subject_name,
                  as2.present_students::text AS present,
                  as2.total_students::text   AS total
           FROM attendance_session as2
           JOIN timetable t ON t.timetable_id = as2.timetable_id
           JOIN batch b     ON b.batch_id = t.batch_id
           JOIN subject sub ON sub.subject_id = t.subject_id
           WHERE as2.session_date = $1 AND as2.is_active = TRUE
           ORDER BY b.batch_code, sub.subject_name`,
          [targetDate]
        );

        filename = `daily-report-${targetDate}.csv`;
        csvContent = `Date,${targetDate}\n\n`;
        csvContent += "Batch,Subject,Present,Total,Attendance %\n";
        rows.forEach((r) => {
          const p = Number(r.present);
          const t = Number(r.total);
          csvContent += `"${r.batch_code}","${r.subject_name}",${p},${t},${pct(p, t)}\n`;
        });
        break;
      }

      // ── Monthly ───────────────────────────────────────────────────────────
      case "monthly": {
        const m = Number(req.query.month ?? new Date().getMonth() + 1);
        const y = Number(req.query.year ?? new Date().getFullYear());

        const rows = await query<{
          session_date: string;
          batch_code: string;
          subject_name: string;
          present: string;
          total: string;
        }>(
          `SELECT as2.session_date::text, b.batch_code, sub.subject_name,
                  as2.present_students::text AS present,
                  as2.total_students::text   AS total
           FROM attendance_session as2
           JOIN timetable t ON t.timetable_id = as2.timetable_id
           JOIN batch b     ON b.batch_id = t.batch_id
           JOIN subject sub ON sub.subject_id = t.subject_id
           WHERE EXTRACT(MONTH FROM as2.session_date) = $1
             AND EXTRACT(YEAR  FROM as2.session_date) = $2
             AND as2.is_active = TRUE
           ORDER BY as2.session_date, b.batch_code`,
          [m, y]
        );

        filename = `monthly-report-${y}-${String(m).padStart(2, "0")}.csv`;
        csvContent = `Month,${m}/${y}\n\n`;
        csvContent += "Date,Batch,Subject,Present,Total,Attendance %\n";
        rows.forEach((r) => {
          const p = Number(r.present);
          const t = Number(r.total);
          csvContent += `"${r.session_date}","${r.batch_code}","${r.subject_name}",${p},${t},${pct(p, t)}\n`;
        });
        break;
      }

      default:
        return res.status(400).json({
          success: false,
          message: `Unknown reportType '${reportType}'. Valid values: student, batch, subject, daily, monthly.`,
        });
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(csvContent);
  } catch (err) {
    console.error("[reports/export]", err);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

export default router;
