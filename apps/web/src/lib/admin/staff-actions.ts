'use server';

import { revalidatePath } from 'next/cache';
import { createServiceSupabaseClient, getCurrentUser, getAuthorizedUser, getSuperAdminUser, PlatformRole } from '../supabase/server';

export interface ActionResponse {
  error: string | null;
  success: string | null;
  data?: Record<string, unknown>;
}

export const STAFF_ROLE_TITLES: Record<string, string> = {
  super_admin: 'Super Admin',
  superadmin: 'Super Admin',
  admin: 'Administrator',
  management: 'Management',
  moderator: 'Trust & Safety Moderator',
  support: 'Support Specialist',
  content_manager: 'Content Manager',
  analyst: 'Data Analyst',
};

/**
 * Creates a new staff member through Supabase Auth Admin API and sets RBAC role
 */
export async function createStaffAccountAction(
  _prev: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const caller = await getCurrentUser();
  if (!caller) return { error: 'Authentication required.', success: null };

  const auth = await getAuthorizedUser(['super_admin', 'superadmin', 'management', 'admin']);
  if (!auth.isAuthorized || !auth.user) {
    return { error: 'Administrative authorization required.', success: null };
  }

  const isCallerSuperAdmin =
    auth.role === 'super_admin' || auth.role === 'superadmin' || auth.role === 'management';

  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const username = String(formData.get('username') ?? '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const displayName = String(formData.get('displayName') ?? '').trim();
  const role = String(formData.get('role') ?? 'moderator').trim() as PlatformRole;
  const password = String(formData.get('password') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();
  const rawPermissions = formData.getAll('permissions') as string[];

  if (!email || !username || !displayName) {
    return { error: 'Email, username, and display name are required.', success: null };
  }

  // Only Super Admins can create Super Admins or Admins
  if ((role === 'super_admin' || role === 'superadmin' || role === 'admin') && !isCallerSuperAdmin) {
    return { error: 'Only Super Admins can create Administrator or Super Admin accounts.', success: null };
  }

  const supabase = await createServiceSupabaseClient();
  if (!supabase) return { error: 'Database service unavailable.', success: null };

  // 1. Create or invite user via Supabase Auth Admin API
  let authUserId: string;

  if (password) {
    if (password.length < 8) {
      return { error: 'Temporary password must be at least 8 characters long.', success: null };
    }
    const { data: createdAuth, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        display_name: displayName,
      },
    });

    if (createError) {
      // If user already exists in Auth, check if they exist in DB
      if (createError.message.toLowerCase().includes('already registered')) {
        const { data: existingUser } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle();
        if (existingUser) {
          authUserId = existingUser.id;
        } else {
          return { error: `User with email '${email}' already exists. Please assign the role to their existing account.`, success: null };
        }
      } else {
        return { error: `Failed to create auth user: ${createError.message}`, success: null };
      }
    } else {
      authUserId = createdAuth.user.id;
    }
  } else {
    // Send magic invite link via Supabase Auth
    const { data: invitedAuth, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { username, display_name: displayName },
    });

    if (inviteError) {
      return { error: `Failed to send invite: ${inviteError.message}`, success: null };
    }
    authUserId = invitedAuth.user.id;
  }

  // 2. Ensure profile exists in public.profiles
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: authUserId,
    username,
    display_name: displayName,
    account_type: 'organization',
    is_verified: true,
    is_private: false,
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    return { error: `Failed to create profile: ${profileError.message}`, success: null };
  }

  // 3. Upsert role and permissions in public.accounts
  const { data: accountData, error: accountError } = await supabase
    .from('accounts')
    .upsert({
      profile_id: authUserId,
      role,
      status: 'active',
      permissions: rawPermissions,
      assigned_by: caller.id,
      assigned_at: new Date().toISOString(),
      notes: notes || `Created by @${caller.username} (${auth.role})`,
    })
    .select('id')
    .single();

  if (accountError) {
    return { error: `Failed to assign staff role: ${accountError.message}`, success: null };
  }

  // 4. Record audit log
  await supabase.from('audit_logs').insert({
    actor_id: caller.id,
    action: 'staff.created',
    entity_type: 'account',
    entity_id: accountData?.id,
    metadata: {
      target_user_id: authUserId,
      target_username: username,
      target_email: email,
      assigned_role: role,
      permissions: rawPermissions,
      created_by_role: auth.role,
    },
  });

  revalidatePath('/admin');
  revalidatePath('/admin/administrators');
  revalidatePath('/admin/audit-logs');

  return {
    error: null,
    success: `Successfully created staff account @${username} with role '${STAFF_ROLE_TITLES[role] || role}'.`,
    data: { userId: authUserId, role },
  };
}

/**
 * Updates a staff member's role and permissions
 */
