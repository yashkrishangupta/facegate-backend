'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '../../lib/config';
import { getToken, isLoggedIn } from '../../lib/auth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Tab = 'student' | 'batch' | 'subject' | 'room';
type ChipColor = 'green' | 'yellow' | 'red';

interface SubjectRow {
   subjectId: string;
   subjectCode: string;
   subject: string;
   present: number;
   total: number;
   percentage: number;
}

interface StudentRow {
   studentId: string;
   rollNumber: string;
   student: string;
   present: number;
   total: number;
   attendance: number;
}

interface SessionRow {
   date: string;
   batch: string;
   present: number;
   total: number;
   percentage: number;
}

type ReportData =
   | {
        kind: 'student';
        studentName: string;
        batch: string;
        overallAttendance: number;
        totalPresent: number;
        totalClasses: number;
        subjects: SubjectRow[];
     }
   | {
        kind: 'batch';
        batch: string;
        overallAttendance: number;
        totalStudents: number;
        students: StudentRow[];
     }
   | {
        kind: 'subject';
        subject: string;
        subjectCode: string;
        totalSessions: number;
        overallAttendance: number;
        sessions: SessionRow[];
     }
   | null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const API_BASE = API_URL;

function pctChipColor(pct: number): ChipColor {
   if (pct >= 75) return 'green';
   if (pct >= 60) return 'yellow';
   return 'red';
}

