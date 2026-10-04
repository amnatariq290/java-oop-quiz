import React, { useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Lock, FileWarning, ArrowLeft, HelpCircle } from 'lucide-react';
import { labAudio } from '../utils/audio';

export default function AssessmentTerminatedScreen({ reason, student, onReturnHome }) {
  useEffect(() => {
    labAudio.playWarning();
  }, []);

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col justify-center items-center p-4 md:p-8 relative overflow-hidden select-none">
      {/* Background Red Warning Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="w-full max-w-xl bg-surface-900 border border-red-500/50 rounded-3xl p-6 md:p-10 glass-panel shadow-glow-danger relative z-10 space-y-6 text-center animate-in zoom-in-95 duration-400">
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center animate-pulse">
          <ShieldAlert className="w-9 h-9" />
        </div>

        {/* Headline */}
        <div className="space-y-1.5">
          <span className="text-xs font-mono uppercase tracking-widest text-red-400">
            SECURITY LOCKOUT PROTOCOL ACTIVATED
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase">
            ASSESSMENT TERMINATED
          </h1>
          <p className="text-xs md:text-sm text-slate-400 font-light">
            Your assessment session was interrupted due to an enforced anti-cheating policy breach.
          </p>
        </div>

        {/* Reason Box */}
        <div className="p-5 rounded-2xl bg-red-950/40 border border-red-500/30 text-left space-y-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-red-300 font-semibold border-b border-red-500/20 pb-2">
            <FileWarning className="w-4 h-4 text-red-400" />
            <span>RECORDED VIOLATION:</span>
          </div>
          <div className="text-white text-sm font-bold pl-1">
            {reason || 'Leaving the assessment environment was detected (TAB_SWITCH)'}
          </div>
          <div className="text-slate-400 text-[11px] pt-1">
            TIMESTAMP: {new Date().toLocaleTimeString()} • INCIDENT CODE: SEC-TERM-01
          </div>
        </div>

        {/* Student Metadata Card */}
        {student && (
          <div className="grid grid-cols-2 gap-3 text-left font-mono text-xs">
            <div className="p-3 rounded-xl bg-surface-950 border border-white/5">
              <span className="text-[10px] text-slate-500 uppercase block">CANDIDATE ROLL</span>
              <span className="text-electric-cyan font-bold">{student.rollNumber}</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-950 border border-white/5">
              <span className="text-[10px] text-slate-500 uppercase block">CANDIDATE NAME</span>
              <span className="text-white font-medium truncate block">{student.name}</span>
            </div>
          </div>
        )}

        {/* Policy Notice */}
        <p className="text-xs text-slate-400 font-light leading-relaxed text-left p-3.5 rounded-xl bg-white/5 border border-white/10">
          In strict assessment mode, exiting fullscreen, opening developer tools, or switching browser tabs immediately locks the attempt.
          Your previous answers have been preserved and marked as <strong className="text-red-300">TERMINATED</strong> on the instructor scoreboard.
        </p>

        {/* Return Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onReturnHome}
            className="w-full py-3.5 rounded-xl bg-surface-800 hover:bg-surface-700 border border-white/15 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO HOME SCREEN</span>
          </button>
        </div>
      </div>
    </div>
  );
}