export async function updateStaffRoleAction(
  _prev: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const caller = await getCurrentUser();
  if (!caller) return { error: 'Authentication required.', success: null };

  const auth = await getAuthorizedUser(['super_admin', 'superadmin', 'management', 'admin']);
  if (!auth.isAuthorized || !auth.user) {
    return { error: 'Administrative authorization required.', success: null };
  }

  const isCallerSuperAdmin =
    auth.role === 'super_admin' || auth.role === 'superadmin' || auth.role === 'management';

  const accountId = String(formData.get('accountId') ?? '').trim();
  const targetProfileId = String(formData.get('targetProfileId') ?? '').trim();
  const newRole = String(formData.get('newRole') ?? '').trim() as PlatformRole;
  const rawPermissions = formData.getAll('permissions') as string[];
  const notes = String(formData.get('notes') ?? '').trim();

  if (!accountId || !newRole) {
    return { error: 'Account ID and target role are required.', success: null };
  }

  // Only Super Admins can grant or modify Super Admin / Admin roles
  if ((newRole === 'super_admin' || newRole === 'superadmin' || newRole === 'admin') && !isCallerSuperAdmin) {
    return { error: 'Only Super Admins can assign Administrator or Super Admin roles.', success: null };
  }

  const supabase = await createServiceSupabaseClient();
  if (!supabase) return { error: 'Database service unavailable.', success: null };

  // Fetch current account to verify safety
  const { data: currentAccount } = await supabase
    .from('accounts')
    .select('id, profile_id, role, status')
    .eq('id', accountId)
    .single();

  if (!currentAccount) {
    return { error: 'Staff account record not found.', success: null };
  }

  // Prevent demoting the last active Super Admin
  if (
    (currentAccount.role === 'super_admin' || currentAccount.role === 'superadmin') &&
    newRole !== 'super_admin' &&
    newRole !== 'superadmin'
  ) {
    const { count: superAdminCount } = await supabase
      .from('accounts')
      .select('id', { count: 'exact', head: true })
      .in('role', ['super_admin', 'superadmin', 'management'])
      .eq('status', 'active');

    if ((superAdminCount ?? 0) <= 1) {
      return { error: 'Cannot demote the only remaining Super Admin account on the platform.', success: null };
    }
  }

  const { error: updateError } = await supabase
    .from('accounts')
    .update({
      role: newRole,
      permissions: rawPermissions,
      assigned_by: caller.id,
      assigned_at: new Date().toISOString(),
      notes: notes || `Updated by @${caller.username}`,
    })
    .eq('id', accountId);

  if (updateError) {
    return { error: updateError.message, success: null };
  }

  // Record audit log
  await supabase.from('audit_logs').insert({
    actor_id: caller.id,
    action: 'staff.role_updated',
    entity_type: 'account',
    entity_id: accountId,
    metadata: {
      target_profile_id: targetProfileId || currentAccount.profile_id,
      previous_role: currentAccount.role,
      new_role: newRole,
      permissions: rawPermissions,
      assigned_by: caller.id,
    },
  });

  revalidatePath('/admin');
  revalidatePath('/admin/administrators');
  revalidatePath('/admin/audit-logs');

  return {
    error: null,
    success: `Updated role to '${STAFF_ROLE_TITLES[newRole] || newRole}'.`,
  };
}

/**
 * Activates, suspends, or deactivates a user or staff account
 */
export async function toggleAccountStatusAction(
  _prev: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const caller = await getCurrentUser();
  if (!caller) return { error: 'Authentication required.', success: null };

  const auth = await getAuthorizedUser(['super_admin', 'superadmin', 'management', 'admin']);
  if (!auth.isAuthorized || !auth.user) {
    return { error: 'Administrative authorization required.', success: null };
  }

  const accountId = String(formData.get('accountId') ?? '').trim();
  const newStatus = String(formData.get('newStatus') ?? 'active').trim() as 'active' | 'suspended' | 'deactivated';
  const reason = String(formData.get('reason') ?? '').trim();

  if (!accountId || !['active', 'suspended', 'deactivated'].includes(newStatus)) {
    return { error: 'Valid Account ID and status are required.', success: null };
  }

  const supabase = await createServiceSupabaseClient();
  if (!supabase) return { error: 'Database service unavailable.', success: null };

  const { data: targetAccount } = await supabase
    .from('accounts')
    .select('id, profile_id, role, status')
    .eq('id', accountId)
    .single();

  if (!targetAccount) {
    return { error: 'Target account not found.', success: null };
  }

  // Prevent self-suspension
  if (targetAccount.profile_id === caller.id) {
    return { error: 'You cannot suspend or deactivate your own account.', success: null };
  }

  // Only Super Admins can suspend other Admins or Super Admins
  const isTargetStaff = ['super_admin', 'superadmin', 'admin', 'management'].includes(targetAccount.role);
  const isCallerSuperAdmin = ['super_admin', 'superadmin', 'management'].includes(auth.role);

  if (isTargetStaff && !isCallerSuperAdmin) {
    return { error: 'Only Super Admins can change status of Administrator accounts.', success: null };
  }

  const { error: updateError } = await supabase
    .from('accounts')
    .update({
      status: newStatus,
      notes: reason ? `Status changed to ${newStatus}: ${reason}` : undefined,
    })
    .eq('id', accountId);

  if (updateError) {
    return { error: updateError.message, success: null };
  }

  // Record audit log
  await supabase.from('audit_logs').insert({
    actor_id: caller.id,
    action: `account.${newStatus}`,
    entity_type: 'account',
    entity_id: accountId,
    metadata: {
      target_profile_id: targetAccount.profile_id,
      previous_status: targetAccount.status,
      new_status: newStatus,
      reason,
      changed_by: caller.id,
    },
  });

  revalidatePath('/admin');
  revalidatePath('/admin/administrators');
  revalidatePath('/admin/users');
  revalidatePath('/admin/audit-logs');

  return {
    error: null,
    success: `Account status updated to '${newStatus}'.`,
  };
}

