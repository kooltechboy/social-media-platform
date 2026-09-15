import React from 'react';

export default function CreatorAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#2A1B38] pb-5">
        <h1 className="text-2xl font-bold text-white">Audience & Reach Analytics</h1>
        <p className="text-sm text-[#FDF2E9]/60">
          Real-time diaspora engagement telemetry across the Caribbean basin and international diaspora hubs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-5">
          <p className="text-xs text-[#FDF2E9]/60">Avg. Viewer Retention</p>
          <p className="text-2xl font-bold text-[#FF7A59] font-mono mt-1">—</p>
          <p className="text-xs text-[#FDF2E9]/40 mt-1">Publish content to begin tracking retention</p>
        </div>
        <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-5">
          <p className="text-xs text-[#FDF2E9]/60">Viral Amplification Factor</p>
          <p className="text-2xl font-bold text-[#FFB347] font-mono mt-1">—</p>
          <p className="text-xs text-[#FDF2E9]/40 mt-1">Shares per organic impression</p>
        </div>
        <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-5">
          <p className="text-xs text-[#FDF2E9]/60">Live Sound Lounge Attendance</p>
          <p className="text-2xl font-bold text-[#00B4D8] font-mono mt-1">0</p>
          <p className="text-xs text-[#FDF2E9]/40 mt-1">Host your first live session to see peak listeners</p>
        </div>
      </div>

      <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-6">
        <h2 className="text-lg font-bold text-white mb-4">Geographic Footprint Breakdown</h2>
        <div className="py-8 text-center text-[#FDF2E9]/40">
          <p className="text-sm">No audience data available yet</p>
          <p className="text-xs mt-1">
            Geographic and demographic breakdowns will populate as viewers from the Caribbean and diaspora communities engage with your content.
          </p>
        </div>
      </div>
    </div>
  );
}
