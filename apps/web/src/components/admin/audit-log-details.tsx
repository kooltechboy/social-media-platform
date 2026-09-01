'use client';

import React, { useState } from 'react';
import { Eye, Code, X } from 'lucide-react';

export default function AuditLogDetails({
  metadata,
  action,
}: {
  metadata: Record<string, unknown> | null;
  action: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className="text-slate-600 text-xs">—</span>;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-sandstone/60 hover:text-brand-sandstone bg-brand-dusk hover:bg-brand-sunsetPurple/40 border border-brand-sunsetPurple/30 px-2 py-1 rounded-lg transition-colors"
      >
        <Code className="w-3.5 h-3.5 text-brand-caribbeanSea" /> View Payload
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-brand-dusk border border-brand-sunsetPurple/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-brand-sunsetPurple/20 pb-3">
              <h3 className="text-sm font-bold text-brand-sandstone flex items-center gap-2">
                <Code className="w-4 h-4 text-brand-caribbeanSea" /> Audit Payload ({action})
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-300 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <pre className="bg-brand-twilight border border-brand-sunsetPurple/20 rounded-xl p-4 text-xs font-mono text-emerald-300 overflow-x-auto max-h-80">
              {JSON.stringify(metadata, null, 2)}
            </pre>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setIsOpen(false)}
                className="bg-brand-dusk hover:bg-slate-700 text-brand-sandstone font-bold px-4 py-2 rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
