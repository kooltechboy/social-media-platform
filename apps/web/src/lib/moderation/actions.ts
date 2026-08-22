'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient, getCurrentUser } from '../supabase/server';

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

  const user = await getCurrentUser();
  if (!user) return { error: 'Authentication required.', success: null };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: 'Service unavailable.', success: null };

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

  revalidatePath('/moderation');
  return { error: null, success: `Action '${action}' recorded.` };
}
