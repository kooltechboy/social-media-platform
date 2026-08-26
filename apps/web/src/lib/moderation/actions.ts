'use server';

import { revalidatePath } from 'next/cache';
import { createServiceSupabaseClient, getStaffUser } from '../supabase/server';

export type ModerationAction = 'remove' | 'restrict' | 'allow' | 'escalate';

export interface ModerationActionState {
  error: string | null;
  success: string | null;
}

export async function submitModerationActionAction(
  _prev: ModerationActionState,
  formData: FormData,
): Promise<ModerationActionState> {
  const caseId = String(formData.get('caseId') ?? '').trim();
  const action = String(formData.get('action') ?? '').trim() as ModerationAction;
  const rationale = String(formData.get('rationale') ?? '').trim() || null;

  if (!caseId) return { error: 'Missing case ID.', success: null };
  if (!['remove', 'restrict', 'allow', 'escalate'].includes(action))
    return { error: 'Invalid action.', success: null };

  const user = await getStaffUser('moderator');
  if (!user) return { error: 'Moderator authorization required.', success: null };

  const supabase = await createServiceSupabaseClient();
  if (!supabase) return { error: 'Service unavailable.', success: null };

  // Fetch case details for side-effects
  const { data: caseRow } = await supabase
    .from('moderation_cases')
    .select('id, target_type, target_id, report_id')
    .eq('id', caseId)
    .maybeSingle();

  const { error: actionErr } = await supabase.from('moderation_actions').insert({
    case_id: caseId,
    moderator_id: user.id,
    action,
    rationale,
  });

  if (actionErr) return { error: actionErr.message, success: null };

  const newStatus = action === 'escalate' ? 'escalated' : 'decided';
  await supabase
    .from('moderation_cases')
    .update({ status: newStatus, decided_at: new Date().toISOString() })
    .eq('id', caseId);

  // Apply side-effects
  if (caseRow) {
    if (action === 'remove') {
      if (caseRow.target_type === 'post') {
        await supabase.from('posts').update({ is_hidden: true }).eq('id', caseRow.target_id);
      } else if (caseRow.target_type === 'comment') {
        await supabase.from('comments').update({ is_hidden: true }).eq('id', caseRow.target_id);
      }
      if (caseRow.report_id) {
        await supabase.from('reports').update({ status: 'resolved' }).eq('id', caseRow.report_id);
      }
    } else if (action === 'allow') {
      if (caseRow.report_id) {
        await supabase.from('reports').update({ status: 'dismissed' }).eq('id', caseRow.report_id);
      }
    }

    await supabase.from('audit_logs').insert({
      action: `moderation_${action}`,
      target_table: caseRow.target_type === 'post' ? 'posts' : 'moderation_cases',
      target_id: caseRow.target_id,
      actor_id: user.id,
      new_values: { case_id: caseId, action, rationale },
    });
  }

  revalidatePath('/moderation');
  revalidatePath('/moderation/cases');
  return { error: null, success: `Action '${action}' recorded.` };
}

export async function resolveAppealAction(
  _prev: ModerationActionState,
  formData: FormData,
): Promise<ModerationActionState> {
  const caseId = String(formData.get('caseId') ?? '').trim();
  const decision = String(formData.get('decision') ?? '').trim() as 'upheld' | 'overturned';
  const rationale = String(formData.get('rationale') ?? '').trim() || null;

  if (!caseId) return { error: 'Missing case ID.', success: null };
  if (!['upheld', 'overturned'].includes(decision))
    return { error: 'Invalid decision.', success: null };

  const user = await getStaffUser('moderator');
  if (!user) return { error: 'Moderator authorization required.', success: null };

  const supabase = await createServiceSupabaseClient();
  if (!supabase) return { error: 'Service unavailable.', success: null };

  const { data: caseRow } = await supabase
    .from('moderation_cases')
    .select('id, target_type, target_id')
    .eq('id', caseId)
    .maybeSingle();

  if (!caseRow) return { error: 'Case not found.', success: null };

  await supabase
    .from('moderation_cases')
    .update({
      appeal_status: decision,
      appeal_rationale: rationale,
      appeal_decided_by: user.id,
      appeal_decided_at: new Date().toISOString(),
    })
    .eq('id', caseId);

  if (decision === 'overturned') {
    if (caseRow.target_type === 'post') {
      await supabase.from('posts').update({ is_hidden: false }).eq('id', caseRow.target_id);
    } else if (caseRow.target_type === 'comment') {
      await supabase.from('comments').update({ is_hidden: false }).eq('id', caseRow.target_id);
    }
  }

  await supabase.from('audit_logs').insert({
    action: `appeal_${decision}`,
    target_table: 'moderation_cases',
    target_id: caseId,
    actor_id: user.id,
    new_values: { decision, rationale },
  });

  revalidatePath('/moderation/appeals');
  return { error: null, success: `Appeal ${decision}.` };
}

