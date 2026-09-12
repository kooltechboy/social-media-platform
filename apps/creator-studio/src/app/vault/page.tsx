import React from 'react';

export default function MediaVaultPage() {
  const assets = [
    {
      id: 'ast_01',
      title: 'Carnival Parade 4K Master',
      resolution: '4K HLS (2160p, 1080p, 720p)',
      size: '2.4 GB',
      transcodeStatus: 'Ready',
      playbackUrl: 'https://stream.tukubi.caribbean/ast_01/manifest.m3u8',
      uploadedAt: '2 hours ago',
    },
    {
      id: 'ast_02',
      title: 'Steelpan Symphony Audio Feed',
      resolution: 'Lossless AAC 320kbps',
      size: '140 MB',
      transcodeStatus: 'Ready',
      playbackUrl: 'https://stream.tukubi.caribbean/ast_02/audio.m3u8',
      uploadedAt: 'Yesterday',
    },
    {
      id: 'ast_03',
      title: 'Bonaire Reef Dive Documentary Clip',
      resolution: 'Processing HLS ladder...',
      size: '850 MB',
      transcodeStatus: 'Transcoding (84%)',
      playbackUrl: 'Pending processing queue',
      uploadedAt: '12 mins ago',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#2A1B38] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Media Vault & Transcoding Center</h1>
          <p className="text-sm text-[#FDF2E9]/60">
            Enterprise HLS multi-bitrate video and lossless audio asset management powered by @caribbean/media.
          </p>
        </div>
        <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF7A59] to-[#FFB347] text-white font-semibold text-sm shadow-md hover:opacity-95 transition-opacity">
          + Ingest New Media Asset
        </button>
      </div>

      <div className="rounded-xl bg-[#1D1429] border border-[#2A1B38] p-6">
        <h2 className="text-lg font-bold text-white mb-4">Ingested Media Pipeline Assets</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#FDF2E9]/80">
            <thead className="border-b border-[#2A1B38] text-xs uppercase text-[#FDF2E9]/50">
              <tr>
                <th className="py-3 px-2">Asset</th>
                <th className="py-3 px-2">Encoding / Ladder</th>
                <th className="py-3 px-2">File Size</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A1B38]/60">
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td className="py-3 px-2">
                    <p className="font-semibold text-white">{asset.title}</p>
                    <p className="text-xs font-mono text-[#00B4D8]">{asset.id}</p>
                  </td>
                  <td className="py-3 px-2 text-xs font-mono">{asset.resolution}</td>
                  <td className="py-3 px-2 text-xs font-mono">{asset.size}</td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2.5 py-0.5 text-xs rounded-full border ${
                        asset.transcodeStatus === 'Ready'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {asset.transcodeStatus}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-xs text-[#FDF2E9]/60">{asset.uploadedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
