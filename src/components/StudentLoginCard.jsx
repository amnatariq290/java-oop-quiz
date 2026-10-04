import React, { useState } from 'react';
import { ShieldAlert, ArrowRight, Lock, KeyRound, HelpCircle, CheckCircle } from 'lucide-react';
import { labAudio } from '../utils/audio';

export default function StudentLoginCard({ onStudentAuthorized, onGoToAdmin }) {
  const [studentName, setStudentName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);
  const [showSampleRolls, setShowSampleRolls] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentName.trim() || !rollNumber.trim()) return;

    // Frontend Format Validation: YY-CP-NNN
    const cleanRoll = rollNumber.trim().toUpperCase();
    const formatRegex = /^\d{2}-CP-\d{3}$/;
    if (!formatRegex.test(cleanRoll)) {
      labAudio.playWarning();
      setErrorState({
        title: "INVALID ROLL NUMBER",
        message: "Please enter your Roll Number in the format 25-CP-001."
      });
      return;
    }

    setLoading(true);
    setErrorState(null);
    labAudio.playTick();

    try {
      const response = await fetch('/api/auth/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: studentName.trim(),
          rollNumber: cleanRoll
        })
      });

      const data = await response.json();

      if (!response.ok) {
        labAudio.playWarning();
        setErrorState({
          title: data.error || "QUIZ ACCESS DENIED",
          message: data.message || "Your Roll Number is not on today's attendance list.",
          code: data.code,
          attempt: data.attempt
        });
        setLoading(false);
        return;
      }

      labAudio.playSuccess();
      onStudentAuthorized({
        student: data.student,
        resumed: data.resumed,
        attemptId: data.attemptId,
        remainingSeconds: data.remainingSeconds,
        questions: data.questions,
        savedAnswers: data.savedAnswers,
        selectedTopics: data.selectedTopics
      });
    } catch (err) {
      labAudio.playWarning();
      setErrorState({
        title: "CONNECTION ERROR",
        message: "Unable to reach verification gateway. Ensure the assessment server is active.",
        code: "NETWORK_ERROR"
      });
      setLoading(false);
    }
  };

  const handleQuickFill = (name, roll) => {
    setStudentName(name);
    setRollNumber(roll);
    setErrorState(null);
    labAudio.playSelect();
  };

  return (
    <div className="w-full max-w-lg mx-auto p-6 md:p-8 glass-panel rounded-2xl border border-white/10 shadow-metallic-card relative overflow-hidden backdrop-blur-2xl">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-electric-cyan to-transparent"></div>

      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-surface-800 border border-white/10 text-electric-cyan mb-2 shadow-inner">
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white uppercase font-sans">
          STUDENT LOGIN
        </h2>
        <p className="text-xs md:text-sm text-slate-400 font-light">
          Enter your name and official Roll Number to access your assessment.
        </p>
      </div>

      {/* Error Banner */}
      {errorState && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-left animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="font-bold text-red-300 tracking-wider font-mono">
                {errorState.title}
              </div>
              <p className="text-red-200/90 leading-relaxed font-light">
                {errorState.message}
              </p>
              {errorState.attempt && (
                <div className="pt-2 mt-2 border-t border-red-500/20 text-[11px] font-mono text-red-300">
                  Status: <span className="font-bold uppercase">{errorState.attempt.status}</span>
                  {errorState.attempt.score != null && (
                    <span className="ml-3">Score: {errorState.attempt.score} / {errorState.attempt.maxScore}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Simple Form: Student Name + Roll Number */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
            Student Name <span className="text-electric-cyan">*</span>
          </label>
          <input
            type="text"
            required
            value={studentName}
            onChange={(e) => {
              setStudentName(e.target.value);
              if (errorState) setErrorState(null);
            }}
            placeholder="Enter your full name"
            className="w-full px-4 py-3.5 rounded-xl bg-surface-950 border border-white/10 text-white placeholder-slate-600 font-sans text-sm focus:outline-none focus:border-electric-cyan focus:ring-1 focus:ring-electric-cyan transition-all"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-mono uppercase tracking-widest text-slate-400">
              Roll Number <span className="text-electric-cyan">*</span>
            </label>
            <span className="text-[11px] text-slate-500 font-mono">Format: 25-CP-001</span>
          </div>
          <input
            type="text"
            required
            value={rollNumber}
            onChange={(e) => {
              setRollNumber(e.target.value.toUpperCase());
              if (errorState) setErrorState(null);
            }}
            placeholder="25-CP-001"
            className="w-full px-4 py-3.5 rounded-xl bg-surface-950 border border-white/10 text-white placeholder-slate-600 font-mono text-base tracking-wider focus:outline-none focus:border-electric-cyan focus:ring-1 focus:ring-electric-cyan transition-all"
          />
        </div>

        {/* Start Button */}
        <button
          type="submit"
          disabled={loading || !studentName.trim() || !rollNumber.trim()}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-electric-cyan via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-bold tracking-wider uppercase text-sm shadow-glow-blue transition-all flex items-center justify-center gap-2 group disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center gap-2 text-black">
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
              <span>VERIFYING ATTENDANCE...</span>
            </div>
          ) : (
            <>
              <span>ENTER QUIZ</span>
              <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      {/* Present / Absent Demo Helper */}
      <div className="mt-6 pt-5 border-t border-white/5 text-center">
        <button
          type="button"
          onClick={() => setShowSampleRolls(!showSampleRolls)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-electric-cyan transition-colors font-mono"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>{showSampleRolls ? "Hide Sample Attendance Records" : "Click to view / auto-fill Present & Absent sample students"}</span>
        </button>

        {showSampleRolls && (
          <div className="mt-3 p-3 rounded-lg bg-surface-950/80 border border-white/5 text-left text-xs font-mono space-y-2 animate-in fade-in duration-200">
            <div className="text-[11px] text-slate-400 font-semibold">PRESENT (Eligible for quiz):</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("Ali Khan", "25-CP-001")}
                className="text-left p-2 rounded bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
              >
                <div className="font-bold text-white">25-CP-001</div>
                <div className="text-[10px] text-emerald-400">Ali Khan (Present)</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("Ahmed Raza", "25-CP-003")}
                className="text-left p-2 rounded bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
              >
                <div className="font-bold text-white">25-CP-003</div>
                <div className="text-[10px] text-emerald-400">Ahmed Raza (Present)</div>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 font-semibold pt-1">ABSENT (Will trigger Quiz Access Denied):</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("Sara Ahmed", "25-CP-002")}
                className="text-left p-2 rounded bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
              >
                <div className="font-bold text-white">25-CP-002</div>
                <div className="text-[10px] text-red-400">Sara Ahmed (Absent)</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("Zainab Malik", "25-CP-006")}
                className="text-left p-2 rounded bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all"
              >
                <div className="font-bold text-white">25-CP-006</div>
                <div className="text-[10px] text-red-400">Zainab Malik (Absent)</div>
              </button>
            </div>
          </div>
        )}

        <div className="mt-4">
          <button
            type="button"
            onClick={onGoToAdmin}
            className="text-xs text-slate-500 hover:text-white transition-colors font-mono"
          >
            Instructor / Examiner Control →
          </button>
        </div>
      </div>
    </div>
  );
}
