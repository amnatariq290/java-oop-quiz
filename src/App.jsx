import React, { useState, useEffect } from 'react';
import Hero3DCanvas from './components/Hero3DCanvas';
import CinematicScrollIntro from './components/CinematicScrollIntro';
import StudentLoginCard from './components/StudentLoginCard';
import TopicSelectionModal from './components/TopicSelectionModal';
import PreQuizSecurityCheck from './components/PreQuizSecurityCheck';
import QuizCockpit from './components/QuizCockpit';
import ResultScreen from './components/ResultScreen';
import AssessmentTerminatedScreen from './components/AssessmentTerminatedScreen';
import InstructorAdminPortal from './components/InstructorAdminPortal';
import { Volume2, VolumeX, Shield, ArrowRight, Lock, Award, Terminal } from 'lucide-react';
import { labAudio } from './utils/audio';

export default function App() {
  const [view, setView] = useState('LANDING'); // 'LANDING' | 'INTRO' | 'LOGIN' | 'TOPIC_SELECTION' | 'SECURITY_CHECK' | 'QUIZ' | 'RESULT' | 'TERMINATED' | 'ADMIN'
  const [student, setStudent] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [terminationReason, setTerminationReason] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  // Check URL query for #admin or ?admin
  useEffect(() => {
    if (window.location.hash === '#admin' || window.location.search.includes('admin')) {
      setView('ADMIN');
    }
  }, []);

  const toggleSound = () => {
    labAudio.muted = !labAudio.muted;
    setIsMuted(labAudio.muted);
    if (!labAudio.muted) {
      labAudio.playTick();
    }
  };

  // 1. Student Authorized at Login Card
  const handleStudentAuthorized = ({ student: stu, resumed, attemptId, remainingSeconds, questions, savedAnswers, selectedTopics }) => {
    setStudent(stu);
    if (resumed) {
      // Re-fetch quiz state for in-progress attempt directly
      fetch('/api/quiz/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollNumber: stu.rollNumber, name: stu.name })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setQuizData(data);
            setView('QUIZ');
          } else {
            setView('TOPIC_SELECTION');
          }
        })
        .catch(() => setView('TOPIC_SELECTION'));
    } else {
      // Proceed to Topic Selection
      setView('TOPIC_SELECTION');
    }
  };

  // 2. Student Confirms Topics
  const handleTopicsConfirmed = (selectedTopicIds) => {
    setStudent((prev) => ({
      ...prev,
      selectedTopicIds
    }));
    setView('SECURITY_CHECK');
  };

  // 3. Pre-quiz security passed, quiz begins
  const handleQuizReady = (data) => {
    setQuizData(data);
    setView('QUIZ');
  };

  // 4. Quiz Submitted
  const handleQuizSubmitted = (attemptResult) => {
    setResultData(attemptResult);
    setView('RESULT');
  };

  // 5. Security violation termination
  const handleAssessmentTerminated = (reason) => {
    setTerminationReason(reason);
    setView('TERMINATED');
  };

  // 6. Return Home
  const handleReturnHome = () => {
    setView('LANDING');
    setStudent(null);
    setQuizData(null);
    setResultData(null);
    setTerminationReason(null);
  };

  return (
    <div className="relative min-h-screen bg-background text-slate-100 font-sans selection:bg-electric-cyan/20 selection:text-electric-cyan">
      {/* GLOBAL TOP NAV (Visible when not in full quiz mode) */}
      {view !== 'QUIZ' && view !== 'ADMIN' && (
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between border-b border-white/5 bg-surface-950/60 backdrop-blur-md">
          <div
            onClick={handleReturnHome}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-surface-900 border border-white/10 flex items-center justify-center text-electric-cyan font-mono font-bold text-sm shadow-inner group-hover:border-electric-cyan/50 transition-colors">
              ☕
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-xs font-black tracking-tight text-white group-hover:text-electric-cyan transition-colors">
                JAVA OOP // CODE CHALLENGE
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Official University Assessment System
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="p-2 rounded-xl bg-surface-900 border border-white/10 text-slate-400 hover:text-white transition-all text-xs flex items-center gap-1.5"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-electric-cyan" />}
            </button>

            {/* Instructor Portal Link */}
            <button
              onClick={() => {
                labAudio.playTick();
                setView('ADMIN');
              }}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-all"
            >
              <Lock className="w-3.5 h-3.5 text-electric-cyan" />
              <span>INSTRUCTOR PORTAL</span>
            </button>
          </div>
        </nav>
      )}

      {/* VIEW 1: HERO / LANDING */}
      {view === 'LANDING' && (
        <section className="relative min-h-screen flex flex-col justify-center items-center px-6 pt-24 pb-16 overflow-hidden">
          {/* 3D Interactive Background Canvas */}
          <Hero3DCanvas />

          {/* Ambient Studio Lighting Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-electric-cyan/5 rounded-full blur-[160px] pointer-events-none"></div>

          {/* Center Content Card */}
          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 pointer-events-auto">
            {/* Academic Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-900/90 border border-white/10 shadow-lg text-xs font-mono text-slate-300 backdrop-blur-xl animate-in fade-in duration-700">
              <span className="w-2 h-2 rounded-full bg-electric-cyan animate-pulse"></span>
              <span>10 MINUTES • OBJECT-ORIENTED PROGRAMMING • ONE ATTEMPT</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-1">
              <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tightest leading-none text-white uppercase font-sans">
                JAVA OOP
              </h1>
              <h2 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tightest leading-none text-transparent bg-clip-text bg-gradient-to-r from-electric-cyan via-slate-100 to-electric-violet uppercase font-sans">
                CODE CHALLENGE
              </h2>
            </div>

            {/* Subtitle */}
            <p className="text-base sm:text-xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
              A high-stakes examination cockpit engineered for strict academic rigor.
              Evaluate encapsulation, polymorphism, inheritance, and architectural problem-solving.
            </p>

            {/* CTAs */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => {
                  labAudio.playSelect();
                  setView('INTRO');
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-electric-cyan hover:bg-cyan-300 text-black font-bold font-mono text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-glow-blue transition-all group"
              >
                <span>ENTER THE CHALLENGE</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => {
                  labAudio.playTick();
                  setView('LOGIN');
                }}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-surface-900/80 hover:bg-surface-800 border border-white/10 text-white font-mono text-sm tracking-wider uppercase transition-all backdrop-blur-md"
              >
                DIRECT LOGIN
              </button>
            </div>

            <div className="pt-2 text-xs font-mono text-slate-500">
              Present Students Only • Enforced Anti-Cheat Proctoring Active
            </div>
          </div>
        </section>
      )}

      {/* VIEW 2: CINEMATIC SCROLL INTRO */}
      {view === 'INTRO' && (
        <section className="relative min-h-screen pt-20 pb-12 flex items-center justify-center">
          <CinematicScrollIntro onComplete={() => setView('LOGIN')} />
        </section>
      )}

      {/* VIEW 3: SIMPLIFIED STUDENT LOGIN */}
      {view === 'LOGIN' && (
        <section className="relative min-h-screen pt-24 pb-16 flex items-center justify-center px-4">
          <div className="w-full">
            <StudentLoginCard
              onStudentAuthorized={handleStudentAuthorized}
              onGoToAdmin={() => setView('ADMIN')}
            />
          </div>
        </section>
      )}

      {/* VIEW 4: TOPIC SELECTION (Min 2 topics required) */}
      {view === 'TOPIC_SELECTION' && student && (
        <section className="relative min-h-screen pt-24 pb-16 flex items-center justify-center px-4">
          <div className="w-full">
            <TopicSelectionModal
              student={student}
              onTopicsConfirmed={handleTopicsConfirmed}
            />
          </div>
        </section>
      )}

      {/* VIEW 5: PRE-QUIZ SECURITY CHECK */}
      {view === 'SECURITY_CHECK' && student && (
        <section className="relative min-h-screen pt-24 pb-16 flex items-center justify-center px-4">
          <div className="w-full">
            <PreQuizSecurityCheck
              student={student}
              onQuizReady={handleQuizReady}
            />
          </div>
        </section>
      )}

      {/* VIEW 6: QUIZ COCKPIT */}
      {view === 'QUIZ' && quizData && student && (
        <QuizCockpit
          quizData={quizData}
          student={student}
          onQuizSubmitted={handleQuizSubmitted}
          onTerminated={handleAssessmentTerminated}
        />
      )}

      {/* VIEW 7: RESULT SCREEN */}
      {view === 'RESULT' && resultData && (
        <ResultScreen
          resultData={resultData}
          onReturnHome={handleReturnHome}
        />
      )}

      {/* VIEW 8: SECURITY TERMINATION SCREEN */}
      {view === 'TERMINATED' && (
        <AssessmentTerminatedScreen
          reason={terminationReason}
          student={student}
          onReturnHome={handleReturnHome}
        />
      )}

      {/* VIEW 9: INSTRUCTOR ADMIN CONTROL PORTAL */}
      {view === 'ADMIN' && (
        <InstructorAdminPortal
          onExitToStudentPortal={() => setView('LANDING')}
        />
      )}
    </div>
  );
}
