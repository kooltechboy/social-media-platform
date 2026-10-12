import React from 'react';

export default function SchedulePage() {
  const scheduledItems: Array<{
    id: string;
    title: string;
    type: string;
    scheduledFor: string;
    channel: string;
    status: string;
  }> = [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#2A1B38] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Calendar &amp; Broadcast Schedule</h1>
          <p className="text-sm text-[#FDF2E9]/60">
            Orchestrate upcoming post drops, premium subscriber broadcasts, and Live Sound Lounges.
          </p>
        </div>
        <a
          href="/create?mode=post"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF7A59] to-[#FFB347] text-[#110D17] font-bold text-sm shadow-md hover:opacity-95 transition-opacity inline-flex items-center justify-center"
        >
          + Schedule Post or Event
        </a>
      </div>

      {scheduledItems.length === 0 ? (
        <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-8 text-center space-y-3">
          <h2 className="text-lg font-bold text-white">No scheduled releases in queue</h2>
          <p className="text-sm text-[#FDF2E9]/60 max-w-xl mx-auto">
            Scheduled posts, premieres, and live broadcasts created in the canonical TUKUBI Universal Create Studio or Creator Hub (`apps/web` `/creator-studio`) will appear here once queued.
          </p>
          <div className="pt-2">
            <a
              href="/creator-studio"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2A1B38] hover:bg-[#372449] text-white text-xs font-semibold transition-colors"
            >
              Open Canonical Creator Hub →
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {scheduledItems.map((item) => (
            <div key={item.id} className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-6 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-xs font-mono text-[#FF7A59] uppercase tracking-wider">{item.type}</span>
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="text-xs text-[#FDF2E9]/60">Channel: {item.channel}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#2A1B38] flex items-center justify-between">
                <span className="text-xs font-mono text-[#00B4D8]">{item.scheduledFor}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
