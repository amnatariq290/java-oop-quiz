import React, { useState, useEffect } from 'react';
import { ShieldAlert, Maximize2, CheckCircle2, AlertTriangle, Eye, Flame, Play } from 'lucide-react';
import { labAudio } from '../utils/audio';

export default function PreQuizSecurityCheck({ student, onQuizReady }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [countdown, setCountdown] = useState(null); // 'READY?', '3', '2', '1', 'BEGIN'

  useEffect(() => {
    const checkFullscreen = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', checkFullscreen);
    return () => document.removeEventListener('fullscreenchange', checkFullscreen);
  }, []);

  const requestFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        labAudio.playSelect();
      }
    } catch (err) {
      console.warn("Fullscreen request bypassed or blocked:", err);
      // Allow student to proceed even if browser blocks fullscreen request API
      setIsFullscreen(true);
    }
  };

  const handleStartSequence = async () => {
    if (!agreed) return;
    setIsStarting(true);
    labAudio.playTick();

    // Ensure fullscreen
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (e) {}
    }

    // Sequence: READY? -> 3 -> 2 -> 1 -> BEGIN
    const steps = ['READY?', '3', '2', '1', 'BEGIN'];
    for (let i = 0; i < steps.length; i++) {
      setCountdown(steps[i]);
      if (steps[i] === 'BEGIN') {
        labAudio.playSuccess();
      } else {
        labAudio.playTick();
      }
      await new Promise(res => setTimeout(res, 750));
    }

    // Call server to start quiz
    try {
      const res = await fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollNumber: student.rollNumber,
          name: student.name,
          selectedTopicIds: student.selectedTopicIds || [],
          sessionId: Math.random().toString(36).substring(2)
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || data.error || "Unable to start quiz session.");
        setIsStarting(false);
        setCountdown(null);
        return;
      }

      onQuizReady(data);
    } catch (err) {
      console.error(err);
      alert("Network error communicating with assessment engine.");
      setIsStarting(false);
      setCountdown(null);
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto p-6 md:p-8 glass-panel rounded-2xl border border-white/10 shadow-2xl backdrop-blur-2xl">
      {/* Dramatic Countdown Overlay */}
      {countdown && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-3xl z-50 rounded-2xl flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="text-xs font-mono text-electric-cyan tracking-widest uppercase mb-2">
            SYNCHRONIZING SECURE ENVIRONMENT
          </div>
          <div className="text-6xl md:text-8xl font-black font-mono text-white text-glow animate-pulse">
            {countdown}
          </div>
          <div className="text-xs text-slate-500 font-mono mt-4">
            ROLL NO: {student.rollNumber} • CANDIDATE: {student.name}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-white/10 pb-5 mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-electric-cyan">
            <span className="w-2 h-2 rounded-full bg-electric-cyan animate-pulse"></span>
            <span>DIAGNOSTIC PROTOCOL // MANDATORY</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
            SECURITY CHECK & ASSESSMENT RULES
          </h2>
        </div>
        <div className="text-right font-mono text-xs text-slate-400">
          <div>ROLL: <span className="text-white font-bold">{student.rollNumber}</span></div>
          <div className="text-slate-400">{student.name}</div>
        </div>
      </div>

      {/* Fullscreen requirement pill */}
      <div className="mb-6 p-4 rounded-xl bg-surface-900 border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isFullscreen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
            <Maximize2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">
              {isFullscreen ? "Fullscreen Verified" : "Fullscreen Mode Required"}
            </div>
            <div className="text-xs text-slate-400">
              Exam cockpit operates exclusively in distraction-free fullscreen.
            </div>
          </div>
        </div>

        {!isFullscreen ? (
          <button
            type="button"
            onClick={requestFullscreen}
            className="px-4 py-2 rounded-lg bg-electric-cyan/20 hover:bg-electric-cyan/30 border border-electric-cyan/40 text-electric-cyan text-xs font-mono font-semibold transition-all"
          >
            ENTER FULLSCREEN
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
            <CheckCircle2 className="w-4 h-4" />
            <span>ACTIVE</span>
          </div>
        )}
      </div>

      {/* Strict Examination Rules */}
      <div className="space-y-3 mb-6">
        <div className="text-xs font-mono uppercase tracking-widest text-slate-400">
          Enforced Examination Code of Conduct
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
          {[
            { num: "01", text: "One attempt only. Submissions are irreversible." },
            { num: "02", text: "Time limit: 10 minutes strictly server-enforced." },
            { num: "03", text: "Do not switch browser tabs or minimize window." },
            { num: "04", text: "Do not exit fullscreen mode at any time." },
            { num: "05", text: "Clipboard cut, copy, and paste are disabled." },
            { num: "06", text: "Developer inspection tools are strictly prohibited." },
            { num: "07", text: "Do not open secondary background applications." },
            { num: "08", text: "Security violations will automatically terminate the attempt." }
          ].map((rule) => (
            <div
              key={rule.num}
              className="p-3 rounded-lg bg-surface-950/70 border border-white/5 flex items-start gap-2.5 text-slate-300 font-light"
            >
              <span className="font-mono text-electric-cyan font-semibold">{rule.num}.</span>
              <span className="leading-snug">{rule.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Checkbox */}
      <div className="mb-6 p-4 rounded-xl bg-surface-950 border border-white/10 flex items-start gap-3">
        <input
          type="checkbox"
          id="rules-agree"
          checked={agreed}
          onChange={(e) => {
            setAgreed(e.target.checked);
            labAudio.playTick();
          }}
          className="mt-1 w-4 h-4 rounded bg-surface-900 border-white/20 text-electric-cyan focus:ring-electric-cyan cursor-pointer"
        />
        <label htmlFor="rules-agree" className="text-xs text-slate-300 cursor-pointer leading-relaxed">
          I affirm my identity as <span className="text-white font-semibold">{student.name}</span> (<span className="font-mono text-electric-cyan">{student.rollNumber}</span>).
          I acknowledge that this assessment is monitored, my answers autosave continuously, and any unauthorized window defocus or tab switch will be logged and may terminate my attempt.
        </label>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStartSequence}
        disabled={!agreed || isStarting}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-electric-cyan via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-bold tracking-wider uppercase text-sm shadow-glow-blue transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed group"
      >
        <Play className="w-4 h-4 fill-black text-black group-hover:scale-110 transition-transform" />
        <span>I UNDERSTAND — START QUIZ</span>
      </button>
    </div>
  );
}
