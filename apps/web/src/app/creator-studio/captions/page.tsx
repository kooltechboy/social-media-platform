import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Subtitles, Video, Sparkles } from 'lucide-react';
import DialectCaptionGenerator from '../../../components/creator/dialect-caption-generator';

export const metadata = {
  title: 'Caribbean Dialect Caption Studio | TUKUBI Creator Studio',
  description: 'Generate authentic Caribbean Creole, Patois, and Papiamentu auto-captions and WebVTT subtitles.',
};

export default function CreatorStudioCaptionsPage() {
  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/creator-studio"
            className="p-2 rounded-xl bg-brand-dusk border border-slate-800 hover:text-white transition-colors text-xs flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Studio
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-brand-sandstone flex items-center gap-2.5">
              <Subtitles className="w-6 h-6 text-brand-caribbeanSea" /> Caribbean Dialect Subtitle Studio
            </h1>
            <p className="text-xs text-brand-sandstone/60 mt-1">
              Transcribe, translate, and timestamp video content with authentic Caribbean phonetics and WebVTT export.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/creator-studio/videos"
            className="bg-brand-dusk border border-slate-800 hover:text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
          >
            <Video className="w-4 h-4 text-brand-coralPink" /> View My Videos
          </Link>
          <Link
            href="/shorts?create=true"
            className="bg-brand-caribbeanSea hover:bg-brand-caribbeanSea/90 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
          >
            <Sparkles className="w-4 h-4" /> Publish New Short
          </Link>
        </div>
      </div>

      {/* Dialect Caption Generator Studio Component */}
      <DialectCaptionGenerator />
    </div>
  );
}
