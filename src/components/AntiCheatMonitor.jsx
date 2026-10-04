import React, { useEffect, useState, useRef } from 'react';
import { ShieldAlert, AlertTriangle, EyeOff, Maximize, Lock } from 'lucide-react';
import { labAudio } from '../utils/audio';

export default function AntiCheatMonitor({
  attemptId,
  rollNumber,
  studentName,
  settings,
  onTerminated
}) {
  const [warningModal, setWarningModal] = useState(null); // { type, message, countdown }
  const violationCountRef = useRef(0);
  const isTerminatedRef = useRef(false);

  const reportSecurityEvent = async (eventType, details, severity = 'DETECTED') => {
    if (isTerminatedRef.current) return;

    labAudio.playWarning();
    try {
      const res = await fetch('/api/quiz/security-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          rollNumber,
          studentName,
          eventType,
          details,
          severity
        })
      });

      const data = await res.json();
      violationCountRef.current = data.violationCount || (violationCountRef.current + 1);

      if (data.terminated) {
        isTerminatedRef.current = true;
        setWarningModal(null);
        onTerminated(data.terminationReason || `Assessment Terminated: ${eventType}`);
        return;
      }

      // If not yet terminated, display a high-severity warning banner
      setWarningModal({
        type: eventType,
        message: `Security Warning: ${details}. Repeated violations will permanently terminate your assessment.`,
        severity
      });
    } catch (err) {
      console.error("Failed reporting security event:", err);
    }
  };

  useEffect(() => {
    // 1. Tab switching / Visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        reportSecurityEvent(
          'TAB_SWITCH',
          'Assessment tab hidden or user switched away from exam window',
          'DETECTED'
        );
      }
    };

    // 2. Window Blur / Focus
    const handleWindowBlur = () => {
      // Blur can also be triggered when clicking devtools or switching applications
      reportSecurityEvent(
        'WINDOW_FOCUS_LOST',
        'Window lost focus; possible application switch or secondary monitor click',
        'DETECTED'
      );
    };

    // 3. Fullscreen Exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        reportSecurityEvent(
          'FULLSCREEN_EXIT',
          'Candidate exited required examination fullscreen view',
          'DETECTED'
        );
      }
    };

    // 4. Copy / Paste / Cut Prevention
    const handleCopy = (e) => {
      if (settings?.copyPasteDisabled ?? true) {
        e.preventDefault();
        reportSecurityEvent('COPY_PASTE_ATTEMPT', 'Candidate attempted to copy assessment content', 'DETECTED');
      }
    };

    const handlePaste = (e) => {
      if (settings?.copyPasteDisabled ?? true) {
        e.preventDefault();
        reportSecurityEvent('COPY_PASTE_ATTEMPT', 'Candidate attempted to paste external text', 'DETECTED');
      }
    };

    const handleCut = (e) => {
      if (settings?.copyPasteDisabled ?? true) {
        e.preventDefault();
        reportSecurityEvent('COPY_PASTE_ATTEMPT', 'Candidate attempted to cut assessment text', 'DETECTED');
      }
    };

    // 5. Right-click / Context Menu Prevention
    const handleContextMenu = (e) => {
      if (settings?.rightClickDisabled ?? true) {
        e.preventDefault();
        reportSecurityEvent('RIGHT_CLICK_ATTEMPT', 'Candidate attempted to open context menu', 'DETECTED');
      }
    };

    // 6. Keyboard Shortcut Block (DevTools, PrintScreen, Inspect)
    const handleKeyDown = (e) => {
      const key = e.key;
      const ctrl = e.ctrlKey || e.metaKey;

      // Screenshot detection: PrintScreen
      if (key === 'PrintScreen') {
        reportSecurityEvent(
          'POSSIBLE_SCREEN_CAPTURE',
          'PrintScreen key combination triggered',
          'POSSIBLE'
        );
      }

      // Windows Snipping tool / Mac screenshot (Win+Shift+S or Cmd+Shift+3/4)
      if ((e.shiftKey && (key === 'S' || key === 's') && (e.metaKey || ctrl)) ||
          (e.metaKey && e.shiftKey && (key === '3' || key === '4' || key === '5'))) {
        reportSecurityEvent(
          'POSSIBLE_SCREEN_CAPTURE',
          'Operating-system screenshot shortcut invoked',
          'POSSIBLE'
        );
      }

      // Prohibit F12 (DevTools)
      if (key === 'F12') {
        e.preventDefault();
        reportSecurityEvent('DEVTOOLS_ATTEMPT', 'F12 Developer Tools key intercepted', 'DETECTED');
      }

      // Prohibit Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
      if (ctrl && (e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(key))) {
        e.preventDefault();
        reportSecurityEvent('DEVTOOLS_ATTEMPT', 'Developer Tools shortcut intercepted', 'DETECTED');
      }

      if (ctrl && (key === 'U' || key === 'u')) {
        e.preventDefault();
        reportSecurityEvent('DEVTOOLS_ATTEMPT', 'View Source shortcut intercepted', 'DETECTED');
      }
    };

    // 7. DevTools Window Dimension Heuristic
    const checkDevToolsDimensions = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > threshold || heightDiff > threshold) {
        // Devtools may be docked
        reportSecurityEvent(
          'DEVTOOLS_ATTEMPT',
          'Viewport dimension anomaly indicating docked developer tools',
          'DETECTED'
        );
      }
    };

    const dimensionInterval = setInterval(checkDevToolsDimensions, 4000);

    // Register all listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(dimensionInterval);
    };
  }, [attemptId, rollNumber, studentName, settings]);

  const resumeFromWarning = async () => {
    // Re-request fullscreen if lost
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (e) {}
    }
    setWarningModal(null);
    labAudio.playTick();
  };

  return (
    <>
      {/* Warning Modal if a non-fatal violation occurred */}
      {warningModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface-900 border border-amber-500/50 rounded-2xl p-6 shadow-glow-danger text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center animate-bounce">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono text-amber-400 tracking-widest uppercase">
                SECURITY VIOLATION DETECTED
              </span>
              <h3 className="text-xl font-bold text-white uppercase">
                {warningModal.type.replace(/_/g, ' ')}
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-light">
              {warningModal.message}
            </p>

            <div className="p-3 rounded-lg bg-surface-950 border border-white/5 text-[11px] font-mono text-slate-400 text-left">
              <div>EVENT: <span className="text-amber-400">{warningModal.type}</span></div>
              <div>CLASSIFICATION: <span className="text-white">{warningModal.severity}</span></div>
              <div>CANDIDATE: <span className="text-white">{rollNumber}</span></div>
            </div>

            <button
              onClick={resumeFromWarning}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono text-xs uppercase tracking-wider transition-all"
            >
              ACKNOWLEDGE & RETURN TO ASSESSMENT
            </button>
          </div>
        </div>
      )}
    </>
  );
}
