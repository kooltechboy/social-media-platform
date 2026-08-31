'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FlaskConical, Check, MessageSquare, Star, Send } from 'lucide-react';
import type { LabsProgram } from '../../lib/recognition/types';

interface LabsProgramListProps {
  programs: LabsProgram[];
  isAuthenticated: boolean;
}

export default function LabsProgramList({
  programs: initialPrograms,
  isAuthenticated,
}: LabsProgramListProps) {
  const [programs, setPrograms] = useState<LabsProgram[]>(initialPrograms);
  const [feedbackProgramId, setFeedbackProgramId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const handleToggleJoin = async (program: LabsProgram) => {
    if (!isAuthenticated) return;

    const endpoint = `/api/recognition/labs/${program.id}/join`;
    const method = program.is_member ? 'DELETE' : 'POST';

    try {
      const res = await fetch(endpoint, { method });
      if (res.ok) {
        setPrograms((prev) =>
          prev.map((p) =>
            p.id === program.id
              ? {
                  ...p,
                  is_member: !p.is_member,
                  current_participants_count: p.is_member
                    ? p.current_participants_count - 1
                    : p.current_participants_count + 1,
                }
              : p
          )
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackProgramId || !feedbackText.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/recognition/labs/${feedbackProgramId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback_text: feedbackText, reported_issue: false }),
      });

      if (res.ok) {
        setFeedbackSuccess(true);
        setTimeout(() => {
          setFeedbackProgramId(null);
          setFeedbackText('');
          setFeedbackSuccess(false);
        }, 1800);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (programs.length === 0) {
    return (
      <div className="bg-brand-dusk/40 border border-dashed border-slate-800 rounded-3xl p-10 text-center space-y-2">
        <FlaskConical className="w-8 h-8 mx-auto text-brand-sandstone/20" />
        <h3 className="text-sm font-bold text-brand-sandstone">No Active Beta Features</h3>
        <p className="text-xs text-brand-sandstone/50 max-w-sm mx-auto">
          New experimental features and creator cohorts will be announced here soon.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {programs.map((program) => (
        <div
          key={program.id}
          className="bg-brand-dusk/60 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                  {program.status}
                </span>
                <span className="text-xs font-mono text-brand-sandstone/40">
                  {program.feature_key}
                </span>
              </div>
              <h3 className="text-base font-black text-brand-sandstone mt-1">{program.title}</h3>
            </div>

            <div className="flex items-center gap-2">
              {program.is_member && (
                <button
                  onClick={() => setFeedbackProgramId(feedbackProgramId === program.id ? null : program.id)}
                  className="bg-slate-800 hover:bg-slate-700 text-brand-sandstone text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-brand-caribbeanSea" />
                  <span>Feedback</span>
                </button>
              )}

              {isAuthenticated ? (
                <button
                  onClick={() => handleToggleJoin(program)}
                  className={`text-xs font-black px-4 py-2 rounded-xl transition-all ${
                    program.is_member
                      ? 'bg-slate-800 text-emerald-300 border border-emerald-500/30 hover:bg-red-950/40 hover:text-red-300 hover:border-red-500/30'
                      : 'bg-brand-caribbeanSea text-slate-950 hover:brightness-110'
                  }`}
                >
                  {program.is_member ? 'Enrolled (Leave)' : 'Opt In'}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2 rounded-xl border border-slate-700"
                >
                  Sign In to Join
                </Link>
              )}
            </div>
          </div>

          <p className="text-xs text-brand-sandstone/70 leading-relaxed">{program.description}</p>

          {/* Feedback Form Tray */}
          {feedbackProgramId === program.id && (
            <form
              onSubmit={handleSendFeedback}
              className="mt-4 pt-4 border-t border-slate-800/80 space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 animate-fadeIn"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-sandstone flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-400" /> Rate Experience:
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-sm ${rating >= star ? 'text-amber-400' : 'text-slate-600'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share your thoughts, suggestions, or issues found in this beta feature..."
                rows={3}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-brand-sandstone placeholder:text-brand-sandstone/40 focus:outline-none focus:border-brand-caribbeanSea"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFeedbackProgramId(null)}
                  className="text-xs text-brand-sandstone/50 hover:text-slate-200 px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || feedbackSuccess}
                  className="bg-brand-caribbeanSea text-slate-950 text-xs font-black px-4 py-1.5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {feedbackSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Sent!
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Submit Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}
