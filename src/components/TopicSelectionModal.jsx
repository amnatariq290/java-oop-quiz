import React, { useState, useEffect } from 'react';
import { Layers, Check, AlertCircle, ArrowRight, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';
import { labAudio } from '../utils/audio';

export default function TopicSelectionModal({ student, onTopicsConfirmed }) {
  const [topics, setTopics] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [minTopics, setMinTopics] = useState(2);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetch('/api/quiz/topics')
      .then(res => res.json())
      .then(data => {
        setTopics(data.topics || []);
        setMinTopics(data.minTopics || 2);
        // Default select first 3 topics for smooth initial state
        const initial = (data.topics || []).slice(0, 3).map(t => t.id);
        setSelectedIds(initial);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const toggleTopic = (id) => {
    labAudio.playTick();
    setErrorMsg(null);
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(t => t !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleConfirm = () => {
    if (selectedIds.length < minTopics) {
      labAudio.playWarning();
      setErrorMsg(`Please select at least ${minTopics} topics before continuing.`);
      return;
    }

    labAudio.playSuccess();
    onTopicsConfirmed(selectedIds);
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-12 text-center text-slate-400 font-mono text-xs">
        Loading Java OOP syllabus topics...
      </div>
    );
  }

  const isEligible = selectedIds.length >= minTopics;

  return (
    <div className="w-full max-w-3xl mx-auto p-6 md:p-8 glass-panel rounded-3xl border border-white/10 shadow-2xl relative backdrop-blur-2xl space-y-6">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-electric-cyan to-transparent"></div>

      {/* Top Header */}
      <div className="border-b border-white/10 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-electric-cyan">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SYLLABUS SELECTION PROTOCOL</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
            SELECT YOUR QUIZ TOPICS
          </h2>
          <p className="text-xs text-slate-400 font-light mt-0.5">
            Select the Java OOP topics included in your course syllabus. Questions will be generated exclusively from your chosen topics.
          </p>
        </div>

        {/* Selected count pill */}
        <div className={`px-4 py-2 rounded-xl border font-mono text-xs font-bold transition-all flex items-center gap-2 ${
          isEligible
            ? 'bg-electric-cyan/15 border-electric-cyan/50 text-electric-cyan shadow-glow-blue'
            : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
        }`}>
          <span>{selectedIds.length} TOPICS SELECTED</span>
          {isEligible && <CheckCircle2 className="w-4 h-4" />}
        </div>
      </div>

      {/* Candidate Banner */}
      <div className="p-3.5 rounded-xl bg-surface-950/80 border border-white/5 flex items-center justify-between text-xs font-mono text-slate-400">
        <div>
          CANDIDATE: <span className="text-white font-bold">{student.name}</span>
        </div>
        <div>
          ROLL NO: <span className="text-electric-cyan font-bold">{student.rollNumber}</span>
        </div>
      </div>

      {/* Warning message if < minimum */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Topics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
        {topics.map((t) => {
          const isSelected = selectedIds.includes(t.id);
          return (
            <div
              key={t.id}
              onClick={() => toggleTopic(t.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all duration-150 relative flex items-start gap-3.5 ${
                isSelected
                  ? 'bg-electric-cyan/10 border-electric-cyan shadow-glow-blue text-white'
                  : 'bg-surface-950/70 border-white/5 text-slate-300 hover:border-white/20 hover:bg-surface-950'
              }`}
            >
              {/* Checkbox indicator */}
              <div className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${
                isSelected
                  ? 'bg-electric-cyan border-electric-cyan text-black'
                  : 'bg-surface-900 border-white/20'
              }`}>
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>

              {/* Topic Information */}
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500 uppercase">{t.category}</span>
                </div>
                <div className="text-sm font-bold tracking-tight text-white">
                  {t.name}
                </div>
                <p className="text-xs text-slate-400 font-light leading-relaxed">
                  {t.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs font-mono text-slate-400">
          {selectedIds.length < minTopics ? (
            <span className="text-amber-400">⚠ Select at least {minTopics - selectedIds.length} more topic(s) to proceed.</span>
          ) : (
            <span className="text-emerald-400">✓ Syllabus criteria satisfied ({selectedIds.length} topics).</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!isEligible}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-electric-cyan hover:bg-cyan-400 text-black font-bold font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-glow-blue disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>CONFIRM TOPICS & CONTINUE</span>
          <ArrowRight className="w-4 h-4 text-black" />
        </button>
      </div>
    </div>
  );
}
