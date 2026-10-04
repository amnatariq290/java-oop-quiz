import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle2,
  AlertCircle,
  Send,
  Code2,
  Check,
  Save,
  Maximize2,
  HelpCircle,
  Lock
} from 'lucide-react';
import AntiCheatMonitor from './AntiCheatMonitor';
import { labAudio } from '../utils/audio';

export default function QuizCockpit({
  quizData,
  student,
  onQuizSubmitted,
  onTerminated
}) {
  const { attempt, questions, savedAnswers = {}, settings } = quizData;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(savedAnswers);
  const [flagged, setFlagged] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(attempt.remainingSeconds || 600);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeExpiredModal, setTimeExpiredModal] = useState(false);
  const [mandatoryWarning, setMandatoryWarning] = useState(false);

  const debounceTimers = useRef({});
  const timerIntervalRef = useRef(null);
  const syncIntervalRef = useRef(null);

  const currentQuestion = questions[currentIndex] || questions[0];

  // Check if a question is answered
  const isQuestionAnswered = (idx) => {
    const q = questions[idx];
    if (!q) return false;
    const ans = answers[q.id];
    return ans !== undefined && String(ans).trim().length > 0;
  };

  // Determine the highest index unlocked (must answer previous to unlock next)
  let maxUnlockedIndex = 0;
  for (let i = 0; i < questions.length; i++) {
    if (isQuestionAnswered(i)) {
      maxUnlockedIndex = Math.min(i + 1, questions.length - 1);
    } else {
      break;
    }
  }

  // 1. Precise countdown timer
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleAutoSubmitTimeExpired();
          return 0;
        }

        // Audio cues for critical time
        if (prev <= 60 && prev % 5 === 0) {
          labAudio.playTick();
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerIntervalRef.current);
  }, []);

  // 2. Periodic Server Heartbeat & Clock Sync (every 15s)
  useEffect(() => {
    syncIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/quiz/session-status?attemptId=${attempt.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'TERMINATED') {
            onTerminated(data.terminationReason || 'Assessment terminated by proctor');
          } else if (data.status === 'TIME_EXPIRED' || data.remainingSeconds <= 0) {
            handleAutoSubmitTimeExpired();
          } else if (Math.abs(data.remainingSeconds - remainingSeconds) > 3) {
            // Re-sync client timer with server truth
            setRemainingSeconds(data.remainingSeconds);
          }
        }
      } catch (e) {
        console.warn('Heartbeat sync failed:', e);
      }
    }, 15000);

    return () => clearInterval(syncIntervalRef.current);
  }, [attempt.id, remainingSeconds, onTerminated]);

  // 3. Auto-save answer to server
  const triggerAutoSave = useCallback((questionId, val) => {
    setIsSaving(true);
    fetch('/api/quiz/autosave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attemptId: attempt.id,
        questionId,
        studentAnswer: val
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setIsSaving(false);
        if (data.success) {
          const now = new Date();
          setLastSavedTime(
            `${String(now.getHours()).padStart(2, '0')}:${String(
              now.getMinutes()
            ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
          );
        }
      })
      .catch((err) => {
        console.error('Autosave failed:', err);
        setIsSaving(false);
      });
  }, [attempt.id]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setMandatoryWarning(false);

    // Debounce for typing, immediate for MCQ
    if (debounceTimers.current[questionId]) {
      clearTimeout(debounceTimers.current[questionId]);
    }

    const isText = currentQuestion?.questionType !== 'MCQ';
    if (isText) {
      debounceTimers.current[questionId] = setTimeout(() => {
        triggerAutoSave(questionId, value);
      }, 400);
    } else {
      triggerAutoSave(questionId, value);
      labAudio.playSelect();
    }
  };

  const toggleFlag = (questionId) => {
    setFlagged((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
    labAudio.playTick();
  };

  const handleNext = () => {
    // Requirement #22: Mandatory Answer Before Next Question
    if (!isQuestionAnswered(currentIndex)) {
      labAudio.playWarning();
      setMandatoryWarning(true);
      setTimeout(() => setMandatoryWarning(false), 3500);
      return;
    }

    setMandatoryWarning(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      labAudio.playTick();
    } else {
      // Check that all questions are answered before showing submit modal
      const allAnswered = questions.every((_, i) => isQuestionAnswered(i));
      if (!allAnswered) {
        labAudio.playWarning();
        setMandatoryWarning(true);
        setTimeout(() => setMandatoryWarning(false), 3500);
        return;
      }
      setShowSubmitModal(true);
      labAudio.playTick();
    }
  };

  const handlePrev = () => {
    setMandatoryWarning(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      labAudio.playTick();
    }
  };

  // Keyboard navigation (Arrow keys + A/B/C/D for MCQ)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in textarea or input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        return;
      }

      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (currentQuestion?.questionType === 'MCQ' && currentQuestion?.options) {
        const key = e.key.toUpperCase();
        const map = { '1': 0, '2': 1, '3': 2, '4': 3, 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
        if (map[key] !== undefined && currentQuestion.options[map[key]]) {
          handleAnswerChange(currentQuestion.id, currentQuestion.options[map[key]].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, currentQuestion, questions.length]);

  // Final submission
  const executeFinalSubmit = async () => {
    setIsSubmitting(true);
    labAudio.playTick();

    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: attempt.id })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to submit assessment.');
        setIsSubmitting(false);
        return;
      }

      labAudio.playSuccess();
      onQuizSubmitted(data.attempt);
    } catch (err) {
      console.error(err);
      alert('Network error during final submission. Please retry.');
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmitTimeExpired = async () => {
    setTimeExpiredModal(true);
    labAudio.playWarning();

    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: attempt.id })
      });
      const data = await res.json();
      if (res.ok) {
        setTimeout(() => {
          onQuizSubmitted(data.attempt);
        }, 2200);
      }
    } catch (e) {
      console.error('Auto submit error:', e);
    }
  };

  // Format MM:SS
  const formatTime = (secs) => {
    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  // Timer color states
  const getTimerStyles = () => {
    if (remainingSeconds <= 60) {
      return 'text-red-400 border-red-500/50 bg-red-950/40 animate-pulse';
    }
    if (remainingSeconds <= 180) {
      return 'text-amber-400 border-amber-500/40 bg-amber-950/30';
    }
    return 'text-electric-cyan border-electric-cyan/30 bg-surface-900';
  };

  const answeredCount = questions.filter(
    (q) => answers[q.id] !== undefined && String(answers[q.id]).trim().length > 0
  ).length;

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col justify-between selection:bg-electric-cyan/20 selection:text-electric-cyan select-none">
      {/* Background Anti-Cheat Guardian */}
      <AntiCheatMonitor
        attemptId={attempt.id}
        rollNumber={student.rollNumber}
        studentName={student.name}
        settings={settings}
        onTerminated={onTerminated}
      />

      {/* Time Expired Modal */}
      {timeExpiredModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface-900 border border-red-500/50 rounded-2xl p-6 text-center space-y-4 shadow-glow-danger animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-red-400 uppercase tracking-widest">
                DEADLINE REACHED
              </span>
              <h2 className="text-2xl font-black text-white">TIME EXPIRED</h2>
            </div>
            <p className="text-xs text-slate-300 font-light">
              Your 10-minute assessment window has elapsed. All answers have been saved and
              automatically submitted to the server.
            </p>
            <div className="text-xs font-mono text-electric-cyan animate-pulse">
              Transferring to official score report...
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-surface-900 border border-white/15 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-electric-cyan/10 text-electric-cyan border border-electric-cyan/20">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                  SUBMIT YOUR ASSESSMENT?
                </h3>
                <p className="text-xs text-slate-400 font-light">
                  This action is permanent and cannot be undone.
                </p>
              </div>
            </div>

            {/* Assessment summary breakdown */}
            <div className="p-4 rounded-xl bg-surface-950 border border-white/10 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Total Questions:</span>
                <span className="text-white font-bold">{questions.length}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Answered:</span>
                <span className="text-emerald-400 font-bold">
                  {answeredCount} of {questions.length}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Unanswered:</span>
                <span
                  className={
                    questions.length - answeredCount > 0
                      ? 'text-amber-400 font-bold'
                      : 'text-slate-400'
                  }
                >
                  {questions.length - answeredCount}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Flagged for Review:</span>
                <span className="text-amber-400 font-bold">
                  {Object.values(flagged).filter(Boolean).length}
                </span>
              </div>
              <div className="flex justify-between text-slate-300 pt-2 border-t border-white/10">
                <span>Time Remaining:</span>
                <span className="text-electric-cyan font-bold">
                  {formatTime(remainingSeconds)}
                </span>
              </div>
            </div>

            {questions.length - answeredCount > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                <span>
                  You have {questions.length - answeredCount} unanswered question(s). You can cancel
                  and complete them before time runs out.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-medium text-slate-300 hover:bg-white/5 transition-all"
              >
                RETURN TO QUIZ
              </button>
              <button
                type="button"
                onClick={executeFinalSubmit}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-electric-cyan hover:bg-cyan-400 text-black font-bold text-xs uppercase font-mono tracking-wider transition-all flex items-center gap-2 shadow-glow-blue disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    <span>SUBMITTING...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>CONFIRM & SUBMIT FINAL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP COCKPIT BAR */}
      <header className="border-b border-white/10 bg-surface-950/80 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-8 py-3 flex items-center justify-between">
        {/* Left: Brand & Assessment title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-900 border border-white/10 flex items-center justify-center text-electric-cyan font-black font-mono text-sm shadow-inner">
            ☕
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm font-black tracking-tight text-white font-mono">
                JAVA OOP // CODE CHALLENGE
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-slate-400">
                PROCTOR ACTIVE
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-light flex items-center gap-2">
              <span>Candidate:</span>
              <span className="text-white font-medium">{student.name}</span>
              <span className="text-slate-500">•</span>
              <span className="text-electric-cyan font-mono">{student.rollNumber}</span>
            </div>
          </div>
        </div>

        {/* Right: Autosave status & Server Timer */}
        <div className="flex items-center gap-3 md:gap-5">
          {/* Autosave status pill */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
            {isSaving ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span>SYNCING...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">
                  {lastSavedTime ? `SAVED ${lastSavedTime}` : 'AUTOSAVE ON'}
                </span>
              </>
            )}
          </div>

          {/* Enforced 10-Minute Countdown Display */}
          <div
            className={`px-3 md:px-4 py-1.5 rounded-xl border flex items-center gap-2 font-mono transition-all ${getTimerStyles()}`}
          >
            <Clock className="w-4 h-4" />
            <span className="text-base md:text-xl font-bold tracking-wider">
              {formatTime(remainingSeconds)}
            </span>
          </div>

          {/* Quick Submit Button */}
          <button
            onClick={() => {
              setShowSubmitModal(true);
              labAudio.playTick();
            }}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-electric-cyan/15 hover:bg-electric-cyan/25 border border-electric-cyan/40 text-electric-cyan text-xs font-mono font-semibold transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>SUBMIT</span>
          </button>
        </div>
      </header>

      {/* MAIN COCKPIT BODY: GRID */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: QUESTION NAVIGATOR (cols-12 on mobile, 4 on desktop) */}
        <div className="lg:col-span-3 bg-surface-900/90 rounded-2xl border border-white/10 p-5 glass-card space-y-5 lg:sticky lg:top-20">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
              QUESTION MATRIX
            </span>
            <span className="text-xs font-mono text-electric-cyan">
              {answeredCount}/{questions.length}
            </span>
          </div>

          {/* Matrix Grid */}
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = isQuestionAnswered(idx);
              const isCurrent = currentIndex === idx;
              const isLocked = idx > maxUnlockedIndex;
              const isFlagged = !!flagged[q.id];

              let buttonStyle = 'bg-surface-950 border-white/10 text-slate-400 hover:border-white/30';
              if (isCurrent) {
                buttonStyle =
                  'bg-white text-black font-bold ring-2 ring-electric-cyan border-white shadow-glow-blue';
              } else if (isAnswered) {
                buttonStyle =
                  'bg-electric-cyan/10 border-electric-cyan/50 text-electric-cyan font-semibold hover:bg-electric-cyan/20';
              } else if (isLocked) {
                buttonStyle =
                  'bg-surface-950/40 border-white/5 text-slate-600 cursor-not-allowed opacity-40';
              }

              return (
                <button
                  key={q.id}
                  disabled={isLocked}
                  onClick={() => {
                    if (!isLocked) {
                      setCurrentIndex(idx);
                      labAudio.playTick();
                      setMandatoryWarning(false);
                    }
                  }}
                  title={isLocked ? `Question ${idx + 1} is locked. Answer previous questions first.` : `Question ${idx + 1}`}
                  className={`relative h-11 rounded-xl border flex flex-col items-center justify-center font-mono text-xs transition-all ${buttonStyle}`}
                >
                  <div className="flex items-center gap-0.5">
                    {isLocked ? (
                      <Lock className="w-2.5 h-2.5 text-slate-500" />
                    ) : isAnswered && !isCurrent ? (
                      <span className="text-emerald-400 font-bold text-[10px]">✓</span>
                    ) : isCurrent ? (
                      <span className="text-black font-bold text-[10px]">→</span>
                    ) : null}
                    <span>{String(idx + 1).padStart(2, '0')}</span>
                  </div>

                  {/* Flag indicator tag */}
                  {isFlagged && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="pt-2 border-t border-white/5 space-y-1.5 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-white"></span>
              <span>→ Current</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold text-xs">✓</span>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-2.5 h-2.5 text-slate-500" />
              <span>Locked (Answer previous)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-amber-400"></span>
              <span>Flagged for Review</span>
            </div>
          </div>
        </div>

        {/* CENTER/RIGHT PANEL: ACTIVE QUESTION COCKPIT (8 cols) */}
        <div className="lg:col-span-9 space-y-6">
          <div className="bg-surface-900/90 rounded-2xl border border-white/10 p-6 md:p-8 glass-panel shadow-metallic-card relative space-y-6">
            {/* Top Question Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <span className="px-3 py-1 rounded-md bg-electric-cyan/10 border border-electric-cyan/30 text-electric-cyan font-mono text-xs font-bold">
                  QUESTION {String(currentIndex + 1).padStart(2, '0')} OF {String(questions.length).padStart(2, '0')}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-surface-950 border border-white/10 text-slate-400 font-mono text-xs">
                  {currentQuestion?.topic || 'Java OOP'}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-surface-950 border border-white/10 text-slate-400 font-mono text-xs">
                  {currentQuestion?.marks || 1} MARK
                </span>
                <span className="px-2.5 py-1 rounded-md bg-surface-950 border border-white/10 text-slate-500 font-mono text-[11px] uppercase">
                  {currentQuestion?.questionType}
                </span>
              </div>

              {/* Flag Toggle Button */}
              <button
                type="button"
                onClick={() => toggleFlag(currentQuestion.id)}
                className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-mono ${
                  flagged[currentQuestion.id]
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-surface-950 border-white/10 text-slate-400 hover:text-white'
                }`}
                title="Flag this question for later review"
              >
                <Flag className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {flagged[currentQuestion.id] ? 'FLAGGED' : 'FLAG'}
                </span>
              </button>
            </div>

            {/* Question Text */}
            <div className="text-base md:text-lg text-slate-100 font-medium leading-relaxed">
              {currentQuestion?.questionText}
            </div>

            {/* Code Snippet Box (If present) */}
            {currentQuestion?.codeSnippet && (
              <div className="rounded-xl overflow-hidden border border-white/15 bg-black/60 shadow-inner">
                {/* Code Window Header */}
                <div className="px-4 py-2 bg-surface-950 border-b border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                    <span className="ml-2 text-slate-400">JavaSource.java</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Read-Only</span>
                </div>
                {/* Code Body */}
                <pre className="p-4 text-xs md:text-sm font-mono text-slate-200 overflow-x-auto leading-relaxed select-none">
                  <code>{currentQuestion.codeSnippet}</code>
                </pre>
              </div>
            )}

            {/* Interactive Inputs based on Question Type */}
            <div className="pt-2">
              {/* 1. MCQ OPTIONS */}
              {currentQuestion?.questionType === 'MCQ' && (
                <div className="space-y-3">
                  <div className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
                    SELECT ONE CORRECT OPTION:
                  </div>
                  {currentQuestion.options?.map((option, optIdx) => {
                    const letters = ['A', 'B', 'C', 'D'];
                    const letter = letters[optIdx] || String(optIdx + 1);
                    const isSelected = answers[currentQuestion.id] === option.id;

                    return (
                      <div
                        key={option.id}
                        onClick={() => handleAnswerChange(currentQuestion.id, option.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 flex items-center gap-4 ${
                          isSelected
                            ? 'bg-electric-cyan/15 border-electric-cyan text-white shadow-glow-blue'
                            : 'bg-surface-950/70 border-white/10 text-slate-300 hover:border-white/30 hover:bg-surface-950'
                        }`}
                      >
                        {/* Letter indicator */}
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs flex-shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-electric-cyan text-black'
                              : 'bg-surface-900 border border-white/10 text-slate-400'
                          }`}
                        >
                          {letter}
                        </div>

                        {/* Text */}
                        <div className="text-sm font-light leading-relaxed flex-1">
                          {option.text}
                        </div>

                        {/* Check circle */}
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSelected
                              ? 'border-electric-cyan bg-electric-cyan text-black'
                              : 'border-white/20'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. FILL IN THE BLANK */}
              {currentQuestion?.questionType === 'FILL_BLANK' && (
                <div className="space-y-3 max-w-xl">
                  <label className="block text-xs font-mono uppercase tracking-widest text-slate-400">
                    ENTER THE EXACT TERM OR KEYWORD:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      autoComplete="off"
                      spellCheck="false"
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder="Type your response here..."
                      className="w-full px-4 py-3.5 rounded-xl bg-surface-950 border border-white/20 text-white font-mono text-sm placeholder:text-slate-600 focus:outline-none focus:border-electric-cyan focus:ring-1 focus:ring-electric-cyan transition-all"
                    />
                    {answers[currentQuestion.id] && (
                      <button
                        type="button"
                        onClick={() => handleAnswerChange(currentQuestion.id, '')}
                        className="absolute right-3 top-3.5 text-xs font-mono text-slate-500 hover:text-slate-300"
                      >
                        CLEAR
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Answers are case-normalized automatically. Press enter or click next to save.
                  </p>
                </div>
              )}

              {/* 3. SCENARIO SHORT ANSWER */}
              {currentQuestion?.questionType === 'SCENARIO' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="uppercase tracking-widest">
                      ARCHITECTURAL ANALYSIS / SHORT EXPLANATION:
                    </span>
                    <span>
                      {(answers[currentQuestion.id] || '').length} characters •{' '}
                      {(answers[currentQuestion.id] || '')
                        .trim()
                        .split(/\s+/)
                        .filter(Boolean).length}{' '}
                      words
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    placeholder="Identify the core OOP principles (e.g. Inheritance, Polymorphism, Encapsulation, Interfaces) and explain your reasoning clearly..."
                    className="w-full p-4 rounded-xl bg-surface-950 border border-white/20 text-white font-mono text-xs md:text-sm placeholder:text-slate-600 focus:outline-none focus:border-electric-cyan focus:ring-1 focus:ring-electric-cyan transition-all resize-y leading-relaxed"
                  />
                  <div className="p-3 rounded-lg bg-surface-950/60 border border-white/5 text-[11px] text-slate-400 font-mono">
                    💡 <span className="text-slate-300">Scoring Criteria:</span> Clearly reference
                    appropriate design principles, subclassing mechanisms, or contract decoupling.
                  </div>
                </div>
              )}
            </div>

            {/* Question Footer: Autosave Status */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs font-mono text-slate-500">
              <div>
                STATUS:{' '}
                <span
                  className={
                    answers[currentQuestion.id] ? 'text-electric-cyan' : 'text-slate-500'
                  }
                >
                  {answers[currentQuestion.id] ? 'ANSWER RECORDED' : 'UNANSWERED'}
                </span>
              </div>
              <div>Keyboard: [← / →] Navigate • [1-4 / A-D] Select</div>
            </div>
          </div>

          {/* Mandatory Answer Warning Banner */}
          {mandatoryWarning && (
            <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div>
                <span className="font-bold">ANSWER REQUIRED:</span>{' '}
                <span>Please select or type an answer to this question before proceeding.</span>
              </div>
            </div>
          )}

          {/* BOTTOM NAVIGATION ACTIONS */}
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="px-5 py-3 rounded-xl border border-white/15 bg-surface-900 hover:bg-surface-800 text-white text-xs font-mono font-semibold flex items-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>PREVIOUS</span>
            </button>

            <div className="text-xs font-mono text-slate-500 hidden sm:block">
              QUESTION {currentIndex + 1} OF {questions.length}
            </div>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!isQuestionAnswered(currentIndex)}
                className="px-6 py-3 rounded-xl bg-white hover:bg-slate-200 text-black text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>NEXT</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={!isQuestionAnswered(currentIndex)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-electric-cyan to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-glow-blue disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>SUBMIT ASSESSMENT</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-3 px-6 text-center text-[11px] font-mono text-slate-500">
        SECURITY PROTOCOL: Active Window & Fullscreen Monitoring • Session ID: {attempt.id}
      </footer>
    </div>
  );
}
