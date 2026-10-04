import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Award,
  RefreshCw,
  Download,
  Search,
  RotateCcw,
  Sliders,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  FileText,
  UserPlus,
  Trash2,
  Lock,
  LogOut,
  ChevronRight,
  Check,
  Terminal,
  Activity,
  UserCheck,
  UserX,
  UploadCloud,
  FileSpreadsheet,
  BookOpen,
  HelpCircle,
  Sparkles,
  Mail,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { labAudio } from '../utils/audio';

export default function InstructorAdminPortal({ onExitToStudentPortal }) {
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [authStep, setAuthStep] = useState('request'); // 'request' | 'verify'
  const [universityEmail, setUniversityEmail] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [authInstructorInfo, setAuthInstructorInfo] = useState(null);
  const [universityDomain, setUniversityDomain] = useState('uettaxila.edu.pk');

  // Portal State
  const [activeTab, setActiveTab] = useState('scoreboard'); // 'scoreboard' | 'attendance' | 'security' | 'questions' | 'settings'
  const [scoreboardData, setScoreboardData] = useState(null);
  const [loadingScoreboard, setLoadingScoreboard] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [newSubmissionToast, setNewSubmissionToast] = useState(null);

  // Attendance State
  const [attendanceRoster, setAttendanceRoster] = useState([]);
  const [pasteAttendanceText, setPasteAttendanceText] = useState('');
  const [attendanceMsg, setAttendanceMsg] = useState(null);
  const [processingAttendance, setProcessingAttendance] = useState(false);

  // Settings State
  const [settingsForm, setSettingsForm] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Questions State
  const [questionsList, setQuestionsList] = useState([]);

  const previousSubmissionsCount = useRef(0);
  const pollIntervalRef = useRef(null);

  // Authenticated API request helper passing Bearer token and credentials
  const adminFetch = async (endpoint, options = {}) => {
    const token = sessionStorage.getItem('java_quiz_admin_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const res = await fetch(endpoint, {
      ...options,
      credentials: 'include',
      headers
    });

    if (res.status === 401) {
      sessionStorage.removeItem('java_quiz_admin_token');
      setIsAdminAuth(false);
      setAuthInstructorInfo(null);
      setAuthError('Instructor session has expired or is unauthorized. Please sign in.');
    }
    return res;
  };

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Initial load: verify session and fetch domain info
  useEffect(() => {
    fetch('/api/admin/faculty-info')
      .then(res => res.json())
      .then(data => {
        if (data.domain) setUniversityDomain(data.domain);
      })
      .catch(console.error);

    const token = sessionStorage.getItem('java_quiz_admin_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    fetch('/api/admin/verify-session', { credentials: 'include', headers })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.instructor) {
            setAuthInstructorInfo(data.instructor);
            setIsAdminAuth(true);
          }
        } else {
          sessionStorage.removeItem('java_quiz_admin_token');
          setIsAdminAuth(false);
        }
      })
      .catch(() => {
        setIsAdminAuth(false);
      });
  }, []);

  useEffect(() => {
    if (!isAdminAuth) return;

    fetchScoreboard();
    fetchAttendance();

    pollIntervalRef.current = setInterval(() => {
      fetchScoreboard(true);
    }, 4000);

    return () => clearInterval(pollIntervalRef.current);
  }, [isAdminAuth]);

  useEffect(() => {
    if (!isAdminAuth) return;

    if (activeTab === 'settings') {
      fetchSettings();
    } else if (activeTab === 'questions') {
      fetchQuestions();
    } else if (activeTab === 'attendance') {
      fetchAttendance();
    }
  }, [activeTab, isAdminAuth]);

  // Step 1: Request Temporary Password
  const handleRequestPassword = async (e) => {
    e?.preventDefault();
    if (!universityEmail.trim()) {
      setAuthError('Please enter your university email address.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccessMsg(null);
    labAudio.playTick();

    try {
      const res = await fetch('/api/admin/request-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: universityEmail.trim().toLowerCase()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.message || data.error || 'Access denied. This email is not authorized.');
        labAudio.playWarning();
        setAuthLoading(false);
        return;
      }

      setAuthSuccessMsg(data.message || `Temporary password sent to ${universityEmail}.`);
      setAuthStep('verify');
      setResendCooldown(data.cooldownSeconds || 60);
      setTemporaryPassword('');
      labAudio.playSuccess();
    } catch (err) {
      setAuthError('Connection error contacting institutional auth service.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Step 2: Verify Temporary Password & Enter
  const handleVerifyPasswordLogin = async (e) => {
    e?.preventDefault();
    if (!temporaryPassword.trim()) {
      setAuthError('Please enter the temporary password sent to your university email.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    labAudio.playTick();

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: universityEmail.trim().toLowerCase(),
          temporaryPassword: temporaryPassword.trim().toUpperCase()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.message || data.error || 'Authentication rejected.');
        labAudio.playWarning();
        setAuthLoading(false);
        return;
      }

      if (data.token) {
        sessionStorage.setItem('java_quiz_admin_token', data.token);
      }
      setAuthInstructorInfo(data.instructor);
      setIsAdminAuth(true);
      setAuthSuccessMsg(null);
      labAudio.playSuccess();
    } catch (err) {
      setAuthError('Network error during credential verification.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    labAudio.playTick();
    try {
      const token = sessionStorage.getItem('java_quiz_admin_token');
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
    } catch (e) {
      console.error(e);
    }
    sessionStorage.removeItem('java_quiz_admin_token');
    setIsAdminAuth(false);
    setAuthInstructorInfo(null);
    setAuthStep('request');
    setTemporaryPassword('');
    setAuthError(null);
    setAuthSuccessMsg(null);
  };

  const fetchScoreboard = async (isBackground = false) => {
    if (!isBackground) setLoadingScoreboard(true);
    try {
      const res = await adminFetch('/api/admin/scoreboard');
      if (res.ok) {
        const data = await res.json();

        if (
          previousSubmissionsCount.current > 0 &&
          data.metrics.completed > previousSubmissionsCount.current
        ) {
          labAudio.playSuccess();
          const latestCompleted = data.scoreboard.find((s) => s.status === 'SUBMITTED');
          if (latestCompleted) {
            setNewSubmissionToast(latestCompleted);
            setTimeout(() => setNewSubmissionToast(null), 5000);
          }
        }
        previousSubmissionsCount.current = data.metrics.completed;

        setScoreboardData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!isBackground) setLoadingScoreboard(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await adminFetch('/api/admin/attendance');
      if (res.ok) {
        const data = await res.json();
        setAttendanceRoster(data.attendance || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePasteAttendanceSubmit = async (e) => {
    e.preventDefault();
    if (!pasteAttendanceText.trim()) return;

    setProcessingAttendance(true);
    labAudio.playTick();

    try {
      const res = await adminFetch('/api/admin/attendance', {
        method: 'POST',
        body: JSON.stringify({ pasteText: pasteAttendanceText })
      });
      const data = await res.json();
      if (res.ok) {
        setAttendanceMsg(data.message || 'Attendance list updated.');
        setPasteAttendanceText('');
        fetchAttendance();
        fetchScoreboard();
        labAudio.playSuccess();
        setTimeout(() => setAttendanceMsg(null), 4000);
      }
    } catch (e) {
      alert('Error updating attendance roster');
    } finally {
      setProcessingAttendance(false);
    }
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      setProcessingAttendance(true);
      try {
        const res = await adminFetch('/api/admin/attendance', {
          method: 'POST',
          body: JSON.stringify({ pasteText: text })
        });
        const data = await res.json();
        if (res.ok) {
          setAttendanceMsg(`CSV imported: ${data.message}`);
          fetchAttendance();
          fetchScoreboard();
          labAudio.playSuccess();
          setTimeout(() => setAttendanceMsg(null), 4000);
        }
      } catch (err) {
        alert('Failed to parse CSV file');
      } finally {
        setProcessingAttendance(false);
      }
    };
    reader.readAsText(file);
  };

  const handleToggleAttendance = async (rollNumber) => {
    labAudio.playTick();
    try {
      const res = await adminFetch('/api/admin/attendance', {
        method: 'PUT',
        body: JSON.stringify({ rollNumber })
      });
      if (res.ok) {
        fetchAttendance();
        fetchScoreboard(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await adminFetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettingsForm(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    labAudio.playTick();

    try {
      const res = await adminFetch('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(settingsForm)
      });
      if (res.ok) {
        setSettingsSuccess(true);
        labAudio.playSuccess();
        setTimeout(() => setSettingsSuccess(false), 3000);
      }
    } catch (e) {
      alert('Error updating settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/quiz/topics');
      if (res.ok) {
        const data = await res.json();
        setQuestionsList(data.topics || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetAttempt = async (rollNumber) => {
    if (
      !confirm(
        `Reset assessment attempt for ${rollNumber}? This will clear answers and allow a fresh attempt.`
      )
    ) {
      return;
    }

    try {
      const res = await adminFetch('/api/admin/reset-attempt', {
        method: 'POST',
        body: JSON.stringify({ rollNumber })
      });
      if (res.ok) {
        labAudio.playTick();
        fetchScoreboard();
        if (selectedStudentDetail) {
          setSelectedStudentDetail(null);
        }
      }
    } catch (e) {
      alert('Failed to reset attempt');
    }
  };

  const openStudentDetail = async (rollNumber) => {
    setLoadingDetail(true);
    labAudio.playTick();
    try {
      const res = await adminFetch(`/api/admin/student-detail?rollNumber=${encodeURIComponent(rollNumber)}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedStudentDetail(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleExportCSV = async () => {
    labAudio.playTick();
    try {
      const res = await adminFetch('/api/admin/export');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "java_oop_quiz_attendance_results.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // If Not Authenticated, show Two-Step Faculty Verification & Temporary Password Login Screen
  if (!isAdminAuth) {
    return (
      <div className="min-h-screen bg-background text-slate-100 flex flex-col justify-center items-center p-6 relative">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-electric-cyan/10 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="w-full max-w-lg bg-surface-900 border border-white/10 rounded-3xl p-8 md:p-10 glass-panel shadow-2xl relative z-10 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-surface-800 border border-electric-cyan/30 text-electric-cyan flex items-center justify-center font-mono font-bold shadow-glow-blue">
              {authStep === 'request' ? <ShieldCheck className="w-7 h-7" /> : <KeyRound className="w-7 h-7" />}
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-cyan/10 border border-electric-cyan/20 text-[10px] font-mono text-electric-cyan uppercase tracking-wider">
              <span>{authStep === 'request' ? 'STEP 1: FACULTY IDENTITY VERIFICATION' : 'STEP 2: SECURITY ACCESS CODE'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase font-mono">
              INSTRUCTOR CONTROL
            </h1>
            <p className="text-xs text-slate-400 font-light">
              {authStep === 'request'
                ? 'Official Examination Portal • Pre-authorized University Faculty Only'
                : 'Enter single-use temporary password dispatched to your institutional inbox'}
            </p>
          </div>

          {/* Institutional Domain Badge */}
          <div className="px-4 py-2.5 rounded-xl bg-surface-950/80 border border-white/5 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">AUTHORIZED DOMAIN:</span>
            <span className="text-electric-cyan font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              @{universityDomain}
            </span>
          </div>

          {/* Feedback Alerts */}
          {authError && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-xs text-red-300 font-mono flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs text-emerald-300 font-mono flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{authSuccessMsg}</span>
            </div>
          )}

          {/* STEP 1: REQUEST PASSWORD FORM */}
          {authStep === 'request' && (
            <form onSubmit={handleRequestPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-400 flex items-center justify-between">
                  <span>University Email Address</span>
                  <span className="text-[10px] text-slate-500">@{universityDomain}</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={universityEmail}
                    onChange={(e) => setUniversityEmail(e.target.value)}
                    placeholder={`name@${universityDomain}`}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-surface-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-electric-cyan transition-all"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 rounded-xl bg-electric-cyan hover:bg-cyan-400 text-black font-bold font-mono text-xs uppercase tracking-wider transition-all shadow-glow-blue disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>VERIFYING FACULTY IDENTITY...</span>
                  </>
                ) : (
                  <>
                    <span>SEND LOGIN PASSWORD</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: VERIFY TEMPORARY PASSWORD */}
          {authStep === 'verify' && (
            <form onSubmit={handleVerifyPasswordLogin} className="space-y-4">
              <div className="p-3 rounded-xl bg-surface-950 border border-white/5 flex items-center justify-between text-xs font-mono">
                <div className="truncate">
                  <span className="text-slate-500 block text-[10px] uppercase">Destination Inbox</span>
                  <span className="text-white font-bold">{universityEmail}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthStep('request');
                    setAuthError(null);
                  }}
                  className="text-[11px] text-electric-cyan hover:underline ml-2"
                >
                  Change
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-400 flex items-center justify-between">
                  <span>Temporary Password</span>
                  <span className="text-[10px] text-amber-400">EXPIRES IN 10 MIN</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={temporaryPassword}
                    onChange={(e) => setTemporaryPassword(e.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX"
                    maxLength={9}
                    autoFocus
                    required
                    className="w-full px-4 py-3.5 rounded-xl bg-surface-950 border border-electric-cyan/40 text-electric-cyan font-mono text-center text-lg font-bold tracking-widest focus:outline-none focus:border-electric-cyan transition-all"
                  />
                  <KeyRound className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[10px] font-mono text-slate-400 text-center">
                  Format: 8-character single-use code (e.g. <code>A7K9-M3P2</code>).
                </p>
              </div>

              {/* Lab Mode Helper Notice */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono text-amber-300/90 leading-relaxed">
                <strong>Audit Note:</strong> In local environment, temporary passwords are dispatched to{' '}
                <code className="text-white bg-black/40 px-1 py-0.5 rounded">data/email-outbox.log</code> and the server terminal.
              </div>

              <button
                type="submit"
                disabled={authLoading || !temporaryPassword.trim()}
                className="w-full py-3.5 rounded-xl bg-electric-cyan hover:bg-cyan-400 text-black font-bold font-mono text-xs uppercase tracking-wider transition-all shadow-glow-blue disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>VALIDATING PASSWORD...</span>
                  </>
                ) : (
                  <>
                    <span>ACCESS CONTROL DASHBOARD</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleRequestPassword}
                  disabled={resendCooldown > 0 || authLoading}
                  className="text-xs font-mono text-electric-cyan hover:underline disabled:text-slate-600 disabled:no-underline transition-colors"
                >
                  {resendCooldown > 0
                    ? `Resend available in ${resendCooldown}s`
                    : 'Resend Temporary Password'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthStep('request');
                    setAuthError(null);
                  }}
                  className="text-xs font-mono text-slate-400 hover:text-white transition-colors"
                >
                  ← Back to Step 1
                </button>
              </div>
            </form>
          )}

          <div className="pt-2 text-center border-t border-white/5">
            <button
              type="button"
              onClick={onExitToStudentPortal}
              className="text-xs font-mono text-slate-400 hover:text-white transition-colors"
            >
              ← RETURN TO STUDENT PORTAL
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter Scoreboard Rows
  const filteredScoreboard = (scoreboardData?.scoreboard || []).filter((row) => {
    const matchesSearch =
      row.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter === 'COMPLETED')
      return row.status === 'SUBMITTED' || row.status === 'TIME_EXPIRED';
    if (statusFilter === 'IN_PROGRESS') return row.status === 'IN_PROGRESS';
    if (statusFilter === 'TERMINATED') return row.status === 'TERMINATED';
    if (statusFilter === 'PRESENT') return row.isPresent;
    if (statusFilter === 'ABSENT') return !row.isPresent;

    return true;
  });

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col selection:bg-electric-cyan/20 selection:text-electric-cyan">
      {/* Toast Notification for New Submission */}
      {newSubmissionToast && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-surface-900 border border-electric-cyan shadow-glow-blue flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono text-electric-cyan uppercase">NEW SUBMISSION</div>
            <div className="text-xs font-bold text-white">
              {newSubmissionToast.rollNumber} • {newSubmissionToast.name}
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Score: {newSubmissionToast.score}/{newSubmissionToast.maxScore} (
              {newSubmissionToast.percentage}%) • Topics: {newSubmissionToast.topicsCount}
            </div>
          </div>
        </div>
      )}

      {/* TOP INSTRUCTOR BAR */}
      <header className="border-b border-white/10 bg-surface-950/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-surface-900 border border-white/10 flex items-center justify-center text-electric-cyan font-bold font-mono">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-sm md:text-base font-bold text-white tracking-tight font-mono">
                JAVA OOP // INSTRUCTOR CONTROL
              </h1>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>ATTENDANCE & QUIZ ACTIVE</span>
              </div>
            </div>
            <div className="text-xs text-slate-400 font-light flex items-center gap-2 flex-wrap">
              <span>{authInstructorInfo?.role || 'Lead Examiner'}:</span>
              <strong className="text-slate-200">{authInstructorInfo?.name || 'Dr. Naveed Khan'}</strong>
              {authInstructorInfo?.email && (
                <span className="px-2 py-0.5 rounded bg-surface-900 border border-white/10 text-[11px] font-mono text-electric-cyan">
                  {authInstructorInfo.email}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchScoreboard(false)}
            title="Manual Sync"
            className="p-2.5 rounded-xl border border-white/10 bg-surface-900 hover:bg-surface-800 text-slate-300 transition-all"
          >
            <RefreshCw
              className={`w-4 h-4 ${loadingScoreboard ? 'animate-spin text-electric-cyan' : ''}`}
            />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-mono text-xs flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-electric-cyan" />
            <span className="hidden sm:inline">EXPORT RESULTS CSV</span>
          </button>

          <button
            onClick={onExitToStudentPortal}
            className="px-3.5 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 font-mono text-xs transition-all"
          >
            STUDENT VIEW
          </button>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* DASHBOARD NAVIGATION TABS */}
      <div className="border-b border-white/10 bg-surface-950/40 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-2">
          {[
            { id: 'scoreboard', label: 'LIVE SCOREBOARD', icon: Activity },
            { id: 'attendance', label: 'PRESENT STUDENTS (ATTENDANCE)', icon: UserCheck },
            { id: 'security', label: 'SECURITY MONITOR', icon: ShieldAlert },
            { id: 'questions', label: 'TOPIC LIBRARY', icon: Terminal },
            { id: 'settings', label: 'QUIZ SETTINGS', icon: Sliders }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  labAudio.playTick();
                }}
                className={`px-4 py-2.5 rounded-xl font-mono text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-electric-cyan/15 text-electric-cyan border border-electric-cyan/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* TOP OVERVIEW STAT METRICS CARDS */}
        {scoreboardData && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="p-4 rounded-2xl bg-surface-900 border border-white/10 space-y-1 glass-card">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                TOTAL CLASS
              </span>
              <div className="text-2xl font-bold font-mono text-white">
                {scoreboardData.metrics.totalClass}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-900 border border-white/10 space-y-1 glass-card">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                PRESENT (ELIGIBLE)
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {scoreboardData.metrics.present}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-900 border border-white/10 space-y-1 glass-card">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                ABSENT (LOCKED)
              </span>
              <div className="text-2xl font-bold font-mono text-amber-400">
                {scoreboardData.metrics.absent}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-900 border border-white/10 space-y-1 glass-card">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                COMPLETED
              </span>
              <div className="text-2xl font-bold font-mono text-electric-cyan">
                {scoreboardData.metrics.completed}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-900 border border-white/10 space-y-1 glass-card">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                IN PROGRESS
              </span>
              <div className="text-2xl font-bold font-mono text-white flex items-center gap-2">
                <span>{scoreboardData.metrics.inProgress}</span>
                {scoreboardData.metrics.inProgress > 0 && (
                  <span className="w-2 h-2 rounded-full bg-electric-cyan animate-ping"></span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface-900 border border-white/10 space-y-1 glass-card">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                AVERAGE SCORE
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {scoreboardData.metrics.averageScore}{' '}
                <span className="text-xs font-normal text-slate-500">/ 10</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: LIVE SCOREBOARD */}
        {activeTab === 'scoreboard' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-surface-900 border border-white/10 glass-panel">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Roll No or Student..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-electric-cyan"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {['ALL', 'COMPLETED', 'IN_PROGRESS', 'PRESENT', 'ABSENT'].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setStatusFilter(st);
                      labAudio.playTick();
                    }}
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-all ${
                      statusFilter === st
                        ? 'bg-white text-black font-bold'
                        : 'bg-surface-950 text-slate-400 border border-white/10 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Scoreboard Table with Topics Column */}
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-surface-900 shadow-metallic-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-surface-950/80 border-b border-white/10 text-slate-400 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-5 py-3.5">Rank</th>
                      <th className="px-5 py-3.5">Roll No</th>
                      <th className="px-5 py-3.5">Student</th>
                      <th className="px-5 py-3.5">Attendance</th>
                      <th className="px-5 py-3.5">Score</th>
                      <th className="px-5 py-3.5">%</th>
                      <th className="px-5 py-3.5">Time</th>
                      <th className="px-5 py-3.5">Topics</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Security</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredScoreboard.map((row) => {
                      const isTerminated = row.status === 'TERMINATED';
                      const isCompleted = row.status === 'SUBMITTED' || row.status === 'TIME_EXPIRED';
                      const isInProgress = row.status === 'IN_PROGRESS';

                      return (
                        <tr key={row.rollNumber} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-4 font-bold text-slate-400">
                            {row.rank === '01' ? (
                              <span className="text-amber-400 flex items-center gap-1 font-bold">
                                👑 01
                              </span>
                            ) : (
                              row.rank
                            )}
                          </td>
                          <td className="px-5 py-4 text-electric-cyan font-bold">
                            {row.rollNumber}
                          </td>
                          <td className="px-5 py-4 font-sans font-medium text-white">
                            {row.name}
                          </td>
                          <td className="px-5 py-4">
                            {row.isPresent ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold">
                                PRESENT
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-semibold">
                                ABSENT
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 font-bold">
                            {isCompleted ? (
                              <span className="text-white text-sm">
                                {row.score}{' '}
                                <span className="text-xs text-slate-500 font-normal">
                                  / {row.maxScore}
                                </span>
                              </span>
                            ) : (
                              <span className="text-slate-600">--</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {isCompleted ? (
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  row.percentage >= 60
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                }`}
                              >
                                {row.percentage}%
                              </span>
                            ) : (
                              <span className="text-slate-600">--</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-slate-300">{row.duration}</td>

                          {/* Topics Column (#27) */}
                          <td className="px-5 py-4">
                            {row.topicsCount > 0 ? (
                              <button
                                onClick={() => openStudentDetail(row.rollNumber)}
                                className="px-2 py-0.5 rounded bg-surface-950 border border-white/10 hover:border-electric-cyan text-slate-300 hover:text-white transition-all text-[11px] flex items-center gap-1"
                                title={row.selectedTopics.join(', ')}
                              >
                                <span>{row.topicsCount} Topics</span>
                              </button>
                            ) : (
                              <span className="text-slate-600">--</span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            {isCompleted && (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold uppercase">
                                {row.status}
                              </span>
                            )}
                            {isInProgress && (
                              <span className="px-2.5 py-1 rounded-full bg-electric-cyan/10 border border-electric-cyan/30 text-electric-cyan text-[10px] font-semibold uppercase flex items-center gap-1.5 w-fit">
                                <span className="w-1.5 h-1.5 rounded-full bg-electric-cyan animate-ping"></span>
                                <span>IN PROGRESS</span>
                              </span>
                            )}
                            {isTerminated && (
                              <span className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-semibold uppercase">
                                TERMINATED
                              </span>
                            )}
                            {row.status === 'NOT_STARTED' && (
                              <span className="px-2.5 py-1 rounded-full bg-surface-950 border border-white/10 text-slate-500 text-[10px] uppercase">
                                NOT STARTED
                              </span>
                            )}
                            {row.status === 'LOCKED_ABSENT' && (
                              <span className="px-2.5 py-1 rounded-full bg-red-950/40 border border-red-500/20 text-red-400 text-[10px] uppercase">
                                LOCKED (ABSENT)
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {row.securityStatus === 'CLEAN' ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Clean</span>
                              </span>
                            ) : (
                              <span className="text-amber-400 flex items-center gap-1 font-semibold">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>{row.violationCount} Violations</span>
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right space-x-2">
                            <button
                              onClick={() => openStudentDetail(row.rollNumber)}
                              className="px-2.5 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-200 border border-white/10 text-[11px] transition-all"
                            >
                              DETAIL
                            </button>
                            {row.attemptId && (
                              <button
                                onClick={() => handleResetAttempt(row.rollNumber)}
                                title="Reset Student Attempt"
                                className="px-2 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 text-[11px] transition-all"
                              >
                                RESET
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {filteredScoreboard.length === 0 && (
                      <tr>
                        <td colSpan={11} className="px-5 py-12 text-center text-slate-500">
                          No matching student assessment records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ATTENDANCE & PRESENT STUDENTS SYSTEM (#4, #5) */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Attendance Input Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Method A: Paste Roll Numbers */}
              <form
                onSubmit={handlePasteAttendanceSubmit}
                className="p-5 rounded-2xl bg-surface-900 border border-white/10 glass-panel space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono text-electric-cyan font-bold">
                    <FileText className="w-4 h-4" />
                    <span>METHOD A: PASTE PRESENT ROLL NUMBERS</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">One per line</span>
                </div>
                <p className="text-xs text-slate-400 font-light">
                  Paste roll numbers (e.g. 25-CP-001 or 25-CP-001,Student Name). All pasted students are instantly marked PRESENT.
                </p>
                <textarea
                  rows={4}
                  value={pasteAttendanceText}
                  onChange={(e) => setPasteAttendanceText(e.target.value)}
                  placeholder={`25-CP-001\n25-CP-003\n25-CP-005,Hamza`}
                  className="w-full p-3 rounded-xl bg-surface-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-electric-cyan"
                />
                <button
                  type="submit"
                  disabled={processingAttendance || !pasteAttendanceText.trim()}
                  className="w-full py-2.5 rounded-xl bg-electric-cyan hover:bg-cyan-400 text-black font-bold font-mono text-xs uppercase transition-all shadow-glow-blue disabled:opacity-40"
                >
                  {processingAttendance ? 'PROCESSING...' : 'UPDATE PRESENT STUDENTS LIST'}
                </button>
              </form>

              {/* Method B: Upload CSV */}
              <div className="p-5 rounded-2xl bg-surface-900 border border-white/10 glass-panel space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono text-electric-cyan font-bold mb-1">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>METHOD B: UPLOAD ATTENDANCE CSV</span>
                  </div>
                  <p className="text-xs text-slate-400 font-light">
                    Upload a CSV file containing columns: <code className="text-slate-300">Roll Number,Student Name</code>.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-dashed border-white/20 bg-surface-950 text-center space-y-2">
                  <UploadCloud className="w-8 h-8 text-electric-cyan mx-auto" />
                  <div className="text-xs text-slate-300">Select attendance CSV from your device</div>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleCSVUpload}
                    className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-mono file:bg-surface-800 file:text-white hover:file:bg-surface-700 cursor-pointer"
                  />
                </div>

                {attendanceMsg && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs">
                    ✓ {attendanceMsg}
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Roster Table */}
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-surface-900 shadow-metallic-card">
              <div className="p-4 bg-surface-950 border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  ATTENDANCE ROSTER ({attendanceRoster.length} Total Enrolled)
                </span>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-emerald-400 font-bold">
                    {attendanceRoster.filter(a => a.isPresent).length} Present
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-red-400 font-bold">
                    {attendanceRoster.filter(a => !a.isPresent).length} Absent
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-surface-950/50 border-b border-white/5 text-slate-400 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-5 py-3">Roll Number</th>
                      <th className="px-5 py-3">Student Name</th>
                      <th className="px-5 py-3">Attendance</th>
                      <th className="px-5 py-3">Quiz Access Eligibility</th>
                      <th className="px-5 py-3 text-right">Quick Toggle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {attendanceRoster.map((item) => (
                      <tr key={item.rollNumber} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3 text-electric-cyan font-bold">{item.rollNumber}</td>
                        <td className="px-5 py-3 font-sans text-white">{item.studentName}</td>
                        <td className="px-5 py-3">
                          {item.isPresent ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-[10px]">
                              PRESENT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-[10px]">
                              ABSENT
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {item.isPresent ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Eligible to Start</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 flex items-center gap-1">
                              <Lock className="w-3.5 h-3.5 text-red-400" />
                              <span>Access Denied</span>
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleToggleAttendance(item.rollNumber)}
                            className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                              item.isPresent
                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            Mark {item.isPresent ? 'Absent' : 'Present'}
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

        {/* TAB 3: SECURITY MONITOR */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-surface-900 border border-white/10 glass-panel flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase font-mono">
                  REAL-TIME ASSESSMENT INTEGRITY MONITOR
                </h3>
                <p className="text-xs text-slate-400 font-light">
                  Continuous browser security feed tracking window focus, devtools, and fullscreen events.
                </p>
              </div>
              <div className="text-xs font-mono text-electric-cyan">
                {scoreboardData?.recentSecurityEvents?.length || 0} Events Logged
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 overflow-hidden bg-surface-900 shadow-metallic-card">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-surface-950/80 border-b border-white/10 text-slate-400 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5">Roll Number</th>
                    <th className="px-5 py-3.5">Student</th>
                    <th className="px-5 py-3.5">Event</th>
                    <th className="px-5 py-3.5">Classification</th>
                    <th className="px-5 py-3.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(scoreboardData?.recentSecurityEvents || []).map((ev) => (
                    <tr key={ev.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3 text-slate-400">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-5 py-3 text-electric-cyan font-bold">{ev.rollNumber}</td>
                      <td className="px-5 py-3 font-sans text-white">{ev.studentName}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ev.eventType === 'TAB_SWITCH' ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {ev.eventType}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400">{ev.severity}</td>
                      <td className="px-5 py-3 text-slate-300 font-light">{ev.details}</td>
                    </tr>
                  ))}
                  {(!scoreboardData?.recentSecurityEvents || scoreboardData.recentSecurityEvents.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                        No integrity violations recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: TOPIC LIBRARY (#15) */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-surface-900 border border-white/10 glass-panel">
              <h3 className="text-sm font-bold text-white uppercase font-mono">
                JAVA OOP TOPIC LIBRARY & QUESTION POOL
              </h3>
              <p className="text-xs text-slate-400 font-light">
                Topics available for student selection. Each topic contains questions of normal university level difficulty.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questionsList.map((t) => (
                <div key={t.id} className="p-5 rounded-2xl bg-surface-900 border border-white/10 glass-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-electric-cyan tracking-wider">
                      {t.category}
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">ACTIVE</span>
                  </div>
                  <h4 className="text-base font-bold text-white">{t.name}</h4>
                  <p className="text-xs text-slate-400 font-light leading-relaxed">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: QUIZ SETTINGS */}
        {activeTab === 'settings' && settingsForm && (
          <form
            onSubmit={saveSettings}
            className="max-w-2xl bg-surface-900 border border-white/10 rounded-2xl p-6 md:p-8 glass-panel shadow-metallic-card space-y-6"
          >
            <div className="border-b border-white/10 pb-4">
              <h3 className="text-lg font-bold text-white uppercase font-mono">
                QUIZ CONFIGURATION & BATCH SETTINGS
              </h3>
              <p className="text-xs text-slate-400 font-light">
                Configure roll number prefix, minimum topic selection, and assessment duration.
              </p>
            </div>

            {settingsSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Configuration changes committed to database.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-400">
                  Configured Roll Prefix
                </label>
                <input
                  type="text"
                  value={settingsForm.rollPrefix || '25-CP'}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, rollPrefix: e.target.value.toUpperCase() })
                  }
                  placeholder="25-CP"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-electric-cyan uppercase"
                />
                <span className="text-[10px] text-slate-500 font-mono">
                  Students must enter roll numbers in format {settingsForm.rollPrefix || '25-CP'}-NNN
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-400">
                  Authorized University Email Domain
                </label>
                <input
                  type="text"
                  value={settingsForm.universityEmailDomain || 'uettaxila.edu.pk'}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, universityEmailDomain: e.target.value.toLowerCase().trim() })
                  }
                  placeholder="uettaxila.edu.pk"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-electric-cyan"
                />
                <span className="text-[10px] text-slate-500 font-mono">
                  Instructors must sign in using @{settingsForm.universityEmailDomain || 'uettaxila.edu.pk'} accounts
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-400">
                  Minimum Topics Required
                </label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={settingsForm.minTopics || 2}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      minTopics: parseInt(e.target.value) || 2
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-electric-cyan"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-400">
                  Total Questions Per Candidate
                </label>
                <input
                  type="number"
                  min="5"
                  max="30"
                  value={settingsForm.totalQuestions || 10}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      totalQuestions: parseInt(e.target.value) || 10
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-electric-cyan"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono uppercase text-slate-400">
                  Assessment Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={settingsForm.durationMinutes || 10}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      durationMinutes: parseInt(e.target.value) || 10
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-electric-cyan"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full py-3.5 rounded-xl bg-electric-cyan hover:bg-cyan-400 text-black font-bold font-mono text-xs uppercase tracking-wider transition-all shadow-glow-blue disabled:opacity-50"
            >
              {savingSettings ? 'SAVING...' : 'SAVE CONFIGURATION'}
            </button>
          </form>
        )}
      </main>

      {/* STUDENT ASSESSMENT DETAIL MODAL (#26, #28) */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] bg-surface-900 border border-white/15 rounded-3xl p-6 md:p-8 overflow-y-auto space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-electric-cyan">
                  <span>STUDENT ASSESSMENT DETAIL REPORT</span>
                </div>
                <h2 className="text-2xl font-bold text-white mt-1">
                  {selectedStudentDetail.studentName}
                </h2>
                <div className="text-xs font-mono text-slate-400 mt-0.5">
                  Roll: <span className="text-white font-bold">{selectedStudentDetail.rollNumber}</span> •
                  Status:{' '}
                  <span className="text-emerald-400 uppercase font-bold">
                    {selectedStudentDetail.attempt?.status || 'NOT STARTED'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="p-2 rounded-xl bg-surface-950 border border-white/10 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Score & Time Details */}
            {selectedStudentDetail.attempt && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-surface-950 border border-white/5 space-y-1">
                  <span className="text-slate-500 uppercase text-[10px]">Score</span>
                  <div className="text-lg font-bold text-white">
                    {selectedStudentDetail.attempt.score} / {selectedStudentDetail.attempt.maxScore}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-950 border border-white/5 space-y-1">
                  <span className="text-slate-500 uppercase text-[10px]">Percentage</span>
                  <div className="text-lg font-bold text-electric-cyan">
                    {selectedStudentDetail.attempt.percentage}%
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-950 border border-white/5 space-y-1">
                  <span className="text-slate-500 uppercase text-[10px]">Attendance</span>
                  <div className="text-xs font-bold text-emerald-400">
                    {selectedStudentDetail.isPresent ? 'PRESENT' : 'ABSENT'}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface-950 border border-white/5 space-y-1">
                  <span className="text-slate-500 uppercase text-[10px]">Submitted At</span>
                  <div className="text-xs text-slate-300">
                    {selectedStudentDetail.attempt.submittedAt
                      ? new Date(selectedStudentDetail.attempt.submittedAt).toLocaleTimeString()
                      : '--'}
                  </div>
                </div>
              </div>
            )}

            {/* SELECTED TOPICS SECTION (#26) */}
            <div className="p-5 rounded-2xl bg-surface-950 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-widest text-electric-cyan font-bold flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>SELECTED TOPICS ({selectedStudentDetail.selectedTopics?.length || 0} Selected)</span>
                </span>
              </div>
              {selectedStudentDetail.selectedTopics && selectedStudentDetail.selectedTopics.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedStudentDetail.selectedTopics.map((topicName, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-electric-cyan/10 border border-electric-cyan/30 text-electric-cyan text-xs font-mono font-medium"
                    >
                      {idx + 1}. {topicName}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 font-mono">
                  Candidate has not yet selected topics.
                </div>
              )}
            </div>

            {/* QUESTION-BY-QUESTION BREAKDOWN (#28) */}
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                QUESTION-BY-QUESTION EVALUATION BREAKDOWN
              </div>

              {selectedStudentDetail.questionBreakdown && selectedStudentDetail.questionBreakdown.length > 0 ? (
                selectedStudentDetail.questionBreakdown.map((q) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl bg-surface-950 border border-white/5 space-y-2 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-electric-cyan font-bold">
                          Q{q.orderNum}.
                        </span>
                        <span className="px-2 py-0.5 rounded bg-surface-900 border border-white/10 text-slate-300 text-[10px]">
                          Topic: {q.topic}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-surface-900 border border-white/10 text-slate-400 text-[10px]">
                          {q.questionType}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          q.isCorrect
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {q.isCorrect ? `CORRECT (+${q.marksAwarded})` : `INCORRECT (0)`}
                      </span>
                    </div>

                    <p className="text-slate-300 font-sans text-xs">{q.questionText}</p>

                    <div className="p-2.5 rounded-lg bg-surface-900 border border-white/5 space-y-1">
                      <div className="text-slate-400">
                        Candidate Response:{' '}
                        <span className="text-white font-bold">{q.studentAnswer}</span>
                      </div>
                      <div className="text-slate-400">
                        Expected Answer / Criteria:{' '}
                        <span className="text-emerald-400 font-bold">{q.correctAnswer}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-500 font-mono text-xs">
                  No questions answered yet.
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              {selectedStudentDetail.attempt && (
                <button
                  type="button"
                  onClick={() => handleResetAttempt(selectedStudentDetail.rollNumber)}
                  className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono font-bold transition-all"
                >
                  RESET ATTEMPT & ALLOW RETAKE
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedStudentDetail(null)}
                className="px-5 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-white text-xs font-mono transition-all ml-auto"
              >
                CLOSE AUDIT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