function PctChip({ value }: { value: number }) {
   const color = pctChipColor(value);
   const styles: Record<ChipColor, string> = {
      green: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      yellow: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      red: 'bg-red-500/15 text-red-400 border border-red-500/30',
   };
   return (
      <span
         className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${styles[color]}`}
      >
         {value.toFixed(1)}%
      </span>
   );
}

function Skeleton() {
   return (
      <div className='animate-pulse space-y-3'>
         {[...Array(5)].map((_, i) => (
            <div key={i} className='h-10 rounded-xl bg-[#1E2D42]' />
         ))}
      </div>
   );
}

function StatCard({
   label,
   value,
   color,
}: {
   label: string;
   value: string | number;
   color: string;
}) {
   return (
      <div className='bg-[#141E2E] border border-[#1E2D42] rounded-2xl p-5 flex flex-col gap-1'>
         <p className='text-[11px] font-bold tracking-widest uppercase text-[#5A7A9A]'>
            {label}
         </p>
         <p className='text-2xl font-bold' style={{ color }}>
            {value}
         </p>
      </div>
   );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function ReportsPage() {
   const router = useRouter();

   useEffect(() => {
      if (!isLoggedIn()) { router.push('/login'); }
   }, []);

   const [activeTab, setActiveTab] = useState<Tab>('student');

   // Filter inputs
   const [studentIdInput, setStudentIdInput] = useState('');
   const [batchIdInput, setBatchIdInput] = useState('');
   const [subjectIdInput, setSubjectIdInput] = useState('');
   const [dateFrom, setDateFrom] = useState('');
   const [dateTo, setDateTo] = useState('');
   const [semester, setSemester] = useState('');

   // State
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [data, setData] = useState<ReportData>(null);
   const [sortCol, setSortCol] = useState<string>('name');
   const [sortAsc, setSortAsc] = useState(true);

   // ── Fetch ─────────────────────────────────────────────────────────────────
   const buildParams = useCallback(() => {
      const p = new URLSearchParams();
      if (dateFrom) p.set('from', dateFrom);
      if (dateTo) p.set('to', dateTo);
      if (semester) p.set('semester', semester);
      return p.toString();
   }, [dateFrom, dateTo, semester]);

   const runReport = useCallback(async () => {
      setError(null);
      setData(null);
      setLoading(true);

      try {
         let url = '';
         switch (activeTab) {
            case 'student':
               if (!studentIdInput.trim()) {
                  setError('Enter a Student ID or Roll Number.');
                  setLoading(false);
                  return;
               }
               url = `${API_BASE}/reports/student/${studentIdInput.trim()}?${buildParams()}`;
               break;
            case 'batch':
               setError(
                  'Batch-level reports are not available yet — the backend only exposes a department-level report today. Ask your backend teammate to add GET /reports/batch/:batchId.',
               );
               setLoading(false);
               return;
            case 'subject':
               setError(
                  'Subject-level reports are not available yet — this endpoint has not been built on the backend. Ask your backend teammate to add GET /reports/subject/:subjectId.',
               );
               setLoading(false);
               return;
            case 'room':
               setError(
                  'Room reports are based on device assignment. Use the Devices page to view room-level sessions.',
               );
               setLoading(false);
               return;
         }

         const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
         const json = await res.json();
         if (!res.ok || !json.success) {
            setError(json.message ?? 'Failed to fetch report.');
            setLoading(false);
            return;
         }

      setData({ kind: 'student', ...json.data });
      } catch {
         setError('Network error — make sure the API server is running.');
      } finally {
         setLoading(false);
      }
   }, [activeTab, studentIdInput, batchIdInput, subjectIdInput, buildParams]);

   // ── CSV Export ────────────────────────────────────────────────────────────
   const handleExport = useCallback(async () => {
      let reportType = '';
      let entityId = '';
      switch (activeTab) {
         case 'student':
            reportType = 'student';
            entityId = studentIdInput.trim();
            break;
         case 'batch':
            reportType = 'batch';
            entityId = batchIdInput.trim();
            break;
         case 'subject':
            reportType = 'subject';
            entityId = subjectIdInput.trim();
            break;
         default:
            setError(
               'Select a report first (Student, Batch, or Subject) to export.',
            );
            return;
      }
      if (!entityId) {
         setError('Run a report first before exporting.');
         return;
      }

      const params = new URLSearchParams({
         reportType,
         format: 'csv',
         id: entityId,
      });
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);

      const url = `${API_BASE}/reports/export?${params}`;

      try {
         const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
         if (!res.ok) {
            setError('Export failed — server returned an error.');
            return;
         }
         const blob = await res.blob();
         const objectUrl = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = objectUrl;
         a.download = `facegate-${reportType}-report.csv`;
         a.click();
         URL.revokeObjectURL(objectUrl);
      } catch {
         setError('Export failed — network error.');
      }
   }, [
      activeTab,
      studentIdInput,
      batchIdInput,
      subjectIdInput,
      dateFrom,
      dateTo,
   ]);

   // ── Quick date helpers ────────────────────────────────────────────────────
   const applyQuick = (preset: 'week' | 'month' | 'semester') => {
      const now = new Date();
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      const to = fmt(now);
      let from = '';
      if (preset === 'week') {
         const d = new Date(now);
         d.setDate(d.getDate() - 7);
         from = fmt(d);
      } else if (preset === 'month') {
         const d = new Date(now);
         d.setMonth(d.getMonth() - 1);
         from = fmt(d);
      } else {
         const d = new Date(now);
         d.setMonth(d.getMonth() - 6);
         from = fmt(d);
      }
      setDateFrom(from);
      setDateTo(to);
   };

   // ── Sort helper ───────────────────────────────────────────────────────────
   const toggleSort = (col: string) => {
      if (sortCol === col) setSortAsc(!sortAsc);
      else {
         setSortCol(col);
         setSortAsc(true);
      }
   };

   const SortIcon = ({ col }: { col: string }) => (
      <span className='ml-1 text-[10px] opacity-50'>
         {sortCol === col ? (sortAsc ? '▲' : '▼') : '⇅'}
      </span>
   );

   // ── Summary stats ─────────────────────────────────────────────────────────
   const summaryStats = (() => {
      if (!data) return null;
      if (data.kind === 'student')
         return [
            {
               label: 'Overall Attendance',
               value: `${data.overallAttendance}%`,
               color: '#5DA9FF',
            },
            {
               label: 'Total Present',
               value: data.totalPresent,
               color: '#4ADE80',
            },
            {
               label: 'Total Classes',
               value: data.totalClasses,
               color: '#A78BFA',
            },
            {
               label: 'Subjects',
               value: data.subjects.length,
               color: '#F59E0B',
            },
         ];
      if (data.kind === 'batch')
         return [
            {
               label: 'Overall Attendance',
               value: `${data.overallAttendance}%`,
               color: '#5DA9FF',
            },
            {
               label: 'Total Students',
               value: data.totalStudents,
               color: '#4ADE80',
            },
         ];
      if (data.kind === 'subject')
         return [
            {
               label: 'Overall Attendance',
               value: `${data.overallAttendance}%`,
               color: '#5DA9FF',
            },
            {
               label: 'Total Sessions',
               value: data.totalSessions,
               color: '#4ADE80',
            },
         ];
      return null;
   })();

   // ── Table rows ────────────────────────────────────────────────────────────
   const tableContent = (() => {
      if (!data) return null;

      if (data.kind === 'student') {
         const sorted = [...data.subjects].sort((a, b) => {
            const dir = sortAsc ? 1 : -1;
            if (sortCol === 'subject')
               return dir * a.subject.localeCompare(b.subject);
            if (sortCol === 'present') return dir * (a.present - b.present);
            if (sortCol === 'total') return dir * (a.total - b.total);
            if (sortCol === 'pct') return dir * (a.percentage - b.percentage);
            return 0;
         });
         return (
            <table className='w-full text-sm'>
               <thead>
                  <tr className='border-b border-[#1E2D42]'>
                     {[
                        { key: 'subject', label: 'Subject' },
                        { key: 'present', label: 'Present' },
                        { key: 'total', label: 'Total' },
                        { key: 'pct', label: 'Attendance %' },
                     ].map((h) => (
                        <th
                           key={h.key}
                           onClick={() => toggleSort(h.key)}
                           className='text-left p-4 text-[#5A7A9A] font-bold text-xs tracking-wider cursor-pointer hover:text-white transition-colors select-none'
                        >
                           {h.label}
                           <SortIcon col={h.key} />
                        </th>
                     ))}
                  </tr>
               </thead>
               <tbody>
                  {sorted.map((r) => (
                     <tr
                        key={r.subjectId}
                        className='border-b border-[#1A2436] hover:bg-[#141E2E] transition-colors'
                     >
                        <td className='p-4 font-medium'>
                           <div>{r.subject}</div>
                           <div className='text-[11px] text-[#5A7A9A]'>
                              {r.subjectCode}
                           </div>
                        </td>
                        <td className='p-4 text-[#90A6BD]'>{r.present}</td>
                        <td className='p-4 text-[#90A6BD]'>{r.total}</td>
                        <td className='p-4'>
                           <PctChip value={r.percentage} />
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         );
      }

      if (data.kind === 'batch') {
         const sorted = [...data.students].sort((a, b) => {
            const dir = sortAsc ? 1 : -1;
            if (sortCol === 'roll')
               return dir * a.rollNumber.localeCompare(b.rollNumber);
            if (sortCol === 'student')
               return dir * a.student.localeCompare(b.student);
            if (sortCol === 'present') return dir * (a.present - b.present);
            if (sortCol === 'pct') return dir * (a.attendance - b.attendance);
            return 0;
         });
         return (
            <table className='w-full text-sm'>
               <thead>
                  <tr className='border-b border-[#1E2D42]'>
                     {[
                        { key: 'roll', label: 'Roll No' },
                        { key: 'student', label: 'Student' },
                        { key: 'present', label: 'Present' },
                        { key: 'pct', label: 'Attendance %' },
                     ].map((h) => (
                        <th
                           key={h.key}
                           onClick={() => toggleSort(h.key)}
                           className='text-left p-4 text-[#5A7A9A] font-bold text-xs tracking-wider cursor-pointer hover:text-white transition-colors select-none'
                        >
                           {h.label}
                           <SortIcon col={h.key} />
                        </th>
                     ))}
                  </tr>
               </thead>
               <tbody>
                  {sorted.map((r) => (
                     <tr
                        key={r.studentId}
                        className='border-b border-[#1A2436] hover:bg-[#141E2E] transition-colors'
                     >
                        <td className='p-4 font-mono text-[#5DA9FF] text-xs'>
                           {r.rollNumber}
                        </td>
                        <td className='p-4 font-medium'>{r.student}</td>
                        <td className='p-4 text-[#90A6BD]'>
                           {r.present} / {r.total}
                        </td>
                        <td className='p-4'>
                           <PctChip value={r.attendance} />
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         );
      }

      if (data.kind === 'subject') {
         const sorted = [...data.sessions].sort((a, b) => {
            const dir = sortAsc ? 1 : -1;
            if (sortCol === 'date') return dir * a.date.localeCompare(b.date);
            if (sortCol === 'batch')
               return dir * a.batch.localeCompare(b.batch);
            if (sortCol === 'pct') return dir * (a.percentage - b.percentage);
            return 0;
         });
         return (
            <table className='w-full text-sm'>
               <thead>
                  <tr className='border-b border-[#1E2D42]'>
                     {[
                        { key: 'date', label: 'Date' },
                        { key: 'batch', label: 'Batch' },
                        { key: 'present', label: 'Present / Total' },
                        { key: 'pct', label: 'Attendance %' },
                     ].map((h) => (
                        <th
                           key={h.key}
                           onClick={() => toggleSort(h.key)}
                           className='text-left p-4 text-[#5A7A9A] font-bold text-xs tracking-wider cursor-pointer hover:text-white transition-colors select-none'
                        >
                           {h.label}
                           <SortIcon col={h.key} />
                        </th>
                     ))}
                  </tr>
               </thead>
               <tbody>
                  {sorted.map((r, i) => (
                     <tr
                        key={i}
                        className='border-b border-[#1A2436] hover:bg-[#141E2E] transition-colors'
                     >
                        <td className='p-4 font-mono text-xs text-[#90A6BD]'>
                           {r.date}
                        </td>
                        <td className='p-4 font-medium'>{r.batch}</td>
                        <td className='p-4 text-[#90A6BD]'>
                           {r.present} / {r.total}
                        </td>
                        <td className='p-4'>
                           <PctChip value={r.percentage} />
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         );
      }

      return null;
   })();

   // ── Legend items ──────────────────────────────────────────────────────────
   const legend = [
      { color: 'bg-emerald-400', label: '≥ 75% — Good' },
      { color: 'bg-amber-400', label: '60–74% — At Risk' },
      { color: 'bg-red-400', label: '< 60% — Low' },
   ];

   // ── Tabs config ───────────────────────────────────────────────────────────
   const tabs: { id: Tab; label: string; icon: string }[] = [
      { id: 'student', label: 'By Student', icon: '👤' },
      { id: 'batch', label: 'By Batch', icon: '🏷️' },
      { id: 'subject', label: 'By Subject', icon: '📚' },
      { id: 'room', label: 'By Room', icon: '🚪' },
   ];

   return (
      <main className='min-h-screen bg-[#0A1120] text-white'>
         {/* ── Top bar ──────────────────────────────────────────────────────── */}
         <div className='border-b border-[#1A2436] bg-[#0D1727] sticky top-0 z-10'>
            <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
               <div className='flex items-center gap-4'>
                  <a
                     href='/'
                     className='text-[#5DA9FF] text-sm font-bold hover:text-white transition-colors flex items-center gap-1'
                  >
                     ← Back
                  </a>
                  <div className='w-px h-5 bg-[#1E2D42]' />
                  <div>
                     <h1 className='text-lg font-bold leading-none'>
                        Attendance Reports
                     </h1>
                     <p className='text-[#5A7A9A] text-xs mt-0.5'>
                        Filter · Analyse · Export
                     </p>
                  </div>
               </div>

               {/* Export button */}
               <button
                  id='btn-export-csv'
                  onClick={handleExport}
                  disabled={!data}
                  className='flex items-center gap-2 bg-[#1A2436] border border-[#2F4E73] hover:border-[#5DA9FF] disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold px-4 py-2 rounded-xl transition-all'
               >
                  <span>⬇</span> Export CSV
               </button>
            </div>
         </div>

         <div className='max-w-7xl mx-auto px-6 py-8 space-y-6'>
            {/* ── Tabs ─────────────────────────────────────────────────────────── */}
            <div className='flex gap-2'>
               {tabs.map((t) => (
                  <button
                     key={t.id}
                     id={`tab-${t.id}`}
                     onClick={() => {
                        setActiveTab(t.id);
                        setData(null);
                        setError(null);
                     }}
                     className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                        activeTab === t.id
                           ? 'bg-[#5DA9FF]/10 border-[#5DA9FF] text-[#5DA9FF]'
                           : 'bg-[#0D1727] border-[#1E2D42] text-[#5A7A9A] hover:border-[#2F4E73] hover:text-white'
                     }`}
                  >
                     <span>{t.icon}</span>
                     <span className='hidden sm:inline'>{t.label}</span>
                  </button>
               ))}
            </div>

            {/* ── Filter panel ─────────────────────────────────────────────────── */}
            <div className='bg-[#0D1727] border border-[#1E2D42] rounded-2xl p-5 space-y-4'>
               <p className='text-xs font-bold tracking-widest uppercase text-[#5A7A9A]'>
                  Filters
               </p>

               {/* Entity ID input */}
               <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {activeTab === 'student' && (
                     <div className='flex flex-col gap-1.5'>
                        <label className='text-xs text-[#5A7A9A] font-medium'>
                           Student ID
                        </label>
                        <input
                           id='input-student-id'
                           type='text'
                           value={studentIdInput}
                           onChange={(e) => setStudentIdInput(e.target.value)}
                           placeholder='e.g. 9bc18df2-84fd-...'
                           className='bg-[#141E2E] border border-[#1E2D42] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#3A5A7A] focus:outline-none focus:border-[#5DA9FF] transition-colors'
                        />
                     </div>
                  )}
                  {activeTab === 'batch' && (
                     <div className='flex flex-col gap-1.5'>
                        <label className='text-xs text-[#5A7A9A] font-medium'>
                           Batch ID
                        </label>
                        <input
                           id='input-batch-id'
                           type='text'
                           value={batchIdInput}
                           onChange={(e) => setBatchIdInput(e.target.value)}
                           placeholder='e.g. b2a7d8d3-8f3a-...'
                           className='bg-[#141E2E] border border-[#1E2D42] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#3A5A7A] focus:outline-none focus:border-[#5DA9FF] transition-colors'
                        />
                     </div>
                  )}
                  {activeTab === 'subject' && (
                     <div className='flex flex-col gap-1.5'>
                        <label className='text-xs text-[#5A7A9A] font-medium'>
                           Subject ID
                        </label>
                        <input
                           id='input-subject-id'
                           type='text'
                           value={subjectIdInput}
                           onChange={(e) => setSubjectIdInput(e.target.value)}
                           placeholder='e.g. a1d3c5b8-9f7d-...'
                           className='bg-[#141E2E] border border-[#1E2D42] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#3A5A7A] focus:outline-none focus:border-[#5DA9FF] transition-colors'
                        />
                     </div>
                  )}
                  {activeTab === 'student' && (
                     <div className='flex flex-col gap-1.5'>
                        <label className='text-xs text-[#5A7A9A] font-medium'>
                           Semester
                        </label>
                        <select
                           id='select-semester'
                           value={semester}
                           onChange={(e) => setSemester(e.target.value)}
                           className='bg-[#141E2E] border border-[#1E2D42] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#5DA9FF] transition-colors appearance-none'
                        >
                           <option value=''>All Semesters</option>
                           {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                              <option key={s} value={s}>
                                 Semester {s}
                              </option>
                           ))}
                        </select>
                     </div>
                  )}
               </div>

               {/* Date range */}
               {activeTab !== 'room' && (
                  <div className='flex flex-wrap items-end gap-4'>
                     <div className='flex flex-col gap-1.5'>
                        <label className='text-xs text-[#5A7A9A] font-medium'>
                           From
                        </label>
                        <input
                           id='input-date-from'
                           type='date'
                           value={dateFrom}
                           onChange={(e) => setDateFrom(e.target.value)}
                           className='bg-[#141E2E] border border-[#1E2D42] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#5DA9FF] transition-colors'
                        />
                     </div>
                     <div className='flex flex-col gap-1.5'>
                        <label className='text-xs text-[#5A7A9A] font-medium'>
                           To
                        </label>
                        <input
                           id='input-date-to'
                           type='date'
                           value={dateTo}
                           onChange={(e) => setDateTo(e.target.value)}
                           className='bg-[#141E2E] border border-[#1E2D42] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#5DA9FF] transition-colors'
                        />
                     </div>

                     {/* Quick presets */}
                     <div className='flex gap-2'>
                        {(['week', 'month', 'semester'] as const).map((p) => (
                           <button
                              key={p}
                              id={`btn-quick-${p}`}
                              onClick={() => applyQuick(p)}
                              className='text-xs font-bold px-3 py-2 rounded-lg bg-[#141E2E] border border-[#1E2D42] text-[#5A7A9A] hover:border-[#5DA9FF] hover:text-white transition-all capitalize'
                           >
                              {p === 'semester'
                                 ? 'This Semester'
                                 : `This ${p.charAt(0).toUpperCase() + p.slice(1)}`}
                           </button>
                        ))}
                        {(dateFrom || dateTo) && (
                           <button
                              id='btn-clear-dates'
                              onClick={() => {
                                 setDateFrom('');
                                 setDateTo('');
                              }}
                              className='text-xs font-bold px-3 py-2 rounded-lg bg-[#141E2E] border border-[#2F1A1A] text-red-400 hover:border-red-500 transition-all'
                           >
                              Clear
                           </button>
                        )}
                     </div>
                  </div>
               )}

               {/* Run button */}
               {activeTab !== 'room' && (
                  <button
                     id='btn-run-report'
                     onClick={runReport}
                     disabled={loading}
                     className='w-full sm:w-auto flex items-center justify-center gap-2 bg-[#5DA9FF] hover:bg-[#4A96F0] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-8 py-2.5 rounded-xl transition-all text-sm'
                  >
                     {loading ? (
                        <>
                           <span className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block' />
                           Running…
                        </>
                     ) : (
                        'Run Report'
                     )}
                  </button>
               )}
            </div>

            {/* ── Room tab notice ───────────────────────────────────────────────── */}
            {activeTab === 'room' && (
               <div className='bg-[#0D1727] border border-[#1E2D42] rounded-2xl p-8 text-center'>
                  <p className='text-3xl mb-3'>🚪</p>
                  <p className='font-bold text-white mb-1'>Room Reports</p>
                  <p className='text-[#5A7A9A] text-sm max-w-md mx-auto'>
                     Room-level attendance is tied to device assignment. Each
                     device is paired to one room and syncs its own schedule. To
                     view per-room attendance, go to the{' '}
                     <a
                        href='/devices'
                        className='text-[#5DA9FF] hover:underline font-bold'
                     >
                        Devices page
                     </a>{' '}
                     and click a device to see its session history.
                  </p>
               </div>
            )}

            {/* ── Error ────────────────────────────────────────────────────────── */}
            {error && (
               <div className='bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-3 text-red-400 text-sm flex items-center gap-3'>
                  <span>⚠</span>
                  <span>{error}</span>
               </div>
            )}

            {/* ── Skeleton ─────────────────────────────────────────────────────── */}
            {loading && <Skeleton />}

            {/* ── Summary stats ────────────────────────────────────────────────── */}
            {data && summaryStats && (
               <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  {summaryStats.map((s) => (
                     <StatCard key={s.label} {...s} />
                  ))}
               </div>
            )}

            {/* ── Report header ────────────────────────────────────────────────── */}
            {data && (
               <div className='flex items-start justify-between'>
                  <div>
                     {data.kind === 'student' && (
                        <>
                           <p className='font-bold text-lg'>
                              {data.studentName}
                           </p>
                           <p className='text-[#5A7A9A] text-sm'>
                              Batch: {data.batch}
                           </p>
                        </>
                     )}
                     {data.kind === 'batch' && (
                        <>
                           <p className='font-bold text-lg'>{data.batch}</p>
                           <p className='text-[#5A7A9A] text-sm'>
                              {data.totalStudents} students
                           </p>
                        </>
                     )}
                     {data.kind === 'subject' && (
                        <>
                           <p className='font-bold text-lg'>{data.subject}</p>
                           <p className='text-[#5A7A9A] text-sm font-mono text-xs'>
                              {data.subjectCode}
                           </p>
                        </>
                     )}
                  </div>

                  {/* Legend */}
                  <div className='flex gap-3'>
                     {legend.map((l) => (
                        <div
                           key={l.label}
                           className='flex items-center gap-1.5 text-xs text-[#5A7A9A]'
                        >
                           <span
                              className={`w-2 h-2 rounded-full ${l.color}`}
                           />
                           {l.label}
                        </div>
                     ))}
                  </div>
               </div>
            )}

            {/* ── Data table ───────────────────────────────────────────────────── */}
            {data && (
               <div className='bg-[#0D1727] border border-[#1E2D42] rounded-2xl overflow-hidden'>
                  <div className='overflow-x-auto'>{tableContent}</div>
               </div>
            )}

            {/* ── Empty prompt ─────────────────────────────────────────────────── */}
            {!data && !loading && !error && activeTab !== 'room' && (
               <div className='bg-[#0D1727] border border-[#1E2D42] rounded-2xl p-16 text-center'>
                  <p className='text-5xl mb-4'>📊</p>
                  <p className='font-bold text-white text-lg mb-1'>
                     No report loaded
                  </p>
                  <p className='text-[#5A7A9A] text-sm'>
                     Fill in the filters above and click{' '}
                     <span className='text-white font-bold'>Run Report</span>.
                  </p>
               </div>
            )}
         </div>
      </main>
   );
}