/**
 * Revokes administrative staff privileges and returns user to standard role
 */
export async function revokeStaffAccessAction(
  _prev: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const caller = await getCurrentUser();
  if (!caller) return { error: 'Authentication required.', success: null };

  const superAdmin = await getSuperAdminUser();
  if (!superAdmin) {
    return { error: 'Only Super Admins can revoke staff privileges.', success: null };
  }

  const accountId = String(formData.get('accountId') ?? '').trim();
  const reason = String(formData.get('reason') ?? '').trim();

  if (!accountId) return { error: 'Account ID is required.', success: null };

  const supabase = await createServiceSupabaseClient();
  if (!supabase) return { error: 'Database service unavailable.', success: null };

  const { data: targetAccount } = await supabase
    .from('accounts')
    .select('id, profile_id, role')
    .eq('id', accountId)
    .single();

  if (!targetAccount) {
    return { error: 'Account record not found.', success: null };
  }

  if (targetAccount.profile_id === caller.id) {
    return { error: 'You cannot revoke your own Super Admin access.', success: null };
  }

  const { error: updateError } = await supabase
    .from('accounts')
    .update({
      role: 'user',
      permissions: [],
      notes: reason ? `Staff access revoked: ${reason}` : `Revoked by @${caller.username}`,
    })
    .eq('id', accountId);

  if (updateError) {
    return { error: updateError.message, success: null };
  }

  await supabase.from('audit_logs').insert({
    actor_id: caller.id,
    action: 'staff.revoked',
    entity_type: 'account',
    entity_id: accountId,
    metadata: {
      target_profile_id: targetAccount.profile_id,
      previous_role: targetAccount.role,
      revoked_by: caller.id,
      reason,
    },
  });

  revalidatePath('/admin');
  revalidatePath('/admin/administrators');
  revalidatePath('/admin/audit-logs');

  return {
    error: null,
    success: 'Staff privileges have been successfully revoked.',
  };
}

/**
 * One-time Super Admin bootstrap action (Guarded: only succeeds if 0 super admins exist)
 */
export async function bootstrapSuperAdminAction(
  _prev: ActionResponse,
  formData: FormData
): Promise<ActionResponse> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const username = String(formData.get('username') ?? '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const displayName = String(formData.get('displayName') ?? '').trim();
  const password = String(formData.get('password') ?? '').trim();

  if (!email || !username || !displayName || !password) {
    return { error: 'All fields (Email, Username, Display Name, Password) are required.', success: null };
  }

  if (password.length < 10) {
    return { error: 'Super Admin password must be at least 10 characters long.', success: null };
  }

  const supabase = await createServiceSupabaseClient();
  if (!supabase) return { error: 'Database service unavailable.', success: null };

  // 1. Double check in database that 0 super admins exist
  const { count: superAdminCount } = await supabase
    .from('accounts')
    .select('id', { count: 'exact', head: true })
    .in('role', ['super_admin', 'superadmin', 'management']);

  if ((superAdminCount ?? 0) > 0) {
    return {
      error: 'Platform is already initialized with a Super Admin. Please log in to /admin to manage administrators.',
      success: null,
    };
  }

  // 2. Create user in Supabase Auth via Admin API
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      username,
      display_name: displayName,
    },
  });

  let userId: string;
  if (authError) {
    if (authError.message.toLowerCase().includes('already registered')) {
      const { data: existingProfile } = await supabase.from('profiles').select('id').eq('username', username).maybeSingle();
      if (existingProfile) {
        userId = existingProfile.id;
      } else {
        return { error: `Auth user with email ${email} already exists. Please log in or use a different email.`, success: null };
      }
    } else {
      return { error: `Failed to create auth user: ${authError.message}`, success: null };
    }
  } else {
    userId = authData.user.id;
  }

  // 3. Call database bootstrap procedure
  const { data: rpcData, error: rpcError } = await supabase.rpc('bootstrap_super_admin', {
    p_user_id: userId,
    p_username: username,
    p_display_name: displayName,
    p_notes: 'Initial Root Super Admin setup',
  });

  if (rpcError) {
    return { error: `Database bootstrap failed: ${rpcError.message}`, success: null };
  }

  revalidatePath('/admin');
  revalidatePath('/admin/bootstrap');
  revalidatePath('/admin/administrators');

  return {
    error: null,
    success: `Root Super Admin @${username} (${email}) created successfully! You can now log in at /login and access /admin.`,
    data: rpcData as Record<string, unknown>,
  };
}
