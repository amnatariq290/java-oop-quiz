import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Terminal, Layers, Box, Cpu, GitFork, Zap } from 'lucide-react';
import { labAudio } from '../utils/audio';

export default function CinematicScrollIntro({ onComplete }) {
  const [stage, setStage] = useState(0);
  const [timerText, setTimerText] = useState("10:00");

  const assemblySteps = [
    { name: "CLASS", sub: "Blueprint & State Definition", icon: Box, color: "#38bdf8", desc: "Abstract data structures blueprinting memory layout" },
    { name: "OBJECT", sub: "Heap Allocation & Identity", icon: Layers, color: "#818cf8", desc: "Concrete instantiation living within the JVM heap" },
    { name: "METHOD", sub: "Behavioral Message Dispatch", icon: Terminal, color: "#a855f7", desc: "Algorithmic operations modulating encapsulated state" },
    { name: "INHERITANCE", sub: "Hierarchical Specialization", icon: GitFork, color: "#c084fc", desc: "Code reuse through parent-child polymorphism" },
    { name: "POLYMORPHISM", sub: "Dynamic Runtime Resolution", icon: Zap, color: "#38bdf8", desc: "One interface, multiple concrete execution strategies" },
  ];

  // Auto progression or user click progression
  useEffect(() => {
    const handleScroll = (e) => {
      if (e.deltaY > 30 && stage < 3) {
        setStage(prev => Math.min(prev + 1, 3));
        labAudio.playTick();
      }
    };
    window.addEventListener('wheel', handleScroll, { passive: true });
    return () => window.removeEventListener('wheel', handleScroll);
  }, [stage]);

  const handleNext = () => {
    labAudio.playSelect();
    if (stage < 3) {
      setStage(stage + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="relative w-full min-h-[92vh] flex flex-col justify-between py-12 px-6 max-w-6xl mx-auto z-10">
      {/* Top Breadcrumb Indicator */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-electric-cyan animate-pulse"></span>
          <span>SYSTEM // ORIENTATION SEQUENCE</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((stepIdx) => (
              <button
                key={stepIdx}
                onClick={() => { setStage(stepIdx); labAudio.playTick(); }}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  stage === stepIdx
                    ? 'w-8 bg-electric-cyan'
                    : stage > stepIdx
                    ? 'w-4 bg-slate-600'
                    : 'w-4 bg-white/10'
                }`}
                title={`Stage ${stepIdx + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() => { labAudio.playTick(); onComplete(); }}
            className="text-slate-400 hover:text-white transition-colors underline decoration-slate-600 underline-offset-4"
          >
            SKIP TO LOGIN →
          </button>
        </div>
      </div>

      {/* Main Dynamic Stage Content */}
      <div className="my-auto py-8">
        {/* SCENE 1: ARCHITECTURAL OVERVIEW */}
        {stage === 0 && (
          <div className="space-y-6 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-electric-cyan/10 border border-electric-cyan/30 text-electric-cyan text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ACADEMIC ASSESSMENT PLATFORM</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tightest leading-tight text-white">
              The Architecture of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan via-indigo-300 to-electric-violet">
                Object-Oriented Programming
              </span>
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl font-light">
              Welcome to the official university evaluation cockpit. Here, code is not merely executed;
              it is engineered through strict encapsulation, polymorphic dispatch, and modular hierarchies.
            </p>
            <div className="pt-4 flex items-center gap-4">
              <button
                onClick={handleNext}
                className="px-6 py-3.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium flex items-center gap-2 backdrop-blur-md transition-all group"
              >
                <span>ASSEMBLE OOP CORE</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <span className="text-xs text-slate-500 font-mono">Or scroll mouse to progress</span>
            </div>
          </div>
        )}

        {/* SCENE 2: OOP CORE ASSEMBLY */}
        {stage === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
              <span className="text-xs font-mono text-electric-violet tracking-widest uppercase">Structural Assembly</span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mt-1">
                Constructing the OOP Paradigm
              </h2>
            </div>

            {/* Assembling 5 Layers */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {assemblySteps.map((step, idx) => {
                const IconComponent = step.icon;
                return (
                  <div
                    key={idx}
                    style={{ animationDelay: `${idx * 120}ms` }}
                    className="glass-panel p-5 rounded-xl border border-white/10 relative overflow-hidden group hover:border-electric-cyan/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-6"
                  >
                    <div className="w-10 h-10 rounded-lg bg-surface-900 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <IconComponent className="w-5 h-5" style={{ color: step.color }} />
                    </div>
                    <div className="text-xs font-mono text-slate-500 mb-1">STAGE 0{idx + 1}</div>
                    <h3 className="font-bold text-white text-base tracking-wide">{step.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{step.sub}</p>
                    <div className="mt-3 pt-3 border-t border-white/5 text-[11px] text-slate-500 font-mono leading-tight">
                      {step.desc}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleNext}
                className="px-6 py-3.5 rounded-lg bg-electric-cyan/20 hover:bg-electric-cyan/30 border border-electric-cyan/40 text-electric-cyan font-medium flex items-center gap-2 backdrop-blur-md transition-all group"
              >
                <span>PROCEED TO AXIOMS</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* SCENE 3: BOLD APPLE-STYLE TYPOGRAPHY SEQUENCE */}
        {stage === 2 && (
          <div className="space-y-12 max-w-4xl animate-in fade-in zoom-in-95 duration-700">
            <div className="space-y-4">
              <div className="text-4xl md:text-7xl font-black tracking-tightest text-slate-500/50 hover:text-slate-400 transition-colors">
                THINK IN OBJECTS.
              </div>
              <div className="text-4xl md:text-7xl font-black tracking-tightest text-slate-300 hover:text-white transition-colors">
                CODE WITH LOGIC.
              </div>
              <div className="text-4xl md:text-7xl font-black tracking-tightest text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan via-white to-electric-violet">
                PROVE WHAT YOU KNOW.
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-6">
              <p className="text-sm font-mono text-slate-400">
                10-Minute Assessment • Real-time Monitoring • Strict Integrity Mode
              </p>
              <button
                onClick={handleNext}
                className="px-7 py-3.5 rounded-lg bg-white text-black font-semibold hover:bg-slate-200 transition-all flex items-center gap-2 shadow-glow-blue"
              >
                <span>INITIATE TIMER PROJECTION</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* SCENE 4: 10:00 TIMER VISUAL PULSE & TRANSITION */}
        {stage === 3 && (
          <div className="text-center space-y-6 max-w-xl mx-auto animate-in fade-in zoom-in-90 duration-500">
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-400 uppercase tracking-widest">
              Standard Evaluation Window
            </div>
            <div className="text-7xl md:text-9xl font-mono font-black tracking-tighter text-white text-glow animate-pulse">
              10:00
            </div>
            <p className="text-slate-400 font-light text-base">
              Once you confirm identity and pass security diagnostics, the 600-second server countdown begins.
              No browser refreshes will restore consumed time.
            </p>
            <div className="pt-6">
              <button
                onClick={() => { labAudio.playSelect(); onComplete(); }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-electric-cyan to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-bold tracking-wider uppercase text-sm shadow-glow-blue transition-all flex items-center justify-center gap-3"
              >
                <span>AUTHENTICATE & ENTER ASSESSMENT</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer System Specs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px] font-mono text-slate-500 border-t border-white/5 pt-4">
        <div>MODULE: CS-301 ADV JAVA OOP</div>
        <div>TIME LIMIT: 10 MINUTES</div>
        <div>QUESTION TYPES: MCQ / BLANK / SCENARIO</div>
        <div>SESSION: ONE ATTEMPT RECORDED</div>
      </div>
    </div>
  );
}
