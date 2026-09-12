import React from 'react';

export default function CreatorAnalyticsPage() {
  const regions = [
    { name: 'Jamaica (Kingston & Montego Bay)', share: '32.4%', sessions: '81,200', growth: '+14%' },
    { name: 'Trinidad & Tobago (Port of Spain)', share: '24.1%', sessions: '60,500', growth: '+21%' },
    { name: 'US Diaspora (Miami, NYC, Atlanta)', share: '18.5%', sessions: '46,400', growth: '+33%' },
    { name: 'Barbados (Bridgetown)', share: '11.2%', sessions: '28,100', growth: '+9%' },
    { name: 'UK Diaspora (London, Birmingham)', share: '8.6%', sessions: '21,600', growth: '+18%' },
    { name: 'Bahamas (Nassau)', share: '5.2%', sessions: '13,100', growth: '+12%' },
  ];

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
          <p className="text-2xl font-bold text-[#FF7A59] font-mono mt-1">68.4%</p>
          <p className="text-xs text-emerald-400 mt-1">Top quartile for video content</p>
        </div>
        <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-5">
          <p className="text-xs text-[#FDF2E9]/60">Viral Amplification Factor</p>
          <p className="text-2xl font-bold text-[#FFB347] font-mono mt-1">2.41x</p>
          <p className="text-xs text-emerald-400 mt-1">Shares per organic impression</p>
        </div>
        <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-5">
          <p className="text-xs text-[#FDF2E9]/60">Live Sound Lounge Attendance</p>
          <p className="text-2xl font-bold text-[#00B4D8] font-mono mt-1">12,850</p>
          <p className="text-xs text-emerald-400 mt-1">Peak simultaneous listeners</p>
        </div>
      </div>

      <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-6">
        <h2 className="text-lg font-bold text-white mb-4">Geographic Footprint Breakdown</h2>
        <div className="space-y-4">
          {regions.map((region) => (
            <div key={region.name} className="flex items-center justify-between border-b border-[#2A1B38]/40 pb-3">
              <div>
                <p className="text-sm font-semibold text-white">{region.name}</p>
                <p className="text-xs text-[#FDF2E9]/60">{region.sessions} active sessions</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-mono font-bold text-[#FFB347]">{region.share}</span>
                <p className="text-xs text-emerald-400">{region.growth}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
