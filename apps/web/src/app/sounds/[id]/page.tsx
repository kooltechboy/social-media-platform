import React, { Suspense } from 'react';
import Link from 'next/link';
import { Music, ArrowLeft } from 'lucide-react';
import { getCurrentUser } from '../../../lib/supabase/server';
import { getSoundDetailsAction } from '../../../lib/sounds/actions';
import SoundDetailViewer from '../../../components/sounds/sound-detail-viewer';

export const dynamic = 'force-dynamic';

export default async function SoundTrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, soundDetails] = await Promise.all([
    getCurrentUser(),
    getSoundDetailsAction(id),
  ]);

  if (!soundDetails.sound) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <Music className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-black text-white">Sound Not Found</h1>
        <p className="text-xs text-brand-sandstone/70">
          This rhythm stem or sound could not be located in Caribbean Sounds. It may have been removed or updated.
        </p>
        <Link
          href="/sounds"
          className="bg-rose-500 hover:brightness-110 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs inline-flex items-center gap-2 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" /> Explore All Sounds
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-brand-sandstone p-4 md:p-6">
      <Suspense
        fallback={
          <div className="w-full flex items-center justify-center p-20">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <SoundDetailViewer
          sound={soundDetails.sound}
          associatedReels={soundDetails.associatedReels}
          totalUses={soundDetails.totalUses}
          user={
            user
              ? {
                  id: user.id,
                  displayName: user.displayName,
                  username: user.username,
                }
              : null
          }
        />
      </Suspense>
    </div>
  );
}
