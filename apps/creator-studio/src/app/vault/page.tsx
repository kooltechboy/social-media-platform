import React from 'react';

export default function MediaVaultPage() {
  const assets: Array<{
    id: string;
    title: string;
    resolution: string;
    size: string;
    transcodeStatus: string;
    playbackUrl: string;
    uploadedAt: string;
  }> = [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#2A1B38] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Media Vault &amp; Transcoding Center</h1>
          <p className="text-sm text-[#FDF2E9]/60">
            Enterprise HLS multi-bitrate video and lossless audio asset management powered by @caribbean/media.
          </p>
        </div>
        <a
          href="/create?mode=video"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF7A59] to-[#FFB347] text-[#110D17] font-bold text-sm shadow-md hover:opacity-95 transition-opacity inline-flex items-center justify-center"
        >
          + Upload Media Asset
        </a>
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
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#FDF2E9]/50">
                    <p className="text-sm font-semibold text-white">No ingested media assets in this workspace yet</p>
                    <p className="text-xs mt-1">
                      Upload videos, audio tracks, or podcast episodes via the canonical Creator Studio (`/creator-studio/videos`) to inspect encoding status here.
                    </p>
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
