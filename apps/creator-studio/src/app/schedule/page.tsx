import React from 'react';

export default function SchedulePage() {
  const scheduledItems = [
    {
      id: 'sch_1',
      title: 'Carnival J’ouvert Countdown Special',
      type: 'Live Audio Lounge',
      scheduledFor: 'Tomorrow at 6:00 PM AST',
      channel: 'Sound Lounge Stage 1',
      status: 'Scheduled',
    },
    {
      id: 'sch_2',
      title: 'Exclusive Subscriber Q&A: Island Beats',
      type: 'Pro Tier Post & Video',
      scheduledFor: 'Sep 15, 2026 at 2:00 PM AST',
      channel: 'Creator Hub Feed',
      status: 'Queued',
    },
    {
      id: 'sch_3',
      title: 'Culinary Secrets: Jerk Smokehouse Special',
      type: 'HLS Video Release',
      scheduledFor: 'Sep 18, 2026 at 8:00 PM AST',
      channel: 'Public Discover',
      status: 'Queued',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#2A1B38] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Calendar & Broadcast Schedule</h1>
          <p className="text-sm text-[#FDF2E9]/60">
            Orchestrate upcoming post drops, premium subscriber broadcasts, and Live Sound Lounges.
          </p>
        </div>
        <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF7A59] to-[#FFB347] text-white font-semibold text-sm shadow-md hover:opacity-95 transition-opacity">
          + Schedule Event
        </button>
      </div>

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
    </div>
  );
}
