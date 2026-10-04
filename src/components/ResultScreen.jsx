import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  Award,
  ArrowRight,
  Printer,
  Home,
  AlertTriangle,
  Lock,
  FileCheck
} from 'lucide-react';
import { labAudio } from '../utils/audio';

export default function ResultScreen({ resultData, onReturnHome }) {
  const {
    id,
    rollNumber,
    studentName,
    status = 'SUBMITTED',
    score = 0,
    maxScore = 10,
    percentage = 0,
    timeUsed = '08:42',
    submittedAt,
    securityStatus = 'CLEAN',
    terminationReason
  } = resultData;

  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    labAudio.playSuccess();

    // Score count-up animation
    const targetScore = typeof score === 'number' ? score : parseFloat(score) || 0;
    const targetPercent = typeof percentage === 'number' ? percentage : parseInt(percentage) || 0;

    let start = 0;
    const duration = 1200; // ms
    const startTime = performance.now();

    const animateCount = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);

      setAnimatedScore(Math.round(targetScore * ease * 10) / 10);
      setAnimatedPercent(Math.round(targetPercent * ease));

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };

    requestAnimationFrame(animateCount);
  }, [score, percentage]);

  const isPassed = animatedPercent >= 60;
  const isTerminated = status === 'TERMINATED';

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col justify-center items-center p-4 md:p-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-electric-cyan/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="w-full max-w-2xl bg-surface-900/90 rounded-3xl border border-white/10 p-6 md:p-10 glass-panel shadow-2xl relative z-10 space-y-8 animate-in zoom-in-95 duration-500">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface-800 border border-white/10 text-xs font-mono text-emerald-400">
            <FileCheck className="w-3.5 h-3.5" />
            <span>EXAMINATION RECEIPT ENCRYPTED</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white uppercase">
            {isTerminated ? 'ASSESSMENT RECORDED (TERMINATED)' : 'ASSESSMENT COMPLETE'}
          </h1>
          <p className="text-xs md:text-sm text-slate-400 font-light max-w-md mx-auto">
            Your evaluation has been cryptographically finalized on the examination server.
          </p>
        </div>

        {/* Central Prominent Score Card */}
        <div className="p-8 rounded-2xl bg-gradient-to-b from-surface-800 to-surface-950 border border-white/10 text-center relative overflow-hidden shadow-metallic-card">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-electric-cyan to-transparent"></div>

          <div className="text-xs font-mono uppercase tracking-widest text-slate-400 mb-2">
            OFFICIAL EVALUATION SCORE
          </div>

          {score !== null && score !== undefined ? (
            <div className="space-y-1">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-6xl md:text-8xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400">
                  {animatedScore}
                </span>
                <span className="text-2xl md:text-4xl font-mono text-slate-500 font-light">
                  / {maxScore}
                </span>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 font-mono text-sm">
                <span className="text-electric-cyan font-bold">{animatedPercent}%</span>
                <span className="text-slate-500">•</span>
                <span
                  className={
                    isPassed ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'
                  }
                >
                  {isPassed ? 'PASSED CRITERIA' : 'BELOW THRESHOLD'}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-6 space-y-2">
              <div className="text-2xl font-mono font-bold text-white">SUBMISSION RECORDED</div>
              <p className="text-xs text-slate-400 font-light max-w-sm mx-auto">
                Individual question scores are withheld by the instructor pending class completion.
              </p>
            </div>
          )}
        </div>

        {/* Candidate & Metadata Summary Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          <div className="p-3.5 rounded-xl bg-surface-950 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              ROLL NUMBER
            </span>
            <div className="font-mono font-bold text-electric-cyan text-sm">{rollNumber}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-950 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              CANDIDATE
            </span>
            <div className="font-semibold text-white text-sm truncate">{studentName}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-950 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              TIME CONSUMED
            </span>
            <div className="font-mono text-white text-sm flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{timeUsed}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-950 border border-white/5 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
              ATTEMPT STATUS
            </span>
            <div
              className={`font-mono text-xs font-bold uppercase ${
                isTerminated ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {status}
            </div>
          </div>
        </div>

        {/* Security & Topics Flag */}
        <div className="p-4 rounded-xl bg-surface-950 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <ShieldCheck
              className={`w-5 h-5 ${
                securityStatus === 'CLEAN' ? 'text-emerald-400' : 'text-amber-400'
              }`}
            />
            <span className="text-slate-300">
              Integrity Status:{' '}
              <strong
                className={
                  securityStatus === 'CLEAN' ? 'text-emerald-400' : 'text-amber-400'
                }
              >
                {securityStatus}
              </strong>
            </span>
          </div>

          {resultData.selectedTopics && resultData.selectedTopics.length > 0 && (
            <div className="text-electric-cyan font-semibold">
              {resultData.selectedTopics.length} Topics Evaluated
            </div>
          )}

          <div className="text-slate-500 text-[11px]">
            {submittedAt ? new Date(submittedAt).toLocaleTimeString() : 'Recorded'}
          </div>
        </div>

        {/* Permanent Lock Warning */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 leading-relaxed font-light">
          <Lock className="w-4 h-4 text-electric-cyan flex-shrink-0 mt-0.5" />
          <span>
            <strong className="text-white font-medium">Single Attempt Policy Enforced:</strong> Your
            Roll Number has been marked as completed for this assessment. Any attempt to start a new
            session with this Roll Number will be rejected by the server.
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-white/15 bg-surface-800 hover:bg-surface-700 text-white text-xs font-mono font-medium flex items-center justify-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>PRINT RECEIPT</span>
          </button>

          <button
            type="button"
            onClick={onReturnHome}
            className="w-full sm:flex-1 py-3.5 rounded-xl bg-electric-cyan hover:bg-cyan-400 text-black font-bold text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-glow-blue"
          >
            <Home className="w-4 h-4" />
            <span>RETURN TO PORTAL</span>
          </button>
        </div>
      </div>
    </div>
  );
}
