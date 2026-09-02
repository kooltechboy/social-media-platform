import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Sparkles, ArrowLeft, Shield, AlertTriangle } from 'lucide-react';
import { createServiceSupabaseClient, getAuthorizedUser } from '../../../lib/supabase/server';
import AccessDenied from '../../../components/access-denied';
import OfficialAccountClient from '../../../components/admin/official-account-client';
import { OfficialAccount, OfficialAccountOperator, OfficialPostDraft } from '../../../lib/official/types';

export const dynamic = 'force-dynamic';

export default async function AdminOfficialAccountsPage() {
  const auth = await getAuthorizedUser([
    'super_admin',
    'superadmin',
    'management',
    'admin',
    'content_manager',
  ]);

  if (!auth.isLoggedIn) {
    redirect('/login?next=/admin/official-accounts');
  }

  if (!auth.isAuthorized) {
    return (
      <AccessDenied
        user={auth.user}
        requiredRole="admin"
        currentRole={auth.role}
        resourceName="Official Accounts & Publishing Studio"
      />
    );
  }

  const supabase = await createServiceSupabaseClient();
  if (!supabase) {
    return (
      <div className="min-h-screen bg-transparent text-brand-sandstone flex items-center justify-center p-4">
        <p className="text-sm text-brand-sandstone/60">Service temporarily unavailable. Please try again.</p>
      </div>
    );
  }

  // 1. Fetch or initialize @tukubi official account
  let { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, is_official, is_verified')
    .ilike('username', 'tukubi')
    .maybeSingle();

  // If @tukubi profile exists, ensure official_accounts entry
  let officialAccount: OfficialAccount | null = null;
  if (profile) {
    let { data: officialAcc } = await supabase
      .from('official_accounts')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (!officialAcc) {
      const { data: createdAcc } = await supabase
        .from('official_accounts')
        .insert({
          profile_id: profile.id,
          classification: 'official_platform',
          department: 'Executive & Platform Communications',
          status: 'active',
          is_system_account: true,
        })
        .select('*')
        .single();
      officialAcc = createdAcc;
    }

    if (officialAcc) {
      officialAccount = {
        ...officialAcc,
        profile,
      };
    }
  }

  // If not yet bootstrapped in DB, construct fallback model for UI display
  if (!officialAccount) {
    officialAccount = {
      id: '00000000-0000-0000-0000-000000000001',
      profile_id: profile?.id || '00000000-0000-0000-0000-000000000001',
      classification: 'official_platform',
      department: 'Executive & Platform Communications',
      status: 'active',
      is_system_account: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile: {
        username: 'tukubi',
        display_name: 'TUKUBI',
        avatar_url: null,
        bio: '🌴 The Caribbean Connected.\nConnecting Caribbean people, culture, creators, businesses & the global diaspora.\n🌎 Born in the Caribbean. Built for the World.',
        is_official: true,
        is_verified: true,
      },
    };
  }

  // 2. Fetch operators
  const { data: operatorsData } = await supabase
    .from('official_account_operators')
    .select('*, operator_profile:profiles!official_account_operators_operator_profile_id_fkey(username, display_name, avatar_url)')
    .eq('official_account_id', officialAccount.id);

  const operators = (operatorsData ?? []) as unknown as OfficialAccountOperator[];

  // 3. Fetch drafts and bot queue
  const { data: draftsData } = await supabase
    .from('official_post_drafts')
    .select('*, official_account:official_accounts(*), author_profile:profiles!official_post_drafts_author_operator_id_fkey(username, display_name, avatar_url)')
    .eq('official_account_id', officialAccount.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const drafts = (draftsData ?? []) as unknown as OfficialPostDraft[];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="text-xs font-bold text-slate-400 hover:text-brand-sandstone transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Admin Console
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-xs font-black text-brand-sandstone flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-caribbeanSea" />
            Official Accounts &amp; Automated Publishing
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-black text-brand-sandstone tracking-tight flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-brand-caribbeanSea" />
          Official Accounts &amp; Publishing Studio
        </h1>
        <p className="text-xs text-brand-sandstone/60 leading-relaxed">
          Manage official platform communications, draft community updates, review automated TUKUBI Bot submissions, and control operator credentials.
        </p>
      </div>

      {/* Main interactive client */}
      <OfficialAccountClient
        officialAccount={officialAccount}
        operators={operators}
        drafts={drafts}
        currentUserId={auth.user?.id || ''}
      />
    </div>
  );
}
